import { createClient } from '@supabase/supabase-js';

const ADMIN_ID = "1168575437723680850";

export async function onRequestPost(context) {
  try {
    const { username, password } = await context.request.json();
    const ip = context.request.headers.get("CF-Connecting-IP") || "Unknown";
    const country = context.request.headers.get("CF-IPCountry") || "XX";
    const userAgent = context.request.headers.get("User-Agent");
    
    const webhookUrl = context.env.DISCORD_WEBHOOK_URL;
    const sbUrl = 'https://gdlvzfyvgmeyvlcgggix.supabase.co';
    const sbKey = context.env.SUPABASE_SERVICE_KEY;

    // 1. ALERT DISCORD (PING ADMIN)
    if (webhookUrl) {
      const message = `
<@${ADMIN_ID}>
\`\`\`diff
- [🍯 HONEYPOT TRIGGERED]
-------------------------
IP:    ${ip} (${country})
User:  ${username}
Pass:  ${password}
Agent: ${userAgent}
\`\`\`
`;
      context.waitUntil(fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message })
      }));
    }

    // 2. LOG TO DB
    if (sbKey) {
        const supabase = createClient(sbUrl, sbKey);
        await supabase.from('audit_logs').insert({
            actor_type: 'ATTACKER',
            ip: `${ip} (${country})`,
            action: 'CREDENTIAL_HARVEST',
            details: `Attempted: ${username} / ${password}`
        });
    }

    await new Promise(r => setTimeout(r, 2000));
    return new Response(JSON.stringify({ error: "Invalid credentials" }), { 
        status: 401, headers: { "Content-Type": "application/json" }
    });

  } catch (e) { return new Response("Error", { status: 500 }); }
}
