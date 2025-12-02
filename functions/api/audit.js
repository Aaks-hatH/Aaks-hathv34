export async function onRequestPost(context) {
  // 1. Get the code sent from the frontend
  const { code } = await context.request.json();

  // 2. Call OpenAI using the key hidden in Cloudflare Environment Variables
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${context.env.OPENAI_API_KEY}` // Hidden Key
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{
        role: "system",
        content: "You are a security auditor. Analyze this code for vulnerabilities."
      }, {
        role: "user",
        content: code
      }]
    })
  });

  const data = await response.json();

  // 3. Send only the answer back to the frontend
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
}
