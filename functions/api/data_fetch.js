import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  try {
    const { password, table } = await context.request.json();
    const adminPass = context.env.ADMIN_PASSWORD;
    const sbUrl = 'https://gdlvzfyvgmeyvlcgggix.supabase.co';
    const sbKey = context.env.SUPABASE_SERVICE_KEY; // Using the SECRET key

    // 1. Verify Admin Password
    if (password !== adminPass) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // 2. Validate Request
    const validTables = ['audit_logs', 'banned_ips', 'system_config'];
    if (!validTables.includes(table)) {
        return new Response(JSON.stringify({ error: "Invalid Table" }), { status: 400 });
    }

    // 3. Fetch Data Securely
    const supabase = createClient(sbUrl, sbKey);
    
    let query = supabase.from(table).select('*');
    
    // Sort logic
    if (table === 'audit_logs') query = query.order('timestamp', { ascending: false }).limit(100);
    if (table === 'banned_ips') query = query.order('banned_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return new Response(JSON.stringify({ data }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
