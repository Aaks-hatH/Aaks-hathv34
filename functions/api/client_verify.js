export async function onRequest(context) {
  // Handle CORS
  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" } });
  }

  const clientIP = context.request.headers.get("CF-Connecting-IP");
  const allowedEnv = context.env.ALLOWED_HUD_IP;

  // 1. If variable is missing, OPEN ACCESS (Prevent lockout)
  if (!allowedEnv) {
    return new Response(JSON.stringify({ status: "Open", ip: clientIP }), { status: 200 });
  }

  // 2. Parse List (Handle commas, spaces, and newlines)
  const allowedList = allowedEnv.split(',').map(ip => ip.trim());

  // 3. Check
  if (allowedList.includes(clientIP)) {
    return new Response("OK", { status: 200 });
  } else {
    // Return the IP so you can see it in Network Tab debug
    return new Response(JSON.stringify({ error: "Forbidden", your_ip: clientIP }), { 
        status: 403,
        headers: { "Content-Type": "application/json" }
    });
  }
}
