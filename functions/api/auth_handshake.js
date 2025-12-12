import * as OTPAuth from "otpauth";
import { createClient } from '@supabase/supabase-js';

const ADMIN_ID = "1168575437723680850";

// --- HELPER: EMAIL ALERT ---
async function sendEmailAlert(context, subject, message) {
  const serviceId = context.env.EMAILJS_SERVICE_ID;
  const templateId = context.env.EMAILJS_TEMPLATE_ID;
  const userId = context.env.EMAILJS_USER_ID;
  const accessToken = context.env.EMAILJS_ACCESS_TOKEN;

  if (!serviceId || !accessToken) return "MISSING_KEYS";

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: userId,
    accessToken: accessToken,
    template_params: {
      subject: subject,
      message: message,
      to_email: 'aakshathariharan@gmail.com'
    }
  };

  try {
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.ok ? "SENT" : `API_FAIL: ${await res.text()}`;
  } catch (err) {
      return `FETCH_ERR: ${err.message}`;
  }
}

export async function onRequestPost(context) {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }
    });
  }
  
  try {
    const { password, token, captcha, stepUpCode } = await context.request.json();
    
    // --- 1. LOAD & VALIDATE SECRETS ---
    const actualPassword = (context.env.ADMIN_PASSWORD || "").trim();
    const totpSecret = (context.env.ADMIN_TOTP_SECRET || "").replace(/\s/g, '');
    const turnstileSecret = context.env.TURNSTILE_SECRET_KEY;
    const sbKey = context.env.SUPABASE_SERVICE_KEY;
    const webhookUrl = context.env.DISCORD_WEBHOOK_URL;
    
    // IP Metadata
    const clientIP = context.request.headers.get("CF-Connecting-IP") || "127.0.0.1";
    const country = context.request.headers.get("CF-IPCountry") || "XX";

    const sendDiscord = (msg) => {
        if (webhookUrl) context.waitUntil(fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: msg }) }).catch(()=>{}));
    };

    // If Service Key is missing, the whole security system fails. Stop here.
    if (!sbKey) return new Response(JSON.stringify({ error: "SERVER CONFIG ERROR: Missing DB Key" }), { status: 500 });

    const supabase = createClient('https://gdlvzfyvgmeyvlcgggix.supabase.co', sbKey);

    // ==========================================================
    // 2. CAPTCHA CHECK (STRICT)
    // ==========================================================
    if (!turnstileSecret) {
        // If you forgot the key in Cloudflare, fail safe (Block access)
        return new Response(JSON.stringify({ error: "SERVER CONFIG ERROR: Missing Turnstile Secret" }), { status: 500 });
    }

    if (!captcha) return new Response(JSON.stringify({ error: "CAPTCHA_REQUIRED" }), { status: 400 });
    
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: turnstileSecret, response: captcha, remoteip: clientIP })
    });
    const d = await verifyRes.json();
    
    if (!d.success) {
        // Log the exact error codes from Cloudflare (e.g. 'invalid-input-secret')
        await supabase.from('audit_logs').insert({ 
            actor_type: 'ATTACKER', ip: clientIP, action: 'CAPTCHA_FAIL', 
            details: `Codes: ${JSON.stringify(d['error-codes'])}` 
        });
        return new Response(JSON.stringify({ error: "CAPTCHA_FAILED", debug: d['error-codes'] }), { status: 403 });
    }

    // ==========================================================
    // 3. AUTO-BAN & SUSPICIOUS CHECK
    // ==========================================================
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60000).toISOString();
    const { count: failCount } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('ip', clientIP)
        .eq('action', 'LOGIN_FAIL')
        .gte('timestamp', fifteenMinsAgo);

    // A. BAN (5+ Fails)
    if (failCount >= 5) {
        const { data: isBanned } = await supabase.from('banned_ips').select('ip').eq('ip', clientIP).maybeSingle();
        if (!isBanned) {
            await supabase.from('banned_ips').insert({ ip: clientIP, reason: "Auto-Ban: Brute Force" });
            await supabase.from('audit_logs').insert({ actor_type: 'ATTACKER', ip: clientIP, action: 'AUTO_BAN', details: 'Threshold Exceeded' });
            
            sendDiscord(`<@${ADMIN_ID}>\n**🚨 AUTO-BAN**\nTarget: ${clientIP}`);
            context.waitUntil(sendEmailAlert(context, "CRITICAL: Auto-Ban Executed", `Target IP: ${clientIP} banned.`));
        }
        return new Response(JSON.stringify({ error: "ACCESS DENIED: IP BANNED" }), { status: 403 });
    }

    // B. DEAD MAN SWITCH
    const { data: status } = await supabase.from('admin_status').select('is_online, last_heartbeat').eq('id', 1).single();
    const now = new Date();
    const lastBeat = new Date(status?.last_heartbeat || 0);
    const diffSeconds = (now - lastBeat) / 1000;

    if (!status || status.is_online !== true || diffSeconds > 120) {
         return new Response(JSON.stringify({ error: "SECURITY LOCKOUT: HUD OFFLINE" }), { status: 403 });
    }

    // ==========================================================
    // 4. CREDENTIAL VALIDATION
    // ==========================================================

    // A. PASSWORD
    if (password !== actualPassword) {
       await supabase.from('audit_logs').insert({ 
           actor_type: 'ATTACKER', ip: clientIP, action: 'LOGIN_FAIL', details: 'Wrong Password' 
       });
       sendDiscord(`<@${ADMIN_ID}>\n**Alert:** Login failed.\n**Source:** ${clientIP}\n**Count:** ${failCount + 1}`);
       await new Promise(r => setTimeout(r, 2000));
       return new Response(JSON.stringify({ error: "PASSWORD_INCORRECT" }), { status: 401 });
    }

    // B. STEP-UP AUTH (Suspicious IP + Correct Password)
    // Check verification code first
    let isVerified = false;
    if (stepUpCode) {
        const { data: storedCode } = await supabase.from('system_config').select('value').eq('key', 'temp_auth_code').single();
        if (!storedCode || storedCode.value !== stepUpCode) {
            await supabase.from('audit_logs').insert({ actor_type: 'ATTACKER', ip: clientIP, action: 'LOGIN_FAIL', details: 'Wrong Step-Up Code' });
            return new Response(JSON.stringify({ error: "INVALID_VERIFICATION_CODE" }), { status: 401 });
        }
        await supabase.from('system_config').delete().eq('key', 'temp_auth_code');
        isVerified = true;
    }

    // If suspicious and not verified yet -> Challenge
    if (failCount >= 2 && !isVerified) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await supabase.from('system_config').upsert({ key: 'temp_auth_code', value: code });
        sendDiscord(`<@${ADMIN_ID}>\n**🛡️ SUSPICIOUS LOGIN**\n**Code:** \`${code}\``);
        return new Response(JSON.stringify({ stepUp: true, message: "Verification required." }), { status: 200 });
    }

    // C. 2FA / TOTP (STRICT CHECK)
    if (!totpSecret) {
        // FAIL SAFE: If secret is missing in Cloudflare, block login to prevent unauthorized access
        return new Response(JSON.stringify({ error: "SERVER CONFIG ERROR: Missing TOTP Secret" }), { status: 500 });
    }

    const totp = new OTPAuth.TOTP({ algorithm: "SHA1", digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(totpSecret) });
    const delta = totp.validate({ token: token, window: 2 });
    
    if (delta === null) {
       await supabase.from('audit_logs').insert({ actor_type: 'ATTACKER', ip: clientIP, action: 'LOGIN_FAIL', details: 'Wrong 2FA' });
       return new Response(JSON.stringify({ error: "2FA_CODE_INVALID" }), { status: 401 });
    }

    // ==========================================================
    // 5. SUCCESS
    // ==========================================================
    await supabase.from('audit_logs').insert({ actor_type: 'ADMIN', ip: clientIP, action: 'LOGIN_SUCCESS', details: 'Session Started' });
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
