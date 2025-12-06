import * as OTPAuth from "otpauth";
import { createClient } from '@supabase/supabase-js';

const ADMIN_ID = "1168575437723680850"; // Your ID

export async function onRequestPost(context) {
  try {
    const { password, token, captcha } = await context.request.json();
    
    // Secrets
    const actualPassword = (context.env.ADMIN_PASSWORD || "").trim();
    const totpSecret = (context.env.ADMIN_TOTP_SECRET || "").replace(/\s/g, '');
    const webhookUrl = context.env.DISCORD_WEBHOOK_URL;
    const turnstileSecret = context.env.TURNSTILE_SECRET_KEY;
    const sbKey = context.env.SUPABASE_SERVICE_KEY;
    
    // Metadata
    const clientIP = context.request.headers.get("CF-Connecting-IP") || "Unknown";
    const country = context.request.headers.get("CF-IPCountry") || "XX";
    
    // Helper to send alerts safely
    const sendAlert = (msg) => {
        if (webhookUrl) {
            context.waitUntil(
                fetch(webhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: msg })
                }).catch(err => console.log("Discord Error:", err))
            );
        }
    };

    // 1. CAPTCHA CHECK
    if (turnstileSecret) {
        if (!captcha) return new Response(JSON.stringify({ error: "CAPTCHA_REQUIRED" }), { status: 400 });
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret: turnstileSecret, response: captcha, remoteip: clientIP })
        });
        const d = await verifyRes.json();
        if (!d.success) return new Response(JSON.stringify({ error: "CAPTCHA_FAILED" }), { status: 403 });
    }

    // 2. PASSWORD CHECK
    if (password !== actualPassword) {
       sendAlert(`<@${ADMIN_ID}> \n\`\`\`diff\n- [CRITICAL] BAD PASSWORD ATTEMPT\nIP: ${clientIP} (${country})\`\`\``);
       await new Promise(r => setTimeout(r, 2000));
       return new Response(JSON.stringify({ error: "PASSWORD_INCORRECT" }), { status: 401 });
    }

    // 3. 2FA CHECK
    if (totpSecret) {
        const totp = new OTPAuth.TOTP({ algorithm: "SHA1", digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(totpSecret) });
        const delta = totp.validate({ token: token, window: 2 });
        if (delta === null) {
           sendAlert(`<@${ADMIN_ID}> \n\`\`\`fix\n! [WARNING] 2FA FAILED (Pass OK)\nIP: ${clientIP}\`\`\``);
           return new Response(JSON.stringify({ error: "2FA_CODE_INVALID" }), { status: 401 });
        }
    }

    // 4. SUCCESS
    sendAlert(`<@${ADMIN_ID}> \n\`\`\`css\n[SUCCESS] ADMIN SESSION STARTED\nIP: ${clientIP} (${country})\`\`\``);
    
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
