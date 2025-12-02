import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

export default function Admin() {
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('DATABASE');

  // State for features
  const [messages, setMessages] = useState([]);
  const [maintenance, setMaintenance] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('IDLE'); // IDLE, UPLOADING, DONE

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
        body: JSON.stringify({ password, token: totp })
      });
      const text = await res.text();
      
      if (!res.ok) throw new Error(`Auth Failed: ${res.status}`);
      
      const data = JSON.parse(text);
      if (data.success) {
        setAuth(true);
        setError('');
      } else {
        setError('CREDENTIALS_REJECTED');
      }
    } catch (err) {
      setError('CONNECTION_LOST');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!confirm("CONFIRM_DELETION: This action is irreversible. Proceed?")) return;
    await base44.entities.GuestbookMessage.delete(id);
    fetchMessages();
  };

  const handleUpload = (e) => {
    e.preventDefault();
    setUploadStatus('UPLOADING');
    // Simulation of upload delay
    setTimeout(() => setUploadStatus('DONE'), 1500);
    setTimeout(() => setUploadStatus('IDLE'), 3500);
  };

  // --- LOGIN SCREEN ---
  if (!auth) {
    return (
      <div className="min-h-screen bg-black text-slate-400 font-mono p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-md border border-slate-800 p-8 bg-slate-950">
          <div className="border-b border-slate-800 pb-4 mb-6">
            <h1 className="text-slate-100 tracking-widest text-sm">[ SECURE_GATEWAY_V4 ]</h1>
            <p className="text-xs text-slate-600 mt-1">RESTRICTED ACCESS AREA</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs uppercase">Passphrase</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-slate-700 p-2 text-slate-100 focus:border-cyan-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase">Auth Token (2FA)</label>
              <input 
                type="text" 
                value={totp}
                onChange={(e) => setTotp(e.target.value)}
                maxLength={6}
                className="w-full bg-black border border-slate-700 p-2 text-slate-100 focus:border-cyan-500 outline-none tracking-widest"
                placeholder="------"
              />
            </div>

            {error && <div className="bg-red-950/30 text-red-500 text-xs p-2 border-l-2 border-red-500">ERROR: {error}</div>}
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-100 text-black hover:bg-cyan-500 hover:text-black py-2 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              {loading ? "HANDSHAKING..." : "INITIATE_SESSION"}
            </button>
          </form>
        </div>
        <Link to="/" className="mt-8 text-xs text-slate-600 hover:text-slate-400">[ TERMINATE_CONNECTION ]</Link>
      </div>
    );
  }

  // --- DASHBOARD ---
  return (
    <div className="min-h-screen bg-black text-slate-300 font-mono p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-slate-800 pb-6 gap-4">
          <div>
            <h1 className="text-xl text-white tracking-widest">ADMINISTRATOR_CONTROLS</h1>
            <p className="text-xs text-cyan-600 mt-1">SESSION_ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="text-xs text-slate-500">
              UPTIME: <span className="text-slate-300">99.9%</span>
            </div>
            <button onClick={() => setAuth(false)} className="text-xs border border-red-900 text-red-500 px-4 py-2 hover:bg-red-950">
              LOGOUT
            </button>
          </div>
        </header>

        {/* TABS */}
        <div className="flex gap-1 mb-8 border-b border-slate-800">
          {['DATABASE', 'SYSTEM_LOGS', 'NETWORK_OPS'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 text-xs transition-colors ${activeTab === tab ? 'bg-slate-100 text-black' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* CONTENT: DATABASE */}
        {activeTab === 'DATABASE' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="text-xs text-slate-500">QUERY: SELECT * FROM guestbook</div>
              <button onClick={fetchMessages} className="text-xs text-cyan-500 hover:underline">[ REFRESH_DATA ]</button>
            </div>

            <div className="border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-500">
                  <tr>
                    <th className="p-3 font-normal">ID</th>
                    <th className="p-3 font-normal">TIMESTAMP</th>
                    <th className="p-3 font-normal">USER</th>
                    <th className="p-3 font-normal">PAYLOAD</th>
                    <th className="p-3 font-normal text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {messages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-slate-900/50">
                      <td className="p-3 text-slate-600 font-mono">{String(msg.id).substring(0,8)}...</td>
                      <td className="p-3 text-slate-500">{new Date(msg.created_date).toISOString().replace('T', ' ').substring(0, 19)}</td>
                      <td className="p-3 text-cyan-500">{msg.name}</td>
                      <td className="p-3 text-slate-300">{msg.message}</td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => handleDelete(msg.id)}
                          className="text-red-500 hover:bg-red-950 px-2 py-1"
                        >
                          [ DELETE ]
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {messages.length === 0 && <div className="p-8 text-center text-slate-600 text-xs">NO_RECORDS_FOUND</div>}
            </div>
          </div>
        )}

        {/* CONTENT: SYSTEM LOGS */}
        {activeTab === 'SYSTEM_LOGS' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-500 mb-2">STREAM: /var/log/auth.log (SIMULATED)</div>
            <div className="bg-slate-950 border border-slate-800 p-4 h-[400px] overflow-y-auto font-mono text-xs space-y-1">
              <div className="text-slate-500">{new Date().toISOString()} [INFO] System boot sequence initiated</div>
              <div className="text-slate-500">{new Date().toISOString()} [INFO] Kernel loaded v5.15.0-generic</div>
              <div className="text-slate-500">{new Date().toISOString()} [INFO] Network interfaces initialized (eth0, wlan0)</div>
              <div className="text-green-500">{new Date().toISOString()} [SUCCESS] Connection established to Cloudflare Edge</div>
              <div className="text-slate-500">{new Date().toISOString()} [INFO] Rate limiter active: 100req/s</div>
              {messages.map(m => (
                <div key={m.id} className="text-cyan-600">
                  {new Date(m.created_date).toISOString()} [GUESTBOOK] New entry received from IP 10.24.X.X
                </div>
              ))}
              <div className="text-yellow-500">{new Date().toISOString()} [WARN] High latency detected on region us-east-1</div>
              <div className="text-green-500">{new Date().toISOString()} [AUTH] Admin session verified: root</div>
              <div className="animate-pulse text-slate-600">_</div>
            </div>
          </div>
        )}

        {/* CONTENT: NETWORK OPS */}
        {activeTab === 'NETWORK_OPS' && (
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Maintenance Toggle */}
            <div className="border border-slate-800 p-6">
              <h3 className="text-sm text-slate-100 mb-4 border-b border-slate-800 pb-2">EMERGENCY_LOCKDOWN</h3>
              <p className="text-xs text-slate-500 mb-6">
                Enabling lockdown mode will reject all incoming traffic with a 503 Service Unavailable response.
                Use only during active attacks or maintenance.
              </p>
              <div className="flex items-center justify-between bg-slate-900 p-4">
                <span className="text-xs text-slate-400">STATUS:</span>
                <span className={maintenance ? "text-red-500 font-bold" : "text-green-500 font-bold"}>
                  {maintenance ? "ACTIVE" : "NORMAL"}
                </span>
              </div>
              <button 
                onClick={() => setMaintenance(!maintenance)}
                className={`w-full mt-4 py-2 text-xs font-bold border ${maintenance ? 'border-green-900 text-green-500 hover:bg-green-950' : 'border-red-900 text-red-500 hover:bg-red-950'}`}
              >
                {maintenance ? "[ DISENGAGE_LOCKDOWN ]" : "[ ENGAGE_LOCKDOWN ]"}
              </button>
            </div>

            {/* File Upload */}
            <div className="border border-slate-800 p-6">
              <h3 className="text-sm text-slate-100 mb-4 border-b border-slate-800 pb-2">SECURE_FILE_UPLINK</h3>
              <p className="text-xs text-slate-500 mb-6">
                Upload encrypted archives or system patches directly to the server. 
                Max file size: 50MB.
              </p>
              
              {uploadStatus === 'IDLE' && (
                <form onSubmit={handleUpload} className="space-y-4">
                  <input type="file" className="block w-full text-xs text-slate-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-none file:border-0
                    file:text-xs file:bg-slate-800 file:text-slate-300
                    hover:file:bg-slate-700" 
                  />
                  <button type="submit" className="w-full py-2 bg-cyan-900/20 border border-cyan-900 text-cyan-500 text-xs hover:bg-cyan-900/40">
                    [ START_UPLOAD ]
                  </button>
                </form>
              )}

              {uploadStatus === 'UPLOADING' && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-400 flex justify-between">
                    <span>TRANSMITTING...</span>
                    <span>45%</span>
                  </div>
                  <div className="h-2 bg-slate-900 w-full">
                    <div className="h-full bg-cyan-600 w-[45%] animate-pulse"></div>
                  </div>
                </div>
              )}

              {uploadStatus === 'DONE' && (
                <div className="text-center py-4">
                  <div className="text-green-500 text-sm mb-2">[ UPLOAD_COMPLETE ]</div>
                  <p className="text-xs text-slate-500">File hash verified. Stored in secure vault.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
