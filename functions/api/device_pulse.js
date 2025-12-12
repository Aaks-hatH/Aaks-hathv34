import { createClient } from '@supabase/supabase-js';

const GHOST_KEY = "GHOST-MK-998877-ALPHA-VIGILANTE";

export async function onRequestPost(context) {
  try {
    const { currentUrl, threatScore, status } = await context.request.json();
    const ghostHeader = context.request.headers.get('X-Ghost-Token');
    const sbKey = context.env.SUPABASE_SERVICE_KEY;

    // 1. Verify it's actually your computer
    if (ghostHeader !== GHOST_KEY) {
        return new Response(JSON.stringify({ error: "Unauthorized Hardware" }), { status: 401 });
    }

    // 2. Save Telemetry to Supabase
    const supabase = createClient('https://gdlvzfyvgmeyvlcgggix.supabase.co', sbKey);
    
    // We use a specific ID (1) so the HUD always looks at the same row
    await supabase.from('device_telemetry').upsert({ 
        id: 1,
        last_seen: new Date().toISOString(),
        current_url: currentUrl,
        threat_score: threatScore,
        device_status: status
    });

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
