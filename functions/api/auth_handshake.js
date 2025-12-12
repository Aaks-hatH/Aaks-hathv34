import * as OTPAuth from "otpauth";
import { createClient } from '@supabase/supabase-js';

const ADMIN_ID = "1168575437723680850";

// --- EMAIL HELPER ---
async function sendEmailAlert(context, subject, message) {
  const serviceId = context.env.EMAILJS_SERVICE_ID;
  const templateId = context.env.EMAILJS_TEMPLATE_ID;
  const userId = context.env.EMAILJS_USER_ID;
  const accessToken = context.env.EMAILJS_ACCESS_TOKEN;

  if (!serviceId || !templateId || !userId || !accessToken) return;

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: userId,
    accessToken: accessToken,
    template_params: { subject, message, to_email: 'aakshathariharan@gmail.com' }
  };

  try {
      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
  } catch (e) { console.error("Email Error", e); }
}

export async function onRequestPost(context) {
  if (context.request.method === "OPTIONS") return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
  
  try {
    const { password, token, captcha, stepUpCode } = await context.request.json();
    
    // Secrets
    const actualPassword = (context.env.ADMIN_PASSWORD || "").trim();
    const totpSecret = (context.env.ADMIN_TOTP_SECRET || "").replace(/\s/g, '');
    const turnstileSecret = context.env.TURNSTILE_SECRET_KEY;
    const sbKey = context.env.SUPABASE_SERVICE_KEY;
    const webhookUrl = context.env.DISCORD_WEBHOOK_URL;
    
    const clientIP = context.request.headers.get("CF-Connecting-IP") || "127.0.0.1";
    const country = context.request.headers.get("CF-IPCountry") || "XX";

    const sendDiscord = (msg) => {
        if (webhookUrl) context.waitUntil(fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: msg }) }).catch(()=>{}));
    };

    const supabase = createClient('https://gdlvzfyvgmeyvlcgggix.supabase.co', sbKey);

    // ==========================================================
    // 1. CAPTCHA SESSION CHECK (The Fix)
    // ==========================================================
    // Check if this IP passed captcha in the last 5 minutes
    const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString();
    const { count: captchaSession } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('ip', clientIP)
        .eq('action', 'CAPTCHA_PASSED')
        .gte('timestamp', fiveMinsAgo);

    const hasValidSession = captchaSession > 0;

    // Only verify if we don't have a session
    if (!hasValidSession) {
        if (turnstileSecret) {
            if (!captcha) return new Response(JSON.stringify({ error: "CAPTCHA_REQUIRED" }), { status: 400 });
            
            const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secret: turnstileSecret, response: captcha, remoteip: clientIP })
            });
            const d = await verifyRes.json();
            
            if (!d.success) return new Response(JSON.stringify({ error: "CAPTCHA_FAILED" }), { status: 403 });

            // LOG SUCCESS TO START SESSION
            await supabase.from('audit_logs').insert({ 
                actor_type: 'VISITOR', ip: clientIP, action: 'CAPTCHA_PASSED', details: 'Session Started' 
            });
        }
    }

    // ==========================================================
    // 2. INTELLIGENT THREAT DETECTION
    // ==========================================================
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60000).toISOString();
    const { count: failCount } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('ip', clientIP)
        .eq('action', 'LOGIN_FAIL')
        .gte('timestamp', fifteenMinsAgo);

    // AUTO-BAN (5+ Failures)
    if (failCount >= 5) {
        const { data: isBanned } = await supabase.from('banned_ips').select('ip').eq('ip', clientIP).maybeSingle();
        if (!isBanned) {
            await supabase.from('banned_ips').insert({ ip: clientIP, reason: "Auto-Ban: Brute Force" });
            await supabase.from('audit_logs').insert({ actor_type: 'ATTACKER', ip: clientIP, action: 'AUTO_BAN', details: `Failures: ${failCount}` });
            
            sendDiscord(`<@${ADMIN_ID}>\n**🚨 AUTO-BAN**\nTarget: ${clientIP}\nFails: ${failCount}`);
            context.waitUntil(sendEmailAlert(context, "CRITICAL: Auto-Ban Executed", `Target IP: ${clientIP} banned after ${failCount} failed login attempts.`));
        }
        return new Response(JSON.stringify({ error: "ACCESS DENIED: IP BANNED" }), { status: 403 });
    }

    // ==========================================================
    // 3. DEAD MAN SWITCH
    // ==========================================================
    const { data: status } = await supabase.from('admin_status').select('is_online, last_heartbeat').eq('id', 1).single();
    const now = new Date();
    const lastBeat = new Date(status?.last_heartbeat || 0);
    const diffSeconds = (now - lastBeat) / 1000;

    if (!status || status.is_online !== true || diffSeconds > 120) {
         return new Response(JSON.stringify({ error: "SECURITY LOCKOUT: HUD OFFLINE" }), { status: 403 });
    }

    // ==========================================================
    // 4. PASSWORD CHECK
    // ==========================================================
    if (password !== actualPassword) {
       await supabase.from('audit_logs').insert({ 
           actor_type: 'ATTACKER', ip: clientIP, action: 'LOGIN_FAIL', details: 'Wrong Password' 
       });
       
       sendDiscord(`<@${ADMIN_ID}>\n**Login Failed:** Bad Password\n**Source:** ${clientIP}`);
       
       // Artificial Delay to stop timing attacks
       await new Promise(r => setTimeout(r, 2000));
       
       return new Response(JSON.stringify({ error: "PASSWORD_INCORRECT" }), { status: 401 });
    }

    // ==========================================================
    // 5. ADAPTIVE STEP-UP AUTH (Suspicious Activity)
    // ==========================================================
    // If user has > 1 recent failures (even if they got password right now), trigger Step-Up
    // UNLESS they already provided the correct step-up code
    
    let isStepUpVerified = false;

    // A. Check if code was provided
    if (stepUpCode) {
        const { data: storedCode } = await supabase.from('system_config').select('value').eq('key', 'temp_auth_code').single();
        if (!storedCode || storedCode.value !== stepUpCode) {
            await supabase.from('audit_logs').insert({ actor_type: 'ATTACKER', ip: clientIP, action: 'LOGIN_FAIL', details: 'Wrong Step-Up Code' });
            return new Response(JSON.stringify({ error: "INVALID_VERIFICATION_CODE" }), { status: 401 });
        }
        // Burn the code so it can't be reused
        await supabase.from('system_config').delete().eq('key', 'temp_auth_code');
        isStepUpVerified = true;
    }

    // B. Trigger Challenge if suspicious AND not yet verified
    if (failCount >= 2 && !isStepUpVerified) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await supabase.from('system_config').upsert({ key: 'temp_auth_code', value: code });
        
        sendDiscord(`<@${ADMIN_ID}>\n**🛡️ SUSPICIOUS LOGIN**\n**Reason:** ${failCount} prior failures.\n**Verification Code:** \`${code}\``);
        
        // Return 200 OK but with 'stepUp' flag
        return new Response(JSON.stringify({ 
            stepUp: true, 
            message: "Suspicious activity detected. Verification code sent to secure channel." 
        }), { status: 200 });
    }

    // ==========================================================
    // 6. TOTP (2FA) CHECK
    // ==========================================================
    if (totpSecret) {
        const totp = new OTPAuth.TOTP({ algorithm: "SHA1", digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(totpSecret) });
        const delta = totp.validate({ token: token, window: 2 });
        if (delta === null) {
           await supabase.from('audit_logs').insert({ actor_type: 'ATTACKER', ip: clientIP, action: 'LOGIN_FAIL', details: 'Wrong 2FA' });
           return new Response(JSON.stringify({ error: "2FA_CODE_INVALID" }), { status: 401 });
        }
    }

    // ==========================================================
    // SUCCESS
    // ==========================================================
    await supabase.from('audit_logs').insert({ actor_type: 'ADMIN', ip: clientIP, action: 'LOGIN_SUCCESS', details: 'Session Started' });
    sendDiscord(`<@${ADMIN_ID}>\n**Success:** Admin logged in.\n**IP:** ${clientIP}`);
    
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
