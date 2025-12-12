import * as OTPAuth from "otpauth";
import { createClient } from '@supabase/supabase-js';

const ADMIN_ID = "1168575437723680850";

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
async function calculateRiskScore(supabase, ip, country, userAgent, password) {
    let score = 0;
    let reasons = [];

    // 1. VELOCITY CHECK (Last 15 mins)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60000).toISOString();
    const { count: failCount } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('ip', ip)
        .eq('action', 'LOGIN_FAIL')
        .gte('timestamp', fifteenMinsAgo);
    
    if (failCount > 0) {
        const points = failCount * 20; 
        score += points;
        reasons.push(`Velocity: ${failCount} recent fails`);
    }

    // 2. TRIPWIRE HISTORY
    const { count: tripwireCount } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('ip', ip)
        .like('action', '%TRIPWIRE%'); 
    
    if (tripwireCount > 0) {
        score += 100; 
        reasons.push("Prior Tripwire Event");
    }

    // 3. SQL INJECTION SIGNATURES
    const sqlPatterns = [/(')/, /(--)/, /(\%27)/, /(\%23)/, /(#)/, /(OR 1=1)/i, /(SELECT)/i, /(UNION)/i];
    if (sqlPatterns.some(p => p.test(password))) {
        score += 50;
        reasons.push("Attack Signature: SQLi");
    }

    // 4. BOT FINGERPRINTING
    const botAgents = ['curl', 'python', 'postman', 'httpclient', 'wget', 'axios'];
    const ua = (userAgent || "").toLowerCase();
    if (!ua || ua.length < 5) {
        score += 40;
        reasons.push("Anomaly: Invalid User-Agent");
    } else if (botAgents.some(b => ua.includes(b))) {
        score += 60;
        reasons.push(`Bot User-Agent Detected`);
    }

    // 5. VAMPIRE RULE (Time Anomaly)
    const date = new Date();
    const estHour = (date.getUTCHours() - 5 + 24) % 24; 
    if (estHour >= 3 && estHour <= 6) {
        score += 15;
        reasons.push("Anomaly: Off-Hours Access");
    }

    // 6. HIGH RISK GEO
    if (['RU', 'CN', 'KP', 'IR'].includes(country)) {
        score += 25;
        reasons.push(`High Risk Geo: ${country}`);
    }

    return { score: Math.min(score, 100), reasons, failCount };
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
    
    // Metadata
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
    // Before doing ANY processing, check if IP is already banned.
    const { data: alreadyBanned } = await supabase
        .from('banned_ips')
        .select('ip')
        .eq('ip', clientIP)
        .maybeSingle();

    if (alreadyBanned) {
        // Silent Reject (Don't waste resources or give hints)
        return new Response(JSON.stringify({ error: "Access Denied" }), { status: 403 });
    }

    // ==========================================================
    // 🧠 LAYER 1: VIGILANTE RISK ANALYSIS (SIEM)
    // ==========================================================
    const { score: riskScore, reasons: riskFactors, failCount } = await calculateRiskScore(supabase, clientIP, country, userAgent, password);

    // 🔴 CRITICAL RISK (Score >= 80) -> AUTO BAN
    if (riskScore >= 80) {
        // Logic check: We already checked Layer 0, so if we are here, they aren't banned yet.
        // BAN THEM NOW.
        await supabase.from('banned_ips').insert({ ip: clientIP, reason: `SIEM: Risk Score ${riskScore}` });
        
        await supabase.from('audit_logs').insert({ 
            actor_type: 'ATTACKER', ip: clientIP, action: 'AUTO_BAN', details: `Score: ${riskScore} | ${riskFactors.join(', ')}` 
        });
        
        const msg = `**🚨 SIEM BAN EXECUTION**\n**Target:** ${clientIP} (${country})\n**Risk Score:** ${riskScore}/100\n**Reasons:**\n- ${riskFactors.join('\n- ')}`;
        sendDiscord(`<@${ADMIN_ID}>\n${msg}`);
        context.waitUntil(sendEmailAlert(context, "CRITICAL: SIEM Ban", msg));
        
        // Return Stealth Error
        return new Response(JSON.stringify({ error: "Access Denied" }), { status: 403 });
    }

    // ==========================================================
    // 🔐 LAYER 2: STANDARD CHECKS
    // ==========================================================

    // CAPTCHA (Skip if trusted session exists)
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
       
       // Calculate dynamic delay based on risk
       const delay = 2000 + (riskScore * 50); 
       await new Promise(r => setTimeout(r, delay));
       
       sendDiscord(`<@${ADMIN_ID}>\n**Login Failed**\nIP: ${clientIP}\nRisk Score: ${riskScore}`);
       
       return new Response(JSON.stringify({ error: "Invalid Credentials" }), { status: 401 });
    }

    // ==========================================================
    // 🟡 LAYER 3: SUSPICIOUS CHECK (Score 30-79) -> STEP UP
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

    // Trigger Challenge if risk is medium/high AND not yet verified
    if ((riskScore >= 30 || failCount >= 2) && !isStepUpVerified) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await supabase.from('system_config').upsert({ key: 'temp_auth_code', value: code });
        
        sendDiscord(`<@${ADMIN_ID}>\n**🛡️ SIEM CHALLENGE**\n**Risk Score:** ${riskScore}\n**Factors:** ${riskFactors.join(', ')}\n**Code:** \`${code}\``);
        
        return new Response(JSON.stringify({ 
            stepUp: true, 
            message: "Additional verification required. Check secure channel." 
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
    sendDiscord(`<@${ADMIN_ID}>\n**Login Success**\nIP: ${clientIP}\nSIEM Score: ${riskScore}`);
    
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: "Internal Service Error" }), { status: 500 });
  }
}
