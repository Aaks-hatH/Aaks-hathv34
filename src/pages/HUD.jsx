import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/api/base44Client';
import { Activity, Wifi, Terminal, Eye, Lock, Zap, ShieldAlert, Volume2 } from 'lucide-react';

// SOUNDS (Bleeps and Alarms)
const ALARM_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"; // Sci-fi Alarm
const BLEEP_URL = "https://assets.mixkit.co/active_storage/sfx/2346/2346-preview.mp3"; // Data chirp

export default function HUD() {
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Dashboard State
  const [task, setTask] = useState('System Idle');
  const [visitors, setVisitors] = useState(0);
  const [logs, setLogs] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Security State
  const [threatLevel, setThreatLevel] = useState('NORMAL'); // NORMAL | WARNING | CRITICAL
  const [verificationStatus, setVerificationStatus] = useState('ANALYZING_DEVICE...');

  // Refs for Audio
  const alarmAudio = useRef(new Audio(ALARM_URL));
  const bleepAudio = useRef(new Audio(BLEEP_URL));

  // ---------------------------------------------------------
  // 1. DEVICE INTEGRITY CHECK (The Rickroll Protection)
  // ---------------------------------------------------------
  useEffect(() => {
    const checkAccess = async () => {
        // A. Check if Chromebook/Linux (Basic filter)
        const ua = navigator.userAgent;
        const isSafeDevice = ua.includes("CrOS") || ua.includes("Linux"); 
      
        if (!isSafeDevice) {
            window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
            return;
        }

        // B. Check IP (Server Side Validation)
        try {
            const res = await fetch('/api/hud-access'); // Uses the IP check function we made
            if (res.ok) {
                setVerificationStatus("ACCESS_GRANTED");
            } else {
                setVerificationStatus("UNAUTHORIZED_IP");
                setTimeout(() => {
                    window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
                }, 2000);
            }
        } catch(e) {
            setVerificationStatus("NET_ERROR");
        }
    };
    checkAccess();
  }, []);

  // ---------------------------------------------------------
  // 2. WAKE LOCK (Prevent Sleep)
  // ---------------------------------------------------------
  useEffect(() => {
    if (!auth) return;
    
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('Wake Lock Active: Screen will not sleep.');
        }
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    };
    
    requestWakeLock();
    
    // Re-acquire lock if visibility changes (e.g., switching tabs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [auth]);

  // ---------------------------------------------------------
  // 3. IDLE DETECTION (Auto-update "What I'm doing")
  // ---------------------------------------------------------
  useEffect(() => {
    if(!auth) return;
    let idleTimer;
    const resetIdle = () => {
        // If we were AFK, switch back to Active
        if(task.includes("(AFK)")) {
            setTask(prev => prev.replace(" (AFK)", ""));
        }
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            // If no mouse move for 5 mins, mark AFK
            setTask(prev => prev.includes("(AFK)") ? prev : prev + " (AFK)");
        }, 300000); // 5 minutes
    };
    
    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    return () => {
        window.removeEventListener('mousemove', resetIdle);
        window.removeEventListener('keydown', resetIdle);
    };
  }, [auth, task]);

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

    // Logs & Threat Detection
    const logSub = supabase.channel('hud-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (p) => {
        const newLog = p.new;
        setLogs(prev => [newLog, ...prev].slice(0, 20));
        
        // THREAT ANALYSIS
        if (newLog.actor_type === 'ATTACKER' || newLog.action.includes('HONEYPOT') || newLog.action.includes('BAN')) {
            setThreatLevel('CRITICAL');
            alarmAudio.current.play().catch(()=>{});
            // Reset threat level after 5 seconds
            setTimeout(() => setThreatLevel('NORMAL'), 5000);
        } else {
            // Normal traffic beep
            bleepAudio.current.play().catch(()=>{});
        }
      })
      .subscribe();

    return () => { 
        clearInterval(timer); clearInterval(hbInt); 
        supabase.removeChannel(presence); supabase.removeChannel(logSub); 
    };
  }, [auth, task]); // Updates heartbeat if task changes

  // ---------------------------------------------------------
  // LOGIN UI
  // ---------------------------------------------------------
  if (verificationStatus !== "ACCESS_GRANTED") {
      return <div className="min-h-screen bg-black text-red-600 font-mono flex items-center justify-center text-xl animate-pulse">{verificationStatus}</div>;
  }

  if (!auth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-mono">
        <div className="w-full max-w-md border border-cyan-900/50 p-8 bg-slate-950 text-center">
          <Lock className="w-12 h-12 text-cyan-500 mx-auto mb-4" />
          <h1 className="text-cyan-500 tracking-[0.5em] text-xl mb-8">HUD_LOGIN</h1>
          <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              const res = await fetch('/api/heartbeat', { method: 'POST', body: JSON.stringify({ password, task, status: true }) });
              setLoading(false);
              if(res.ok) setAuth(true);
              else alert("INVALID AUTH");
          }}>
            <input 
                type="password" 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                className="w-full bg-black border border-slate-800 p-3 text-cyan-400 text-center outline-none focus:border-cyan-500" 
                autoFocus 
                placeholder="PASSWORD"
            />
            <button type="submit" disabled={loading} className="w-full mt-4 bg-cyan-900/20 text-cyan-400 py-2 border border-cyan-900 hover:bg-cyan-900/40">
                {loading ? "VERIFYING..." : "INITIALIZE SYSTEM"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // MAIN HUD UI
  // ---------------------------------------------------------
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
                <div className="mt-2 text-[10px] opacity-50 text-right">AUTO-AFK ENABLED (5 MIN)</div>
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
