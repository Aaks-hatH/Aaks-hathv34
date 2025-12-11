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
      reason: "TRIPWIRE: Accessed Honey Link" 
  });

  // 2. ALERT
  if (webhookUrl) {
      const msg = `<@${ADMIN_ID}>\n**🕸️ TRIPWIRE TRIGGERED**\n**Source:** ${clientIP} (${country})\n**Action:** User/Bot clicked the invisible honey link.\n**Status:** BANNED`;
      await fetch(webhookUrl, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: msg })
      });
  }

  // 3. Return a fake 404 so they don't know they triggered a trap
  return new Response("Not Found", { status: 404 });
}
