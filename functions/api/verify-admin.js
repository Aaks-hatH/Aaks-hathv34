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

    // Get Metadata for Logs
    const clientIP = context.request.headers.get("CF-Connecting-IP") || "Unknown";
    const country = context.request.headers.get("CF-IPCountry") || "XX";
    const timestamp = new Date().toISOString();

    if (!actualPassword) {
        return new Response(JSON.stringify({ error: "Server Config Error: Password not set" }), { status: 500 });
    }

    // 2. PASSWORD CHECK
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
       // Artificial Delay to stop brute force
       await new Promise(r => setTimeout(r, 2000));
       return new Response(JSON.stringify({ error: "PASSWORD_INCORRECT" }), { status: 401 });
    }

    // 3. 2FA CHECK (TOTP)
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

    // 4. SUCCESS
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
