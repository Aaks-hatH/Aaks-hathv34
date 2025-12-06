export async function onRequest(context) {
  // 1. Handle CORS (Preflight)
  // This ensures browsers don't block the request if headers are strict
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  // 2. Extract Data (Cloudflare provides this automatically)
  // Even if they use a VPN, Cloudflare sees the VPN's IP/Location
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

  // 3. Return JSON
  // Access-Control-Allow-Origin: "*" ensures it works even if headers are stripped by extensions
  return new Response(JSON.stringify(identity), {
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*" 
    }
  });
}
