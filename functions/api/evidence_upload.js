import { createClient } from '@supabase/supabase-js';

const ADMIN_ID = "1168575437723680850";

// --- CORS HEADERS HELPER ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Ghost-Token"
};

// 1. Handle Preflight Request (Browser checking permissions)
export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

// Helper: Base64 to ArrayBuffer
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

    if (!image) return new Response("No Image Data", { status: 400, headers: corsHeaders });

    const supabase = createClient('https://gdlvzfyvgmeyvlcgggix.supabase.co', sbKey);

    // 2. Prepare Filename
    const filename = `capture_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
    
    // 3. Decode Base64 (Strip prefix if present)
    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const fileBody = base64ToArrayBuffer(base64Data);

    // 4. Upload to Supabase
    const { error: uploadError } = await supabase
      .storage
      .from('evidence')
      .upload(filename, fileBody, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 5. Get Public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('evidence')
      .getPublicUrl(filename);

    // 6. Send to Discord
    if (webhookUrl) {
        const msg = {
            content: `<@${ADMIN_ID}> **🚨 INTRUDER CAPTURED**\n**Source:** Sentry Mode\n**IP:** ${clientIP}`,
            embeds: [{
                title: "Evidence Locker Link",
                url: publicUrl,
                image: { url: publicUrl },
                color: 15158332
            }]
        };

        context.waitUntil(fetch(webhookUrl, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(msg)
        }));
    }

    return new Response(JSON.stringify({ success: true, url: publicUrl }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
}
