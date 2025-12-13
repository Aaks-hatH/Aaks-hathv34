import { createClient } from '@supabase/supabase-js';

// 
const FLAGS = {
    "flag{console_cowboy}": "EASY",       
    "flag{header_hunter}": "MEDIUM",      
    "flag{stego_master}": "HARD"          
};

const ADMIN_ID = "1168575437723680850";

export async function onRequestPost(context) {
  try {
    const { flag, username } = await context.request.json();
    const sbKey = context.env.SUPABASE_SERVICE_KEY;
    const webhookUrl = context.env.DISCORD_WEBHOOK_URL;
    const clientIP = context.request.headers.get("CF-Connecting-IP");

    // 1. Validate Input
    if (!flag || !username) return new Response(JSON.stringify({ error: "Syntax: submit <flag> <username>" }), { status: 400 });
    if (username.length > 20) return new Response(JSON.stringify({ error: "Username too long" }), { status: 400 });

    // 2. Check Flag
    const level = FLAGS[flag];
    if (!level) {
        return new Response(JSON.stringify({ success: false, message: "❌ ACCESS DENIED: Incorrect Flag." }), { 
            headers: { "Content-Type": "application/json" } 
        });
    }

    // 3. Save to Leaderboard
    const supabase = createClient('https://gdlvzfyvgmeyvlcgggix.supabase.co', sbKey);
    
    // Check if this specific user already solved this level (prevent spamming leaderboard)
    const { data: existing } = await supabase
        .from('ctf_solvers')
        .select('*')
        .eq('username', username)
        .eq('flag_level', level)
        .maybeSingle();

    if (existing) {
        return new Response(JSON.stringify({ success: true, message: `⚠️ You already captured the [${level}] flag!` }), { 
            headers: { "Content-Type": "application/json" } 
        });
    }

    // Insert Win
    await supabase.from('ctf_solvers').insert({
        username: username,
        flag_level: level
    });

    // 4. Alert Discord (Optional)
    if (webhookUrl) {
        const msg = `<@${ADMIN_ID}>\n**🚩 CTF CAPTURED [${level}]**\n**User:** ${username}\n**IP:** ${clientIP}`;
        context.waitUntil(fetch(webhookUrl, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: msg })
        }).catch(()=>{}));
    }

    return new Response(JSON.stringify({ 
        success: true, 
        message: `✅ FLAG ACCEPTED [${level}].\nUser '${username}' added to the Hall of Fame.` 
    }), { headers: { "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
