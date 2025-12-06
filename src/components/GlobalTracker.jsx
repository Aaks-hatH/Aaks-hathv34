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

  // 1. IP & BAN CHECK
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/geo_resolve');
        if (res.ok) {
            const data = await res.json();
            setIpInfo(data);
            const { data: banData } = await supabase.from('banned_ips').select('*').eq('ip', data.ip).maybeSingle();
            if (banData) setBanned(true);
        } else {
            setIpInfo({ ip: 'Hidden (VPN)', geo: 'Unknown' });
        }
        
        // Log view
        if (!window.location.pathname.includes('/admin')) {
            fetch('/api/collect_telemetry', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actor_type: 'VISITOR', action: 'PAGE_VIEW', details: window.location.pathname })
            }).catch(() => {}); 
        }
      } catch (e) { setIpInfo({ ip: 'Error', geo: 'Unknown' }); }
    };
    init();
  }, []);

  // 2. REALTIME COMMANDS
  useEffect(() => {
    supabase.from('system_config').select('value').eq('key', 'maintenance_mode').maybeSingle()
      .then(({ data }) => { if (data?.value === 'true') setLocked(true); });

    const sysSub = supabase.channel('system-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_config' }, (payload) => {
        if (!payload.new) return;
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

  // 3. PRESENCE
  useEffect(() => {
     if(ipInfo.ip === 'Detecting...') return;
     const channel = supabase.channel('online-users', { config: { presence: { key: guestId } } });
     channel.subscribe(status => {
         if(status === 'SUBSCRIBED') {
             channel.track({ id: guestId, path: location.pathname, ua: navigator.userAgent, ip: ipInfo.ip, geo: ipInfo.geo, timestamp: new Date().toISOString() });
         }
     });
     return () => { supabase.removeChannel(channel); };
  }, [location, guestId, ipInfo]);

  // --- HARDCORE SECURITY ENFORCEMENT ---
  if (banned) {
      // ☢️ NUCLEAR OPTION: Destroy the React App
      const root = document.getElementById('root');
      if (root) {
          root.innerHTML = ''; // Wipe the DOM so there is nothing to reveal
          root.style.display = 'none'; // Hide the container
      }
      
      // Inject raw HTML for the ban screen (outside React)
      document.body.style.backgroundColor = 'black';
      document.body.innerHTML = `
        <div style="height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#ef4444;font-family:monospace;text-align:center;">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
            <h1 style="font-size:3rem;margin:20px 0;">CONNECTION TERMINATED</h1>
            <p>YOUR IP (${ipInfo.ip}) HAS BEEN PERMANENTLY BLACKLISTED.</p>
        </div>
      `;
      // Stop execution
      throw new Error("BANNED USER DETECTED - EXECUTION HALTED"); 
  }

  // Lockdown (Soft block, keeps app loaded but hidden)
  if (locked && !location.pathname.includes('/admin')) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-red-600 font-mono p-4">
        <ShieldAlert className="w-24 h-24 mb-4 animate-pulse" />
        <h1 className="text-4xl font-bold text-center tracking-widest">SYSTEM LOCKDOWN</h1>
      </div>
    );
  }

  if (broadcast) return <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-5 fade-in"><div className="bg-slate-900 border border-cyan-500 text-cyan-400 p-4 rounded shadow-lg flex items-center gap-3 max-w-sm"><Info className="w-5 h-5 shrink-0" /><div><h3 className="font-bold text-sm mb-1">ADMIN MESSAGE</h3><p className="text-xs text-slate-300 font-mono">{broadcast}</p></div></div></div>;

  return null;
}
