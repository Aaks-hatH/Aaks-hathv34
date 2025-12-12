limport { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  try {
    const { target } = await context.request.json();
    const ip = context.request.headers.get("CF-Connecting-IP") || "Unknown";
    const apiKey = context.env.VIRUSTOTAL_API_KEY; // Make sure this is set in Cloudflare!
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

        if (count >= 2) {
            return new Response(JSON.stringify({ 
                error: "RATE LIMIT: VT Quota (2 req/min). Please wait." 
            }), { status: 429 });
        }

        await supabase.from('audit_logs').insert({
            actor_type: 'VISITOR', ip: ip, action: 'VT_SCAN_REQUEST', details: `Target: ${target}`
        });
    }

    // 2. VALIDATE INPUT
    if (!apiKey) return new Response(JSON.stringify({ error: "Server Config Error: Missing VT API Key" }), { status: 500 });
    if (!target) return new Response(JSON.stringify({ error: "Target required" }), { status: 400 });

    // 3. DETERMINE ENDPOINT (Direct Connection)
    const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(target);
    const endpoint = isIp 
      ? `https://www.virustotal.com/api/v3/ip_addresses/${target}`
      : `https://www.virustotal.com/api/v3/domains/${target}`;

    // 4. FETCH DIRECTLY (No Proxy)
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 
          'x-apikey': apiKey,
          'Accept': 'application/json'
      }
    });

    if (!response.ok) {
        // If it's still 403, the key is invalid or lacks permissions
        if (response.status === 403) throw new Error("VirusTotal Key Invalid or Restricted");
        if (response.status === 429) throw new Error("VirusTotal Quota Exceeded");
        if (response.status === 404) throw new Error("Target not found in VT Database");
        throw new Error(`VT API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Safety check if data exists
    if (!data.data || !data.data.attributes) {
        throw new Error("Invalid Response from VirusTotal");
    }

    return new Response(JSON.stringify({ stats: data.data.attributes.last_analysis_stats }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}