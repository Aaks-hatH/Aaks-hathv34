import * as OTPAuth from "otpauth";
import { createClient } from '@supabase/supabase-js';

const ADMIN_ID = "1168575437723680850";

export async function onRequestPost(context) {
  // Handle CORS
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  
  try {
    const { password, token, captcha, stepUpCode } = await context.request.json();
    
    // Secrets
    const actualPassword = (context.env.ADMIN_PASSWORD || "").trim();
    const totpSecret = (context.env.ADMIN_TOTP_SECRET || "").replace(/\s/g, '');
    const webhookUrl = context.env.DISCORD_WEBHOOK_URL;
    const turnstileSecret = context.env.TURNSTILE_SECRET_KEY;
    const sbKey = context.env.SUPABASE_SERVICE_KEY;
    
    // Metadata
    const clientIP = context.request.headers.get("CF-Connecting-IP") || "Unknown";
    const country = context.request.headers.get("CF-IPCountry") || "XX";

    const sendAlert = (msg) => {
        if (webhookUrl) {
            context.waitUntil(fetch(webhookUrl, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: msg })
            }).catch(() => {}));
        }
    };

    const supabase = createClient('https://gdlvzfyvgmeyvlcgggix.supabase.co', sbKey);

    // ==========================================================
    // 🛡️ PHASE 1: BEHAVIORAL ANALYSIS & AUTO-BAN
    // ==========================================================
    
    // Check recent failures (Last 15 minutes)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60000).toISOString();
    
    // Count failed login attempts from this IP
    const { count: failCount } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('ip', clientIP)
        .eq('action', 'LOGIN_FAIL')
        .gte('timestamp', fifteenMinsAgo);

    // 🛑 CRITICAL THREAT: > 5 Failures = AUTO BAN
    if (failCount >= 5) {
        await supabase.from('banned_ips').upsert({ 
            ip: clientIP, 
            reason: "Auto-Ban: Brute Force Detected (5+ Failed Logins)" 
        });
        
        await supabase.from('audit_logs').insert({ 
            actor_type: 'ATTACKER', ip: clientIP, action: 'AUTO_BAN', details: 'Brute Force Threshold Exceeded' 
        });

        sendAlert(`<@${ADMIN_ID}>\n**🚨 AUTO-BAN EXECUTED**\n**Reason:** Brute Force (${failCount} fails)\n**Target:** ${clientIP} (${country})`);
        
        return new Response(JSON.stringify({ error: "ACCESS DENIED: IP BANNED" }), { status: 403 });
    }

    // ⚠️ SUSPICIOUS ACTIVITY: > 2 Failures = STEP-UP AUTH REQUIRED
    // If the user hasn't provided the code yet, generate it and stop them.
    if (failCount >= 2 && !stepUpCode) {
        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store in system_config temporarily (acts as a session store)
        await supabase.from('system_config').upsert({ key: 'temp_auth_code', value: code });

        // Send to Admin Discord (The "Email" Channel)
        sendAlert(`<@${ADMIN_ID}>\n**🛡️ SUSPICIOUS LOGIN DETECTED**\n**Source:** ${clientIP} (${country})\n**Flag:** ${failCount} recent failures.\n**VERIFICATION CODE:** \`${code}\``);

        return new Response(JSON.stringify({ 
            stepUp: true, 
            message: "Suspicious activity detected. Verification code sent to secure channel." 
        }), { status: 200 });
    }

    // ==========================================================
    // 🔐 PHASE 2: STANDARD CHECKS
    // ==========================================================

    // 1. CAPTCHA CHECK
    if (turnstileSecret) {
        if (!captcha) return new Response(JSON.stringify({ error: "CAPTCHA_REQUIRED" }), { status: 400 });
        
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret: turnstileSecret, response: captcha, remoteip: clientIP })
        });
        
        const d = await verifyRes.json();
        if (!d.success) return new Response(JSON.stringify({ error: "CAPTCHA_FAILED" }), { status: 403 });
    }

    // 2. DEAD MAN'S SWITCH (HUD ONLINE CHECK)
    const { data: status } = await supabase
        .from('admin_status')
        .select('is_online, last_heartbeat')
        .eq('id', 1)
        .single();
        
    const now = new Date();
    const lastBeat = new Date(status?.last_heartbeat || 0);
    const diffSeconds = (now - lastBeat) / 1000;
    const TIMEOUT_LIMIT = 120; // 2 Minutes

    // If HUD is marked offline OR heartbeat is stale -> BLOCK
    if (!status || status.is_online !== true || diffSeconds > TIMEOUT_LIMIT) {
         sendAlert(`<@${ADMIN_ID}>\n**Security Block:** Login blocked. HUD Offline.\n**Time since pulse:** ${Math.floor(diffSeconds)}s\n**IP:** ${clientIP}`);
         return new Response(JSON.stringify({ error: "SECURITY LOCKOUT: HUD OFFLINE" }), { status: 403 });
    }

    // 3. STEP-UP CODE VERIFICATION (If provided)
    if (stepUpCode) {
        const { data: storedCode } = await supabase.from('system_config').select('value').eq('key', 'temp_auth_code').single();
        
        if (!storedCode || storedCode.value !== stepUpCode) {
            // Log failure to increase ban count
            await supabase.from('audit_logs').insert({ actor_type: 'ATTACKER', ip: clientIP, action: 'LOGIN_FAIL', details: 'Wrong Step-Up Code' });
            return new Response(JSON.stringify({ error: "INVALID_VERIFICATION_CODE" }), { status: 401 });
        }
        
        // Clear code after use (One-time use)
        await supabase.from('system_config').delete().eq('key', 'temp_auth_code');
    }

    // 4. PASSWORD CHECK
    if (password !== actualPassword) {
       await supabase.from('audit_logs').insert({ actor_type: 'ATTACKER', ip: clientIP, action: 'LOGIN_FAIL', details: 'Wrong Password' });
       sendAlert(`<@${ADMIN_ID}>\n**Alert:** Login failed (Bad Password).\n**Source:** ${clientIP} (${country})`);
       
       await new Promise(r => setTimeout(r, 2000)); // Artificial Delay
       return new Response(JSON.stringify({ error: "PASSWORD_INCORRECT" }), { status: 401 });
    }

    // 5. 2FA (TOTP) CHECK
    if (totpSecret) {
        const totp = new OTPAuth.TOTP({ algorithm: "SHA1", digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(totpSecret) });
        const delta = totp.validate({ token: token, window: 2 });
        
        if (delta === null) {
           await supabase.from('audit_logs').insert({ actor_type: 'ATTACKER', ip: clientIP, action: 'LOGIN_FAIL', details: 'Wrong 2FA' });
           sendAlert(`<@${ADMIN_ID}>\n**Security Warning:** Valid password used, but 2FA code failed.\n**Source:** ${clientIP} (${country})`);
           return new Response(JSON.stringify({ error: "2FA_CODE_INVALID" }), { status: 401 });
        }
    }

    // 6. SUCCESS
    sendAlert(`<@${ADMIN_ID}>\n**System Notice:** Admin session established.\n**IP:** ${clientIP} (${country})`);
    
    // Log success (prevents future bans)
    await supabase.from('audit_logs').insert({ actor_type: 'ADMIN', ip: clientIP, action: 'LOGIN_SUCCESS', details: 'Session Started' });

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
