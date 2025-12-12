import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
  // 1. Handle CORS (Preflight)
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  // 2. Firewall Block (Prevents Direct Endpoint Abuse)
  const userAgent = (context.request.headers.get("User-Agent") || "").toLowerCase();
  if (userAgent.includes("python") || userAgent.includes("curl") || userAgent.includes("bot")) {
      return new Response(JSON.stringify({ error: "Access Denied" }), { status: 403 });
  }

  // 3. Extract Data
  let ip = context.request.headers.get("CF-Connecting-IP") || "127.0.0.1";
  let country = context.request.headers.get("CF-IPCountry") || "XX";
  let city = context.request.headers.get("CF-IPCity") || "Unknown City";
  let lat = context.request.headers.get("CF-IPLatitude");
  let lon = context.request.headers.get("CF-IPLongitude");

  // 4. LOCALHOST SIMULATION
  if (!lat || !lon) {
      // Randomize slightly so multiple tabs show as distinct dots
      const jitter = () => (Math.random() * 10 - 5).toFixed(4);
      lat = (37.2343 + parseFloat(jitter())).toFixed(4);
      lon = (-115.8067 + parseFloat(jitter())).toFixed(4);
      city = "Simulated Location";
      country = "US (DEV)";
  }

  // 5. SECURITY CHECK (The Fix)
  let isBanned = false;
  let isLocked = false;
  
  const sbKey = context.env.SUPABASE_SERVICE_KEY;
  const sbUrl = 'https://gdlvzfyvgmeyvlcgggix.supabase.co';

  if (sbKey) {
      const supabase = createClient(sbUrl, sbKey);
      
      // Check Ban List
      const { data: banData } = await supabase
          .from('banned_ips')
          .select('ip')
          .eq('ip', ip)
          .maybeSingle();
      
      if (banData) isBanned = true;

      // Check Lockdown Mode
      const { data: lockData } = await supabase
          .from('system_config')
          .select('value')
          .eq('key', 'maintenance_mode')
          .maybeSingle();
      
      if (lockData && lockData.value === 'true') isLocked = true;
  }

  const identity = {
    ip,
    geo: `${city}, ${country}`,
    coords: `${lat},${lon}`,
    timestamp: new Date().toISOString(),
    // Return security status to frontend
    security: {
        banned: isBanned,
        locked: isLocked
    }
  };

  // 6. Return JSON
  return new Response(JSON.stringify(identity), {
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*" 
    }
  });
}
