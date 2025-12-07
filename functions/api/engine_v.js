import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  try {
    const { target } = await context.request.json();
    const ip = context.request.headers.get("CF-Connecting-IP") || "Unknown";
    const apiKey = context.env.VIRUSTOTAL_API_KEY;
    const sbKey = context.env.SUPABASE_SERVICE_KEY;

    // 1. RATE LIMIT CHECK
    if (sbKey) {
        const supabase = createClient('https://gdlvzfyvgmeyvlcgggix.supabase.co', sbKey);
        const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
        
        const { count } = await supabase
            .from('audit_logs')
            .select('*', { count: 'exact', head: true })
            .eq('ip', ip)
            .eq('action', 'VT_SCAN_REQUEST')
            .gte('timestamp', oneMinuteAgo);

        // LIMIT: 2 Requests per minute (VirusTotal Free Tier is 4/min total globally)
        if (count >= 2) {
            return new Response(JSON.stringify({ 
                error: "RATE LIMIT EXCEEDED: VT Quota Consumed. Wait 60s." 
            }), { status: 429 });
        }

        // Log Request
        await supabase.from('audit_logs').insert({
            actor_type: 'VISITOR',
            ip: ip,
            action: 'VT_SCAN_REQUEST',
            details: `Target: ${target}`
        });
    }

    // 2. RUN SCAN
    if (!apiKey) return new Response(JSON.stringify({ error: "Server Config Error" }), { status: 500 });

    const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(target);
    const endpoint = isIp 
      ? `https://www.virustotal.com/api/v3/ip_addresses/${target}`
      : `https://www.virustotal.com/api/v3/domains/${target}`;

    // Use CORS Proxy
    const proxyUrl = `https://corsproxy.io/?` + encodeURIComponent(endpoint);

    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: { 'x-apikey': apiKey }
    });

    if (!response.ok) {
        if (response.status === 429) return new Response(JSON.stringify({ error: "Global VirusTotal Quota Exceeded" }), { status: 429 });
        throw new Error(`VT API Error: ${response.status}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify({ stats: data.data.attributes.last_analysis_stats }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
