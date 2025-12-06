import * as OTPAuth from "otpauth";
import { createClient } from '@supabase/supabase-js';

const ADMIN_ID = "1168575437723680850";

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
  }
  if (context.request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  try {
    const { password, token, captcha } = await context.request.json();
    
    const actualPassword = (context.env.ADMIN_PASSWORD || "").trim();
    const totpSecret = (context.env.ADMIN_TOTP_SECRET || "").replace(/\s/g, '');
    const webhookUrl = context.env.DISCORD_WEBHOOK_URL;
    const turnstileSecret = context.env.TURNSTILE_SECRET_KEY;
    const sbKey = context.env.SUPABASE_SERVICE_KEY;
    
    const clientIP = context.request.headers.get("CF-Connecting-IP") || "Unknown";
    const country = context.request.headers.get("CF-IPCountry") || "XX";
    const timestamp = new Date().toISOString();

    // 1. CAPTCHA
    if (turnstileSecret) {
        if (!captcha) return new Response(JSON.stringify({ error: "CAPTCHA_REQUIRED" }), { status: 400 });
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret: turnstileSecret, response: captcha, remoteip: clientIP })
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) return new Response(JSON.stringify({ error: "CAPTCHA_FAILED" }), { status: 403 });
    }

    // 2. DEAD MAN'S SWITCH
    if (sbKey) {
        const supabase = createClient('https://gdlvzfyvgmeyvlcgggix.supabase.co', sbKey);
        const { data: status } = await supabase.from('admin_status').select('is_online').eq('id', 1).single();
        if (!status || status.is_online !== true) {
             await sendDiscordAlert(webhookUrl, `<@${ADMIN_ID}> \n\`\`\`diff\n- [BLOCKED] Offline Lockout Active\nIP: ${clientIP}\`\`\``);
             return new Response(JSON.stringify({ error: "SECURITY LOCKOUT: HUD OFFLINE" }), { status: 403 });
        }
    }

    // 3. PASSWORD
    if (password !== actualPassword) {
       await sendDiscordAlert(webhookUrl, `<@${ADMIN_ID}> \n\`\`\`diff\n- [CRITICAL] BAD PASSWORD ATTEMPT\nIP: ${clientIP} (${country})\`\`\``);
       await new Promise(r => setTimeout(r, 2000));
       return new Response(JSON.stringify({ error: "PASSWORD_INCORRECT" }), { status: 401 });
    }

    // 4. 2FA
    if (totpSecret) {
        const totp = new OTPAuth.TOTP({ algorithm: "SHA1", digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(totpSecret) });
        const delta = totp.validate({ token: token, window: 2 });
        if (delta === null) {
           await sendDiscordAlert(webhookUrl, `<@${ADMIN_ID}> \n\`\`\`fix\n! [WARNING] 2FA FAILED (Pass OK)\nIP: ${clientIP}\`\`\``);
           return new Response(JSON.stringify({ error: "2FA_CODE_INVALID" }), { status: 401 });
        }
    }

    // 5. SUCCESS
    await sendDiscordAlert(webhookUrl, `<@${ADMIN_ID}> \n\`\`\`css\n[SUCCESS] ADMIN SESSION STARTED\nIP: ${clientIP}\`\`\``);
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

async function sendDiscordAlert(url, content) {
  if(url) fetch(url, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ content }) });
}
