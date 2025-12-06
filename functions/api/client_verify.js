export async function onRequest(context) {
  const clientIP = context.request.headers.get("CF-Connecting-IP");
  const allowedIP = context.env.ALLOWED_HUD_IP; 

  // If you haven't set an ALLOWED_HUD_IP in Cloudflare, we allow everyone for now
  // to prevent you from locking yourself out.
  if (allowedIP && clientIP !== allowedIP) {
    return new Response("Forbidden", { status: 403 });
  }

  return new Response("OK", { status: 200 });
}
