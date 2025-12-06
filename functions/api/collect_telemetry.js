import { createClient } from '@supabase/supabase-js';

// YOUR DISCORD ID
const ADMIN_ID = "1168575437723680850";

export async function onRequestPost(context) {
  try {
    // --- 🛡️ WAF LAYER 1: USER AGENT FILTERING ---
    const userAgent = (context.request.headers.get("User-Agent") || "").toLowerCase();
    
    // Check for malicious bots
    if (userAgent.includes("python") || 
        userAgent.includes("curl") || 
        userAgent.includes("evilbot")) {
        
        return new Response(JSON.stringify({ 
            error: "FIREWALL_BLOCK: Suspicious User Agent." 
        }), { status: 403 });
    }

    let body;
    try { body = await context.request.json(); } 
    catch (e) { return new Response("Invalid JSON", { status: 400 }); }

    const { actor_type, action, details } = body;

    // --- 🛡️ WAF LAYER 2: ATTACK SIGNATURES ---
    if (action === 'DOS_SIMULATION' || actor_type === 'STRESS_TEST_BOT') {
        return new Response(JSON.stringify({ error: "RATE_LIMIT_EXCEEDED" }), { status: 429 });
    }

    let safeActor = actor_type;
    if (actor_type === 'ADMIN') safeActor = 'IMPOSTOR'; 

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
            actor_type: safeActor,
            ip: `${ip} (${country})`,
            action: action || 'UNKNOWN',
            details: details || 'No details'
        });
    }

    // 2. SEND TO DISCORD
    if (webhookUrl) {
        let icon = "ℹ️";
        let ping = ""; // Default: No Ping

        // LOGIC: Only ping on Critical Events
        if (safeActor === 'IMPOSTOR' || action.includes('TRIPWIRE') || action.includes('ATTACK')) {
            ping = `<@${ADMIN_ID}>`; // Ping You
            icon = "🚨";
        }
        
        // Dont spam pings for page views, but log them
        if (action === 'PAGE_VIEW') icon = "👀";

        // Filter: Send everything (Remove if you want to hide page views)
        const message = `
${ping}
\`\`\`ini
[${icon} ${action}]
Actor:   ${safeActor}
IP:      ${ip} (${country})
Details: ${details}
Time:    ${timestamp}
Agent:   ${userAgent}
\`\`\`
`;
        context.waitUntil(
            fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: message })
            }).catch(() => {})
        );
    }

    return new Response(JSON.stringify({ success: true }), { 
        headers: { "Content-Type": "application/json" } 
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
