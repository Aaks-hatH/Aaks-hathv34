import { createClient } from '@supabase/supabase-js';

const ADMIN_ID = "1168575437723680850";

export async function onRequestPost(context) {
  try {
    const userAgent = (context.request.headers.get("User-Agent") || "").toLowerCase();
    
    // Firewall Block
    if (userAgent.includes("python") || userAgent.includes("curl") || userAgent.includes("evilbot")) {
        return new Response(JSON.stringify({ error: "Access Denied: User Agent Blocked" }), { status: 403 });
    }

    let body;
    try { body = await context.request.json(); } catch (e) { return new Response("Invalid JSON", { status: 400 }); }

    const { actor_type, action, details } = body;
    let safeActor = actor_type === 'ADMIN' ? 'IMPOSTOR' : actor_type;

    const ip = context.request.headers.get("CF-Connecting-IP") || "Unknown";
    const country = context.request.headers.get("CF-IPCountry") || "XX";
    
    const sbUrl = 'https://gdlvzfyvgmeyvlcgggix.supabase.co';
    const sbKey = context.env.SUPABASE_SERVICE_KEY;
    const webhookUrl = context.env.DISCORD_WEBHOOK_URL;

    // Database Log
    if (sbKey) {
        const supabase = createClient(sbUrl, sbKey);
        await supabase.from('audit_logs').insert({
            actor_type: safeActor,
            ip: `${ip} (${country})`,
            action: action || 'UNKNOWN',
            details: details || 'No details'
        });
    }

    // Discord Alert
    if (webhookUrl) {
        // Ping logic
        let ping = "";
        if (safeActor === 'IMPOSTOR' || action.includes('TRIPWIRE') || action.includes('ATTACK')) {
            ping = `<@${ADMIN_ID}> `;
        }
        
        // Clean Message Format
        if (action !== 'PAGE_VIEW') {
            const message = `${ping}**Event Log:** ${action}\n**Actor:** ${safeActor}\n**IP:** ${ip} (${country})\n**Details:** ${details}`;
            
            context.waitUntil(fetch(webhookUrl, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: message })
            }).catch(() => {}));
        }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500 }); }
}
