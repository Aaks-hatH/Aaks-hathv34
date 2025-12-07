
export async function onRequest(context) {
  // DISCORD_WEBHOOK_URL is a secret environment variable
  // Learn more: https://developers.cloudflare.com/pages/functions/bindings/
  const discordWebhookUrl = context.env.DISCORD_WEBHOOK_URL;

  // Get the message from the request body
  const { message } = await context.request.json();

  if (!discordWebhookUrl) {
    return new Response("Discord webhook URL not configured", { status: 500 });
  }

  if (!message) {
    return new Response("Message is required", { status: 400 });
  }

  try {
    const res = await fetch(discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });

    if (res.ok) {
      return new Response("Message sent to Discord", { status: 200 });
    } else {
      return new Response("Failed to send message to Discord", { status: 500 });
    }
  } catch (error) {
    return new Response(`Error sending message: ${error.message}`, { status: 500 });
  }
}
