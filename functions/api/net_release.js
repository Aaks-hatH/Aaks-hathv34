import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  try {
    const { password, ip } = await context.request.json();
    const adminPass = context.env.ADMIN_PASSWORD;
    const sbUrl = 'https://gdlvzfyvgmeyvlcgggix.supabase.co';
    const sbKey = context.env.SUPABASE_SERVICE_KEY;

    if (password !== adminPass) return new Response("Unauthorized", { status: 401 });

    const supabase = createClient(sbUrl, sbKey);

    // 1. Remove Ban
    const { error } = await supabase.from('banned_ips').delete().eq('ip', ip);
    if (error) throw error;

    // 2. LOG THE MERCY
    await supabase.from('audit_logs').insert({
        actor_type: 'ADMIN',
        ip: ip,
        action: 'UNBAN_TARGET',
        details: 'Access restored by admin'
    });

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
