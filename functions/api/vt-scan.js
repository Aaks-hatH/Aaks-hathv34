export async function onRequest(context) {
  // Handle CORS Preflight
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (context.request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { target } = await context.request.json();
    const apiKey = context.env.VIRUSTOTAL_API_KEY;

    if (!apiKey) return new Response(JSON.stringify({ error: "Missing VT API Key" }), { status: 500 });

    const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(target);
    const endpoint = isIp 
      ? `https://www.virustotal.com/api/v3/ip_addresses/${target}`
      : `https://www.virustotal.com/api/v3/domains/${target}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'x-apikey': apiKey }
    });

    if (!response.ok) return new Response(JSON.stringify({ error: `VT Error ${response.status}` }), { status: response.status });

    const data = await response.json();
    return new Response(JSON.stringify({ stats: data.data.attributes.last_analysis_stats }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
