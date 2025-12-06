import { createClient } from '@supabase/supabase-js';
import * as OTPAuth from "otpauth";

export async function onRequest(context) {
  // 1. Handle CORS Preflight (Required for some browsers)
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (context.request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { password, token } = await context.request.json();
    
    // Get Environment Variables
    // .trim() removes accidental spaces from copy-pasting
    const actualPassword = (context.env.ADMIN_PASSWORD || "").trim();
    const totpSecret = (context.env.ADMIN_TOTP_SECRET || "").replace(/\s/g, ''); 
    const webhookUrl = context.env.DISCORD_WEBHOOK_URL;
    
    // Supabase Config
    const sbUrl = 'https://gdlvzfyvgmeyvlcgggix.supabase.co';
    const sbKey = context.env.SUPABASE_SERVICE_KEY; // Use Service Key for reliable backend access

    // Get Metadata for Logs
    const clientIP = context.request.headers.get("CF-Connecting-IP") || "Unknown";
    const country = context.request.headers.get("CF-IPCountry") || "XX";
    const timestamp = new Date().toISOString();

    if (password !== actualPassword) {
       await sendDiscordAlert(webhookUrl, `...`);
       await new Promise(r => setTimeout(r, 2000));
       
       // Ensure this is 401, NOT 200
       return new Response(JSON.stringify({ error: "PASSWORD_INCORRECT" }), { 
           status: 401,
           headers: { "Content-Type": "application/json" }
       });
    }

    // ---------------------------------------------------------
    // CHECK 1: DEAD MAN'S SWITCH (Is HUD Online?)
    // ---------------------------------------------------------
    if (sbKey) {
        const supabase = createClient(sbUrl, sbKey);
        const { data: status } = await supabase.from('admin_status').select('is_online').eq('id', 1).single();
        
        if (!status || status.is_online !== true) {
            // 🚨 ALERT: Login Attempt while Offline
            await sendDiscordAlert(webhookUrl, `
\`\`\`diff
- [SECURITY LOCKOUT ACTIVATED]
------------------------------
EVENT:   Login Attempt Rejected
REASON:  Admin HUD is Offline (Dead Man's Switch)
IP:      ${clientIP} (${country})
TIME:    ${timestamp}
\`\`\`
`);
            return new Response(JSON.stringify({ error: "SECURITY LOCKOUT: Admin HUD must be online to authenticate." }), { status: 403 });
        }
    }

    // ---------------------------------------------------------
    // CHECK 2: PASSWORD
    // ---------------------------------------------------------
    if (password !== actualPassword) {
       await sendDiscordAlert(webhookUrl, `
\`\`\`diff
- [CRITICAL] FAILED LOGIN ATTEMPT
---------------------------------
REASON:  Invalid Password
IP:      ${clientIP} (${country})
TIME:    ${timestamp}
\`\`\`
`);
       // Artificial Delay to stop brute force (2 seconds)
       await new Promise(r => setTimeout(r, 2000));
       return new Response(JSON.stringify({ error: "PASSWORD_INCORRECT" }), { status: 401 });
    }

    // ---------------------------------------------------------
    // CHECK 3: 2FA (TOTP)
    // ---------------------------------------------------------
    if (totpSecret) {
        const totp = new OTPAuth.TOTP({
          algorithm: "SHA1", digits: 6, period: 30,
          secret: OTPAuth.Secret.fromBase32(totpSecret)
        });
        
        // VALIDATE: Window 2 means accept codes from ±60 seconds ago
        // This fixes "Invalid Code" errors caused by phone time drift
        const delta = totp.validate({ token: token, window: 2 });
        
        if (delta === null) {
           await sendDiscordAlert(webhookUrl, `
\`\`\`fix
! [WARNING] 2FA VERIFICATION FAILED
-----------------------------------
REASON:  Password OK, Code Invalid
IP:      ${clientIP} (${country})
TIME:    ${timestamp}
\`\`\`
`);
           return new Response(JSON.stringify({ error: "2FA_CODE_INVALID" }), { status: 401 });
        }
    }

    // ---------------------------------------------------------
    // 4. SUCCESS
    // ---------------------------------------------------------
    await sendDiscordAlert(webhookUrl, `
\`\`\`css
[SUCCESS] ADMIN SESSION ESTABLISHED
-----------------------------------
USER:    root
IP:      ${clientIP} (${country})
TIME:    ${timestamp}
\`\`\`
`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: `Server Error: ${e.message}` }), { status: 500 });
  }
}

// Helper to send clean text logs to Discord
async function sendDiscordAlert(url, content) {
  if(!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content })
    });
  } catch (e) {
    // Ignore alert failures
  }
}
