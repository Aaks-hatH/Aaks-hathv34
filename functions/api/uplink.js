import { createClient } from '@supabase/supabase-js';

const ADMIN_ID = "1168575437723680850"; // Your Discord ID

export async function onRequestPost(context) {
  try {
    const { message } = await context.request.json();
    const ip = context.request.headers.get("CF-Connecting-IP") || "Unknown";
    const country = context.request.headers.get("CF-IPCountry") || "XX";
    
    const sbUrl = 'https://gdlvzfyvgmeyvlcgggix.supabase.co';
    const sbKey = context.env.SUPABASE_SERVICE_KEY;
    const webhookUrl = context.env.DISCORD_WEBHOOK_URL;

    // 1. Log to HUD (Database)
    if (sbKey) {
        const supabase = createClient(sbUrl, sbKey);
        await supabase.from('audit_logs').insert({
            actor_type: 'VISITOR',
            ip: `${ip} (${country})`,
            action: 'UPLINK_MSG',
            details: message
        });
    }

    // 2. Alert Discord
    if (webhookUrl) {
        context.waitUntil(fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                content: `<@${ADMIN_ID}>\n\`\`\`bash\n[INCOMING TRANSMISSION]\nSource: ${ip}\nMsg: "${message}"\n\`\`\`` 
            })
        }));
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: "Transmission Failed" }), { status: 500 });
  }
}
