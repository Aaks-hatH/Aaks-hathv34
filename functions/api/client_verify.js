export async function onRequest(context) {
  const clientIP = context.request.headers.get("CF-Connecting-IP");
  const allowedIP = context.env.ALLOWED_HUD_IP;

  if (context.request.method === "OPTIONS") return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" } });

  // If no IP is set in Cloudflare, we allow it (Fallback to prevent lockout)
  if (!allowedIP) {
    return new Response("OK - No Whitelist Set", { status: 200 });
  }

  if (clientIP === allowedIP) {
    return new Response("OK", { status: 200 });
  } else {
    return new Response("Forbidden", { status: 403 });
  }
}
