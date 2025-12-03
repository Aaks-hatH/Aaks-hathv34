import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  try {
    const { actor_type, action, details } = await context.request.json();
    
    const ip = context.request.headers.get("CF-Connecting-IP") || "Unknown";
    const country = context.request.headers.get("CF-IPCountry") || "XX";
    const timestamp = new Date().toISOString();
    
    const sbUrl = 'https://gdlvzfyvgmeyvlcgggix.supabase.co';
    const sbKey = context.env.SUPABASE_SERVICE_KEY;
    const webhookUrl = context.env.DISCORD_WEBHOOK_URL;

    // 1. Save to Database
    if (sbKey) {
        const supabase = createClient(sbUrl, sbKey);
        await supabase.from('audit_logs').insert({
            actor_type,
            ip: `${ip} (${country})`,
            action,
            details
        });
    }

    // 2. Send to Discord
    if (webhookUrl) {
        let icon = "ℹ️";
        if (actor_type === 'ADMIN') icon = "🛡️";
        if (action.includes('BAN')) icon = "🚫";
        if (action.includes('LOCKDOWN')) icon = "🚨";

        const message = `
\`\`\`ini
[${icon} ${action}]
Actor:   ${actor_type}
IP:      ${ip} (${country})
Details: ${details}
Time:    ${timestamp}
\`\`\`
`;
        await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: message })
        });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
