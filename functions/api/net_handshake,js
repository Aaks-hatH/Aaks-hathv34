import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  try {
    const sbUrl = 'https://gdlvzfyvgmeyvlcgggix.supabase.co';
    const sbKey = context.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(sbUrl, sbKey);

    // Get Today's Date (UTC)
    const today = new Date().toISOString().split('T')[0];

    // 1. Get Current Count
    let { data: current } = await supabase
      .from('daily_stats')
      .select('count')
      .eq('date', today)
      .maybeSingle();

    let newCount = 1;
    let isFirst = false;

    if (current) {
      newCount = current.count + 1;
      // Update existing
      await supabase
        .from('daily_stats')
        .update({ count: newCount })
        .eq('date', today);
    } else {
      // Create new day (First Blood!)
      isFirst = true;
      await supabase
        .from('daily_stats')
        .insert({ date: today, count: 1 });
    }

    return new Response(JSON.stringify({ 
      count: newCount, 
      isFirst: isFirst,
      date: today 
    }), { 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
