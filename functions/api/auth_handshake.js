import * as OTPAuth from "otpauth";
import { createClient } from '@supabase/supabase-js';

const ADMIN_ID = "1168575437723680850";

// --- EMAIL HELPER ---
async function sendEmailAlert(context, subject, message) {
  const serviceId = context.env.EMAILJS_SERVICE_ID;
  const templateId = context.env.EMAILJS_TEMPLATE_ID;
  const userId = context.env.EMAILJS_USER_ID;
  const accessToken = context.env.EMAILJS_ACCESS_TOKEN;

  if (!serviceId || !accessToken) return "MISSING_EMAIL_KEYS";

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: userId,
    accessToken: accessToken,
    template_params: { subject, message, to_email: 'aakshathariharan@gmail.com' }
  };

  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });

  return res.ok ? "SENT" : `EMAIL_FAIL: ${await res.text()}`;
}

export async function onRequestPost(context) {
  if (context.request.method === "OPTIONS") return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
  
  try {
    const { password, token, captcha, stepUpCode } = await context.request.json();
    
    // Secrets
    const actualPassword = (context.env.ADMIN_PASSWORD || "").trim();
    const totpSecret = (context.env.ADMIN_TOTP_SECRET || "").replace(/\s/g, '');
    const webhookUrl = context.env.DISCORD_WEBHOOK_URL;
    const turnstileSecret = context.env.TURNSTILE_SECRET_KEY;
    const sbKey = context.env.SUPABASE_SERVICE_KEY;
    
    const clientIP = context.request.headers.get("CF-Connecting-IP") || "Unknown";
    const country = context.request.headers.get("CF-IPCountry") || "XX";

    // DB Connection
    const supabase = createClient('https://gdlvzfyvgmeyvlcgggix.supabase.co', sbKey);

    const sendAlert = (msg) => {
        if (webhookUrl) context.waitUntil(fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: msg }) }).catch(()=>{}));
    };

    // 1. AUTO-BAN CHECK
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60000).toISOString();
    
    // DEBUG: Check if we can actually read the DB
    const { count: failCount, error: countError } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('ip', clientIP)
        .eq('action', 'LOGIN_FAIL')
        .gte('timestamp', fifteenMinsAgo);

    if (countError) {
        // 🛑 DATABASE ERROR TRAP
        return new Response(JSON.stringify({ error: "DB_READ_ERROR", details: countError.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    if (failCount >= 5) {
        const { data: isBanned } = await supabase.from('banned_ips').select('ip').eq('ip', clientIP).maybeSingle();
        
        // Try to ban
        const { error: banError } = await supabase.from('banned_ips').insert({ ip: clientIP, reason: "Auto-Ban: Brute Force" });
        
        // Try to Email
        const emailStatus = await sendEmailAlert(context, "🚨 CRITICAL: Auto-Ban", `IP: ${clientIP} banned.`);

        if (banError && !isBanned) {
             return new Response(JSON.stringify({ error: "DB_WRITE_ERROR", details: banError.message }), { status: 500, headers: { "Content-Type": "application/json" } });
        }

        return new Response(JSON.stringify({ error: "ACCESS DENIED: IP BANNED", debug_email: emailStatus }), { status: 403, headers: { "Content-Type": "application/json" } });
    }

    // 2. CAPTCHA
    if (turnstileSecret) {
        if (!captcha) return new Response(JSON.stringify({ error: "CAPTCHA_REQUIRED" }), { status: 400 });
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret: turnstileSecret, response: captcha, remoteip: clientIP })
        });
        const d = await verifyRes.json();
        if (!d.success) return new Response(JSON.stringify({ error: "CAPTCHA_FAILED" }), { status: 403 });
    }

    // 3. DEAD MAN CHECK
    const { data: status } = await supabase.from('admin_status').select('is_online, last_heartbeat').eq('id', 1).single();
    const now = new Date();
    const lastBeat = new Date(status?.last_heartbeat || 0);
    const diffSeconds = (now - lastBeat) / 1000;

    if (!status || status.is_online !== true || diffSeconds > 120) {
         return new Response(JSON.stringify({ error: "SECURITY LOCKOUT: HUD OFFLINE" }), { status: 403 });
    }

    // 4. PASSWORD CHECK
    if (password !== actualPassword) {
       // DEBUG: Check if INSERT fails
       const { error: insertError } = await supabase.from('audit_logs').insert({ 
           actor_type: 'ATTACKER', ip: clientIP, action: 'LOGIN_FAIL', details: 'Wrong Password' 
       });

       if (insertError) {
           // 🛑 RETURN DB ERROR SO WE SEE IT
           return new Response(JSON.stringify({ error: "DB_INSERT_FAIL", details: insertError.message }), { status: 500, headers: { "Content-Type": "application/json" } });
       }

       sendAlert(`<@${ADMIN_ID}>\n**Alert:** Login failed.\n**Source:** ${clientIP}\n**Count:** ${failCount + 1}`);
       await new Promise(r => setTimeout(r, 2000)); 
       return new Response(JSON.stringify({ error: "PASSWORD_INCORRECT" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    // 5. STEP-UP CHECK
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

    if (failCount >= 2 && !isVerified) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await supabase.from('system_config').upsert({ key: 'temp_auth_code', value: code });
        sendAlert(`<@${ADMIN_ID}>\n**🛡️ SUSPICIOUS LOGIN**\n**Code:** \`${code}\``);
        return new Response(JSON.stringify({ stepUp: true, message: "Verification required." }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // SUCCESS
    await supabase.from('audit_logs').insert({ actor_type: 'ADMIN', ip: clientIP, action: 'LOGIN_SUCCESS', details: 'Session Started' });
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
