import { createClient } from '@supabase/supabase-js';

const ADMIN_ID = "1168575437723680850";

export async function onRequestGet(context) {
  const clientIP = context.request.headers.get("CF-Connecting-IP") || "Unknown";
  const country = context.request.headers.get("CF-IPCountry") || "XX";
  const sbKey = context.env.SUPABASE_SERVICE_KEY;
  const webhookUrl = context.env.DISCORD_WEBHOOK_URL;

  const supabase = createClient('https://gdlvzfyvgmeyvlcgggix.supabase.co', sbKey);

  // 1. BAN THE IP
  await supabase.from('banned_ips').insert({ 
      ip: clientIP, 
      reason: "TRIPWIRE: Accessed Hidden System Recovery Endpoint" 
  });

  // 2. ALERT DISCORD
  if (webhookUrl) {
      const msg = `<@${ADMIN_ID}>\n**🕸️ TRIPWIRE TRIGGERED**\n**Source:** ${clientIP} (${country})\n**Action:** User/Bot clicked the invisible honey link.\n**Status:** BANNED`;
      context.waitUntil(fetch(webhookUrl, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: msg })
      }));
  }

  // 3. THEATRICAL RESPONSE (The "Gotcha" Screen)
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>SYSTEM CRITICAL</title>
        <style>
            body { background-color: #000; color: #ef4444; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
            .container { border: 1px solid #ef4444; padding: 40px; box-shadow: 0 0 50px rgba(239, 68, 68, 0.3); max-width: 600px; }
            h1 { font-size: 48px; margin: 0 0 20px 0; letter-spacing: 5px; text-shadow: 2px 2px #500; }
            p { font-size: 18px; color: #fff; }
            .ip { color: #22c55e; font-weight: bold; font-size: 24px; margin: 20px 0; display: block; }
            .blink { animation: blink 1s infinite; }
            @keyframes blink { 50% { opacity: 0; } }
        </style>
    </head>
    <body>
        <div class="container">
            <h1> ACCESS DENIED</h1>
            <p>UNAUTHORIZED SYSTEM RECOVERY ATTEMPT DETECTED.</p>
            <p>Your digital footprint has been captured.</p>
            <p>Why'd you try hacking a cybersecurity agent?</p>
            <span class="ip">TARGET IP: ${clientIP}</span>
            <p class="blink" style="color: #ef4444; margin-top: 30px;">[ COUNTER-MEASURES DEPLOYED ]</p>
            <p style="font-size: 12px; color: #666; margin-top: 40px;">Incident ID: TRP-${Date.now()}</p>
        </div>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
    status: 403
  });
}
