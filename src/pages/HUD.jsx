import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/api/base44Client';
import { Activity, Wifi, Terminal, Eye, EyeOff, Lock, ShieldAlert, Cpu, Globe, Shield, AlertTriangle } from 'lucide-react';

const playSound = (type) => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === 'BLEEP') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(2000, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.1); gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1); osc.start(); osc.stop(ctx.currentTime + 0.1);
  } 
  if (type === 'ALARM') {
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(800, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.6); gain.gain.setValueAtTime(0.4, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.6); osc.start(); osc.stop(ctx.currentTime + 0.6);
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
  
  // DEVICE STATE
  const [deviceData, setDeviceData] = useState({ online: false, url: 'WAITING FOR SIGNAL...', threat: 0 });
  const [threatLevel, setThreatLevel] = useState('NORMAL'); 
  const [privacyMode, setPrivacyMode] = useState(false);

  // REFS (The Fix for Stale State)
  const lastHeartbeatRef = useRef(0); // Tracks time since last pulse

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
        const res = await fetch('/api/stream_keepalive', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, task, status: true }) });
        if (res.ok) { setAuth(true); playSound('BLEEP'); } else { setError("ACCESS DENIED"); setPassword(''); }
    } catch (err) { setError("CONNECTION ERROR"); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!auth) return;
    
    // 1. BASICS
    let wakeLock = null;
    const requestWakeLock = async () => { try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (err) {} };
    requestWakeLock();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    const sendHeartbeat = () => { fetch('/api/stream_keepalive', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, task, status: true }) }).catch(() => {}); };
    sendHeartbeat();
    const hbInt = setInterval(sendHeartbeat, 30000);

    const handleVisibilityChange = () => {
      if (document.hidden) document.title = "⚠️ CONNECTION PAUSED";
      else { document.title = "HUD ONLINE"; sendHeartbeat(); }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 2. REALTIME SUBSCRIPTIONS
    const presence = supabase.channel('online-users').on('presence', { event: 'sync' }, () => setVisitors(Object.keys(presence.presenceState()).length)).subscribe();

    const logSub = supabase.channel('hud-logs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_feed' }, (p) => {
        setLogs(prev => [p.new, ...prev].slice(0, 20));
        if (p.new.actor_type === 'ATTACKER' || p.new.action.includes('BAN')) { setThreatLevel('CRITICAL'); playSound('ALARM'); setTimeout(() => setThreatLevel('NORMAL'), 5000); } else { playSound('BLEEP'); }
    }).subscribe();

    const statusSub = supabase.channel('public-status-sync').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'admin_status' }, (p) => {
          if (p.new && p.new.current_task) setTask(p.new.current_task); 
    }).subscribe();

    // 3. DEVICE UPLINK (THE FIX)
    const deviceSub = supabase.channel('device-uplink')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'device_telemetry' }, (p) => {
          if (p.new) {
              // Update Ref immediately so Watchdog sees it
              lastHeartbeatRef.current = Date.now();
              
              setDeviceData({
                  online: true,
                  url: p.new.current_url,
                  threat: p.new.threat_score
              });
          }
      })
      .subscribe();

    // 4. WATCHDOG (Checks Ref instead of State)
    const deviceCheck = setInterval(() => {
        const timeSinceLastPulse = Date.now() - lastHeartbeatRef.current;
        // Increased timeout to 25s to be safe against network lag
        if (lastHeartbeatRef.current > 0 && timeSinceLastPulse > 25000) {
            setDeviceData(prev => ({ ...prev, online: false }));
        }
    }, 5000);

    return () => { 
        clearInterval(timer); clearInterval(hbInt); clearInterval(deviceCheck);
        supabase.removeChannel(presence); supabase.removeChannel(logSub); supabase.removeChannel(deviceSub); supabase.removeChannel(statusSub);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [auth]); // Removed extra dependencies

  if (!auth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-mono">
        <div className="w-full max-w-md border border-cyan-900/50 p-8 bg-slate-950 text-center shadow-[0_0_30px_rgba(8,145,178,0.2)]">
            <Lock className="w-12 h-12 text-cyan-500 mx-auto mb-4" />
            <h1 className="text-cyan-500 tracking-[0.5em] text-xl mb-8">HUD_LOGIN</h1>
            <form onSubmit={handleLogin}>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-black border border-slate-800 p-3 text-cyan-400 text-center outline-none focus:border-cyan-500 placeholder-slate-800" autoFocus placeholder="ENTER PASSCODE" />
                {error && <div className="text-red-500 text-xs mt-4 font-bold animate-pulse">{error}</div>}
                <button type="submit" disabled={loading} className="w-full mt-6 py-2 border border-cyan-900 bg-cyan-900/20 text-cyan-400 hover:bg-cyan-900/40 transition-colors font-bold tracking-widest">{loading ? "VERIFYING..." : "INITIALIZE SYSTEM"}</button>
            </form>
        </div>
      </div>
    );
  }

  const blurClass = privacyMode ? "blur-md opacity-50 transition-all duration-300" : "transition-all duration-300";

  return (
    <div className={`min-h-screen font-mono p-6 overflow-hidden flex flex-col transition-all duration-500 ${threatLevel === 'CRITICAL' ? 'bg-red-950/20 shadow-[inset_0_0_100px_rgba(220,38,38,0.5)]' : 'bg-black text-green-500'}`}>
      
      {/* 🔴 RED ALERT OVERLAY */}
      {threatLevel === 'CRITICAL' && (
        <div className="fixed inset-0 border-[10px] border-red-600 animate-pulse pointer-events-none z-50 mix-blend-overlay"></div>
      )}

      {/* HEADER */}
      <div className={`flex justify-between items-end border-b pb-4 mb-6 transition-colors ${threatLevel === 'CRITICAL' ? 'border-red-500' : 'border-green-900/50'}`}>
        <div>
            {threatLevel === 'CRITICAL' ? (
                <h1 className="text-4xl font-bold tracking-tighter text-red-500 animate-pulse flex items-center gap-4">
                    <ShieldAlert className="w-10 h-10" /> SECURITY ALERT ACTIVE
                </h1>
            ) : (
                <h1 className="text-4xl font-bold tracking-tighter text-white">COMMAND_STATION</h1>
            )}
            
            <div className="flex items-center gap-4 text-xs mt-2">
                <span className="flex items-center gap-2"><Wifi className="w-3 h-3 animate-pulse" /> UPLINK_ESTABLISHED</span>
                <button onClick={() => setPrivacyMode(!privacyMode)} className="flex items-center gap-1 hover:text-white">
                    {privacyMode ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}
                    {privacyMode ? "PRIVACY: ON" : "PRIVACY: OFF"}
                </button>
            </div>
        </div>
        <div className="text-right">
            <div className="text-5xl font-bold text-white">{currentTime.toLocaleTimeString([], {hour12: false})}</div>
            <div className={`mt-2 inline-flex items-center gap-2 border px-3 py-1 rounded-full text-xs font-bold transition-all ${deviceData.online ? 'border-cyan-500 text-cyan-400 bg-cyan-950/30' : 'border-red-900 text-red-500 bg-red-950/20'}`}>
                <Cpu className="w-3 h-3" /> 
                {deviceData.online ? "ADMIN_PC_CONNECTED" : "ADMIN_PC_OFFLINE"}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 flex-1">
        
        {/* LEFT COLUMN */}
        <div className="col-span-1 space-y-6">
            
            {/* NEURAL UPLINK */}
            <div className={`border p-4 rounded relative overflow-hidden transition-all ${deviceData.threat > 50 ? 'border-red-500 bg-red-950/20' : 'border-cyan-900 bg-cyan-950/10'}`}>
                <div className="absolute top-0 right-0 p-2"><Activity className={`w-4 h-4 animate-pulse ${deviceData.threat > 50 ? 'text-red-500' : 'text-cyan-500'}`}/></div>
                <h3 className={`text-xs mb-4 font-bold flex items-center gap-2 ${deviceData.threat > 50 ? 'text-red-500' : 'text-cyan-500'}`}><Globe className="w-3 h-3"/> NEURAL UPLINK</h3>
                
                <div className={`space-y-4 text-sm ${blurClass}`}>
                    <div>
                        <div className="text-[10px] text-slate-500 mb-1">CURRENT TARGET URL</div>
                        <div className="truncate text-white font-bold font-mono bg-black/50 p-2 rounded border border-white/10" title={deviceData.url}>
                            {deviceData.online ? deviceData.url : "NO SIGNAL"}
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="text-[10px] text-slate-500">THREAT ANALYSIS</div>
                            <div className={`text-3xl font-bold ${deviceData.threat > 50 ? "text-red-500 animate-pulse" : "text-green-400"}`}>
                                {deviceData.online ? `${deviceData.threat}/100` : "--"}
                            </div>
                        </div>
                        {deviceData.threat > 50 && <ShieldAlert className="w-10 h-10 text-red-500 animate-bounce" />}
                        {deviceData.threat <= 50 && <Shield className="w-10 h-10 text-green-500 opacity-50" />}
                    </div>
                </div>
            </div>

            {/* VISITOR & TASK PANELS */}
            <div className="grid grid-cols-2 gap-4">
                <div className="border border-green-900 bg-green-950/5 p-4 rounded text-center">
                    <h3 className="text-[10px] mb-2 text-green-500 font-bold">ACTIVE VISITORS</h3>
                    <div className={`text-5xl font-bold text-white ${blurClass}`}>{visitors}</div>
                </div>
                <div className="border border-slate-800 bg-slate-900/20 p-4 rounded text-center">
                     <h3 className="text-[10px] mb-2 text-slate-500 font-bold">SYSTEM STATUS</h3>
                     <div className={`text-xl font-bold ${threatLevel === 'CRITICAL' ? 'text-red-500' : 'text-green-500'}`}>
                         {threatLevel}
                     </div>
                </div>
            </div>

            <div className="border border-slate-800 bg-black/50 p-4 rounded">
                <h3 className="text-[10px] mb-2 text-slate-500 font-bold flex items-center gap-2"><Terminal className="w-3 h-3"/> CURRENT_OBJECTIVE_SYNC</h3>
                <textarea 
                    value={task} 
                    readOnly
                    className={`w-full bg-black border border-slate-800 p-3 text-sm text-cyan-400 font-mono outline-none h-20 resize-none rounded ${blurClass}`}
                />
            </div>
        </div>

        {/* RIGHT COLUMN (LOGS) */}
        <div className="col-span-2 border border-slate-800 bg-black p-0 flex flex-col relative overflow-hidden rounded">
            <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-400 flex items-center gap-2"><Activity className="w-4 h-4 text-green-500"/> DATA_INTERCEPT_STREAM</h3>
                <span className="text-[10px] text-slate-600">LIVE FEED</span>
            </div>
            
            <div className={`flex-1 overflow-y-auto custom-scrollbar p-0 ${blurClass}`}>
                {logs.map((log, i) => (
                    <div key={i} className={`flex items-center gap-4 p-3 border-b border-white/5 text-sm font-mono transition-all hover:bg-white/5 ${
                        log.actor_type === 'ATTACKER' ? 'bg-red-950/10 text-red-400 border-l-4 border-l-red-500' : 
                        log.actor_type === 'ADMIN' ? 'text-yellow-400 border-l-4 border-l-yellow-500' : 
                        'text-green-400/80 border-l-4 border-l-green-900'
                    }`}>
                        <span className="opacity-50 text-[10px] w-16">{new Date(log.timestamp).toLocaleTimeString([], {hour12: false})}</span>
                        <span className="w-24 font-bold tracking-wider">{log.actor_type}</span>
                        <span className="w-32 opacity-80">{log.action}</span>
                        <span className="truncate flex-1 text-slate-300">{log.details}</span>
                        {log.actor_type === 'ATTACKER' && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
                    </div>
                ))}
            </div>
            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)50%,rgba(0,0,0,0.1)50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,2px_100%]" />
        </div>
      </div>
    </div>
  );
}
