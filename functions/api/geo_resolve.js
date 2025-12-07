
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
  const ip = context.request.headers.get("CF-Connecting-IP") || "127.0.0.1";
  const country = context.request.headers.get("CF-IPCountry") || "XX";
  const city = context.request.headers.get("CF-IPCity") || "Unknown City";
  const lat = context.request.headers.get("CF-IPLatitude") || "0";
  const lon = context.request.headers.get("CF-IPLongitude") || "0";

  const identity = {
    ip,
    geo: `${city}, ${country}`,
    coords: `${lat}, ${lon}`,
    timestamp: new Date().toISOString()
  };

  // 4. Return JSON
  return new Response(JSON.stringify(identity), {
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*" 
    }
  });
}
