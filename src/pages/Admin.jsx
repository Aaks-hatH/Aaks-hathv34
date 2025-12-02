import React, { useState, useEffect } from 'react';
import { base44, supabase } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { 
  Trash2, LogOut, ShieldAlert, Radio, Loader2, 
  Megaphone, RefreshCw, Ban, Terminal as TermIcon, Globe, MapPin 
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
  const [maintenance, setMaintenance] = useState(false);
  
  // Inputs
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [cmd, setCmd] = useState('');

  // 1. INITIAL FETCH
  const fetchMessages = async () => {
    const data = await base44.entities.GuestbookMessage.list();
    setMessages(data);
  };

  // 2. REALTIME LISTENERS
  useEffect(() => {
    if (!auth) return;
    
    // Get initial maintenance status
    supabase.from('system_config').select('value').eq('key', 'maintenance_mode').single()
      .then(({ data }) => setMaintenance(data?.value === 'true'));

    // Listen for Guestbook Updates
    const msgSub = supabase
      .channel('admin-guestbook')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'guestbook' }, (payload) => {
        setMessages((prev) => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'guestbook' }, (payload) => {
        setMessages((prev) => prev.filter(msg => msg.id !== payload.old.id));
      })
      .subscribe();

    // Listen for "Spy" Presence
    const presenceSub = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        setVisitors(presenceSub.presenceState());
      })
      .subscribe();

    fetchMessages();

    return () => { supabase.removeChannel(msgSub); supabase.removeChannel(presenceSub); };
  }, [auth]);

  // --- AUTH ACTION ---
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
      if (data.success) setAuth(true);
      else {
        setError(data.error || 'FAILED');
        setPassword('');
        setTotp('');
      }
    } catch (err) { setError('CONNECTION_ERROR'); } 
    finally { setLoading(false); }
  };

  // --- DASHBOARD ACTIONS ---

  const toggleMaintenance = async () => {
    const newState = !maintenance;
    setMaintenance(newState); // Optimistic update
    await fetch('/api/toggle-lockdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, key: 'maintenance_mode', value: String(newState) })
    });
  };

  const sendBroadcast = async () => {
    if(!broadcastMsg) return;
    await fetch('/api/toggle-lockdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, key: 'system_broadcast', value: broadcastMsg })
    });
    setBroadcastMsg('');
    alert("Broadcast Transmitted");
  };

  const executeCommand = async (payload) => {
    await fetch('/api/toggle-lockdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, key: 'system_command', value: payload })
    });
    setCmd('');
  };

  const banUser = async (ip) => {
    if(!confirm(`PERMANENTLY BAN IP: ${ip}?`)) return;
    await fetch('/api/ban-target', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, ip, reason: "Admin Manual Ban" })
    });
    alert(`Target ${ip} has been blacklisted.`);
  };

  const handleDelete = async (id) => {
    if(!confirm("DELETE RECORD?")) return;
    setMessages(prev => prev.filter(m => m.id !== id));
    await fetch('/api/delete-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, id })
    });
  };

  // --- LOGIN VIEW ---
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
            <input type="text" value={totp} onChange={e=>setTotp(e.target.value)} maxLength={6} className="w-full bg-black border border-slate-700 p-2 text-white tracking-widest focus:border-cyan-500 outline-none" placeholder="2FA TOKEN" />
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

  // --- MAIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-black text-slate-300 font-mono p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-xl text-white tracking-widest">OVERWATCH_CONSOLE</h1>
            <p className="text-xs text-cyan-600">ACTIVE_AGENTS: {Object.keys(visitors).length}</p>
          </div>
          <button onClick={() => setAuth(false)} className="text-xs text-red-500 hover:text-white border border-red-900 px-3 py-1 hover:bg-red-900">[ DISCONNECT ]</button>
        </header>

        {/* TABS */}
        <div className="grid grid-cols-3 gap-1 mb-8">
          {['LIVE_TRAFFIC', 'NETWORK_OPS', 'DATABASE'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`py-2 text-xs font-bold ${activeTab===tab ? 'bg-slate-100 text-black' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}>{tab}</button>
          ))}
        </div>

        {/* TAB 1: LIVE TRAFFIC (SPY MODE) */}
        {activeTab === 'LIVE_TRAFFIC' && (
          <div className="space-y-4">
            <div className="text-xs text-green-500 mb-2 flex items-center gap-2">
              <Radio className="w-4 h-4 animate-pulse" /> SIGNAL_INTERCEPT
            </div>
            <div className="border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-500">
                  <tr><th className="p-3">IP / LOCATION</th><th className="p-3">CURRENT PATH</th><th className="p-3">DEVICE UA</th><th className="p-3 text-right">OPS</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {Object.values(visitors).map((v) => {
                    const user = v[0];
                    return (
                      <tr key={user.id} className="hover:bg-slate-900/30">
                        <td className="p-3">
                            <div className="text-cyan-500 font-bold mb-1">{user.ip || '127.0.0.1'}</div>
                            <div className="text-slate-600 flex items-center gap-1"><MapPin className="w-3 h-3"/> {user.geo || 'Unknown'}</div>
                        </td>
                        <td className="p-3 text-white font-bold">{user.path}</td>
                        <td className="p-3 text-slate-500 truncate max-w-[200px]" title={user.ua}>{user.ua}</td>
                        <td className="p-3 text-right">
                            <button onClick={() => banUser(user.ip)} className="text-red-500 border border-red-900 bg-red-950/10 px-2 py-1 hover:bg-red-600 hover:text-white text-[10px] tracking-wider flex items-center gap-1 ml-auto">
                                <Ban className="w-3 h-3" /> BAN
                            </button>
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

        {/* TAB 2: NETWORK OPS (COMMANDS) */}
        {activeTab === 'NETWORK_OPS' && (
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* REMOTE SHELL */}
            <div className="border border-slate-800 p-6 bg-slate-950">
                <h3 className="text-sm text-green-500 mb-4 border-b border-green-900/30 pb-2 flex items-center gap-2">
                    <TermIcon className="w-4 h-4"/> REMOTE_EXECUTION_SHELL
                </h3>
                <div className="space-y-2">
                    <p className="text-[10px] text-slate-600 mb-4">Executes JS payload on ALL connected client browsers.</p>
                    <div className="flex gap-2 mb-4">
                        <button onClick={() => executeCommand('RELOAD_' + Date.now())} className="text-[10px] bg-slate-900 px-2 py-1 border border-slate-700 hover:border-white text-slate-300">Force Reload</button>
                        <button onClick={() => executeCommand('RICKROLL')} className="text-[10px] bg-slate-900 px-2 py-1 border border-slate-700 hover:border-white text-slate-300">Rickroll</button>
                    </div>
                    <div className="flex items-center bg-black border border-slate-800 p-2">
                        <span className="text-green-500 mr-2">{">"}</span>
                        <input 
                            value={cmd} 
                            onChange={e => setCmd(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && executeCommand(`ALERT:${cmd}`)}
                            className="bg-transparent border-none outline-none text-white text-xs w-full font-mono"
                            placeholder="alert('System Breach');" 
                        />
                    </div>
                    <p className="text-[10px] text-slate-700 text-right">Hit Enter to Execute</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* LOCKDOWN */}
                <div className={`border p-4 text-center ${maintenance ? 'border-red-500 bg-red-950/10' : 'border-slate-800'}`}>
                    <ShieldAlert className={`w-8 h-8 mx-auto mb-2 ${maintenance ? 'text-red-500 animate-pulse' : 'text-slate-600'}`} />
                    <div className="text-xs text-slate-400 mb-4">EMERGENCY LOCKDOWN PROTOCOL</div>
                    <button 
                        onClick={toggleMaintenance}
                        className={`w-full py-2 text-xs font-bold tracking-widest border ${maintenance ? 'bg-red-600 text-white border-red-600' : 'bg-transparent text-red-500 border-red-900 hover:bg-red-900/20'}`}
                    >
                        {maintenance ? "DISENGAGE" : "INITIATE"}
                    </button>
                </div>

                {/* BROADCAST */}
                <div className="border border-slate-800 p-4">
                    <div className="text-xs text-slate-400 mb-2 flex items-center gap-2"><Megaphone className="w-3 h-3"/> SYSTEM_BROADCAST</div>
                    <div className="flex gap-2">
                        <input value={broadcastMsg} onChange={e=>setBroadcastMsg(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 p-2 text-white text-xs" placeholder="Message..." />
                        <button onClick={sendBroadcast} className="bg-cyan-900/20 border border-cyan-900 text-cyan-500 text-xs px-3 hover:bg-cyan-900/40">SEND</button>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* TAB 3: DATABASE (MESSAGES) */}
        {activeTab === 'DATABASE' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center"><div className="text-xs text-slate-500">GUESTBOOK_DATA</div><button onClick={fetchMessages} className="text-xs text-cyan-500 hover:underline">[ FORCE_SYNC ]</button></div>
            <div className="grid gap-2">
              {messages.map(msg => (
                <div key={msg.id} className="bg-slate-900 p-3 flex justify-between items-center border border-slate-800 hover:border-slate-600 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-cyan-500 text-xs font-bold">{msg.name}</span>
                        <span className="text-[10px] text-slate-600">{new Date(msg.created_date).toLocaleString()}</span>
                    </div>
                    <span className="text-slate-400 text-sm">{msg.message}</span>
                  </div>
                  <button onClick={()=>handleDelete(msg.id)} className="text-slate-600 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
            {messages.length === 0 && <div className="p-8 text-center text-slate-700 text-xs">DATABASE_EMPTY</div>}
          </div>
        )}

      </div>
    </div>
  );
}
