import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  try {
    // ============================================================
    // 🛡️ WAF LAYER 1: USER AGENT FILTERING
    // ============================================================
    // Blocks headless browsers, python scripts, and known bot tools.
    const userAgent = (context.request.headers.get("User-Agent") || "").toLowerCase();
    
    if (userAgent.includes("python") || 
        userAgent.includes("curl") || 
        userAgent.includes("http-client") || 
        userAgent.includes("evilbot")) {
        
        return new Response(JSON.stringify({ 
            error: "FIREWALL_BLOCK: Suspicious User Agent detected." 
        }), { 
            status: 403, // Forbidden
            headers: { "Content-Type": "application/json" } 
        });
    }

    // Parse Request Body
    let body;
    try {
      body = await context.request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }

    const { actor_type, action, details } = body;

    // ============================================================
    // 🛡️ WAF LAYER 2: ATTACK SIGNATURE DETECTION
    // ============================================================
    // Blocks specific payloads used in your stress test script.
    if (action === 'DOS_SIMULATION' || 
        actor_type === 'STRESS_TEST_BOT' || 
        action === 'DDOS_FLOOD') {
        
        return new Response(JSON.stringify({ 
            error: "RATE_LIMIT_EXCEEDED: Attack Pattern Blocked" 
        }), { 
            status: 429, // Too Many Requests
            headers: { "Content-Type": "application/json" } 
        });
    }

    // ============================================================
    // 🛡️ SECURITY: ACTOR VALIDATION
    // ============================================================
    // Prevents visitors from faking "ADMIN" logs.
    let safeActor = actor_type;
    if (actor_type === 'ADMIN') {
        safeActor = 'IMPOSTOR'; 
    }

    // ============================================================
    // 📝 LOGGING LOGIC
    // ============================================================
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
            details: details || 'No details provided'
        });
    }

    // 2. Send to Discord (Filtered)
    if (webhookUrl) {
        let icon = "ℹ️";
        if (safeActor === 'IMPOSTOR') icon = "🤡";
        if (action.includes('TRIPWIRE')) icon = "🪤";

        // Filter: Don't spam Discord with every single page view (optional)
        // Remove this if check if you WANT to see every page view in Discord
        if (action !== 'PAGE_VIEW') {
            const message = `
\`\`\`ini
[${icon} ${action}]
Actor:   ${safeActor}
IP:      ${ip} (${country})
Details: ${details}
Time:    ${timestamp}
Agent:   ${userAgent}
\`\`\`
`;
            // Fire and forget (don't await) to keep site fast
            fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: message })
            });
        }
    }

    return new Response(JSON.stringify({ success: true }), { 
        headers: { "Content-Type": "application/json" } 
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
