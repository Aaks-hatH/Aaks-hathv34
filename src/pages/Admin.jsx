import React, { useState, useEffect } from 'react';
import { base44, supabase } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { 
  Trash2, LogOut, ShieldAlert, Radio, Loader2, 
  Megaphone, RefreshCw, Ban, Terminal as TermIcon, 
  Globe, MapPin, Unlock 
} from 'lucide-react';

export default function Admin() {
  // Auth State
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Dashboard State
  const [activeTab, setActiveTab] = useState('LIVE_TRAFFIC');
  const [messages, setMessages] = useState([]);
  const [visitors, setVisitors] = useState({});
  const [bannedIps, setBannedIps] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [maintenance, setMaintenance] = useState(false);
  
  // Inputs
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [cmd, setCmd] = useState('');

  // --- DATA SYNC ---
  const refreshAll = async () => {
    // 1. Get Messages
    const msgData = await base44.entities.GuestbookMessage.list();
    setMessages(msgData);
    
    // 2. Get Bans
    const { data: bans } = await supabase.from('banned_ips').select('*').order('banned_at', { ascending: false });
    if (bans) setBannedIps(bans);

    // 3. Get Logs
    const { data: logs } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(50);
    if (logs) setAuditLogs(logs);

    // 4. Get Lockdown Status
    supabase.from('system_config').select('value').eq('key', 'maintenance_mode').single()
      .then(({ data }) => setMaintenance(data?.value === 'true'));
  };

  // --- REALTIME LISTENERS ---
  useEffect(() => {
    if (!auth) return;

    // Listen for Database Changes
    const channel = supabase.channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public' }, refreshAll)
      .subscribe();

    // Listen for "Spy" Presence (Live Visitors)
    const presenceSub = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => setVisitors(presenceSub.presenceState()))
      .subscribe();

    refreshAll();

    return () => { supabase.removeChannel(channel); supabase.removeChannel(presenceSub); };
  }, [auth]);

  // --- LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, token: totp })
      });
      const data = await res.json();
      
      if (data.success) {
        setAuth(true);
        setError('');
      } else {
        setError(data.error || 'FAILED'); 
        if(data.error === 'PASSWORD_INCORRECT') setPassword('');
        if(data.error === '2FA_CODE_INVALID') setTotp('');
      }
    } catch (err) { setError('CONNECTION_ERROR'); } 
    finally { setLoading(false); }
  };

  // --- COMMANDS ---

  const toggleMaintenance = async () => {
    const newState = !maintenance;
    setMaintenance(newState); 
    await fetch('/api/toggle-lockdown', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, key: 'maintenance_mode', value: String(newState) })
    });
  };

  const changeDefcon = async (level) => {
    await fetch('/api/toggle-lockdown', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, key: 'defcon_level', value: String(level) })
    });
  };

  const executeCommand = async (payload) => {
    const uniquePayload = `${payload}|${Date.now()}`;
    await fetch('/api/toggle-lockdown', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, key: 'system_command', value: uniquePayload })
    });
    setCmd('');
  };

  const banUser = async (ip) => {
    if(!confirm(`BAN IP: ${ip}?`)) return;
    await fetch('/api/ban-target', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, ip, reason: "Admin Manual Ban" })
    });
  };

  const unbanUser = async (ip) => {
    await fetch('/api/unban-target', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, ip })
    });
  };

  const handleDelete = async (id) => {
    if(!confirm("DELETE RECORD?")) return;
    await fetch('/api/delete-message', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, id })
    });
  };

  const sendBroadcast = async () => {
    if(!broadcastMsg) return;
    await fetch('/api/toggle-lockdown', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, key: 'system_broadcast', value: broadcastMsg })
    });
    setBroadcastMsg('');
    alert("Broadcast Transmitted");
  };

  // --- LOGIN UI ---
  if (!auth) {
    return (
      <div className="min-h-screen bg-black text-slate-400 font-mono p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-md border border-slate-800 p-8 bg-slate-950">
          <div className="border-b border-slate-800 pb-4 mb-6 flex items-center gap-2">
            <ShieldAlert className="text-red-500 w-5 h-5 animate-pulse" />
            <h1 className="text-slate-100 tracking-widest text-sm">SECURE_GATEWAY</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-black border border-slate-700 p-2 text-white focus:border-cyan-500 outline-none" placeholder="PASSWORD" />
            <input type="text" value={totp} onChange={e=>setTotp(e.target.value)} maxLength={6} className="w-full bg-black border border-slate-700 p-2 text-white tracking-widest focus:border-cyan-500 outline-none" placeholder="2FA CODE" />
            {error && <div className="text-red-500 text-xs bg-red-950/20 p-2 border-l-2 border-red-500">ERROR: {error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-slate-100 text-black py-2 text-xs font-bold hover:bg-cyan-500 hover:text-white transition-colors">
              {loading ? "HANDSHAKING..." : "ACCESS"}
            </button>
          </form>
        </div>
        <Link to="/" className="mt-8 text-xs text-slate-600 hover:text-slate-400">[ ABORT_CONNECTION ]</Link>
      </div>
    );
  }

  // --- DASHBOARD UI ---
  return (
    <div className="min-h-screen bg-black text-slate-300 font-mono p-6">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-xl text-white tracking-widest">OVERWATCH_CONSOLE</h1>
            <p className="text-xs text-cyan-600">ACTIVE_AGENTS: {Object.keys(visitors).length}</p>
          </div>
          <button onClick={() => setAuth(false)} className="text-xs text-red-500 border border-red-900 px-3 py-1 hover:bg-red-900 hover:text-white">[ DISCONNECT ]</button>
        </header>

        <div className="grid grid-cols-4 gap-1 mb-8">
          {['LIVE_TRAFFIC', 'SECURITY_LOGS', 'NETWORK_OPS', 'DATABASE'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`py-2 text-xs font-bold ${activeTab===tab ? 'bg-slate-100 text-black' : 'bg-slate-900 hover:bg-slate-800'}`}>{tab}</button>
          ))}
        </div>
        
        {/* LIVE TRAFFIC */}
        {activeTab === 'LIVE_TRAFFIC' && (
          <div className="border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-400">
              <thead><tr><th className="p-3">IP</th><th className="p-3">PATH</th><th className="p-3">ACT</th></tr></thead>
              <tbody>
                {Object.values(visitors).map(v => {
                    const u = v[0];
                    const isBanned = bannedIps.some(b => b.ip === u.ip);
                    return <tr key={u.id} className="hover:bg-slate-900"><td className="p-3 text-cyan-500">{u.ip}<div className="text-slate-600">{u.geo}</div></td><td className="p-3">{u.path}</td><td className="p-3 text-right">{!isBanned && <button onClick={()=>banUser(u.ip)} className="text-red-500 border border-red-900 px-2 hover:bg-red-900 hover:text-white">BAN</button>}</td></tr>
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* SECURITY LOGS */}
        {activeTab === 'SECURITY_LOGS' && (
            <div className="border border-slate-800 bg-slate-950 h-[400px] overflow-y-auto">
                {bannedIps.map(ban => (
                    <div key={ban.ip} className="flex justify-between items-center p-3 border-b border-slate-800/50">
                        <div className="text-xs"><div className="text-red-500">{ban.ip}</div><div className="text-slate-600">{ban.reason}</div></div>
                        <button onClick={() => unbanUser(ban.ip)} className="text-green-500 border border-green-900 px-2 text-[10px] hover:bg-green-900 hover:text-white">UNBAN</button>
                    </div>
                ))}
                <div className="border-t border-slate-800 mt-4">
                     {auditLogs.map(l => (
                        <div key={l.id} className="p-2 border-b border-slate-800/30 text-[10px] flex justify-between">
                            <span className="text-slate-500">{new Date(l.timestamp).toLocaleTimeString()}</span>
                            <span className={l.actor_type==='ADMIN'?'text-red-400':'text-green-400'}>{l.action}</span>
                            <span className="text-slate-400 truncate w-1/2 text-right">{l.details}</span>
                        </div>
                     ))}
                </div>
            </div>
        )}

        {/* NETWORK OPS */}
        {activeTab === 'NETWORK_OPS' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-slate-800 p-6 bg-black space-y-4">
                <h3 className="text-green-500 text-sm flex items-center gap-2"><TermIcon className="w-4 h-4"/> COMMAND_LINE</h3>
                <div className="flex gap-2"><button onClick={()=>executeCommand('RELOAD')} className="text-xs bg-slate-900 border border-slate-700 px-3 py-1 hover:text-white">RELOAD ALL</button><button onClick={()=>executeCommand('RICKROLL')} className="text-xs bg-slate-900 border border-slate-700 px-3 py-1 hover:text-white">RICKROLL</button></div>
                <input value={cmd} onChange={e=>setCmd(e.target.value)} onKeyDown={e=>e.key==='Enter'&&executeCommand(`ALERT:${cmd}`)} className="w-full bg-slate-900 border-none text-white text-xs p-2 font-mono" placeholder="ALERT:Message..." />
            </div>
            <div className="space-y-6">
                <div className={`border p-6 text-center ${maintenance ? 'border-red-500 bg-red-950/10' : 'border-slate-800'}`}>
                    <ShieldAlert className={`w-12 h-12 mx-auto mb-4 ${maintenance ? 'text-red-500 animate-pulse' : 'text-slate-600'}`} />
                    <button onClick={toggleMaintenance} className={`px-6 py-2 text-xs font-bold border ${maintenance ? 'bg-red-600 text-white' : 'text-red-500 border-red-900'}`}>{maintenance?"DISENGAGE":"LOCKDOWN"}</button>
                </div>
                
                {/* DEFCON CONTROL */}
                <div className="border border-slate-800 p-6 bg-black">
                    <h3 className="text-sm text-white mb-4 border-b border-slate-800 pb-2">THREAT_LEVEL_INDICATOR</h3>
                    <div className="flex gap-2">
                        {[5, 4, 3, 2, 1].map(level => (
                            <button key={level} onClick={() => changeDefcon(level)} className={`flex-1 py-2 text-xs font-bold border ${level === 1 ? 'border-red-600 text-red-600 hover:bg-red-950' : 'border-slate-700 text-slate-500 hover:text-white'}`}>{level}</button>
                        ))}
                    </div>
                </div>
                
                <div className="border border-slate-800 p-4">
                    <div className="text-xs text-slate-400 mb-2 flex items-center gap-2"><Megaphone className="w-3 h-3"/> SYSTEM_BROADCAST</div>
                    <div className="flex gap-2">
                        <input value={broadcastMsg} onChange={e=>setBroadcastMsg(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 p-2 text-white text-xs" placeholder="Message..." />
                        <button onClick={sendBroadcast} className="bg-cyan-900/20 border border-cyan-900 text-cyan-500 text-xs px-3">SEND</button>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* DATABASE */}
        {activeTab === 'DATABASE' && (
            <div className="grid gap-2">
                {messages.map(m=><div key={m.id} className="bg-slate-900 p-3 flex justify-between border border-slate-800"><div><span className="text-cyan-500 text-xs font-bold mr-2">{m.name}</span><span className="text-slate-400 text-sm">{m.message}</span></div><button onClick={()=>handleDelete(m.id)}><Trash2 className="w-4 h-4 text-red-500"/></button></div>)}
            </div>
        )}
      </div>
    </div>
  );
}
