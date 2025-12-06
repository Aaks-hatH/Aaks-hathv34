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
    const { code } = await context.request.json();
    const apiKey = context.env.OPENAI_API_KEY;

    if (!apiKey) return new Response(JSON.stringify({ error: "Missing OpenAI API Key" }), { status: 500 });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a security auditor. Analyze this code for vulnerabilities. Output markdown." },
          { role: "user", content: code }
        ]
      })
    });

    const data = await response.json();
    return new Response(JSON.stringify({ message: data.choices[0].message.content }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
