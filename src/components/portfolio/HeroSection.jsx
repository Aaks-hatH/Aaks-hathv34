import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, Mail, Cloud, Moon, Sun, Terminal, Wifi, User } from 'lucide-react';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import { supabase } from '@/api/base44Client';

const DISCORD_ID = "1168575437723680850"; 

export default function HeroSection() {
  const [time, setTime] = useState(new Date());
  const [discordData, setDiscordData] = useState(null);
  const [weather, setWeather] = useState(null);
  const [adminStatus, setAdminStatus] = useState({ online: false, task: 'System Idle' });
  const [isSleeping, setIsSleeping] = useState(false);

  useEffect(() => {
    // Time & Sleep Status
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);
      const nyHour = parseInt(now.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }));
      setIsSleeping(nyHour >= 23 || nyHour < 7);
    }, 1000);

    // Discord Lanyard
    const fetchLanyard = async () => {
      if (!DISCORD_ID) return;
      try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const data = await res.json();
        if (data.success) setDiscordData(data.data);
      } catch (error) { console.error("Lanyard Error:", error); }
    };
    fetchLanyard();
    const lanyardInterval = setInterval(fetchLanyard, 30000);

    // Weather
    const fetchWeather = async () => {
        try {
            const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.00&current_weather=true');
            const data = await res.json();
            setWeather(data.current_weather);
        } catch (e) {}
    };
    fetchWeather();

    // Admin Status (Supabase)
    const checkStatus = async () => {
        const { data } = await supabase.from('admin_status').select('*').eq('id', 1).maybeSingle();
        if (data) {
            const lastBeat = new Date(data.last_heartbeat).getTime();
            const now = new Date().getTime();
            const isLive = (now - lastBeat) < 120000; 
            setAdminStatus({ online: data.is_online && isLive, task: data.current_task });
        }
    };
    checkStatus();

    const statusSub = supabase.channel('public-status')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'admin_status' }, (payload) => {
          if(payload.new) {
            setAdminStatus({ online: payload.new.is_online === true, task: payload.new.current_task });
          }
      })
      .subscribe();

    return () => {
      clearInterval(timer);
      clearInterval(lanyardInterval);
      supabase.removeChannel(statusSub);
    };
  }, []);

  const nyTime = time.toLocaleString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false });
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20">
      
      {/* 1. THE FLAG */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <span className="text-5xl drop-shadow-2xl filter brightness-75">🇺🇸</span>
      </motion.div>

      {/* 2. STATUS BADGE */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col items-center gap-3 mb-12">
        <div className={`border px-5 py-1.5 rounded-full text-[10px] font-mono tracking-widest flex items-center gap-3 transition-all duration-500 ${adminStatus.online ? 'bg-green-950/20 border-green-500/30 text-green-400' : 'bg-slate-900/50 border-slate-800 text-slate-500'}`}>
          <div className="relative flex h-2 w-2">
            {adminStatus.online && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${adminStatus.online ? 'bg-green-500' : 'bg-slate-600'}`}></span>
          </div>
          <span className="font-bold">{adminStatus.online ? "SYSTEM ONLINE" : "SYSTEM OFFLINE"}</span>
        </div>
        
        {adminStatus.online && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-[10px] text-cyan-400/80 font-mono">
               <Terminal className="w-3 h-3" />
               <span>EXEC: {adminStatus.task}</span>
            </motion.div>
        )}
      </motion.div>

      {/* 3. TERMINAL TITLE */}
      <motion.h1 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ delay: 0.3 }} 
        className="text-4xl md:text-6xl lg:text-7xl font-mono font-bold text-center mb-10 tracking-tighter"
      >
        <span className="text-cyan-600">root@</span>
        <span className="text-slate-200">Aakshat</span>
        <span className="text-cyan-600 mr-2">:~$</span>
        <motion.span 
          animate={{ opacity: [1, 0, 1] }} 
          transition={{ duration: 1, repeat: Infinity, ease: "steps(2)" }} 
          className="text-cyan-500 inline-block align-baseline"
        >
          █
        </motion.span>
      </motion.h1>

      {/* 4. BLENDED TEXT CONTENT */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.5 }} 
        className="max-w-4xl text-center mb-16 space-y-6"
      >
        {/* Intro */}
        <p className="text-slate-400 text-lg md:text-xl font-mono leading-relaxed">
          I’m an OSINT-driven cybersecurity researcher who turns <span className="text-slate-200">information into insight</span>.
        </p>

        {/* The Quote - Now uses a gradient to blend/pop without looking weird */}
        <div className="py-4">
          <p className="text-xl md:text-3xl font-bold font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 drop-shadow-sm">
            "Make the problem, sell the solution."
          </p>
        </div>

        {/* Description */}
        <p className="text-slate-500 text-sm md:text-base font-mono leading-relaxed max-w-2xl mx-auto">
          I uncover risks, analyze digital footprints, and build automated solutions that keep systems a step ahead of threats.
        </p>
      </motion.div>

      {/* 5. SOCIALS */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="flex gap-8 mb-20">
        <TooltipWrapper content="GitHub">
            <motion.a href="https://github.com/aaks-hath" target="_blank" rel="noopener noreferrer" className="group p-2 opacity-70 hover:opacity-100 transition-opacity" whileHover={{ scale: 1.1, rotate: 5 }}>
                <Github className="w-7 h-7 text-slate-300" />
            </motion.a>
        </TooltipWrapper>
        <TooltipWrapper content="Email">
            <motion.a href="mailto:hariharanaakshat@gmail.com" className="group p-2 opacity-70 hover:opacity-100 transition-opacity" whileHover={{ scale: 1.1, rotate: -5 }}>
                <Mail className="w-7 h-7 text-slate-300" />
            </motion.a>
        </TooltipWrapper>
      </motion.div>

      {/* 6. INFO GRID (Darker, more blended) */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
        <div className="bg-slate-950/40 border border-slate-800/60 p-5 rounded-lg flex items-center justify-between backdrop-blur-sm hover:border-cyan-900/30 transition-colors group">
            <div><p className="text-[9px] uppercase tracking-widest text-slate-600 font-mono mb-2">Local Time</p><p className="text-2xl text-slate-200 font-mono tracking-tighter">{nyTime}</p></div>
            <div className="text-right"><p className="text-[9px] uppercase tracking-widest text-slate-600 font-mono mb-2">Admin State</p><div className={`flex items-center gap-2 justify-end ${isSleeping ? 'text-purple-400' : 'text-yellow-500'}`}>{isSleeping ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}<span className="text-xs font-bold font-mono">{isSleeping ? 'ASLEEP' : 'ACTIVE'}</span></div></div>
        </div>
        <div className="bg-slate-950/40 border border-slate-800/60 p-5 rounded-lg flex items-center justify-between backdrop-blur-sm hover:border-cyan-900/30 transition-colors group">
            <div><p className="text-[9px] uppercase tracking-widest text-slate-600 font-mono mb-2">Weather</p><div className="flex items-center gap-2 text-cyan-500"><Cloud className="w-5 h-5" /><span className="text-2xl font-mono tracking-tighter">{weather ? `${weather.temperature}°` : '--'}</span></div></div>
            <div className="text-right"><p className="text-[9px] uppercase tracking-widest text-slate-600 font-mono mb-2">Discord</p><div className="flex items-center gap-3 justify-end">{discordData?.discord_user ? (<img src={`https://cdn.discordapp.com/avatars/${discordData.discord_user.id}/${discordData.discord_user.avatar}.png`} className="w-8 h-8 rounded-full border border-slate-800/50 opacity-90"/>) : <User className="w-6 h-6 text-slate-700" />}<div className="flex flex-col items-end"><span className={`w-2 h-2 rounded-full ${getStatusColor(discordData?.discord_status)}`}></span></div></div></div>
        </div>
      </motion.div>

      {/* DISCORD ACTIVITY */}
      {discordData?.activities?.[0] && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-[10px] text-slate-600 font-mono flex items-center gap-3 bg-black/40 px-6 py-2 rounded-full border border-slate-800/30">
            <Wifi className="w-3 h-3 animate-pulse text-green-500/50" />
            <span>Uplink: <span className="text-green-500/80 font-bold">{discordData.activities[0].name}</span></span>
        </motion.div>
      )}

    </section>
  );
}
