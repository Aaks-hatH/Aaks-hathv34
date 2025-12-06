import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  try {
    const { password, ip, reason } = await context.request.json();
    const adminPass = context.env.ADMIN_PASSWORD;
    const sbUrl = 'https://gdlvzfyvgmeyvlcgggix.supabase.co';
    const sbKey = context.env.SUPABASE_SERVICE_KEY;

    if (password !== adminPass) return new Response("Unauthorized", { status: 401 });

    const supabase = createClient(sbUrl, sbKey);

    // 1. Perform Ban
    const { error } = await supabase.from('banned_ips').upsert({ 
      ip: ip, 
      reason: reason || "Manual Ban" 
    });

    if (error) throw error;

    // 2. CREATE PERMANENT RECORD (Log it)
    await supabase.from('audit_logs').insert({
        actor_type: 'ADMIN',
        ip: ip, // Log the IP being banned
        action: 'BAN_TARGET',
        details: `Reason: ${reason}`
    });

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
