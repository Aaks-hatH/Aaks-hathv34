import React, { useState, useEffect } from 'react';
import { base44, supabase } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Trash2, LogOut, ShieldAlert, Users, Radio, Loader2 } from 'lucide-react';

export default function Admin() {
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('DATABASE');

  // Real Data
  const [messages, setMessages] = useState([]);
  const [maintenance, setMaintenance] = useState(false);
  const [visitors, setVisitors] = useState({}); // Store live users

  // 1. FETCH DATA
  const fetchMessages = async () => {
    const data = await base44.entities.GuestbookMessage.list();
    setMessages(data);
  };

  // 2. LISTEN TO VISITORS (The "Spy" Logic)
  useEffect(() => {
    if (!auth) return;
    
    // Check maintenance status
    supabase.from('system_config').select('value').eq('key', 'maintenance_mode').single()
      .then(({ data }) => setMaintenance(data?.value === 'true'));

    // Subscribe to live presence
    const channel = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setVisitors(state);
      })
      .subscribe();

    fetchMessages();

    return () => { supabase.removeChannel(channel); };
  }, [auth]);

  // 3. LOGIN LOGIC
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
      else setError(data.error || 'FAILED');
    } catch (err) { setError('CONNECTION_ERROR'); } 
    finally { setLoading(false); }
  };

  // 4. TOGGLE LOCKDOWN
 const toggleMaintenance = async () => {
    try {
      const newState = !maintenance;
      
      // Call Secure Backend
      const res = await fetch('/api/toggle-lockdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, status: newState }) // Send pwd for auth
      });

      if (res.ok) {
        setMaintenance(newState);
      } else {
        alert("ACCESS DENIED: Server rejected lockdown command.");
      }
    } catch (e) {
      alert("Network Error");
    }
  };
  
  const handleDelete = async (id) => {
    if(!confirm("CONFIRM_DELETION?")) return;
    
    try {
      // Call Secure Backend
      const res = await fetch('/api/delete-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, id })
      });

      if (res.ok) {
        fetchMessages();
      } else {
        alert("ACCESS DENIED: Server rejected delete command.");
      }
    } catch (e) {
      alert("Network Error");
    }
  };

  if (!auth) {
    return (
      <div className="min-h-screen bg-black text-slate-400 font-mono p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-md border border-slate-800 p-8 bg-slate-950">
          <div className="border-b border-slate-800 pb-4 mb-6 flex items-center gap-2">
            <ShieldAlert className="text-red-500 w-5 h-5" />
            <h1 className="text-slate-100 tracking-widest text-sm">SECURE_GATEWAY</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-black border border-slate-700 p-2 text-white" placeholder="PASSWORD" />
            <input type="text" value={totp} onChange={e=>setTotp(e.target.value)} maxLength={6} className="w-full bg-black border border-slate-700 p-2 text-white tracking-widest" placeholder="2FA TOKEN" />
            {error && <div className="text-red-500 text-xs">ERROR: {error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-slate-100 text-black py-2 text-xs font-bold hover:bg-cyan-500">
              {loading ? "..." : "ACCESS"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const visitorCount = Object.keys(visitors).length;

  return (
    <div className="min-h-screen bg-black text-slate-300 font-mono p-6">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-xl text-white tracking-widest">OVERWATCH_CONSOLE</h1>
            <p className="text-xs text-cyan-600">ACTIVE_AGENTS: {visitorCount}</p>
          </div>
          <button onClick={() => setAuth(false)} className="text-xs text-red-500 hover:text-red-400">[ DISCONNECT ]</button>
        </header>

        <div className="grid grid-cols-4 gap-1 mb-8">
          {['DATABASE', 'LIVE_TRAFFIC', 'NETWORK_OPS'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`py-2 text-xs ${activeTab===tab ? 'bg-slate-100 text-black' : 'bg-slate-900'}`}>{tab}</button>
          ))}
        </div>

        {/* LIVE TRAFFIC TAB */}
        {activeTab === 'LIVE_TRAFFIC' && (
          <div className="space-y-4">
            <div className="text-xs text-green-500 mb-2 flex items-center gap-2">
              <Radio className="w-4 h-4 animate-pulse" /> REALTIME_SIGNALS_DETECTED
            </div>
            <div className="border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-500">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">CURRENT PATH</th>
                    <th className="p-3">DEVICE</th>
                    <th className="p-3 text-right">LAST PING</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {Object.values(visitors).map((v) => {
                    const user = v[0]; // Supabase groups by key
                    return (
                      <tr key={user.id} className="hover:bg-slate-900/30">
                        <td className="p-3 text-cyan-500">{user.id}</td>
                        <td className="p-3 text-white">{user.path}</td>
                        <td className="p-3 text-slate-500 truncate max-w-[200px]">{user.ua}</td>
                        <td className="p-3 text-right text-slate-600">{user.timestamp.split('T')[1].split('.')[0]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {visitorCount === 0 && <div className="p-8 text-center text-slate-600">NO_ACTIVE_SIGNALS</div>}
            </div>
          </div>
        )}

        {/* NETWORK OPS TAB */}
        {activeTab === 'NETWORK_OPS' && (
          <div className="border border-red-900/30 bg-red-950/5 p-8 text-center">
            <ShieldAlert className={`w-16 h-16 mx-auto mb-4 ${maintenance ? 'text-red-500 animate-pulse' : 'text-slate-700'}`} />
            <h2 className="text-white text-lg mb-2">EMERGENCY LOCKDOWN PROTOCOL</h2>
            <p className="text-xs text-slate-500 mb-8 max-w-md mx-auto">
              Engaging this protocol will verify the database flag 'maintenance_mode'. All connected clients will effectively be disconnected immediately.
            </p>
            <button 
              onClick={toggleMaintenance}
              className={`px-8 py-3 text-xs font-bold tracking-widest border ${maintenance ? 'bg-red-600 text-black border-red-600' : 'bg-transparent text-red-500 border-red-900 hover:bg-red-900/20'}`}
            >
              {maintenance ? "DISENGAGE PROTOCOL" : "INITIATE LOCKDOWN"}
            </button>
          </div>
        )}

        {/* DATABASE TAB */}
        {activeTab === 'DATABASE' && (
          <div className="space-y-4">
            <div className="flex justify-between"><div className="text-xs text-slate-500">GUESTBOOK_DATA</div><button onClick={fetchMessages} className="text-xs text-cyan-500">[ SYNC ]</button></div>
            <div className="grid gap-2">
              {messages.map(msg => (
                <div key={msg.id} className="bg-slate-900 p-3 flex justify-between items-center border border-slate-800">
                  <div><span className="text-cyan-500 text-xs mr-2">{msg.name}</span><span className="text-slate-400 text-sm">{msg.message}</span></div>
                  <button onClick={()=>handleDelete(msg.id)} className="text-red-500"><Trash2 className="w-3 h-3"/></button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
