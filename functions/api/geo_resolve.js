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

  // 3. Extract Real Data (Production)
  let ip = context.request.headers.get("CF-Connecting-IP") || "127.0.0.1";
  let country = context.request.headers.get("CF-IPCountry") || "XX";
  let city = context.request.headers.get("CF-IPCity") || "Unknown City";
  let lat = context.request.headers.get("CF-IPLatitude");
  let lon = context.request.headers.get("CF-IPLongitude");

  // 4. LOCALHOST SIMULATION (The Fix)
  // If Cloudflare didn't provide coords (Localhost), we generate a random location
  // to simulate a live environment (e.g., Random spot in US/Europe)
  if (!lat || !lon) {
      // Randomize slightly so multiple tabs show as distinct dots
      const jitter = () => (Math.random() * 10 - 5).toFixed(4);
      
      // Default to "Area 51" (Nevada) + Random Jitter
      lat = (37.2343 + parseFloat(jitter())).toFixed(4);
      lon = (-115.8067 + parseFloat(jitter())).toFixed(4);
      
      city = "Simulated Location";
      country = "US (DEV)";
  }

  const identity = {
    ip,
    geo: `${city}, ${country}`,
    coords: `${lat},${lon}`, // Format required by Leaflet
    timestamp: new Date().toISOString()
  };

  // 5. Return JSON
  return new Response(JSON.stringify(identity), {
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*" 
    }
  });
}
