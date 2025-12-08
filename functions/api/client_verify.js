export async function onRequest(context) {
  // 1. Handle CORS
  if (context.request.method === "OPTIONS") {
    return new Response(null, { 
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" } 
    });
  }

  const clientIP = context.request.headers.get("CF-Connecting-IP");
  const allowedEnv = context.env.ALLOWED_HUD_IP; // Expecting "IP1, IP2, IP3"

  // If no IP is set in Cloudflare, we allow it (Fallback to prevent lockout)
  if (!allowedEnv) {
    return new Response("OK - No Whitelist Set", { status: 200 });
  }

  // 2. Parse the List
  // Split by comma and remove spaces (e.g., "1.1.1.1, 2.2.2.2" -> ["1.1.1.1", "2.2.2.2"])
  const allowedList = allowedEnv.split(',').map(ip => ip.trim());

  // 3. Check Access
  if (allowedList.includes(clientIP)) {
    return new Response("OK", { status: 200 });
  } else {
    return new Response(`Forbidden: Your IP (${clientIP}) is not whitelisted.`, { status: 403 });
  }
}
