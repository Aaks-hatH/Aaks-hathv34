import * as OTPAuth from "otpauth";
import { createClient } from '@supabase/supabase-js';

const ADMIN_ID = "1168575437723680850";
const GHOST_KEY_SECRET = "GHOST-MK-998877-ALPHA-VIGILANTE";

// --- HELPER: EMAIL ALERT ---
async function sendEmailAlert(context, subject, message) {
  const serviceId = context.env.EMAILJS_SERVICE_ID;
  const templateId = context.env.EMAILJS_TEMPLATE_ID;
  const userId = context.env.EMAILJS_USER_ID;
  const accessToken = context.env.EMAILJS_ACCESS_TOKEN;

  if (!serviceId || !templateId || !userId || !accessToken) return;

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: userId,
    accessToken: accessToken,
    template_params: { subject, message, to_email: 'aakshathariharan@gmail.com' }
  };

  try {
      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
  } catch (e) { console.error("Email Error", e); }
}

// --- HELPER: VIGILANTE RISK ENGINE ---
async function calculateRiskScore(supabase, ip, country, userAgent, password, headers) {
    let score = 0;
    let reasons = [];

    // 1. GHOST KEY CHECK (The Hardware Token)
    const ghostHeader = headers.get('X-Ghost-Token');
    
    // STRICT MODE: If key is missing, add massive points
    if (ghostHeader !== GHOST_KEY_SECRET) {
        score += 85; 
        reasons.push("CRITICAL: Missing Ghost Key (Mobile/Unauthorized Device)");
    } else {
        score -= 20; // Trusted Device
        reasons.push("Hardware Verified");
    }

    // 2. VELOCITY CHECK
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60000).toISOString();
    const { count: failCount } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('ip', ip)
        .eq('action', 'LOGIN_FAIL')
        .gte('timestamp', fifteenMinsAgo);
    
    if (failCount > 0) {
        score += (failCount * 20); 
        reasons.push(`Velocity: ${failCount} fails`);
    }

    // 3. TRIPWIRE HISTORY
    const { count: tripwireCount } = await supabase.from('audit_logs').select('*', { count: 'exact', head: true }).eq('ip', ip).like('action', '%TRIPWIRE%'); 
    if (tripwireCount > 0) { score += 100; reasons.push("Prior Tripwire Event"); }

    // 4. SQL INJECTION
    if (/(OR\s+1=1)|(UNION\s+SELECT)/i.test(password)) { score += 50; reasons.push("SQLi Attempt"); }

    // 5. BOT USER AGENT
    const ua = (userAgent || "").toLowerCase();
    if (ua.includes('curl') || ua.includes('python')) { score += 60; reasons.push("Bot User-Agent"); }

    return { score: Math.max(0, Math.min(score, 100)), reasons, failCount };
}

export async function onRequestPost(context) {
  if (context.request.method === "OPTIONS") return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
  
  try {
    const { password, token, captcha, stepUpCode } = await context.request.json();
    
    // Secrets
    const actualPassword = (context.env.ADMIN_PASSWORD || "").trim();
    const totpSecret = (context.env.ADMIN_TOTP_SECRET || "").replace(/\s/g, '');
    const turnstileSecret = context.env.TURNSTILE_SECRET_KEY;
    const sbKey = context.env.SUPABASE_SERVICE_KEY;
    const webhookUrl = context.env.DISCORD_WEBHOOK_URL;
    
    const clientIP = context.request.headers.get("CF-Connecting-IP") || "127.0.0.1";
    const country = context.request.headers.get("CF-IPCountry") || "XX";
    const userAgent = context.request.headers.get("User-Agent");

    const sendDiscord = (msg) => {
        if (webhookUrl) context.waitUntil(fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: msg }) }).catch(()=>{}));
    };
    
    if (!sbKey) return new Response(JSON.stringify({ error: "CONFIG ERROR" }), { status: 500 });
    const supabase = createClient('https://gdlvzfyvgmeyvlcgggix.supabase.co', sbKey);

    // ==========================================================
    // 🛡️ LAYER 0: PRE-FLIGHT BLACKLIST CHECK
    // ==========================================================
    const { data: alreadyBanned } = await supabase.from('banned_ips').select('ip').eq('ip', clientIP).maybeSingle();
    if (alreadyBanned) return new Response(JSON.stringify({ error: "Access Denied" }), { status: 403 });

    // ==========================================================
    // 🧠 LAYER 1: VIGILANTE RISK ANALYSIS
    // ==========================================================
    const { score: riskScore, reasons: riskFactors, failCount } = await calculateRiskScore(supabase, clientIP, country, userAgent, password, context.request.headers);

    // 🚨 EMERGENCY OVERRIDE LOGIC 🚨
    // If you are on Mobile, you don't have the key (Score 85).
    // We allow a "Step-Up" chance instead of an instant ban ONLY if no other bad flags exist.
    const isMobile = riskFactors.length === 1 && riskFactors[0].includes("Missing Ghost Key");
    const autoBanThreshold = isMobile ? 90 : 80; // Give mobile a tiny bit of wiggle room to prove identity via code

    // 🔴 CRITICAL RISK (Score >= 80) -> AUTO BAN
    if (riskScore >= autoBanThreshold) {
        await supabase.from('banned_ips').insert({ ip: clientIP, reason: `SIEM: Risk Score ${riskScore}` });
        await supabase.from('audit_logs').insert({ 
            actor_type: 'ATTACKER', ip: clientIP, action: 'AUTO_BAN', details: `Score: ${riskScore} | ${riskFactors.join(', ')}` 
        });
        
        const msg = `** SIEM BAN EXECUTION**\n**Target:** ${clientIP} (${country})\n**Risk Score:** ${riskScore}/100\n**Reasons:**\n- ${riskFactors.join('\n- ')}`;
        sendDiscord(`<@${ADMIN_ID}>\n${msg}`);
        context.waitUntil(sendEmailAlert(context, "CRITICAL: SIEM Ban", msg));
        
        return new Response(JSON.stringify({ error: "Access Denied" }), { status: 403 });
    }

    // ==========================================================
    // 🔐 LAYER 2: STANDARD CHECKS
    // ==========================================================

    // CAPTCHA
    const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString();
    const { count: captchaSession } = await supabase.from('audit_logs').select('*', { count: 'exact', head: true }).eq('ip', clientIP).eq('action', 'CAPTCHA_PASSED').gte('timestamp', fiveMinsAgo);

    if (captchaSession === 0 && turnstileSecret) {
        if (!captcha) return new Response(JSON.stringify({ error: "Verification Required" }), { status: 400 });
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret: turnstileSecret, response: captcha, remoteip: clientIP })
        });
        const d = await verifyRes.json();
        if (!d.success) return new Response(JSON.stringify({ error: "Verification Failed" }), { status: 403 });
        await supabase.from('audit_logs').insert({ actor_type: 'VISITOR', ip: clientIP, action: 'CAPTCHA_PASSED', details: 'Session Validated' });
    }

    // DEAD MAN SWITCH
    const { data: status } = await supabase.from('admin_status').select('is_online, last_heartbeat').eq('id', 1).single();
    const now = new Date();
    const lastBeat = new Date(status?.last_heartbeat || 0);
    const diffSeconds = (now - lastBeat) / 1000;
    
    if (!status || status.is_online !== true || diffSeconds > 120) {
         return new Response(JSON.stringify({ error: "System Maintenance: Login Unavailable" }), { status: 503 });
    }

    // PASSWORD
    if (password !== actualPassword) {
       await supabase.from('audit_logs').insert({ actor_type: 'ATTACKER', ip: clientIP, action: 'LOGIN_FAIL', details: 'Wrong Password' });
       const delay = 2000 + (riskScore * 50); await new Promise(r => setTimeout(r, delay));
       sendDiscord(`<@${ADMIN_ID}>\n**Login Failed**\nIP: ${clientIP}\nRisk Score: ${riskScore}\nReasons: ${riskFactors.join(', ')}`);
       return new Response(JSON.stringify({ error: "Invalid Credentials" }), { status: 401 });
    }

    // ==========================================================
    // 🟡 LAYER 3: STEP UP (Challenge for Mobile/Suspicious)
    // ==========================================================
    let isStepUpVerified = false;
    if (stepUpCode) {
        const { data: storedCode } = await supabase.from('system_config').select('value').eq('key', 'temp_auth_code').single();
        if (!storedCode || storedCode.value !== stepUpCode) {
            await supabase.from('audit_logs').insert({ actor_type: 'ATTACKER', ip: clientIP, action: 'LOGIN_FAIL', details: 'Wrong Step-Up Code' });
            return new Response(JSON.stringify({ error: "Invalid Verification Code" }), { status: 401 });
        }
        await supabase.from('system_config').delete().eq('key', 'temp_auth_code');
        isStepUpVerified = true;
    }

    // TRIGGER CHALLENGE:
    // 1. If Risk >= 30 (This catches Phone users who have Risk 85 from missing key)
    // 2. OR If Fail Count >= 2
    if ((riskScore >= 30 || failCount >= 2) && !isStepUpVerified) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await supabase.from('system_config').upsert({ key: 'temp_auth_code', value: code });
        
        sendDiscord(`<@${ADMIN_ID}>\n** SECURITY CHALLENGE**\n**Reason:** ${riskFactors.join(', ')}\n**Score:** ${riskScore}\n**Verification Code:** \`${code}\``);
        
        return new Response(JSON.stringify({ 
            stepUp: true, 
            message: "Unrecognized Device. Verification code sent to secure channel." 
        }), { status: 200 });
    }

    // ==========================================================
    // 4. FINAL 2FA & SUCCESS
    // ==========================================================
    if (totpSecret) {
        const totp = new OTPAuth.TOTP({ algorithm: "SHA1", digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(totpSecret) });
        const delta = totp.validate({ token: token, window: 2 });
        if (delta === null) {
           await supabase.from('audit_logs').insert({ actor_type: 'ATTACKER', ip: clientIP, action: 'LOGIN_FAIL', details: 'Wrong 2FA' });
           return new Response(JSON.stringify({ error: "Invalid Credentials" }), { status: 401 });
        }
    }

    await supabase.from('audit_logs').insert({ actor_type: 'ADMIN', ip: clientIP, action: 'LOGIN_SUCCESS', details: `SIEM Cleared (Score: ${riskScore})` });
    sendDiscord(`<@${ADMIN_ID}>\n**Login Success**\nIP: ${clientIP}\nDevice: ${riskFactors.includes("Hardware Verified") ? "Trusted PC" : "Mobile/Untrusted"}`);
    
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: "Internal Service Error" }), { status: 500 });
  }
}
