export async function onRequest(context) {
  // Extract data from Cloudflare Headers
  const ip = context.request.headers.get("CF-Connecting-IP") || "127.0.0.1";
  const country = context.request.headers.get("CF-IPCountry") || "UNK";
  const city = context.request.headers.get("CF-IPCity") || "Unknown City";
  const lat = context.request.headers.get("CF-IPLatitude");
  const lon = context.request.headers.get("CF-IPLongitude");

  const identity = {
    ip,
    geo: `${city}, ${country}`,
    coords: lat ? `${lat}, ${lon}` : "N/A",
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(identity), {
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*" 
    }
  });
}
