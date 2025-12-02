import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/base44Client';
import { useLocation } from 'react-router-dom';
import { ShieldAlert, Info, Ban } from 'lucide-react';

export default function GlobalTracker() {
  const location = useLocation();
  const [locked, setLocked] = useState(false);
  const [banned, setBanned] = useState(false);
  const [broadcast, setBroadcast] = useState('');
  const [ipInfo, setIpInfo] = useState({ ip: 'Loading...', geo: '...' });
  const [guestId] = useState(`GUEST-${Math.floor(Math.random() * 10000)}`);

  useEffect(() => {
    // 1. Identify Self (Get IP & Geo from Cloudflare)
    fetch('/api/whoami').then(r => r.json()).then(data => {
      setIpInfo(data);
      
      // Check if ALREADY banned
      supabase.from('banned_ips').select('*').eq('ip', data.ip).single()
        .then(({ data: banData }) => { if (banData) setBanned(true); });
    });

    // 2. Realtime System Listener
    const sysSub = supabase.channel('system-events')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_config' }, (payload) => {
        if (payload.new.key === 'maintenance_mode') setLocked(payload.new.value === 'true');
        if (payload.new.key === 'system_broadcast') {
            setBroadcast(payload.new.value);
            setTimeout(() => setBroadcast(''), 8000);
        }
        // REMOTE EXECUTION PROTOCOL
        if (payload.new.key === 'system_command') {
            const cmd = payload.new.value;
            if (cmd.startsWith('RELOAD')) window.location.reload();
            if (cmd.startsWith('ALERT:')) alert(cmd.split('ALERT:')[1]);
            if (cmd === 'RICKROLL') window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'banned_ips' }, (payload) => {
        // Instant Ban Enforcement
        if (payload.new.ip === ipInfo.ip) setBanned(true);
      })
      .subscribe();

    return () => { supabase.removeChannel(sysSub); };
  }, [ipInfo.ip]);

  // 3. Broadcast Identity to Admin
  useEffect(() => {
    if (ipInfo.ip === 'Loading...') return;

    const channel = supabase.channel('online-users', { config: { presence: { key: guestId } } });
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          id: guestId,
          path: location.pathname,
          ua: navigator.userAgent,
          ip: ipInfo.ip,        // <--- Sending IP
          geo: ipInfo.geo,      // <--- Sending Location
          timestamp: new Date().toISOString()
        });
      }
    });
    return () => { supabase.removeChannel(channel); };
  }, [location, guestId, ipInfo]);

  // --- OVERLAYS ---

  if (banned) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center text-red-600 font-mono p-4">
         <div className="text-center border border-red-900 p-10 bg-red-950/20">
            <Ban className="w-20 h-20 mx-auto mb-4" />
            <h1 className="text-3xl font-bold">CONNECTION TERMINATED</h1>
            <p className="mt-2 text-sm text-red-400">Your IP address has been blacklisted by the administrator.</p>
            <p className="text-xs text-slate-600 mt-4">{ipInfo.ip}</p>
         </div>
      </div>
    );
  }

  if (locked && !location.pathname.includes('/admin')) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center text-red-600 font-mono p-4">
        <div className="text-center space-y-4 border border-red-900 p-10 bg-red-950/10">
          <ShieldAlert className="w-20 h-20 mx-auto animate-pulse" />
          <h1 className="text-4xl font-bold tracking-widest">SYSTEM LOCKDOWN</h1>
        </div>
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
