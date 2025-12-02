import * as OTPAuth from "otpauth";

export async function onRequestPost(context) {
  const startTime = Date.now();
  
  try {
    const { password, token } = await context.request.json();
    
    // 1. Get Secrets
    const actualPassword = context.env.ADMIN_PASSWORD;
    const totpSecret = context.env.ADMIN_TOTP_SECRET; // Base32 Secret Key
    const webhookUrl = context.env.DISCORD_WEBHOOK_URL;
    
    // Get Client IP (Cloudflare Header)
    const clientIP = context.request.headers.get("CF-Connecting-IP") || "Unknown IP";
    const country = context.request.headers.get("CF-IPCountry") || "Unknown Location";

    // 2. Security Check: Configuration
    if (!actualPassword || !totpSecret) {
      return new Response(JSON.stringify({ error: "Server Config Error" }), { status: 500 });
    }

    // 3. Verify Password
    if (password !== actualPassword) {
      // 🚨 ALERT: Bad Password
      await sendDiscordAlert(webhookUrl, " FAILED LOGIN ATTEMPT", 0xFF0000, [
        { name: "Reason", value: "Invalid Password" },
        { name: "IP Address", value: clientIP },
        { name: "Location", value: country }
      ]);
      
      // ARTIFICIAL DELAY (Rate Limiting)
      // Make them wait 2 seconds so they can't brute force fast
      await new Promise(r => setTimeout(r, 2000));
      
      return new Response(JSON.stringify({ error: "Access Denied" }), { status: 401 });
    }

    // 4. Verify 2FA (TOTP)
    const totp = new OTPAuth.TOTP({
      issuer: "CyberPortfolio",
      label: "Admin",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(totpSecret)
    });

    // Verify with a window of 1 (allows slight time drift)
    const delta = totp.validate({ token: token, window: 1 });

    if (delta === null) {
      // 🚨 ALERT: Bad 2FA
      await sendDiscordAlert(webhookUrl, " 2FA FAILURE", 0xFFA500, [
        { name: "Reason", value: "Correct Password, Wrong 2FA Code" },
        { name: "IP Address", value: clientIP },
        { name: "Location", value: country }
      ]);

      return new Response(JSON.stringify({ error: "Invalid 2FA Code" }), { status: 401 });
    }

    // 5. SUCCESS
    // ✅ ALERT: Successful Login
    await sendDiscordAlert(webhookUrl, " ADMIN ACCESS GRANTED", 0x00FF00, [
      { name: "User", value: "Root Admin" },
      { name: "IP Address", value: clientIP },
      { name: "Location", value: country }
    ]);

    return new Response(JSON.stringify({ success: true, token: "SESSION_ESTABLISHED" }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

// Helper: Send to Discord
async function sendDiscordAlert(webhookUrl, title, color, fields) {
  if (!webhookUrl) return;
  
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [{
        title: title,
        color: color,
        fields: fields,
        footer: { text: "Cyber Army Knife Security System" },
        timestamp: new Date().toISOString()
      }]
    })
  });
}
