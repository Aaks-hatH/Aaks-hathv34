import { createClient } from '@supabase/supabase-js';

const GHOST_KEY = "GHOST-MK-998877-ALPHA-VIGILANTE";
const ADMIN_ID = "1168575437723680850"; // Your Discord ID

export async function onRequestPost(context) {
  try {
    const { currentUrl, threatScore, status } = await context.request.json();
    const ghostHeader = context.request.headers.get('X-Ghost-Token');
    const sbKey = context.env.SUPABASE_SERVICE_KEY;
    const webhookUrl = context.env.DISCORD_WEBHOOK_URL;

    if (ghostHeader !== GHOST_KEY) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const supabase = createClient('https://gdlvzfyvgmeyvlcgggix.supabase.co', sbKey);
    const now = new Date().toISOString();

    // 1. Update Telemetry
    await supabase.from('device_telemetry').upsert({ 
        id: 1, last_seen: now, current_url: currentUrl, 
        threat_score: threatScore, device_status: status
    });

    // 2. Update Public Status
    await supabase.from('admin_status').upsert({
        id: 1, is_online: true, last_heartbeat: now,
        current_task: currentUrl 
    });

    // 3. CHECK FOR INTRUSION (Sentry Mode Trigger)
    if (status === "INTRUSION") {
        // A. Log as ATTACKER (Triggers HUD Alarm)
        await supabase.from('audit_logs').insert({
            actor_type: 'ATTACKER',
            ip: 'INTERNAL_DEVICE',
            action: 'PHYSICAL_BREACH',
            details: 'Ghost Key detected unauthorized input during Sentry Mode.'
        });

        // B. Send Discord Alert
        if (webhookUrl) {
            context.waitUntil(fetch(webhookUrl, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: `<@${ADMIN_ID}>\n**🚨 PHYSICAL SECURITY BREACH**\nYour computer has been accessed while in Sentry Mode.` })
            }));
        }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
