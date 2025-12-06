import React, { useState } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';

export default function FakeLogin() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // RENAMED: honeypot-capture -> user_auth
      await fetch('/api/user_auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      });
      setError('Authentication Failed: Invalid Credentials');
    } catch (e) { setError('Connection Error'); } 
    finally { setLoading(false); setPass(''); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden">
        <div className="bg-slate-800 p-6 text-center">
          <Shield className="w-12 h-12 text-white mx-auto mb-2" />
          <h2 className="text-xl font-bold text-white tracking-wide">STAFF PORTAL</h2>
          <p className="text-xs text-slate-400 mt-1">AUTHORIZED PERSONNEL ONLY</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-red-500" /><p className="text-xs text-red-700 font-bold">{error}</p></div>}
          <div className="space-y-1"><label className="block text-xs font-bold text-slate-500 uppercase">Username</label><input type="text" value={user} onChange={e => setUser(e.target.value)} className="w-full border border-slate-300 p-3 rounded text-sm" placeholder="admin" required /></div>
          <div className="space-y-1"><label className="block text-xs font-bold text-slate-500 uppercase">Password</label><input type="password" value={pass} onChange={e => setPass(e.target.value)} className="w-full border border-slate-300 p-3 rounded text-sm" placeholder="••••••••" required /></div>
          
          <div className="flex justify-center">
            {/* FAKE CAPTCHA (Does nothing, just looks real) */}
            <Turnstile siteKey="Y0x4AAAAAACFDgNVZZRDkdRXG" options={{ theme: 'light' }} />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition-colors disabled:opacity-50">{loading ? "Verifying..." : "Sign In"}</button>
          <div className="text-center pt-4 border-t border-slate-100"><Link to="/" className="text-xs text-slate-400 hover:text-blue-500">← Return to Home</Link></div>
        </form>
      </div>
    </div>
  );
}
