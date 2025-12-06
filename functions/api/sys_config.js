import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  try {
    const { password, key, value } = await context.request.json();
    const adminPass = context.env.ADMIN_PASSWORD;
    const sbUrl = 'https://gdlvzfyvgmeyvlcgggix.supabase.co';
    const sbKey = context.env.SUPABASE_SERVICE_KEY;
    const webhookUrl = context.env.DISCORD_WEBHOOK_URL;

    if (password !== adminPass) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const supabase = createClient(sbUrl, sbKey);
    
    // 1. Update Database
    const updateKey = key || 'maintenance_mode';
    const { error } = await supabase
      .from('system_config')
      .upsert({ key: updateKey, value: String(value) });

    if (error) throw error;

    // 2. Alert Discord
    const ADMIN_ID = "1168575437723680850";

// ... inside code ...
    // Alert Discord
    if(webhookUrl) {
        const cleanValue = String(value).split('|')[0];
        const msg = `<@${ADMIN_ID}> \n\`\`\`css\n[ADMIN COMMAND EXECUTED]\nCmd: ${updateKey}\nVal: ${cleanValue}\`\`\``;
        
        context.waitUntil(fetch(webhookUrl, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: msg })
        }));
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
