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

  // 1. IDENTIFY & LOG VISITOR
  useEffect(() => {
    const init = async () => {
      try {
        // Get IP
        const res = await fetch('/api/whoami');
        if (!res.ok) throw new Error('API Fail');
        const data = await res.json();
        setIpInfo(data);

        // Check Ban
        const { data: banData } = await supabase.from('banned_ips').select('*').eq('ip', data.ip).maybeSingle();
        if (banData) setBanned(true);

        // LOG VISIT TO DISCORD/DB
        if (!window.location.pathname.includes('/admin')) {
            await fetch('/api/log-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    actor_type: 'VISITOR',
                    action: 'PAGE_VIEW',
                    details: window.location.pathname
                })
            });
        }
      } catch (e) {
        console.log("Tracker init failed:", e);
      }
    };
    init();
  }, []);

  // 2. LISTEN FOR COMMANDS
  useEffect(() => {
    // Check initial lock state
    supabase.from('system_config').select('value').eq('key', 'maintenance_mode').maybeSingle()
      .then(({ data }) => { if (data?.value === 'true') setLocked(true); });

    const sysSub = supabase.channel('system-events')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_config' }, (payload) => {
        const { key, value } = payload.new;
        
        if (key === 'maintenance_mode') setLocked(value === 'true');
        if (key === 'system_broadcast') { setBroadcast(value); setTimeout(() => setBroadcast(''), 10000); }
        
        if (key === 'system_command') {
            const cmd = value.split('|')[0];
            if (cmd === 'RICKROLL') window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
            if (cmd === 'RELOAD') window.location.reload();
            if (cmd.startsWith('ALERT:')) alert(cmd.split('ALERT:')[1]);
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
  }, [ipInfo.ip]);

  // 3. PRESENCE (LIVE MAP)
  useEffect(() => {
     if(ipInfo.ip === 'Unknown') return;
     const channel = supabase.channel('online-users', { config: { presence: { key: guestId } } });
     channel.subscribe(status => {
         if(status === 'SUBSCRIBED') {
             channel.track({ id: guestId, path: location.pathname, ua: navigator.userAgent, ip: ipInfo.ip, geo: ipInfo.geo, timestamp: new Date().toISOString() });
         }
     });
     return () => { supabase.removeChannel(channel); };
  }, [location, guestId, ipInfo]);

  if (banned) return <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center text-red-600 font-mono text-2xl">IP BANNED</div>;
  if (locked && !location.pathname.includes('/admin')) return <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center text-red-600 font-bold text-2xl">SYSTEM LOCKDOWN</div>;
  if (broadcast) return <div className="fixed top-4 right-4 z-[9999] bg-slate-900 border border-cyan-500 text-cyan-400 p-4 rounded shadow-lg font-mono text-xs">{broadcast}</div>;

  return null;
}
