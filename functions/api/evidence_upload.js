import { createClient } from '@supabase/supabase-js';

const ADMIN_ID = "1168575437723680850"; // Your ID

// Helper: Convert Base64 to ArrayBuffer for upload
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function onRequestPost(context) {
  try {
    const { image } = await context.request.json();
    const sbKey = context.env.SUPABASE_SERVICE_KEY;
    const webhookUrl = context.env.DISCORD_WEBHOOK_URL;
    const clientIP = context.request.headers.get("CF-Connecting-IP") || "Unknown";

    if (!image) return new Response("No Image Data", { status: 400 });

    const supabase = createClient('https://gdlvzfyvgmeyvlcgggix.supabase.co', sbKey);

    // 1. Prepare Filename (Timestamp_Random.jpg)
    const filename = `capture_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
    
    // 2. Decode Base64 (Remove "data:image/jpeg;base64," prefix)
    const base64Data = image.split(',')[1];
    const fileBody = base64ToArrayBuffer(base64Data);

    // 3. Upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from('evidence')
      .upload(filename, fileBody, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) throw error;

    // 4. Get Public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('evidence')
      .getPublicUrl(filename);

    // 5. Send to Discord
    if (webhookUrl) {
        const msg = {
            content: `<@${ADMIN_ID}> ** INTRUDER CAPTURED**\n**Source:** Sentry Mode\n**IP:** ${clientIP}`,
            embeds: [{
                title: "Evidence Locker Link",
                url: publicUrl,
                image: { url: publicUrl }, // Renders the image in chat
                color: 15158332 // Red
            }]
        };

        context.waitUntil(fetch(webhookUrl, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(msg)
        }));
    }

    return new Response(JSON.stringify({ success: true, url: publicUrl }), { 
        headers: { "Content-Type": "application/json" } 
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
