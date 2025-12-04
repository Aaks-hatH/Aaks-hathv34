import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
  // 1. Handle CORS (Preflight)
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // 2. Enforce POST
  if (context.request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { password, task, status } = await context.request.json();
    
    // Secrets
    const adminPass = context.env.ADMIN_PASSWORD;
    const sbUrl = 'https://gdlvzfyvgmeyvlcgggix.supabase.co';
    const sbKey = context.env.SUPABASE_SERVICE_KEY;

    // 3. Verify Password
    if (password !== adminPass) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    if (!sbKey) {
        return new Response(JSON.stringify({ error: "Server Config Error" }), { status: 500 });
    }

    const supabase = createClient(sbUrl, sbKey);

    // 4. Update Status in Database
    // We use upsert on ID 1 so there is only ever ONE admin status row
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
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
