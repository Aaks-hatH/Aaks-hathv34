
export async function onRequest(context) {
  const discordWebhookUrl = context.env.DISCORD_WEBHOOK_URL;
  const ADMIN_ID = "1168575437723680850";

  const { message } = await context.request.json();

  if (!discordWebhookUrl) {
    return new Response("Discord webhook URL not configured", { status: 500 });
  }

  if (!message) {
    return new Response("Message is required", { status: 400 });
  }

  const finalMessage = `<@${ADMIN_ID}> ${message}`;

  try {
    const res = await fetch(discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: finalMessage }),
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
