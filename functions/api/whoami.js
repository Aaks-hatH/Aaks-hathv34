export async function onRequest(context) {
  // Handle CORS
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" }
    });
  }

  const ip = context.request.headers.get("CF-Connecting-IP") || "127.0.0.1";
  const country = context.request.headers.get("CF-IPCountry") || "UNK";
  const city = context.request.headers.get("CF-IPCity") || "Unknown City";

  const identity = {
    ip,
    geo: `${city}, ${country}`,
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(identity), {
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*" 
    }
  });
}
