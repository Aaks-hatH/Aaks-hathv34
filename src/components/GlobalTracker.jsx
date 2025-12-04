import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/base44Client';
import { useLocation } from 'react-router-dom';
import { ShieldAlert, Info, Ban } from 'lucide-react';

export default function GlobalTracker() {
  const location = useLocation();
  const [locked, setLocked] = useState(false);
  const [banned, setBanned] = useState(false);
  const [broadcast, setBroadcast] = useState('');
  
  // Default to "Detecting" so they show up on the map instantly
  const [ipInfo, setIpInfo] = useState({ ip: 'Detecting...', geo: '---' });
  const [guestId] = useState(`GUEST-${Math.floor(Math.random() * 10000)}`);

  // 1. IDENTIFY USER & LOG VISIT
  useEffect(() => {
    const init = async () => {
      try {
        // Try to get IP
        const res = await fetch('/api/whoami');
        if (res.ok) {
            const data = await res.json();
            setIpInfo(data);
            
            // Check if this IP is banned
            const { data: banData } = await supabase
                .from('banned_ips')
                .select('*')
                .eq('ip', data.ip)
                .maybeSingle();
            if (banData) setBanned(true);
        } else {
            // Fallback for AdBlockers
            setIpInfo({ ip: 'Anonymous/Proxy', geo: 'Unknown' });
        }

        // Log Page View (Silent Background Request)
        if (!window.location.pathname.includes('/admin')) {
            fetch('/api/log-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    actor_type: 'VISITOR',
                    action: 'PAGE_VIEW',
                    details: window.location.pathname
                })
            }).catch(() => {}); // Ignore logging errors
        }
      } catch (e) {
        setIpInfo({ ip: 'Tracking Failed', geo: 'Hidden' });
      }
    };
    init();
  }, []);

  // 2. REALTIME COMMAND LISTENER
  useEffect(() => {
    // Check initial lock state
    supabase.from('system_config').select('value').eq('key', 'maintenance_mode').maybeSingle()
      .then(({ data }) => { if (data?.value === 'true') setLocked(true); });

    const sysSub = supabase.channel('system-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_config' }, (payload) => {
        if (!payload.new) return;
        const { key, value } = payload.new;

        // Handle Lockdown
        if (key === 'maintenance_mode') setLocked(value === 'true');
        
        // Handle Broadcasts
        if (key === 'system_broadcast') {
            setBroadcast(value);
            setTimeout(() => setBroadcast(''), 10000);
        }

        // Handle Commands (Rickroll/Reload/Alert)
        if (key === 'system_command') {
            const cmd = value.split('|')[0]; // Remove timestamp
            if (cmd === 'RICKROLL') window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
            if (cmd === 'RELOAD') window.location.reload();
            if (cmd.startsWith('ALERT:')) alert(cmd.split('ALERT:')[1]);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banned_ips' }, (payload) => {
         // Watch for bans specifically targeting THIS user
         if (payload.new && payload.new.ip === ipInfo.ip) setBanned(true);
         if (payload.eventType === 'DELETE' && payload.old && payload.old.ip === ipInfo.ip) setBanned(false);
      })
      .subscribe();

    return () => { supabase.removeChannel(sysSub); };
  }, [ipInfo.ip]); // Re-bind if IP detection finishes late

  // 3. BROADCAST PRESENCE (Live Map)
  useEffect(() => {
     // Connect immediately using guestId, update IP later if it changes
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
  }, [location, guestId, ipInfo]); // Sends new signal whenever Page or IP changes

  // --- UI OVERLAYS ---

  // Ban Screen (Highest Priority)
  if (banned) return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-red-600 font-mono p-4">
         <Ban className="w-24 h-24 mb-4 animate-pulse" />
         <h1 className="text-3xl font-bold text-center">ACCESS DENIED</h1>
         <p className="mt-2 text-sm text-red-400">IP ADDRESS BLACKLISTED</p>
         <p className="text-xs text-slate-600 mt-4 font-mono">Target: {ipInfo.ip}</p>
      </div>
  );

  // Lockdown Screen (Admin is exempt)
  if (locked && !location.pathname.includes('/admin')) return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-red-600 font-mono p-4">
      <ShieldAlert className="w-24 h-24 mb-4 animate-pulse" />
      <h1 className="text-4xl font-bold text-center tracking-widest">SYSTEM LOCKDOWN</h1>
      <p className="text-sm mt-4 text-red-800">ADMINISTRATIVE OVERRIDE ACTIVE</p>
    </div>
  );

  // Broadcast Toast
  if (broadcast) return (
    <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-5 fade-in">
      <div className="bg-slate-900 border border-cyan-500 text-cyan-400 p-4 rounded shadow-lg flex items-center gap-3 max-w-sm">
        <Info className="w-5 h-5 shrink-0" />
        <div>
          <h3 className="font-bold text-sm mb-1">ADMIN MESSAGE</h3>
          <p className="text-xs text-slate-300 font-mono">{broadcast}</p>
        </div>
      </div>
    </div>
  );

  return null;
}
