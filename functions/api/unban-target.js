import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  try {
    const { password, ip } = await context.request.json();
    const adminPass = context.env.ADMIN_PASSWORD;
    const sbUrl = 'https://gdlvzfyvgmeyvlcgggix.supabase.co';
    const sbKey = context.env.SUPABASE_SERVICE_KEY;

    // 1. Verify Admin
    if (password !== adminPass) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // 2. Connect as Admin
    const supabase = createClient(sbUrl, sbKey);

    // 3. Delete the Ban Record
    const { error } = await supabase
      .from('banned_ips')
      .delete()
      .eq('ip', ip);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
