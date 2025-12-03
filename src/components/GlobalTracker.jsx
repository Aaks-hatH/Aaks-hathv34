import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/base44Client';
import { useLocation } from 'react-router-dom';
import { ShieldAlert, Info, Ban } from 'lucide-react';

export default function GlobalTracker() {
  const location = useLocation();
  const [locked, setLocked] = useState(false);
  const [banned, setBanned] = useState(false);
  const [broadcast, setBroadcast] = useState('');
  // Default to 'Unknown' so it doesn't get stuck on 'Loading...'
  const [ipInfo, setIpInfo] = useState({ ip: 'Unknown', geo: 'Earth' }); 
  const [guestId] = useState(`GUEST-${Math.floor(Math.random() * 10000)}`);

  useEffect(() => {
    // 1. IDENTIFY (With Fallback)
    fetch('/api/whoami')
      .then(r => {
        if (r.ok) return r.json();
        throw new Error("Whoami failed");
      })
      .then(data => {
        setIpInfo(data);
        // Check Ban Status
        checkBan(data.ip);
      })
      .catch(() => {
        // Fallback if API blocked
        console.log("Identity cloaked or API blocked");
        setIpInfo({ ip: '127.0.0.1', geo: 'Hidden' });
      });

    // 2. LISTEN FOR COMMANDS
    const sysSub = supabase.channel('system-events')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_config' }, (payload) => {
        
        const { key, value } = payload.new;
        
        // Lockdown
        if (key === 'maintenance_mode') setLocked(value === 'true');

        // Broadcasts
        if (key === 'system_broadcast') {
            setBroadcast(value);
            setTimeout(() => setBroadcast(''), 10000);
        }

        // Remote Execution
        if (key === 'system_command') {
            // FIX: Split the timestamp out (RICKROLL|1234 -> RICKROLL)
            const cleanCommand = value.split('|')[0];
            
            console.log("CMD:", cleanCommand); // Debugging
            
            if (cleanCommand === 'RICKROLL') {
                window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
            }
            if (cleanCommand === 'RELOAD') {
                window.location.reload();
            }
            if (cleanCommand.startsWith('ALERT:')) {
                alert(cleanCommand.split('ALERT:')[1]);
            }
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'banned_ips' }, (payload) => {
        if (payload.new.ip === ipInfo.ip) setBanned(true);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'banned_ips' }, (payload) => {
        if (payload.old.ip === ipInfo.ip) setBanned(false);
      })
      .subscribe();

    return () => { supabase.removeChannel(sysSub); };
  }, [ipInfo.ip]); // Re-run listener if IP changes

  // Helper to check ban status
  const checkBan = async (ip) => {
      const { data } = await supabase.from('banned_ips').select('*').eq('ip', ip).maybeSingle();
      if (data) setBanned(true);
  };

  // 3. SPY BROADCAST
  useEffect(() => {
     if(ipInfo.ip === 'Loading...') return; // Wait for ID

     const channel = supabase.channel('online-users', { config: { presence: { key: guestId } } });
     
     channel.subscribe(status => {
         if(status === 'SUBSCRIBED') {
             channel.track({ 
                 id: guestId, 
                 path: location.pathname, 
                 ua: navigator.userAgent, 
                 ip: ipInfo.ip, 
                 geo: ipInfo.geo, 
                 timestamp: new Date().toISOString() 
             });
         }
     });

     return () => { supabase.removeChannel(channel); };
  }, [location, guestId, ipInfo]);

  // --- VISUALS ---
  if (banned) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center text-red-600 font-mono p-4">
         <div className="text-center border border-red-900 p-10 bg-red-950/20">
            <Ban className="w-20 h-20 mx-auto mb-4" />
            <h1 className="text-3xl font-bold">CONNECTION TERMINATED</h1>
            <p className="mt-2 text-sm text-red-400">IP ADDRESS BLACKLISTED.</p>
            <p className="text-xs text-slate-600 mt-4 font-mono">{ipInfo.ip}</p>
         </div>
      </div>
    );
  }
  
  if (locked && !location.pathname.includes('/admin')) {
    return (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center text-red-600 font-bold text-2xl">
            SYSTEM LOCKDOWN
        </div>
    );
  }

  if (broadcast) {
    return (
      <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-5 fade-in duration-300">
        <div className="bg-slate-900 border border-cyan-500/50 text-cyan-400 p-4 rounded shadow-lg flex items-start gap-3 max-w-sm">
          <Info className="w-5 h-5 mt-0.5 shrink-0" />
          <div><h3 className="font-bold text-sm mb-1">ADMIN MESSAGE</h3><p className="text-xs text-slate-300 font-mono">{broadcast}</p></div>
        </div>
      </div>
    );
  }

  return null;
}
