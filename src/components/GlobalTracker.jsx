import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/base44Client';
import { useLocation } from 'react-router-dom';
import { ShieldAlert, Info, Ban } from 'lucide-react';

export default function GlobalTracker() {
  const location = useLocation();
  const [locked, setLocked] = useState(false);
  const [banned, setBanned] = useState(false);
  const [broadcast, setBroadcast] = useState('');
  const [ipInfo, setIpInfo] = useState({ ip: 'Unknown', geo: 'Unknown' });
  const [guestId] = useState(`GUEST-${Math.floor(Math.random() * 10000)}`);

  // 1. Helper to parse "true"/"false" safely
  const isTrue = (val) => String(val).toLowerCase() === 'true';

  // 2. INITIAL SETUP
  useEffect(() => {
    // Identity
    fetch('/api/whoami').then(r=>r.json()).then(data => {
        setIpInfo(data);
        supabase.from('banned_ips').select('*').eq('ip', data.ip).maybeSingle()
            .then(({ data: ban }) => { if(ban) setBanned(true); });
    }).catch(() => {});

    // Initial Lock Check
    supabase.from('system_config').select('value').eq('key', 'maintenance_mode').maybeSingle()
        .then(({ data }) => { if (data && isTrue(data.value)) setLocked(true); });

    // 3. REALTIME LISTENER
    const sysSub = supabase.channel('system-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_config' }, (payload) => {
        console.log("SIGNAL:", payload); // Check Console for this
        
        const { key, value } = payload.new || {}; // Handle potential empty payload
        
        if (!key) return; // Skip if data is missing

        // Lockdown
        if (key === 'maintenance_mode') {
            const status = isTrue(value);
            console.log("LOCKDOWN SET TO:", status);
            setLocked(status);
        }
        
        // Broadcast
        if (key === 'system_broadcast') {
            setBroadcast(value);
            setTimeout(() => setBroadcast(''), 10000);
        }

        // Commands (Rickroll/Reload)
        if (key === 'system_command') {
            const cmd = value.split('|')[0];
            if (cmd === 'RICKROLL') window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
            if (cmd === 'RELOAD') window.location.reload();
            if (cmd.startsWith('ALERT:')) alert(cmd.split('ALERT:')[1]);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banned_ips' }, (payload) => {
        // Listen for ANY ban change matching our IP
        if (payload.new && payload.new.ip === ipInfo.ip) setBanned(true);
        if (payload.eventType === 'DELETE' && payload.old && payload.old.ip === ipInfo.ip) setBanned(false);
      })
      .subscribe();

    return () => { supabase.removeChannel(sysSub); };
  }, [ipInfo.ip]);

  // 4. PRESENCE (LIVE TRAFFIC)
  useEffect(() => {
     if(ipInfo.ip === 'Unknown') return;
     const channel = supabase.channel('online-users', { config: { presence: { key: guestId } } });
     channel.subscribe(status => {
         if(status === 'SUBSCRIBED') {
             channel.track({ 
                 id: guestId, path: location.pathname, ua: navigator.userAgent, 
                 ip: ipInfo.ip, geo: ipInfo.geo, timestamp: new Date().toISOString() 
             });
         }
     });
     return () => { supabase.removeChannel(channel); };
  }, [location, guestId, ipInfo]);

  // --- UI ---
  if (banned) return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-red-600 font-mono p-4">
         <Ban className="w-24 h-24 mb-4 animate-pulse" />
         <h1 className="text-3xl font-bold text-center">ACCESS DENIED</h1>
         <p className="mt-2 text-sm text-red-400">IP BLACKLISTED</p>
         <p className="text-xs text-slate-600 mt-4 font-mono">{ipInfo.ip}</p>
      </div>
  );

  // Only block if NOT on Admin page
  if (locked && !location.pathname.includes('/admin')) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-red-600 font-mono p-4">
        <ShieldAlert className="w-24 h-24 mb-4 animate-pulse" />
        <h1 className="text-4xl font-bold text-center tracking-widest">SYSTEM LOCKDOWN</h1>
        <p className="text-sm mt-4 text-red-800">ADMINISTRATIVE OVER RIDE ACTIVE</p>
      </div>
    );
  }

  if (broadcast) return (
    <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-5 fade-in">
      <div className="bg-slate-900 border border-cyan-500 text-cyan-400 p-4 rounded shadow-lg flex items-center gap-3 max-w-sm">
        <Info className="w-5 h-5 shrink-0" />
        <div><h3 className="font-bold text-sm mb-1">ADMIN MESSAGE</h3><p className="text-xs text-slate-300 font-mono">{broadcast}</p></div>
      </div>
    </div>
  );

  return null;
}
