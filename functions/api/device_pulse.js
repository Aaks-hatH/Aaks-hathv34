import { createClient } from '@supabase/supabase-js';

const GHOST_KEY = "GHOST-MK-998877-ALPHA-VIGILANTE";

// --- CORS HEADERS (The Fix) ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Ghost-Token"
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost(context) {
  try {
    const { currentUrl, threatScore, status } = await context.request.json();
    const ghostHeader = context.request.headers.get('X-Ghost-Token');
    const sbKey = context.env.SUPABASE_SERVICE_KEY;

    // 1. Verify Hardware Token
    if (ghostHeader !== GHOST_KEY) {
        return new Response(JSON.stringify({ error: "Unauthorized Hardware" }), { 
            status: 401, 
            headers: corsHeaders 
        });
    }

    const supabase = createClient('https://gdlvzfyvgmeyvlcgggix.supabase.co', sbKey);
    const now = new Date().toISOString();

    // 2. Update Private Telemetry (Detailed)
    await supabase.from('device_telemetry').upsert({ 
        id: 1,
        last_seen: now,
        current_url: currentUrl, 
        threat_score: threatScore,
        device_status: status
    });

    // 3. Update Public Status (Hero Section & HUD Text Box)
    await supabase.from('admin_status').upsert({
        id: 1,
        is_online: true,
        last_heartbeat: now,
        current_task: currentUrl 
    });

    return new Response(JSON.stringify({ success: true }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
        status: 500, 
        headers: corsHeaders 
    });
  }
}
