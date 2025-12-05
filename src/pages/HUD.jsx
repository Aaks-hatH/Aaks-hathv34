import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/api/base44Client';
import { Activity, Wifi, Terminal, Eye, Lock, ShieldAlert, Zap } from 'lucide-react';

// --- SYNTHETIC AUDIO SYSTEM ---
const playSound = (type) => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === 'BLEEP') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } 
  
  if (type === 'ALARM') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }
};

export default function HUD() {
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [task, setTask] = useState('System Idle');
  const [visitors, setVisitors] = useState(0);
  const [logs, setLogs] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [threatLevel, setThreatLevel] = useState('NORMAL'); 
  const [verificationStatus, setVerificationStatus] = useState('ANALYZING_DEVICE...');

  // ---------------------------------------------------------
  // 1. DEVICE INTEGRITY CHECK (Strict Chromebook Only)
  // ---------------------------------------------------------
  useEffect(() => {
    const checkAccess = async () => {
        const ua = navigator.userAgent;
        
        // STRICT CHECK: Must contain "CrOS" (Chrome OS)
        // This blocks Windows ("Win"), Mac ("Mac"), Linux ("Linux" without CrOS), and Phones.
        const isChromebook = ua.includes("CrOS");

        if (!isChromebook) {
            setVerificationStatus("UNAUTHORIZED HARDWARE: NOT A CHROMEBOOK");
            setTimeout(() => {
                window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
            }, 1500);
            return;
        }

        // Check IP Access
        try {
            const res = await fetch('/api/hud-access');
            if (res.ok) {
                setVerificationStatus("ACCESS_GRANTED");
            } else {
                setVerificationStatus("UNAUTHORIZED_IP (LOGIN REQUIRED)");
            }
        } catch(e) {
            setVerificationStatus("NET_ERROR");
        }
    };
    checkAccess();
  }, []);

  // ---------------------------------------------------------
  // 2. LOGIN HANDLER
  // ---------------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        const res = await fetch('/api/heartbeat', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password, task, status: true })
        });

        if (res.ok) {
            setAuth(true);
            playSound('BLEEP');
        } else {
            setError("ACCESS DENIED: WRONG PASSWORD");
            setPassword('');
        }
    } catch (err) {
        setError("CONNECTION ERROR");
    } finally {
        setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // 3. WAKE LOCK (Prevent Sleep)
  // ---------------------------------------------------------
  useEffect(() => {
    if (!auth) return;
    
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    };
    
    requestWakeLock();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [auth]);

  // ---------------------------------------------------------
  // 4. DATA STREAMS & THREAT DETECTION
  // ---------------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    if(!auth) return;

    // Heartbeat
    const sendHeartbeat = () => {
      fetch('/api/heartbeat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, task, status: true })
      });
    };
    sendHeartbeat();
    const hbInt = setInterval(sendHeartbeat, 30000);

    // Presence
    const presence = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => setVisitors(Object.keys(presence.presenceState()).length))
      .subscribe();

    // Logs & Audio
    const logSub = supabase.channel('hud-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (p) => {
        const newLog = p.new;
        setLogs(prev => [newLog, ...prev].slice(0, 20));
        
        // THREAT ANALYSIS & SOUND
        if (newLog.actor_type === 'ATTACKER' || newLog.action.includes('HONEYPOT') || newLog.action.includes('BAN')) {
            setThreatLevel('CRITICAL');
            playSound('ALARM');
            setTimeout(() => setThreatLevel('NORMAL'), 5000);
        } else {
            playSound('BLEEP');
        }
      })
      .subscribe();

    return () => { 
        clearInterval(timer); clearInterval(hbInt); 
        supabase.removeChannel(presence); supabase.removeChannel(logSub); 
    };
  }, [auth, task]);

  // ---------------------------------------------------------
  // UI RENDER
  // ---------------------------------------------------------
  
  if (verificationStatus !== "ACCESS_GRANTED" && verificationStatus !== "UNAUTHORIZED_IP (LOGIN REQUIRED)") {
      return <div className="min-h-screen bg-black text-red-600 font-mono flex items-center justify-center text-xl animate-pulse">{verificationStatus}</div>;
  }

  if (!auth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-mono">
        <div className="w-full max-w-md border border-cyan-900/50 p-8 bg-slate-950 text-center shadow-[0_0_30px_rgba(8,145,178,0.2)]">
          <Lock className="w-12 h-12 text-cyan-500 mx-auto mb-4" />
          <h1 className="text-cyan-500 tracking-[0.5em] text-xl mb-8">HUD_LOGIN</h1>
          <form onSubmit={handleLogin}>
            <input 
                type="password" 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                className="w-full bg-black border border-slate-800 p-3 text-cyan-400 text-center outline-none focus:border-cyan-500 placeholder-slate-800" 
                autoFocus 
                placeholder="ENTER PASSCODE"
            />
            {error && <div className="text-red-500 text-xs mt-4 font-bold animate-pulse">{error}</div>}
            <button type="submit" disabled={loading} className="w-full mt-6 bg-cyan-900/20 text-cyan-400 py-2 border border-cyan-900 hover:bg-cyan-900/40 transition-colors font-bold tracking-widest">
                {loading ? "VERIFYING..." : "INITIALIZE SYSTEM"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-mono p-6 overflow-hidden flex flex-col transition-colors duration-300 ${threatLevel === 'CRITICAL' ? 'bg-red-950' : 'bg-black text-green-500'}`}>
      
      {/* TOP BAR */}
      <div className={`flex justify-between items-end border-b pb-4 mb-6 ${threatLevel === 'CRITICAL' ? 'border-red-500' : 'border-green-900/50'}`}>
        <div>
            <h1 className={`text-4xl font-bold tracking-tighter ${threatLevel === 'CRITICAL' ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {threatLevel === 'CRITICAL' ? '⚠️ SECURITY ALERT ⚠️' : 'COMMAND_STATION'}
            </h1>
            <div className="flex items-center gap-2 text-xs mt-1">
                <Wifi className="w-3 h-3 animate-pulse" />
                <span>UPLINK_ESTABLISHED</span>
                <span className="ml-4 opacity-50">WAKE_LOCK: ACTIVE</span>
            </div>
        </div>
        <div className="text-right">
            <div className="text-5xl font-bold text-white">{currentTime.toLocaleTimeString([], {hour12: false})}</div>
            <div className="text-sm opacity-70">{currentTime.toLocaleDateString()}</div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-3 gap-6 flex-1">
        
        {/* COL 1: CONTROLS */}
        <div className="col-span-1 space-y-6">
            <div className={`border p-4 ${threatLevel === 'CRITICAL' ? 'border-red-500 bg-red-900/20' : 'border-green-900 bg-green-950/5'}`}>
                <h3 className="text-xs mb-2 flex items-center gap-2 opacity-70"><Activity className="w-4 h-4"/> CURRENT_OBJECTIVE</h3>
                <textarea 
                    value={task} 
                    onChange={e => setTask(e.target.value)}
                    className="w-full bg-black border border-slate-800 p-3 text-xl text-white outline-none focus:border-green-500 h-32 resize-none"
                />
                <div className="mt-2 text-[10px] opacity-50 text-right">UPDATES PUBLIC SITE INSTANTLY</div>
            </div>

            <div className={`border p-4 ${threatLevel === 'CRITICAL' ? 'border-red-500 bg-red-900/20' : 'border-green-900 bg-green-950/5'}`}>
                <h3 className="text-xs mb-2 flex items-center gap-2 opacity-70"><Eye className="w-4 h-4"/> ACTIVE_VISITORS</h3>
                <div className="text-6xl font-bold text-white">{visitors}</div>
            </div>
        </div>

        {/* COL 2: SYSTEM STREAM */}
        <div className={`col-span-2 border p-4 bg-black relative overflow-hidden flex flex-col ${threatLevel === 'CRITICAL' ? 'border-red-500' : 'border-green-900'}`}>
            <h3 className="text-xs mb-4 flex items-center gap-2 opacity-70"><Terminal className="w-4 h-4"/> DATA_INTERCEPT</h3>
            
            <div className="space-y-2 font-mono text-sm flex-1 overflow-y-auto custom-scrollbar relative z-10">
                {logs.map((log, i) => (
                    <div key={i} className={`flex gap-4 border-b pb-1 ${
                        log.actor_type === 'ATTACKER' ? 'text-red-500 border-red-900/50' :
                        log.actor_type === 'ADMIN' ? 'text-yellow-500 border-yellow-900/30' : 
                        'text-green-500 border-green-900/20'
                    }`}>
                        <span className="opacity-50">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className="w-20 font-bold">{log.actor_type}</span>
                        <span className="w-32">{log.action}</span>
                        <span className="truncate flex-1 opacity-80">{log.details}</span>
                    </div>
                ))}
                <div className="animate-pulse">_</div>
            </div>

            {/* Decorative Scanlines */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)50%,rgba(0,0,0,0.25)50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
        </div>

      </div>
    </div>
  );
}
