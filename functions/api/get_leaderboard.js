import { createClient } from '@supabase/supabase-js';

export async function onRequestGet(context) {
  try {
    const sbKey = context.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient('https://gdlvzfyvgmeyvlcgggix.supabase.co', sbKey);

    const { data, error } = await supabase
        .from('ctf_solvers')
        .select('username, flag_level, solved_at')
        .order('solved_at', { ascending: false })
        .limit(10);

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify([]), { status: 200 }); // Fail gracefully empty
  }
}
