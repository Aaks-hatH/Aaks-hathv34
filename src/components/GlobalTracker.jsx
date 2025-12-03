import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/base44Client';
import { useLocation } from 'react-router-dom';
import { ShieldAlert, Info, Ban } from 'lucide-react';

export default function GlobalTracker() {
  const location = useLocation();
  const [locked, setLocked] = useState(false);
  const [banned, setBanned] = useState(false);
  const [broadcast, setBroadcast] = useState('');
  // Default to basic info so it doesn't crash
  const [ipInfo, setIpInfo] = useState({ ip: 'Identifying...', geo: 'Unknown' });
  const [guestId] = useState(`GUEST-${Math.floor(Math.random() * 100000)}`);

  // 1. IDENTITY CHECK (Robust)
  useEffect(() => {
    const getIdentity = async () => {
      try {
        const res = await fetch('/api/whoami');
        if (!res.ok) throw new Error("Backend Missing");
        const data = await res.json();
        setIpInfo(data);
        
        // Check Ban Status
        const { data: banData } = await supabase
          .from('banned_ips')
          .select('*')
          .eq('ip', data.ip)
          .maybeSingle();
          
        if (banData) setBanned(true);
      } catch (e) {
        console.warn("Whoami failed (using fallback):", e);
        setIpInfo({ ip: '127.0.0.1', geo: 'Hidden (API Fail)' });
      }
    };
    getIdentity();
  }, []);

  // 2. REALTIME COMMAND CENTER
  useEffect(() => {
    console.log("🔌 Connecting to System Channels...");
    
    const channel = supabase.channel('system-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_config' }, (payload) => {
        console.log("⚡ SIGNAL RECEIVED:", payload);
        const { key, value } = payload.new;

        if (key === 'maintenance_mode') setLocked(value === 'true');
        
        if (key === 'system_broadcast') {
            setBroadcast(value);
            setTimeout(() => setBroadcast(''), 10000);
        }

        if (key === 'system_command') {
            const cmd = value.split('|')[0]; // Remove timestamp
            if (cmd === 'RICKROLL') window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
            if (cmd === 'RELOAD') window.location.reload();
            if (cmd.startsWith('ALERT:')) alert(cmd.split('ALERT:')[1]);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'banned_ips' }, (payload) => {
        if (payload.new.ip === ipInfo.ip) setBanned(true);
      })
      .subscribe((status) => {
        console.log("System Status:", status);
      });

    return () => { supabase.removeChannel(channel); };
  }, [ipInfo.ip]);

  // 3. SPY BROADCAST (Presence)
  useEffect(() => {
    const channel = supabase.channel('online-users', {
      config: { presence: { key: guestId } }
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log("📡 Broadcasting Location...");
        await channel.track({
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

  // --- UI ---
  if (banned) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center text-red-600 font-mono p-4">
         <div className="text-center border border-red-900 p-10 bg-red-950/20">
            <Ban className="w-20 h-20 mx-auto mb-4" />
            <h1 className="text-3xl font-bold">CONNECTION TERMINATED</h1>
            <p className="mt-2 text-sm text-red-400">BLACKLISTED TARGET.</p>
            <p className="text-xs text-slate-600 mt-4 font-mono">{ipInfo.ip}</p>
         </div>
      </div>
    );
  }

  if (locked && !location.pathname.includes('/admin')) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center text-red-600 font-bold text-2xl">
        SYSTEM LOCKDOWN ACTIVE
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
