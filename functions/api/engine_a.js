import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  try {
    const { code } = await context.request.json();
    const ip = context.request.headers.get("CF-Connecting-IP") || "Unknown";
    const apiKey = context.env.OPENAI_API_KEY;
    const sbKey = context.env.SUPABASE_SERVICE_KEY;
    
    // 1. RATE LIMIT CHECK (Supabase)
    if (sbKey) {
        const supabase = createClient('https://gdlvzfyvgmeyvlcgggix.supabase.co', sbKey);
        
        // Count how many times this IP used 'AI_AUDIT' in the last 60 seconds
        const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
        
        const { count, error } = await supabase
            .from('audit_logs')
            .select('*', { count: 'exact', head: true })
            .eq('ip', ip) // Check this IP
            .eq('action', 'AI_AUDIT_REQUEST') // Check this specific action
            .gte('timestamp', oneMinuteAgo); // Within last minute

        // LIMIT: 3 Requests per minute
        if (count >= 3) {
            return new Response(JSON.stringify({ 
                error: "RATE LIMIT EXCEEDED: Cooldown active. Try again in 60s." 
            }), { status: 429 });
        }

        // Log this request so it counts towards the limit
        await supabase.from('audit_logs').insert({
            actor_type: 'VISITOR',
            ip: ip,
            action: 'AI_AUDIT_REQUEST',
            details: 'Analyzing Code Snippet'
        });
    }

    // 2. RUN AI
    if (!apiKey) return new Response(JSON.stringify({ error: "Server Config Error" }), { status: 500 });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a security auditor. Analyze this code for vulnerabilities. Output markdown." },
          { role: "user", content: code }
        ]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    return new Response(JSON.stringify({ message: data.choices[0].message.content }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
