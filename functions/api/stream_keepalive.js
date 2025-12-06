import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const { password, task, status } = await context.request.json();
    
    const inputPass = (password || "").toString().trim();
    const storedPass = (context.env.ADMIN_PASSWORD || "").toString().trim();
    const sbUrl = 'https://gdlvzfyvgmeyvlcgggix.supabase.co';
    const sbKey = context.env.SUPABASE_SERVICE_KEY;

    // FIX: REMOVED DEBUG INFO
    // We now return a generic 401 without telling them WHY it failed (length, char match, etc)
    if (inputPass !== storedPass) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { 
            status: 401,
            headers: { "Content-Type": "application/json" }
        });
    }

    if (!sbKey) {
        return new Response(JSON.stringify({ error: "Server Config Error" }), { status: 500 });
    }

    const supabase = createClient(sbUrl, sbKey);

    const { error } = await supabase.from('admin_status').upsert({
        id: 1,
        is_online: status,
        current_task: task || 'System Idle',
        last_heartbeat: new Date().toISOString()
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
