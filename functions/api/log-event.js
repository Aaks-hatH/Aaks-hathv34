import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  try {
    // 1. Safe Request Parsing
    let body;
    try {
      body = await context.request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
    }

    const { actor_type, action, details } = body;
    
    // 2. Security: Validate Actor
    // Since this is a public endpoint, anyone can call it.
    // We downgrade anyone claiming to be "ADMIN" to "IMPOSTOR" so your logs stay trustworthy.
    // (Real Admin actions happen via verify-admin.js or toggle-lockdown.js).
    let safeActor = actor_type;
    if (actor_type === 'ADMIN') {
        safeActor = 'IMPOSTOR'; 
    }

    // 3. Get Metadata (Cloudflare Headers)
    const ip = context.request.headers.get("CF-Connecting-IP") || "Unknown";
    const country = context.request.headers.get("CF-IPCountry") || "XX";
    const timestamp = new Date().toISOString();
    
    // 4. Get Keys
    const sbUrl = 'https://gdlvzfyvgmeyvlcgggix.supabase.co';
    const sbKey = context.env.SUPABASE_SERVICE_KEY;
    const webhookUrl = context.env.DISCORD_WEBHOOK_URL;

    if (action === 'DDOS_FLOOD') {
    // 429 = Too Many Requests
    return new Response("Rate Limited", { status: 429 });
}

    // 5. Save to Database (Audit Log)
    if (sbKey) {
        const supabase = createClient(sbUrl, sbKey);
        await supabase.from('audit_logs').insert({
            actor_type: safeActor,
            ip: `${ip} (${country})`,
            action: action || 'UNKNOWN_ACTION',
            details: details || 'No details provided'
        });
    }

    

    // 6. Send to Discord
    if (webhookUrl) {
        let icon = "ℹ️";
        if (safeActor === 'IMPOSTOR') icon = "🤡";
        if (action.includes('TRIPWIRE')) icon = "🪤";
        
        // We format this as a code block for the "Hacker" aesthetic
        const message = `
\`\`\`ini
[${icon} ${action}]
Actor:   ${safeActor}
IP:      ${ip} (${country})
Details: ${details}
Time:    ${timestamp}
\`\`\`
`;
        // We don't await this fetch so the user doesn't have to wait for Discord
        fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: message })
        });
    }

    return new Response(JSON.stringify({ success: true }), { 
        headers: { "Content-Type": "application/json" } 
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
