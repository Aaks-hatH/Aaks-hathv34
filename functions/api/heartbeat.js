import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
  // 1. CORS Preflight
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
    
    // 2. GET & CLEAN SECRETS
    // We use .trim() to remove invisible spaces from copy-pasting
    const inputPass = (password || "").toString().trim();
    const storedPass = (context.env.ADMIN_PASSWORD || "").toString().trim();
    
    const sbUrl = 'https://gdlvzfyvgmeyvlcgggix.supabase.co';
    const sbKey = context.env.SUPABASE_SERVICE_KEY;

    // 3. DEBUGGING LOGIC (Checks why it failed)
    if (inputPass !== storedPass) {
        return new Response(JSON.stringify({ 
            error: "Unauthorized",
            debug_info: {
                received_length: inputPass.length,
                stored_length: storedPass.length,
                first_char_match: inputPass[0] === storedPass[0]
            }
        }), { 
            status: 401,
            headers: { "Content-Type": "application/json" }
        });
    }

    if (!sbKey) {
        return new Response(JSON.stringify({ error: "Server Config Error: Supabase Key Missing" }), { status: 500 });
    }

    // 4. UPDATE DATABASE
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
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
