import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  try {
    const { password, status } = await context.request.json();
    const adminPass = context.env.ADMIN_PASSWORD;
    const sbUrl = 'https://gdlvzfyvgmeyvlcgggix.supabase.co'; 
    const sbKey = context.env.SUPABASE_SERVICE_KEY; 

    // 1. Verify Admin Password
    if (password !== adminPass) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // 2. Initialize Admin Client
    const supabase = createClient(sbUrl, sbKey);

    // 3. Perform Action
    const { error } = await supabase
      .from('system_config')
      .upsert({ key: 'maintenance_mode', value: String(status) });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
