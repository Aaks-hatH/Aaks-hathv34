import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  try {
    const { password, id } = await context.request.json();
    
    // Secrets
    const adminPass = context.env.ADMIN_PASSWORD;
    const sbUrl = 'https://gdlvzfyvgmeyvlcgggix.supabase.co';
    const sbKey = context.env.SUPABASE_SERVICE_KEY; // <--- MUST be Service Role Key

    // 1. Verify Password
    if (password !== adminPass) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // 2. Connect as Admin
    const supabase = createClient(sbUrl, sbKey);

    // 3. Delete
    const { error } = await supabase
      .from('guestbook')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
