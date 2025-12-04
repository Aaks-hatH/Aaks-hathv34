import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/base44Client';
import { Activity, Wifi, Terminal, Eye, Lock } from 'lucide-react';

export default function HUD() {
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState('');
  
  const [task, setTask] = useState('Monitoring Network Traffic');
  const [visitors, setVisitors] = useState(0);
  const [logs, setLogs] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [securityCheck, setSecurityCheck] = useState("CHECKING...");

  // 1. DEVICE & IP LOCK (Runs on Mount)
  useEffect(() => {
    const verifyDevice = async () => {
        // A. Check for Chromebook/Linux User Agent
        const ua = navigator.userAgent;
        const isChromebook = ua.includes("CrOS") || ua.includes("Linux");
        
        if (!isChromebook) {
            // RICKROLL INTRUDERS
            window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
            return;
        }

        // B. Check IP against Allowed List (Backend Call)
        try {
            const res = await fetch('/api/hud-access'); // New function we need to create
            if (res.ok) {
                setSecurityCheck("DEVICE_VERIFIED");
            } else {
                window.location.href = "/"; // Kick them out
            }
        } catch(e) {
            setSecurityCheck("CONNECTION_ERROR");
        }
    };
    verifyDevice();
  }, []);

  // ... (Rest of your existing HUD logic regarding Heartbeat/Logs stays the same) ...
  // I'll paste the Heartbeat logic here again to ensure it's integrated correctly with the lock.

  useEffect(() => {
    if (!auth) return;
    const sendHeartbeat = () => {
      fetch('/api/heartbeat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, task, status: true })
      });
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);
    const cleanup = () => navigator.sendBeacon('/api/heartbeat', JSON.stringify({ password, task, status: false }));
    window.addEventListener('beforeunload', cleanup);
    return () => { clearInterval(interval); window.removeEventListener('beforeunload', cleanup); };
  }, [auth, task]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    if(!auth) return;
    const presence = supabase.channel('online-users').on('presence', { event: 'sync' }, () => setVisitors(Object.keys(presence.presenceState()).length)).subscribe();
    const logSub = supabase.channel('hud-logs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (p) => setLogs(prev => [p.new, ...prev].slice(0, 5))).subscribe();
    return () => { clearInterval(timer); supabase.removeChannel(presence); supabase.removeChannel(logSub); };
  }, [auth]);

  if (securityCheck !== "DEVICE_VERIFIED") {
      return <div className="min-h-screen bg-black text-red-500 font-mono flex items-center justify-center text-2xl animate-pulse">{securityCheck}</div>;
  }

  if (!auth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-mono">
        <div className="w-full max-w-md border border-cyan-900/50 p-8 bg-slate-950 text-center">
          <h1 className="text-cyan-500 tracking-[0.5em] text-xl mb-8">HUD_LOGIN</h1>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-black border border-slate-800 p-3 text-cyan-400 text-center outline-none focus:border-cyan-500" autoFocus />
          <button onClick={() => setAuth(true)} className="w-full mt-4 bg-cyan-900/20 text-cyan-400 py-2 border border-cyan-900 hover:bg-cyan-900/40">INITIALIZE</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-6 overflow-hidden flex flex-col">
      <div className="flex justify-between items-end border-b border-green-900/50 pb-4 mb-6">
        <div>
            <h1 className="text-4xl font-bold text-white tracking-tighter">COMMAND_STATION</h1>
            <div className="flex items-center gap-2 text-xs mt-1 text-green-600">
                <Wifi className="w-3 h-3 animate-pulse" />
                <span>UPLINK_ESTABLISHED</span>
            </div>
        </div>
        <div className="text-right"><div className="text-5xl font-bold text-white">{currentTime.toLocaleTimeString([], {hour12: false})}</div></div>
      </div>
      <div className="grid grid-cols-3 gap-6 flex-1">
        <div className="col-span-1 space-y-6">
            <div className="border border-green-900 p-4 bg-green-950/5">
                <h3 className="text-xs text-green-700 mb-2 flex items-center gap-2"><Activity className="w-4 h-4"/> CURRENT_OBJECTIVE</h3>
                <textarea value={task} onChange={e => setTask(e.target.value)} className="w-full bg-black border border-green-900 p-3 text-xl text-white outline-none focus:border-green-500 h-32 resize-none"/>
                <div className="mt-2 text-[10px] text-green-800 text-right">UPDATES_PUBLIC_SITE_INSTANTLY</div>
            </div>
            <div className="border border-green-900 p-4 bg-green-950/5">
                <h3 className="text-xs text-green-700 mb-2 flex items-center gap-2"><Eye className="w-4 h-4"/> ACTIVE_VISITORS</h3>
                <div className="text-6xl font-bold text-white">{visitors}</div>
            </div>
        </div>
        <div className="col-span-2 border border-green-900 p-4 bg-black relative overflow-hidden">
            <h3 className="text-xs text-green-700 mb-4 flex items-center gap-2"><Terminal className="w-4 h-4"/> SYSTEM_STREAM</h3>
            <div className="space-y-2 font-mono text-sm">
                {logs.map((log, i) => (
                    <div key={i} className="flex gap-4 border-b border-green-900/20 pb-1"><span className="text-green-800">{new Date(log.timestamp).toLocaleTimeString()}</span><span className="text-cyan-600">{log.actor_type}</span><span className="text-white">{log.action}</span><span className="text-slate-500 truncate">{log.details}</span></div>
                ))}
            </div>
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)50%,rgba(0,0,0,0.25)50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
        </div>
      </div>
    </div>
  );
}
