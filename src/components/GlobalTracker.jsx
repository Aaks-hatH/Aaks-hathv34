import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/base44Client';
import { useLocation } from 'react-router-dom';
import { ShieldAlert, Info, Ban } from 'lucide-react';

export default function GlobalTracker() {
  const location = useLocation();
  const [locked, setLocked] = useState(false);
  const [banned, setBanned] = useState(false);
  const [ipInfo, setIpInfo] = useState({ ip: 'Loading...', geo: '...' });
  const [guestId] = useState(`GUEST-${Math.floor(Math.random() * 10000)}`);

  useEffect(() => {
    // 1. Identify
    fetch('/api/whoami').then(r => r.json()).then(data => {
      setIpInfo(data);
      supabase.from('banned_ips').select('*').eq('ip', data.ip).maybeSingle()
        .then(({ data: banData }) => { if (banData) setBanned(true); });
    });

    // 2. LISTEN FOR COMMANDS
    const sysSub = supabase.channel('system-events')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_config' }, (payload) => {
        
        const { key, value } = payload.new;
        
        // Handle Lockdown
        if (key === 'maintenance_mode') setLocked(value === 'true');

        // Handle Remote Execution
        if (key === 'system_command') {
            console.log("COMMAND RECEIVED:", value);
            
            if (value === 'RICKROLL') {
                window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
            }
            if (value === 'RELOAD') {
                window.location.reload();
            }
            if (value.startsWith('ALERT:')) {
                alert(value.split('ALERT:')[1]);
            }
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'banned_ips' }, (payload) => {
        if (payload.new.ip === ipInfo.ip) setBanned(true);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'banned_ips' }, (payload) => {
        // Instant Unban
        if (payload.old.ip === ipInfo.ip) setBanned(false);
      })
      .subscribe();

    return () => { supabase.removeChannel(sysSub); };
  }, [ipInfo]);

  // ... (Keep Broadcast/Presence logic same as before) ...
  
  useEffect(() => {
     if(ipInfo.ip === 'Loading...') return;
     const channel = supabase.channel('online-users', { config: { presence: { key: guestId } } });
     channel.subscribe(status => {
         if(status==='SUBSCRIBED') channel.track({ id: guestId, path: location.pathname, ua: navigator.userAgent, ip: ipInfo.ip, geo: ipInfo.geo, timestamp: new Date().toISOString() });
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
         </div>
      </div>
    );
  }
  if (locked && !location.pathname.includes('/admin')) return <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center text-red-600 font-bold text-2xl">SYSTEM LOCKDOWN</div>;

  return null;
}
