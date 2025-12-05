import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/base44Client';
import { useLocation } from 'react-router-dom';
import { ShieldAlert, Info, Ban } from 'lucide-react';

export default function GlobalTracker() {
  const location = useLocation();
  const [locked, setLocked] = useState(false);
  const [banned, setBanned] = useState(false);
  const [broadcast, setBroadcast] = useState('');
  const [ipInfo, setIpInfo] = useState({ ip: 'Detecting...', geo: '---' });
  const [guestId] = useState(`GUEST-${Math.floor(Math.random() * 10000)}`);

  // ---------------------------------------------------------
  // 1. PERMANENT LOGGING (The "Black Box")
  // ---------------------------------------------------------
  useEffect(() => {
    // We don't log Admin pages to keep the noise down
    if (location.pathname.includes('/admin')) return;

    // Fire and Forget - This runs immediately on every page load
    fetch('/api/log-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            actor_type: 'VISITOR',
            action: 'PAGE_VIEW',
            details: location.pathname // Logs "/home" or "/tools"
        })
    }).catch(e => console.error("Log failed:", e));
    
  }, [location.pathname]); // Runs every time URL changes

  // ---------------------------------------------------------
  // 2. IDENTITY & BAN CHECK
  // ---------------------------------------------------------
  useEffect(() => {
    const checkIdentity = async () => {
      try {
        const res = await fetch('/api/whoami');
        if (res.ok) {
            const data = await res.json();
            setIpInfo(data);
            
            // Check if Banned
            const { data: banData } = await supabase
                .from('banned_ips')
                .select('*')
                .eq('ip', data.ip)
                .maybeSingle();
            if (banData) setBanned(true);
        }
      } catch (e) {
        setIpInfo({ ip: 'Hidden', geo: 'Unknown' });
      }
    };
    checkIdentity();
  }, []);

  // ---------------------------------------------------------
  // 3. COMMAND CENTER LISTENER (Lockdown/Rickroll)
  // ---------------------------------------------------------
  useEffect(() => {
    // Initial Lock Check
    supabase.from('system_config').select('value').eq('key', 'maintenance_mode').maybeSingle()
      .then(({ data }) => { if (data?.value === 'true') setLocked(true); });

    const sysSub = supabase.channel('system-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_config' }, (payload) => {
        if (!payload.new) return;
        const { key, value } = payload.new;

        if (key === 'maintenance_mode') setLocked(value === 'true');
        
        if (key === 'system_broadcast') {
            setBroadcast(value);
            setTimeout(() => setBroadcast(''), 10000);
        }

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

  // ---------------------------------------------------------
  // 4. LIVE MAP PRESENCE
  // ---------------------------------------------------------
  useEffect(() => {
     // Don't join live map until we have IP (or failed to get it)
     if(ipInfo.ip === 'Detecting...') return;

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

  // --- OVERLAYS ---
  if (banned) return <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-red-600 font-mono p-4"><Ban className="w-24 h-24 mb-4 animate-pulse" /><h1 className="text-3xl font-bold text-center">ACCESS DENIED</h1><p className="mt-2 text-sm text-red-400">IP BLACKLISTED</p><p className="text-xs text-slate-600 mt-4 font-mono">{ipInfo.ip}</p></div>;
  if (locked && !location.pathname.includes('/admin')) return <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-red-600 font-mono p-4"><ShieldAlert className="w-24 h-24 mb-4 animate-pulse" /><h1 className="text-4xl font-bold text-center tracking-widest">SYSTEM LOCKDOWN</h1><p className="text-sm mt-4 text-red-800">ADMINISTRATIVE OVERRIDE ACTIVE</p></div>;
  if (broadcast) return <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-5 fade-in"><div className="bg-slate-900 border border-cyan-500 text-cyan-400 p-4 rounded shadow-lg flex items-center gap-3 max-w-sm"><Info className="w-5 h-5 shrink-0" /><div><h3 className="font-bold text-sm mb-1">ADMIN MESSAGE</h3><p className="text-xs text-slate-300 font-mono">{broadcast}</p></div></div></div>;

  return null;
}
