import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, Mail, Cloud, Moon, Sun, Terminal, Wifi } from 'lucide-react';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import { supabase } from '@/api/base44Client';

// ⚠️ PASTE YOUR DISCORD ID HERE
const DISCORD_ID = "1168575437723680850"; 

export default function HeroSection() {
  const [time, setTime] = useState(new Date());
  const [discordData, setDiscordData] = useState(null);
  const [weather, setWeather] = useState(null);
  
  // Default state
  const [adminStatus, setAdminStatus] = useState({ online: false, task: 'System Idle' });
  const [isSleeping, setIsSleeping] = useState(false);

  useEffect(() => {
    // 1. TIME & SLEEP LOGIC
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);
      
      // Calculate NY Time Hour
      const nyHour = parseInt(now.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }));
      setIsSleeping(nyHour >= 23 || nyHour < 7); // Sleeping between 11 PM and 7 AM
    }, 1000);

    // 2. DISCORD LANYARD
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

    // 3. WEATHER (New York)
    const fetchWeather = async () => {
        try {
            const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.00&current_weather=true');
            const data = await res.json();
            setWeather(data.current_weather);
        } catch (e) {}
    };
    fetchWeather();

    // 4. ADMIN STATUS (HUD Connection)
    const checkStatus = async () => {
        const { data } = await supabase.from('admin_status').select('*').eq('id', 1).single();
        if (data) {
            const lastBeat = new Date(data.last_heartbeat).getTime();
            const now = new Date().getTime();
            const isLive = (now - lastBeat) < 120000; // 2 mins timeout
            setAdminStatus({
                online: data.is_online && isLive,
                task: data.current_task
            });
        }
    };
    checkStatus();

    const statusSub = supabase.channel('public-status')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'admin_status' }, (payload) => {
          if(payload.new) {
            setAdminStatus({
                online: payload.new.is_online,
                task: payload.new.current_task
            });
          }
      })
      .subscribe();

    return () => {
      clearInterval(timer);
      clearInterval(lanyardInterval);
      supabase.removeChannel(statusSub);
    };
  }, []);

  // Format NY Time
  const nyTime = time.toLocaleString('en-US', { 
    timeZone: 'America/New_York', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

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
      
      {/* FLAG */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <span className="text-4xl">🇺🇸</span>
      </motion.div>

      {/* ADMIN STATUS BADGE (From HUD) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center gap-2 mb-8"
      >
        <div className={`border px-4 py-1 rounded-full text-xs font-mono flex items-center gap-2 transition-all duration-500 ${adminStatus.online ? 'bg-green-900/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-slate-900/80 border-slate-700 text-slate-500'}`}>
          <div className="relative flex h-2 w-2">
            {adminStatus.online && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${adminStatus.online ? 'bg-green-500' : 'bg-slate-600'}`}></span>
          </div>
          {adminStatus.online ? "ADMIN ONLINE" : "ADMIN OFFLINE"}
        </div>
        
        {/* CURRENT TASK */}
        {adminStatus.online && (
            <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-[10px] text-cyan-400 font-mono bg-cyan-950/30 px-3 py-1 rounded border border-cyan-900/50"
            >
               <Terminal className="w-3 h-3" />
               <span>EXEC: {adminStatus.task}</span>
            </motion.div>
        )}
      </motion.div>

      {/* TERMINAL TITLE */}
      <motion.h1 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="text-4xl md:text-6xl font-mono font-bold text-center mb-4 tracking-tight"
      >
        <span className="text-cyan-500">root@</span>
        <span className="text-slate-100">Aakshat</span>
        <span className="text-cyan-500">:~$</span>
        <motion.span 
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="bg-cyan-500 w-3 h-6 md:h-10 inline-block ml-2 align-middle"
        ></motion.span>
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-slate-400 text-lg md:text-xl text-center mb-8"
      >
        OSINT Analyst | Gray Hat Hacker | Web Developer
      </motion.p>

      {/* SOCIAL ICONS */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex gap-6 mb-12"
      >
        <TooltipWrapper content="GitHub">
          <motion.a href="https://github.com/aaks-hath" target="_blank" rel="noopener noreferrer" className="group relative" whileHover={{ scale: 1.1, rotate: 5 }}>
            <Github className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
            <div className="absolute inset-0 bg-white/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </motion.a>
        </TooltipWrapper>

        <TooltipWrapper content="Email">
          <motion.a href="mailto:hariharanaakshat@gmail.com" className="group relative" whileHover={{ scale: 1.1, rotate: 5 }}>
            <Mail className="w-6 h-6 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            <div className="absolute inset-0 bg-cyan-400/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </motion.a>
        </TooltipWrapper>
      </motion.div>

      {/* INFO GRID (Time, Sleep, Weather, Discord) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl"
      >
        
        {/* 1. TIME & SLEEP */}
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-center justify-between backdrop-blur-sm">
            <div>
                <p className="text-xs text-slate-500 font-mono mb-1">NY TIME</p>
                <p className="text-xl text-white font-mono">{nyTime}</p>
            </div>
            <div className="text-right">
                <p className="text-xs text-slate-500 font-mono mb-1">STATUS</p>
                <div className={`flex items-center gap-2 ${isSleeping ? 'text-purple-400' : 'text-yellow-400'}`}>
                    {isSleeping ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    <span className="text-sm font-bold">{isSleeping ? 'SLEEPING 😴' : 'AWAKE 👀'}</span>
                </div>
            </div>
        </div>

        {/* 2. WEATHER & DISCORD */}
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-center justify-between backdrop-blur-sm">
             {/* Weather */}
            <div>
                <p className="text-xs text-slate-500 font-mono mb-1">NYC WEATHER</p>
                <div className="flex items-center gap-2 text-cyan-400">
                    <Cloud className="w-4 h-4" />
                    <span className="text-lg font-mono">{weather ? `${weather.temperature}°C` : '...'}</span>
                </div>
            </div>

            {/* Discord */}
            <div className="text-right">
                <p className="text-xs text-slate-500 font-mono mb-1">DISCORD</p>
                <div className="flex items-center gap-2 justify-end">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(discordData?.discord_status)}`}></div>
                    <span className="text-sm text-slate-300 capitalize">{discordData?.discord_status || 'Offline'}</span>
                </div>
            </div>
        </div>

      </motion.div>

      {/* Discord Activity (Playing...) */}
      {discordData?.activities?.[0] && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-xs text-slate-500 font-mono flex items-center gap-2"
        >
            <Wifi className="w-3 h-3 animate-pulse text-green-500" />
            Playing: <span className="text-green-400">{discordData.activities[0].name}</span>
        </motion.div>
      )}

    </section>
  );
}
