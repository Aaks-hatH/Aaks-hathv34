import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/api/base44Client';
import { useLocation } from 'react-router-dom';
import { ShieldAlert, Info, Ban } from 'lucide-react';

export default function GlobalTracker() {
  const location = useLocation();
  const [locked, setLocked] = useState(false);
  const [banned, setBanned] = useState(false);
  const [broadcast, setBroadcast] = useState('');
  
  // State for identity - Defaulting coords to 0,0 prevents map crashes
  const [ipInfo, setIpInfo] = useState({ ip: 'Scanning...', geo: '---', coords: '0,0' });
  
  // Persistent ID for this session
  const [guestId] = useState(() => `GUEST-${Math.floor(Math.random() * 10000)}`);
  
  // Ref to track channel subscription to prevent duplicates
  const channelRef = useRef(null);

  // 1. IP DETECTION & IDENTITY RESOLUTION
  useEffect(() => {
    const getIdentity = async () => {
      try {
        const res = await fetch('/api/geo_resolve');
        if (res.ok) {
            const data = await res.json();
            // Data shape: { ip, geo, coords: "lat,lon", timestamp }
            setIpInfo(data); 
            
            // Check Ban Status immediately
            const { data: banData } = await supabase
                .from('banned_ips')
                .select('*')
                .eq('ip', data.ip)
                .maybeSingle();
            if (banData) setBanned(true);
        } else {
            setIpInfo({ ip: 'Hidden (VPN)', geo: 'Unknown', coords: '0,0' });
        }

        // Log Page View (Exclude Admin page from logs)
        if (!window.location.pathname.includes('/admin')) {
            fetch('/api/collect_telemetry', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actor_type: 'VISITOR', action: 'PAGE_VIEW', details: window.location.pathname })
            }).catch(() => {}); 
        }
      } catch (e) {
        setIpInfo({ ip: 'Error', geo: 'Unknown', coords: '0,0' });
      }
    };
    getIdentity();
  }, []);

  // 2. LIVE PRESENCE TRACKING
  useEffect(() => {
     // Clean up previous channel if it exists
     if (channelRef.current) supabase.removeChannel(channelRef.current);

     const channel = supabase.channel('online-users', { 
        config: { presence: { key: guestId } } 
     });
     
     channelRef.current = channel;

     channel.subscribe(async (status) => {
         if (status === 'SUBSCRIBED') {
             // CRITICAL: We send 'coords' here so the Admin Map can render markers
             await channel.track({ 
                 id: guestId, 
                 path: location.pathname, 
                 ua: navigator.userAgent, 
                 ip: ipInfo.ip, 
                 geo: ipInfo.geo,
                 coords: ipInfo.coords || '0,0', 
                 timestamp: new Date().toISOString() 
             });
         }
     });

     return () => { supabase.removeChannel(channel); };
  }, [location.pathname, ipInfo]); // Updates whenever Path OR Identity changes

  // 3. SYSTEM COMMAND LISTENER (Lockdown, Bans, Broadcasts)
  useEffect(() => {
    // Check initial maintenance state
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
            // Client-side execution of admin commands
            if (cmd === 'RICKROLL') window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
            if (cmd === 'RELOAD') window.location.reload();
            if (cmd.startsWith('ALERT:')) alert(cmd.split('ALERT:')[1]);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banned_ips' }, (payload) => {
         // Live Ban/Unban updates
         if (payload.new && payload.new.ip === ipInfo.ip) setBanned(true);
         if (payload.eventType === 'DELETE' && payload.old && payload.old.ip === ipInfo.ip) setBanned(false);
      })
      .subscribe();

    return () => { supabase.removeChannel(sysSub); };
  }, [ipInfo.ip]);

  // --- INTERFACE RENDERING ---

  // 1. The Ban Hammer (Destroys UI)
  if (banned) return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-red-600 font-mono p-4">
         <Ban className="w-24 h-24 mb-4 animate-pulse" />
         <h1 className="text-3xl font-bold text-center">ACCESS DENIED</h1>
         <p className="mt-2 text-sm text-red-400">IP BLACKLISTED</p>
      </div>
  );

  // 2. Lockdown Mode
  if (locked && !location.pathname.includes('/admin')) return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-red-600 font-mono p-4">
       <ShieldAlert className="w-24 h-24 mb-4 animate-pulse" />
       <h1 className="text-4xl font-bold text-center tracking-widest">SYSTEM LOCKDOWN</h1>
    </div>
  );

  // 3. Admin Broadcast Toast
  if (broadcast) return (
    <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-5 fade-in">
      <div className="bg-slate-900 border border-cyan-500 text-cyan-400 p-4 rounded shadow-lg flex items-center gap-3 max-w-sm">
        <Info className="w-5 h-5 shrink-0" />
        <div><h3 className="font-bold text-sm mb-1">ADMIN MESSAGE</h3><p className="text-xs text-slate-300 font-mono">{broadcast}</p></div>
      </div>
    </div>
  );

  // Invisible in normal state
  return null;
}
