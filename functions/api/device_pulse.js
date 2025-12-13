import { createClient } from '@supabase/supabase-js';

const GHOST_KEY = "GHOST-MK-998877-ALPHA-VIGILANTE";

export async function onRequestPost(context) {
  try {
    // currentUrl comes from Extension formatted as "Researching: google.com [Stack: ...]"
    const { currentUrl, threatScore, status } = await context.request.json();
    const ghostHeader = context.request.headers.get('X-Ghost-Token');
    const sbKey = context.env.SUPABASE_SERVICE_KEY;

    // 1. Verify Hardware Token
    if (ghostHeader !== GHOST_KEY) {
        return new Response(JSON.stringify({ error: "Unauthorized Hardware" }), { status: 401 });
    }

    const supabase = createClient('https://gdlvzfyvgmeyvlcgggix.supabase.co', sbKey);
    const now = new Date().toISOString();

    // 2. Update Private Telemetry (Detailed view for HUD "Neural Uplink" box)
    await supabase.from('device_telemetry').upsert({ 
        id: 1,
        last_seen: now,
        current_url: currentUrl, 
        threat_score: threatScore,
        device_status: status
    });

    // 3. Update Public Status (Hero Section & HUD Text Box)
    // FIX: Don't add "Researching:" prefix here because the Extension already adds it.
    await supabase.from('admin_status').upsert({
        id: 1,
        is_online: true,
        last_heartbeat: now,
        current_task: currentUrl 
    });

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
