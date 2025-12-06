export async function onRequest(context) {
  // 1. Handle CORS Preflight
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: { 
        "Access-Control-Allow-Origin": "https://aaks-hath.pages.dev", // Lock to YOUR domain
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  // 2. SECURITY CHECK: Referer/Origin Validation
  // This blocks direct CURL requests or scanners
  const referer = context.request.headers.get("Referer") || "";
  const origin = context.request.headers.get("Origin") || "";
  
  // Allow only if coming from your site (or localhost for testing)
  const allowed = referer.includes("aaks-hath.pages.dev") || origin.includes("aaks-hath.pages.dev") || referer.includes("localhost");

  if (!allowed) {
      return new Response("Forbidden: Access Denied", { status: 403 });
  }

  // 3. Standard Logic
  const ip = context.request.headers.get("CF-Connecting-IP") || "127.0.0.1";
  const country = context.request.headers.get("CF-IPCountry") || "XX";
  const city = context.request.headers.get("CF-IPCity") || "Unknown City";

  const identity = {
    ip,
    geo: `${city}, ${country}`,
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(identity), {
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "https://aaks-hath.pages.dev" // Lock to domain
    }
  });
}
