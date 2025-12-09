import React, { useState, useEffect } from 'react';
import { base44, supabase } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { 
  Trash2, LogOut, ShieldAlert, Radio, Loader2, 
  Megaphone, RefreshCw, Ban, Terminal as TermIcon, 
  Globe, MapPin, Unlock, FileText, Activity 
} from 'lucide-react';

// --- LEAFLET MAP IMPORTS ---
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';

// --- CUSTOM MARKER SETUP (Prevents Broken Images) ---
const customMarkerIcon = new L.DivIcon({
  html: renderToStaticMarkup(<MapPin className="w-6 h-6 text-cyan-500 drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]" fill="currentColor" />),
  className: 'bg-transparent border-none',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24]
});

export default function Admin() {
  // --- AUTH STATE ---
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [turnstileToken, setTurnstileToken] = useState(''); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- ADAPTIVE SECURITY STATE (New) ---
  const [stepUpRequired, setStepUpRequired] = useState(false);
  const [stepUpCode, setStepUpCode] = useState('');
  
  // --- DASHBOARD DATA STATE ---
  const [activeTab, setActiveTab] = useState('LIVE_TRAFFIC');
  const [messages, setMessages] = useState([]);
  const [visitors, setVisitors] = useState({});
  const [bannedIps, setBannedIps] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [maintenance, setMaintenance] = useState(false);
  
  // --- COMMAND STATE ---
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [cmd, setCmd] = useState('');

  // ------------------------------------------------------------------
  // 1. DATA FETCHING (Secure Tunnel)
  // ------------------------------------------------------------------
  
  // Fetches sensitive data via Backend Proxy (Bypassing RLS)
  const refreshSecureData = async () => {
    if (!password) return; 

    try {
        // Fetch Bans
        const banRes = await fetch('/api/data_fetch', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password, table: 'banned_ips' })
        });
        const banData = await banRes.json();
        if (banData.data) setBannedIps(banData.data);

        // Fetch Logs
        const logRes = await fetch('/api/data_fetch', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password, table: 'audit_logs' })
        });
        const logData = await logRes.json();
        if (logData.data) setAuditLogs(logData.data);

    } catch (e) { console.error("Secure fetch failed", e); }
  };

  // Fetches public data directly
  const refreshPublicData = async () => {
    const msgData = await base44.entities.GuestbookMessage.list();
    setMessages(msgData);

    const { data } = await supabase.from('system_config').select('value').eq('key', 'maintenance_mode').single();
    if (data) setMaintenance(data.value === 'true');
  };

  // ------------------------------------------------------------------
  // 2. REALTIME LISTENERS
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!auth) return;

    // A. LIVE VISITORS (Using explicit join/leave for instant updates)
    const presenceChannel = supabase.channel('online-users');
    
    const updateVisitors = () => {
        const state = presenceChannel.presenceState();
        setVisitors({ ...state }); // Force React re-render with new object
    };

    presenceChannel
      .on('presence', { event: 'sync' }, updateVisitors)
      .on('presence', { event: 'join' }, updateVisitors)
      .on('presence', { event: 'leave' }, updateVisitors)
      .subscribe();

    // B. POLL SECURE DATA
    refreshPublicData();
    refreshSecureData();
    const interval = setInterval(refreshSecureData, 5000); // Poll every 5s for logs/bans

    return () => { 
        clearInterval(interval);
        supabase.removeChannel(presenceChannel); 
    };
  }, [auth]);

  // ------------------------------------------------------------------
  // 3. ACTIONS & HANDLERS
  // ------------------------------------------------------------------

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!turnstileToken) { setError("ANTI-BOT CHECK REQUIRED"); return; }
    
    setLoading(true); setError('');

    try {
      // Send credentials + potential step-up code
      const payload = { 
        password, 
        token: totp, 
        captcha: turnstileToken,
        stepUpCode: stepUpRequired ? stepUpCode : null 
      };

      const res = await fetch('/api/auth_handshake', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      // A. Check for Step-Up Requirement
      if (data.stepUp) {
          setStepUpRequired(true);
          setError("SUSPICIOUS ACTIVITY: Check secure channel for code.");
          setLoading(false);
          return;
      }

      // B. Success
      if (data.success) {
        setAuth(true);
      } else {
        // C. Failure
        setError(data.error || 'FAILED'); 
        if(data.error === 'PASSWORD_INCORRECT') setPassword('');
        if(data.error === '2FA_CODE_INVALID') setTotp('');
        if(data.error === 'INVALID_VERIFICATION_CODE') setStepUpCode('');
      }
    } catch (err) { setError('CONNECTION_ERROR'); } 
    finally { setLoading(false); }
  };

  const toggleMaintenance = async () => {
    const newState = !maintenance;
    setMaintenance(newState); 
    await fetch('/api/sys_config', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, key: 'maintenance_mode', value: String(newState) })
    });
  };

  const changeDefcon = async (level) => {
    await fetch('/api/sys_config', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, key: 'defcon_level', value: String(level) })
    });
  };

  const executeCommand = async (payload) => {
    const uniquePayload = `${payload}|${Date.now()}`;
    await fetch('/api/sys_config', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, key: 'system_command', value: uniquePayload })
    });
    setCmd('');
  };

  const banUser = async (ip) => {
    if(!confirm(`BAN IP: ${ip}?`)) return;
    await fetch('/api/net_block', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, ip, reason: "Admin Manual Ban" })
    });
    alert(`Target ${ip} has been blacklisted.`);
    setTimeout(refreshSecureData, 1000);
  };

  const unbanUser = async (ip) => {
    await fetch('/api/net_release', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, ip })
    });
    setTimeout(refreshSecureData, 1000);
  };

  const handleDelete = async (id) => {
    if(!confirm("DELETE RECORD?")) return;
    setMessages(prev => prev.filter(m => m.id !== id));
    await fetch('/api/data_purge', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, id })
    });
  };

  const sendBroadcast = async () => {
    if(!broadcastMsg) return;
    await fetch('/api/sys_config', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, key: 'system_broadcast', value: broadcastMsg })
    });
    setBroadcastMsg('');
    alert("Broadcast Transmitted");
  };

  // ------------------------------------------------------------------
  // 4. LOGIN VIEW (With Adaptive UI)
  // ------------------------------------------------------------------
  if (!auth) {
    return (
      <div className="min-h-screen bg-black text-slate-400 font-mono p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-md border border-slate-800 p-8 bg-slate-950 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="border-b border-slate-800 pb-4 mb-6 flex items-center gap-2">
            <ShieldAlert className="text-red-500 w-5 h-5 animate-pulse" />
            <h1 className="text-slate-100 tracking-widest text-sm">SECURE_GATEWAY</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* STANDARD LOGIN FIELDS */}
            {!stepUpRequired && (
              <>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-600">Identification</label>
                    <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-black border border-slate-700 p-2 text-white focus:border-cyan-500 outline-none" placeholder="PASSWORD" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-600">Auth Token</label>
                    <input type="text" value={totp} onChange={e=>setTotp(e.target.value)} maxLength={6} className="w-full bg-black border border-slate-700 p-2 text-white tracking-widest focus:border-cyan-500 outline-none" placeholder="000000" />
                </div>
              </>
            )}

            {/* STEP-UP CHALLENGE FIELD (SUSPICIOUS ACTIVITY) */}
            {stepUpRequired && (
                <div className="space-y-1 animate-in slide-in-from-right">
                    <label className="text-[10px] uppercase text-yellow-500 font-bold">Verification Code Required</label>
                    <input 
                        type="text" 
                        value={stepUpCode} 
                        onChange={e=>setStepUpCode(e.target.value)} 
                        maxLength={6} 
                        className="w-full bg-yellow-950/20 border border-yellow-600 p-2 text-yellow-400 tracking-widest focus:border-yellow-400 outline-none text-center text-xl font-bold" 
                        placeholder="______" 
                        autoFocus
                    />
                    <p className="text-[10px] text-slate-500 text-center pt-2">Code sent to Administrator via Secure Line</p>
                </div>
            )}

            <div className="flex justify-center my-2">
                <Turnstile siteKey="0x4AAAAAACFDgNVZZRDkdRXG" onSuccess={(token) => setTurnstileToken(token)} options={{ theme: 'dark' }} />
            </div>

            {error && <div className="text-red-500 text-xs bg-red-950/20 p-2 border-l-2 border-red-500 font-bold">{error}</div>}
            
            <button type="submit" disabled={loading} className={`w-full py-2 text-xs font-bold transition-colors ${stepUpRequired ? 'bg-yellow-600 text-black hover:bg-yellow-500' : 'bg-slate-100 text-black hover:bg-cyan-500 hover:text-white'}`}>
              {loading ? "PROCESSING..." : stepUpRequired ? "VERIFY IDENTITY" : "ACCESS"}
            </button>
          </form>
        </div>
        <Link to="/" className="mt-8 text-xs text-slate-600 hover:text-slate-400">[ ABORT_CONNECTION ]</Link>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 5. DASHBOARD VIEW (With Map)
  // ------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-black text-slate-300 font-mono p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
          <div><h1 className="text-xl text-white tracking-widest">OVERWATCH_CONSOLE</h1><p className="text-xs text-cyan-600">ACTIVE_AGENTS: {Object.keys(visitors).length}</p></div>
          <button onClick={() => setAuth(false)} className="text-xs text-red-500 border border-red-900 px-3 py-1 hover:bg-red-900 hover:text-white transition-colors">[ DISCONNECT ]</button>
        </header>

        <div className="grid grid-cols-5 gap-1 mb-8">
          {['LIVE_TRAFFIC', 'SECURITY_LOGS', 'NETWORK_OPS', 'DATABASE', 'AUDIT_LOGS'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`py-2 text-[10px] md:text-xs font-bold transition-all ${activeTab===tab ? 'bg-slate-100 text-black' : 'bg-slate-900 hover:bg-slate-800 text-slate-500'}`}>{tab}</button>
          ))}
        </div>

        {/* TAB 1: LIVE TRAFFIC (MAP + TABLE) */}
        {activeTab === 'LIVE_TRAFFIC' && (
          <div className="space-y-6">
            
            {/* MAP COMPONENT */}
            <div className="border border-slate-800 bg-slate-950 rounded overflow-hidden relative z-0">
               <div className="absolute top-2 left-2 z-[999] bg-slate-900/80 p-2 border border-slate-700 text-xs text-green-400 rounded">
                 WAR_ROOM VIEW
               </div>
               {/* Explicit height prevents collapse */}
               <MapContainer 
                 key={activeTab} 
                 center={[20, 0]} 
                 zoom={2} 
                 style={{ height: '400px', width: '100%', background: '#020617' }}
               >
                  <TileLayer 
                    attribution='&copy; CARTO' 
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                  />
                  {Object.values(visitors).map((v) => {
                    const u = v[0];
                    if (!u.coords || typeof u.coords !== 'string' || !u.coords.includes(',')) return null;
                    const [lat, lon] = u.coords.split(',').map(Number);
                    
                    return (
                      <Marker key={u.id} position={[lat, lon]} icon={customMarkerIcon}>
                         <Popup className="font-mono text-xs text-black">
                           <div className="font-bold">{u.ip}</div>
                           <div>{u.geo}</div>
                           <div className="text-[10px] text-slate-500">{u.path}</div>
                         </Popup>
                      </Marker>
                    );
                  })}
               </MapContainer>
            </div>

            {/* VISITOR TABLE */}
            <div className="border border-slate-800 bg-slate-950 min-h-[300px]">
              <div className="p-2 border-b border-slate-800 bg-slate-900/50 text-xs text-slate-500 flex justify-between">
                  <span>SIGNAL_INTERCEPT</span>
                  <Activity className="w-3 h-3 text-green-500 animate-pulse" />
              </div>
              <table className="w-full text-left text-xs text-slate-400">
                <thead><tr className="border-b border-slate-800"><th className="p-3">IP / LOC</th><th className="p-3">PATH</th><th className="p-3">DEVICE</th><th className="p-3 text-right">ACT</th></tr></thead>
                <tbody>
                  {Object.values(visitors).map(v => {
                      const u = v[0];
                      const isBanned = bannedIps.some(b => b.ip === u.ip);
                      return (
                          <tr key={u.id} className="hover:bg-slate-900/50 transition-colors border-b border-slate-900">
                              <td className="p-3"><div className="text-cyan-500 font-bold mb-1">{u.ip || 'Hidden'}</div><div className="text-slate-600 flex items-center gap-1"><MapPin className="w-3 h-3"/> {u.geo || 'Unknown'}</div></td>
                              <td className="p-3 text-white">{u.path}</td>
                              <td className="p-3 text-slate-500 truncate max-w-[150px]">{u.ua}</td>
                              <td className="p-3 text-right">
                                  {isBanned ? <span className="text-red-500 font-bold text-[10px]">BANNED</span> : 
                                  <button onClick={() => banUser(u.ip)} className="text-red-500 border border-red-900 px-2 py-1 hover:bg-red-600 hover:text-white text-[10px] transition-colors">[ BAN ]</button>}
                              </td>
                          </tr>
                      );
                  })}
                </tbody>
              </table>
              {Object.keys(visitors).length === 0 && <div className="p-12 text-center text-slate-700 text-xs">NO_ACTIVE_SIGNALS</div>}
            </div>
          </div>
        )}

        {/* TAB 2: SECURITY LOGS (BANS) */}
        {activeTab === 'SECURITY_LOGS' && (
            <div className="border border-slate-800 bg-slate-950 h-[500px] overflow-y-auto custom-scrollbar">
                <div className="p-3 bg-red-950/20 text-red-500 text-xs font-bold border-b border-slate-800 flex items-center gap-2 sticky top-0 backdrop-blur-md">
                    <Ban className="w-4 h-4"/> BLACKLISTED_TARGETS ({bannedIps.length})
                </div>
                {bannedIps.map(ban => (
                    <div key={ban.ip} className="flex justify-between items-center p-3 border-b border-slate-800/50 hover:bg-slate-900/30">
                        <div className="text-xs">
                            <div className="text-white font-mono text-sm">{ban.ip}</div>
                            <div className="text-[10px] text-slate-500">{new Date(ban.banned_at).toLocaleString()}</div>
                            <div className="text-[10px] text-red-400">{ban.reason}</div>
                        </div>
                        <button onClick={() => unbanUser(ban.ip)} className="flex items-center gap-1 text-green-500 border border-green-900 px-3 py-1 text-[10px] hover:bg-green-900 hover:text-white transition-colors">
                            <Unlock className="w-3 h-3" /> UNBAN
                        </button>
                    </div>
                ))}
            </div>
        )}

        {/* TAB 3: NETWORK OPS (COMMANDS) */}
        {activeTab === 'NETWORK_OPS' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-slate-800 p-6 bg-slate-950">
                <h3 className="text-sm text-green-500 mb-4 border-b border-green-900/30 pb-2 flex items-center gap-2">
                    <TermIcon className="w-4 h-4"/> REMOTE_EXECUTION
                </h3>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <button onClick={() => executeCommand('RELOAD')} className="flex-1 text-[10px] bg-slate-900 px-2 py-2 border border-slate-700 hover:text-white text-slate-300 transition-colors">Force Reload</button>
                        <button onClick={() => executeCommand('RICKROLL')} className="flex-1 text-[10px] bg-slate-900 px-2 py-2 border border-slate-700 hover:text-white text-slate-300 transition-colors">Rickroll</button>
                    </div>
                    <div className="flex items-center bg-black border border-slate-800 p-2">
                        <span className="text-green-500 mr-2">{">"}</span>
                        <input 
                            value={cmd} 
                            onChange={e => setCmd(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && executeCommand(`ALERT:${cmd}`)}
                            className="bg-transparent border-none outline-none text-white text-xs w-full font-mono"
                            placeholder="Type alert..." 
                        />
                    </div>
                </div>

                <div className="mt-8 border-t border-slate-800 pt-6">
                    <h3 className="text-sm text-white mb-4">DEFCON LEVEL</h3>
                    <div className="flex gap-1">
                        {[5, 4, 3, 2, 1].map(level => (
                            <button key={level} onClick={() => changeDefcon(level)} className={`flex-1 py-2 text-xs font-bold border transition-colors ${level === 1 ? 'border-red-600 text-red-600 hover:bg-red-950' : 'border-slate-700 text-slate-500 hover:bg-slate-800 hover:text-white'}`}>{level}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className={`border p-6 text-center transition-colors ${maintenance ? 'border-red-500 bg-red-950/10' : 'border-slate-800 bg-slate-950'}`}>
                    <ShieldAlert className={`w-12 h-12 mx-auto mb-4 ${maintenance ? 'text-red-500 animate-pulse' : 'text-slate-600'}`} />
                    <button onClick={toggleMaintenance} className={`px-6 py-3 text-xs font-bold tracking-widest border transition-all ${maintenance ? 'bg-red-600 text-white border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'text-red-500 border-red-900 hover:bg-red-950'}`}>
                        {maintenance ? "DISENGAGE LOCKDOWN" : "INITIATE LOCKDOWN"}
                    </button>
                </div>
                
                <div className="border border-slate-800 p-4 bg-slate-950">
                    <div className="text-xs text-slate-400 mb-2 flex items-center gap-2"><Megaphone className="w-3 h-3"/> SYSTEM_BROADCAST</div>
                    <div className="flex gap-2">
                        <input value={broadcastMsg} onChange={e=>setBroadcastMsg(e.target.value)} className="flex-1 bg-black border border-slate-700 p-2 text-white text-xs outline-none focus:border-cyan-500" placeholder="Message..." />
                        <button onClick={sendBroadcast} className="bg-cyan-900/20 border border-cyan-900 text-cyan-500 text-xs px-4 hover:bg-cyan-900/40 transition-colors">SEND</button>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* TAB 4: DATABASE (GUESTBOOK) */}
        {activeTab === 'DATABASE' && (
            <div className="grid gap-2">
                {messages.map(m=><div key={m.id} className="bg-slate-900 p-3 flex justify-between items-center border border-slate-800 hover:border-slate-600 transition-colors"><div><span className="text-cyan-500 text-xs font-bold mr-2">{m.name}</span><span className="text-slate-400 text-sm">{m.message}</span></div><button onClick={()=>handleDelete(m.id)}><Trash2 className="w-4 h-4 text-slate-600 hover:text-red-500 transition-colors"/></button></div>)}
            </div>
        )}

        {/* TAB 5: AUDIT LOGS (SECURE) */}
        {activeTab === 'AUDIT_LOGS' && (
            <div className="border border-slate-800 bg-black h-[500px] overflow-y-auto custom-scrollbar font-mono text-[10px]">
                <table className="w-full text-left">
                    <thead className="bg-slate-900 text-slate-500 sticky top-0"><tr><th className="p-2">TIME</th><th className="p-2">ACTOR</th><th className="p-2">ACTION</th><th className="p-2">DETAILS</th></tr></thead>
                    <tbody className="divide-y divide-slate-800">
                        {auditLogs.map(l => (
                            <tr key={l.id} className="hover:bg-slate-900/30">
                                <td className="p-2 text-slate-600">{new Date(l.timestamp).toLocaleTimeString()}</td>
                                <td className={`p-2 font-bold ${l.actor_type==='ADMIN'?'text-yellow-500':l.actor_type==='ATTACKER'?'text-red-500':'text-green-500'}`}>{l.actor_type}</td>
                                <td className="p-2 text-white">{l.action}</td>
                                <td className="p-2 text-slate-500 truncate max-w-[200px]" title={l.details}>{l.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
}
