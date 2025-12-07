import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/api/base44Client';
import { Activity, Wifi, Terminal, Eye, Lock, ShieldAlert, Zap, EyeOff } from 'lucide-react';

// SYNTHETIC AUDIO
const playSound = (type) => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  if (type === 'BLEEP') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(1200, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.start(); osc.stop(ctx.currentTime + 0.05);
  } 
  if (type === 'ALARM') {
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    osc.start(); osc.stop(ctx.currentTime + 0.5);
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
  const [verificationStatus, setVerificationStatus] = useState('ANALYZING_HARDWARE...');
  const [isBlurred, setBlurred] = useState(false);

  // ---------------------------------------------------------
  // 1. STRICT DEVICE INTEGRITY CHECK
  // ---------------------------------------------------------
  useEffect(() => {
    const checkAccess = async () => {
        const ua = navigator.userAgent;
        console.log("Detected User Agent:", ua); // Debugging info in console
        
        // STRICT MODE: Only Allow ChromeOS (CrOS) or Linux X11 (Desktop Linux)
        // This blocks Windows, Mac, iPhone, and Android
        const isChromebook = ua.includes("CrOS") || (ua.includes("Linux") && !ua.includes("Android"));

        if (!isChromebook) {
            // Immediate Redirect for non-authorized hardware
            console.warn("UNAUTHORIZED HARDWARE DETECTED");
            window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
            return;
        }

        // IP Check (Server Side)
        try {
            const res = await fetch('/api/client_verify');
            if (res.ok) {
                setVerificationStatus("ACCESS_GRANTED");
            } else {
                setVerificationStatus("UNAUTHORIZED_IP");
                setTimeout(() => window.location.href = "/", 2000);
            }
        } catch(e) {
            setVerificationStatus("NET_ERROR");
        }
    };
    checkAccess();
  }, []);

  // ---------------------------------------------------------
  // 2. PRIVACY VEIL
  // ---------------------------------------------------------
  useEffect(() => {
      const handleVisibility = () => {
          if (document.hidden) setBlurred(true);
          else setBlurred(false);
      };
      document.addEventListener("visibilitychange", handleVisibility);
      return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // ---------------------------------------------------------
  // 3. PANIC KEY (Double ESC)
  // ---------------------------------------------------------
  useEffect(() => {
      let lastPress = 0;
      const handleKeyDown = (e) => {
          if (e.key === 'Escape') {
              const now = Date.now();
              if (now - lastPress < 500) { 
                  setAuth(false);
                  setPassword('');
                  navigator.sendBeacon('/api/stream_keepalive', JSON.stringify({ password, task, status: false }));
              }
              lastPress = now;
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [password, task]);

  // ---------------------------------------------------------
  // 4. HEARTBEAT
  // ---------------------------------------------------------
  useEffect(() => {
    if(!auth) return;
    const sendHeartbeat = () => {
      fetch('/api/stream_keepalive', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, task, status: true })
      }).catch(console.error);
    };
    sendHeartbeat();
    const hbInt = setInterval(sendHeartbeat, 30000);
    const cleanup = () => navigator.sendBeacon('/api/stream_keepalive', JSON.stringify({ password, task, status: false }));
    window.addEventListener('beforeunload', cleanup);
    return () => { clearInterval(hbInt); window.removeEventListener('beforeunload', cleanup); };
  }, [auth, task, password]);

  // ---------------------------------------------------------
  // 5. DATA STREAMS
  // ---------------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    if(!auth) return;
    const presence = supabase.channel('online-users').on('presence', { event: 'sync' }, () => setVisitors(Object.keys(presence.presenceState()).length)).subscribe();
    const logSub = supabase.channel('hud-logs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (p) => {
        setLogs(prev => [p.new, ...prev].slice(0, 20));
        if (p.new.actor_type === 'ATTACKER' || p.new.action.includes('HONEYPOT') || p.new.action.includes('BAN')) {
            setThreatLevel('CRITICAL');
            playSound('ALARM');
            setTimeout(() => setThreatLevel('NORMAL'), 5000);
        } else { playSound('BLEEP'); }
    }).subscribe();
    return () => { clearInterval(timer); supabase.removeChannel(presence); supabase.removeChannel(logSub); };
  }, [auth]);

  // --- UI ---
  if (verificationStatus !== "ACCESS_GRANTED") return <div className="min-h-screen bg-black text-red-600 font-mono flex items-center justify-center text-xl animate-pulse">{verificationStatus}</div>;

  if (!auth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-mono">
        <div className="w-full max-w-md border border-cyan-900/50 p-8 bg-slate-950 text-center shadow-[0_0_30px_rgba(8,145,178,0.2)]">
          <Lock className="w-12 h-12 text-cyan-500 mx-auto mb-4" />
          <h1 className="text-cyan-500 tracking-[0.5em] text-xl mb-8">HUD_LOGIN</h1>
          <form onSubmit={async (e) => {
              e.preventDefault(); setLoading(true); setError('');
              const res = await fetch('/api/stream_keepalive', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ password, task, status: true })
              });
              setLoading(false);
              if (res.ok) { setAuth(true); playSound('BLEEP'); } 
              else { setError("ACCESS DENIED"); setPassword(''); }
          }}>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-black border border-slate-800 p-3 text-cyan-400 text-center outline-none focus:border-cyan-500 placeholder-slate-800" autoFocus placeholder="ENTER PASSCODE"/>
            {error && <div className="text-red-500 text-xs mt-4 font-bold">{error}</div>}
            <button type="submit" disabled={loading} className="w-full mt-6 bg-cyan-900/20 text-cyan-400 py-2 border border-cyan-900 hover:bg-cyan-900/40 font-bold tracking-widest">{loading ? "VERIFYING..." : "INITIALIZE SYSTEM"}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-mono p-6 overflow-hidden flex flex-col transition-colors duration-300 relative ${threatLevel === 'CRITICAL' ? 'bg-red-950' : 'bg-black text-green-500'}`}>
      {isBlurred && <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center text-slate-500"><EyeOff className="w-16 h-16 mb-4" /><p className="tracking-widest">VISUAL_FEED_SUSPENDED</p></div>}
      <div className={`flex justify-between items-end border-b pb-4 mb-6 ${threatLevel === 'CRITICAL' ? 'border-red-500' : 'border-green-900/50'}`}>
        <div><h1 className={`text-4xl font-bold tracking-tighter ${threatLevel === 'CRITICAL' ? 'text-red-500 animate-pulse' : 'text-white'}`}>{threatLevel === 'CRITICAL' ? '⚠️ SECURITY ALERT ⚠️' : 'COMMAND_STATION'}</h1><div className="flex items-center gap-2 text-xs mt-1"><Wifi className="w-3 h-3 animate-pulse" /><span>UPLINK_ESTABLISHED</span><span className="ml-4 opacity-50">DEVICE: CHROMIUM_OS</span></div></div>
        <div className="text-right"><div className="text-5xl font-bold text-white">{currentTime.toLocaleTimeString([], {hour12: false})}</div><div className="text-sm opacity-70">{currentTime.toLocaleDateString()}</div></div>
      </div>
      <div className="grid grid-cols-3 gap-6 flex-1">
        <div className="col-span-1 space-y-6">
            <div className={`border p-4 ${threatLevel === 'CRITICAL' ? 'border-red-500 bg-red-900/20' : 'border-green-900 bg-green-950/5'}`}><h3 className="text-xs mb-2 flex items-center gap-2 opacity-70"><Activity className="w-4 h-4"/> CURRENT_OBJECTIVE</h3><textarea value={task} onChange={e => setTask(e.target.value)} className="w-full bg-black border border-slate-800 p-3 text-xl text-white outline-none focus:border-green-500 h-32 resize-none"/></div>
            <div className={`border p-4 ${threatLevel === 'CRITICAL' ? 'border-red-500 bg-red-900/20' : 'border-green-900 bg-green-950/5'}`}><h3 className="text-xs mb-2 flex items-center gap-2 opacity-70"><Eye className="w-4 h-4"/> ACTIVE_VISITORS</h3><div className="text-6xl font-bold text-white">{visitors}</div></div>
        </div>
        <div className={`col-span-2 border p-4 bg-black relative overflow-hidden flex flex-col ${threatLevel === 'CRITICAL' ? 'border-red-500' : 'border-green-900'}`}>
            <h3 className="text-xs mb-4 flex items-center gap-2 opacity-70"><Terminal className="w-4 h-4"/> DATA_INTERCEPT</h3>
            <div className="space-y-2 font-mono text-sm flex-1 overflow-y-auto custom-scrollbar relative z-10">{logs.map((log, i) => (<div key={i} className={`flex gap-4 border-b pb-1 ${log.actor_type === 'ATTACKER' ? 'text-red-500 border-red-900/50' : 'text-green-500 border-green-900/20'}`}><span className="opacity-50">{new Date(log.timestamp).toLocaleTimeString()}</span><span className="w-20 font-bold">{log.actor_type}</span><span className="w-32">{log.action}</span><span className="truncate flex-1 opacity-80">{log.details}</span></div>))}</div>
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)50%,rgba(0,0,0,0.25)50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
        </div>
      </div>
    </div>
  );
}
