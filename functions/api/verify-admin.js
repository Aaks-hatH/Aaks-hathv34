import * as OTPAuth from "otpauth";

export async function onRequestPost(context) {
  try {
    const { password, token } = await context.request.json();
    const actualPassword = context.env.ADMIN_PASSWORD;
    const totpSecret = context.env.ADMIN_TOTP_SECRET;
    const webhookUrl = context.env.DISCORD_WEBHOOK_URL;
    
    // Get Metadata
    const clientIP = context.request.headers.get("CF-Connecting-IP") || "Unknown";
    const country = context.request.headers.get("CF-IPCountry") || "XX";
    const timestamp = new Date().toISOString();

    if (!actualPassword) {
        return new Response(JSON.stringify({ error: "Server Config Error" }), { status: 500 });
    }

    // 1. Check Password
    if (password !== actualPassword) {
      // SEND ALERT: Plain text format for reliability
      await sendDiscordAlert(webhookUrl, `
\`\`\`diff
- [CRITICAL] UNAUTHORIZED ACCESS ATTEMPT
----------------------------------------
TYPE:    Password Failure
IP:      ${clientIP} (${country})
TIME:    ${timestamp}
\`\`\`
`);
      
      // Artificial Delay
      await new Promise(r => setTimeout(r, 2000));
      return new Response(JSON.stringify({ error: "ACCESS_DENIED" }), { status: 401 });
    }

    // 2. Check 2FA
    if (totpSecret) {
        const totp = new OTPAuth.TOTP({
          algorithm: "SHA1", digits: 6, period: 30,
          secret: OTPAuth.Secret.fromBase32(totpSecret)
        });
        
        const delta = totp.validate({ token: token, window: 1 });
        
        if (delta === null) {
           await sendDiscordAlert(webhookUrl, `
\`\`\`fix
! [WARNING] 2FA VERIFICATION FAILED
----------------------------------------
TYPE:    Valid Password / Invalid Code
IP:      ${clientIP} (${country})
TIME:    ${timestamp}
\`\`\`
`);
           return new Response(JSON.stringify({ error: "INVALID_OTP_TOKEN" }), { status: 401 });
        }
    }

    // 3. Success
    await sendDiscordAlert(webhookUrl, `
\`\`\`css
[SUCCESS] ADMIN SESSION ESTABLISHED
----------------------------------------
USER:    root
IP:      ${clientIP} (${country})
TIME:    ${timestamp}
\`\`\`
`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

async function sendDiscordAlert(url, content) {
  if(!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content }) // Simple content payload
    });
  } catch (e) {
    // Ignore alert failures so login doesn't break
  }
}
