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
  
  // Dashboard Data
  const [activeTab, setActiveTab] = useState('LIVE_TRAFFIC');
  const [messages, setMessages] = useState([]);
  const [visitors, setVisitors] = useState({});
  const [bannedIps, setBannedIps] = useState([]);
  const [maintenance, setMaintenance] = useState(false);
  
  // Command Inputs
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

    // 3. Get Lockdown Status
    supabase.from('system_config').select('value').eq('key', 'maintenance_mode').single()
      .then(({ data }) => setMaintenance(data?.value === 'true'));
  };

  // --- REALTIME LISTENERS ---
  useEffect(() => {
    if (!auth) return;

    // Listen for Database Changes
    const channel = supabase.channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guestbook' }, refreshAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banned_ips' }, refreshAll)
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
        // Show specific error for debugging
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
    setMaintenance(newState); // Optimistic UI update
    await fetch('/api/toggle-lockdown', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, key: 'maintenance_mode', value: String(newState) })
    });
  };

  const executeCommand = async (payload) => {
    // FIX: Append timestamp to force database update event
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
    if(!confirm(`UNBAN IP: ${ip}?`)) return;
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

        {/* TAB 1: LIVE TRAFFIC */}
        {activeTab === 'LIVE_TRAFFIC' && (
          <div className="space-y-4">
            <div className="text-xs text-green-500 mb-2 flex items-center gap-2">
              <Radio className="w-4 h-4 animate-pulse" /> SIGNAL_INTERCEPT
            </div>
            <div className="border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-500"><tr><th className="p-3">IP / LOC</th><th className="p-3">PATH</th><th className="p-3">DEVICE</th><th className="p-3 text-right">ACT</th></tr></thead>
                <tbody className="divide-y divide-slate-800">
                  {Object.values(visitors).map((v) => {
                    const user = v[0];
                    const isBanned = bannedIps.some(b => b.ip === user.ip);
                    return (
                      <tr key={user.id} className="hover:bg-slate-900/30">
                        <td className="p-3"><div className="text-cyan-500 font-bold mb-1">{user.ip || 'Hidden'}</div><div className="text-slate-600 flex items-center gap-1"><MapPin className="w-3 h-3"/> {user.geo || 'Unknown'}</div></td>
                        <td className="p-3 text-white">{user.path}</td>
                        <td className="p-3 text-slate-500 truncate max-w-[150px]">{user.ua}</td>
                        <td className="p-3 text-right">
                            {isBanned ? <span className="text-red-500 font-bold">BANNED</span> : 
                            <button onClick={() => banUser(user.ip)} className="text-red-500 border border-red-900 px-2 py-1 hover:bg-red-600 hover:text-white text-[10px]">[ BAN ]</button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {Object.keys(visitors).length === 0 && <div className="p-12 text-center text-slate-700 text-xs">NO_ACTIVE_SIGNALS_DETECTED</div>}
            </div>
          </div>
        )}

        {/* TAB 2: SECURITY LOGS */}
        {activeTab === 'SECURITY_LOGS' && (
            <div className="border border-slate-800 bg-slate-950">
                <div className="p-3 bg-red-950/20 text-red-500 text-xs font-bold border-b border-slate-800 flex items-center gap-2">
                    <Ban className="w-4 h-4"/> BLACKLISTED_TARGETS ({bannedIps.length})
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    {bannedIps.map(ban => (
                        <div key={ban.ip} className="flex justify-between items-center p-3 border-b border-slate-800/50 hover:bg-slate-900/50">
                            <div>
                                <div className="text-white font-mono text-sm">{ban.ip}</div>
                                <div className="text-[10px] text-slate-500">{new Date(ban.banned_at).toLocaleString()} - {ban.reason}</div>
                            </div>
                            <button onClick={() => unbanUser(ban.ip)} className="flex items-center gap-1 text-green-500 border border-green-900 px-2 py-1 text-[10px] hover:bg-green-900 hover:text-white">
                                <Unlock className="w-3 h-3" /> UNBAN
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* TAB 3: COMMANDS */}
        {activeTab === 'NETWORK_OPS' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-slate-800 p-6 bg-black">
                <h3 className="text-sm text-green-500 mb-4 border-b border-green-900/30 pb-2 flex items-center gap-2">
                    <TermIcon className="w-4 h-4"/> REMOTE_EXECUTION
                </h3>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <button onClick={() => executeCommand('RELOAD')} className="text-[10px] bg-slate-900 px-2 py-1 border border-slate-700 hover:text-white text-slate-300">Force Reload</button>
                        <button onClick={() => executeCommand('RICKROLL')} className="text-[10px] bg-slate-900 px-2 py-1 border border-slate-700 hover:text-white text-slate-300">Rickroll</button>
                    </div>
                    <div className="flex items-center bg-slate-900 border border-slate-800 p-2">
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
            </div>

            <div className="space-y-6">
                <div className={`border p-6 text-center ${maintenance ? 'border-red-500 bg-red-950/10' : 'border-slate-800'}`}>
                    <ShieldAlert className={`w-12 h-12 mx-auto mb-4 ${maintenance ? 'text-red-500 animate-pulse' : 'text-slate-600'}`} />
                    <button onClick={toggleMaintenance} className={`px-6 py-2 text-xs font-bold border ${maintenance ? 'bg-red-600 text-white border-red-600' : 'text-red-500 border-red-900'}`}>
                        {maintenance ? "DISENGAGE LOCKDOWN" : "INITIATE LOCKDOWN"}
                    </button>
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

        {/* TAB 4: MESSAGES */}
        {activeTab === 'DATABASE' && (
          <div className="grid gap-2">
              {messages.map(msg => (
                <div key={msg.id} className="bg-slate-900 p-3 flex justify-between items-center border border-slate-800">
                  <div><span className="text-cyan-500 text-xs font-bold mr-2">{msg.name}</span><span className="text-slate-400 text-sm">{msg.message}</span></div>
                  <button onClick={()=>handleDelete(msg.id)}><Trash2 className="w-4 h-4 text-slate-600 hover:text-red-500"/></button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
