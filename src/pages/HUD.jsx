import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/base44Client';
import { Activity, Wifi, Terminal, Eye, EyeOff, Lock, ShieldAlert, Cpu, Globe, Shield } from 'lucide-react';

const playSound = (type) => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === 'BLEEP') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(1200, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.05); gain.gain.setValueAtTime(0.05, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05); osc.start(); osc.stop(ctx.currentTime + 0.05);
  } 
  if (type === 'ALARM') {
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, ctx.currentTime); osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.5); gain.gain.setValueAtTime(0.2, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5); osc.start(); osc.stop(ctx.currentTime + 0.5);
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
  
  const [deviceData, setDeviceData] = useState({ online: false, url: 'WAITING FOR SIGNAL...', threat: 0, lastSeen: null });
  const [threatLevel, setThreatLevel] = useState('NORMAL'); 
  const [privacyMode, setPrivacyMode] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
        const res = await fetch('/api/stream_keepalive', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, task, status: true }) });
        if (res.ok) { setAuth(true); playSound('BLEEP'); } else { setError("ACCESS DENIED"); setPassword(''); }
    } catch (err) { setError("CONNECTION ERROR"); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!auth) return;
    
    let wakeLock = null;
    const requestWakeLock = async () => { try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (err) {} };
    requestWakeLock();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    const sendHeartbeat = () => { fetch('/api/stream_keepalive', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, task, status: true }) }).catch(() => console.log("Heartbeat failed")); };
    sendHeartbeat();
    const hbInt = setInterval(sendHeartbeat, 30000);

    // REMOVED: The logic that changed document.title to "CONNECTION PAUSED"

    const presence = supabase.channel('online-users').on('presence', { event: 'sync' }, () => setVisitors(Object.keys(presence.presenceState()).length)).subscribe();

    const logSub = supabase.channel('hud-logs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (p) => {
        setLogs(prev => [p.new, ...prev].slice(0, 20));
        if (p.new.actor_type === 'ATTACKER' || p.new.action.includes('BAN')) { setThreatLevel('CRITICAL'); playSound('ALARM'); setTimeout(() => setThreatLevel('NORMAL'), 5000); } else { playSound('BLEEP'); }
    }).subscribe();

    const deviceSub = supabase.channel('device-uplink').on('postgres_changes', { event: '*', schema: 'public', table: 'device_telemetry' }, (p) => {
          if (p.new) { setDeviceData({ online: true, url: p.new.current_url, threat: p.new.threat_score, lastSeen: new Date() }); }
    }).subscribe();

    const deviceCheck = setInterval(() => { if (deviceData.lastSeen && (new Date() - deviceData.lastSeen > 15000)) { setDeviceData(prev => ({ ...prev, online: false })); } }, 5000);

    return () => { 
        clearInterval(timer); clearInterval(hbInt); clearInterval(deviceCheck);
        supabase.removeChannel(presence); supabase.removeChannel(logSub); supabase.removeChannel(deviceSub);
    };
  }, [auth, task, deviceData.lastSeen]);

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
    <div className={`min-h-screen font-mono p-6 overflow-hidden flex flex-col transition-colors duration-300 ${threatLevel === 'CRITICAL' ? 'bg-red-950' : 'bg-black text-green-500'}`}>
      <div className={`flex justify-between items-end border-b pb-4 mb-6 ${threatLevel === 'CRITICAL' ? 'border-red-500' : 'border-green-900/50'}`}>
        <div><h1 className={`text-4xl font-bold tracking-tighter ${threatLevel === 'CRITICAL' ? 'text-red-500 animate-pulse' : 'text-white'}`}>{threatLevel === 'CRITICAL' ? '⚠️ SECURITY ALERT ⚠️' : 'COMMAND_STATION'}</h1><div className="flex items-center gap-4 text-xs mt-1"><span className="flex items-center gap-2"><Wifi className="w-3 h-3 animate-pulse" /> UPLINK_ESTABLISHED</span><button onClick={() => setPrivacyMode(!privacyMode)} className="flex items-center gap-1 hover:text-white">{privacyMode ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}{privacyMode ? "PRIVACY: ON" : "PRIVACY: OFF"}</button></div></div>
        <div className="text-right"><div className="text-5xl font-bold text-white">{currentTime.toLocaleTimeString([], {hour12: false})}</div><div className={`mt-2 inline-flex items-center gap-2 border px-3 py-1 rounded-full text-xs font-bold ${deviceData.online ? 'border-cyan-500 text-cyan-400 bg-cyan-950/30' : 'border-red-900 text-red-500 bg-red-950/20'}`}><Cpu className="w-3 h-3" /> {deviceData.online ? "ADMIN_PC_CONNECTED" : "ADMIN_PC_OFFLINE"}</div></div>
      </div>
      <div className="grid grid-cols-3 gap-6 flex-1">
        <div className="col-span-1 space-y-6">
            <div className="border border-cyan-900 bg-cyan-950/10 p-4 rounded relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2"><Activity className="w-4 h-4 text-cyan-500 animate-pulse"/></div><h3 className="text-xs text-cyan-500 mb-4 font-bold flex items-center gap-2"><Globe className="w-3 h-3"/> NEURAL UPLINK</h3>
                <div className={`space-y-4 text-sm ${blurClass}`}><div><div className="text-[10px] text-slate-500 mb-1">CURRENT TARGET URL</div><div className="truncate text-white font-bold font-mono bg-black/50 p-2 rounded border border-cyan-900/30" title={deviceData.url}>{deviceData.online ? deviceData.url : "NO SIGNAL"}</div></div><div className="flex justify-between items-end"><div><div className="text-[10px] text-slate-500">THREAT ANALYSIS</div><div className={`text-2xl font-bold ${deviceData.threat > 50 ? "text-red-500 animate-pulse" : "text-green-400"}`}>{deviceData.online ? `${deviceData.threat}/100` : "--"}</div></div>{deviceData.threat > 50 && <ShieldAlert className="w-8 h-8 text-red-500" />}{deviceData.threat <= 50 && <Shield className="w-8 h-8 text-green-500" />}</div></div>
            </div>
            <div className={`border p-4 ${threatLevel === 'CRITICAL' ? 'border-red-500 bg-red-900/20' : 'border-green-900 bg-green-950/5'}`}><h3 className="text-xs mb-2 flex items-center gap-2 opacity-70"><Eye className="w-4 h-4"/> ACTIVE_VISITORS</h3><div className={`text-6xl font-bold text-white ${blurClass}`}>{visitors}</div></div>
            <div className={`border p-4 ${threatLevel === 'CRITICAL' ? 'border-red-500 bg-red-900/20' : 'border-green-900 bg-green-950/5'}`}><h3 className="text-xs mb-2 flex items-center gap-2 opacity-70"><Activity className="w-4 h-4"/> CURRENT_OBJECTIVE</h3><textarea value={task} onChange={e => setTask(e.target.value)} className={`w-full bg-black border border-slate-800 p-3 text-xl text-white outline-none focus:border-green-500 h-24 resize-none ${blurClass}`}/></div>
        </div>
        <div className={`col-span-2 border p-4 bg-black relative overflow-hidden flex flex-col ${threatLevel === 'CRITICAL' ? 'border-red-500' : 'border-green-900'}`}><h3 className="text-xs mb-4 flex items-center gap-2 opacity-70"><Terminal className="w-4 h-4"/> DATA_INTERCEPT</h3><div className={`space-y-2 font-mono text-sm flex-1 overflow-y-auto custom-scrollbar relative z-10 ${blurClass}`}>{logs.map((log, i) => (<div key={i} className={`flex gap-4 border-b pb-1 ${log.actor_type === 'ATTACKER' ? 'text-red-500 border-red-900/50' : log.actor_type === 'ADMIN' ? 'text-yellow-500 border-yellow-900/30' : 'text-green-500 border-green-900/20'}`}><span className="opacity-50">{new Date(log.timestamp).toLocaleTimeString()}</span><span className="w-20 font-bold">{log.actor_type}</span><span className="w-32">{log.action}</span><span className="truncate flex-1 opacity-80">{log.details}</span></div>))}<div className="animate-pulse">_</div></div><div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)50%,rgba(0,0,0,0.25)50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" /></div>
      </div>
    </div>
  );
}
