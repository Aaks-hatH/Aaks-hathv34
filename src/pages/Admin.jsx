import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Lock, Trash2, LogOut, ShieldAlert, Loader2, KeyRound } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

export default function Admin() {
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState(''); // New State for 2FA
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    const data = await base44.entities.GuestbookMessage.list();
    setMessages(data);
  };

  useEffect(() => { if (auth) fetchMessages(); }, [auth]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            password: password,
            token: totp // Send 2FA code
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAuth(true);
        setError('');
      } else {
        setError(data.error || 'Access Denied');
        setPassword('');
        setTotp('');
      }
    } catch (err) {
      setError('Connection Error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!confirm("Delete record?")) return;
    try { await base44.entities.GuestbookMessage.delete(id); fetchMessages(); } 
    catch (e) { alert("Database Error"); }
  };

  if (!auth) {
    return (
      <div className="min-h-screen bg-black text-green-500 font-mono p-8 flex flex-col items-center justify-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md border border-green-800 p-8 rounded-lg bg-slate-900/50 backdrop-blur shadow-[0_0_30px_rgba(34,197,94,0.2)]"
        >
          <div className="flex items-center gap-3 mb-6 border-b border-green-900 pb-4">
            <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
            <h1 className="text-xl font-bold tracking-wider text-white">SECURE LOGIN</h1>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-green-700 uppercase">
                <Lock className="w-3 h-3" /> Password
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-green-900 p-3 text-green-400 outline-none focus:border-green-500 text-center tracking-widest transition-all"
                placeholder="••••••"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-green-700 uppercase">
                <KeyRound className="w-3 h-3" /> 2FA Code
              </label>
              <input 
                type="text" 
                value={totp}
                onChange={(e) => setTotp(e.target.value)}
                maxLength={6}
                className="w-full bg-black border border-green-900 p-3 text-green-400 outline-none focus:border-green-500 text-center tracking-[0.5em] font-bold transition-all"
                placeholder="000000"
              />
            </div>

            {error && <p className="text-red-500 text-xs text-center font-bold border border-red-900/50 p-2 bg-red-950/30">{error}</p>}
            
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold tracking-wider"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : "AUTHENTICATE"}
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-green-500" />
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Console</h1>
              <p className="text-xs text-green-500 font-mono">SESSION SECURE (2FA VERIFIED)</p>
            </div>
          </div>
          <Button onClick={() => setAuth(false)} variant="outline" className="border-red-900 text-red-400 hover:bg-red-900/20">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </header>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Guestbook Entries ({messages.length})</h2>
            <Button size="sm" variant="ghost" onClick={fetchMessages} className="text-cyan-400">Refresh Data</Button>
          </div>

          <div className="grid gap-4">
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex justify-between items-start"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-cyan-400 font-bold">{msg.name}</span>
                  </div>
                  <p className="text-slate-300 text-sm">{msg.message}</p>
                  <p className="text-xs text-slate-600 mt-2">{new Date(msg.created_date).toLocaleString()}</p>
                </div>
                <Button size="icon" className="text-red-500 hover:bg-red-900/20" onClick={() => handleDelete(msg.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
