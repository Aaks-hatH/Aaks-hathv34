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
  const [visitCount, setVisitCount] = useState(0);
  const [isSleeping, setIsSleeping] = useState(false);
  
  // Initialize with a default to prevent hydration errors
  const [adminStatus, setAdminStatus] = useState({ online: false, task: 'System Idle' });

  useEffect(() => {
    // 1. Time & Sleep
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);
      const nyHour = parseInt(now.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }));
      setIsSleeping(nyHour >= 23 || nyHour < 7);
    }, 1000);

    // 2. Discord
    const fetchLanyard = async () => {
      if (!DISCORD_ID) return;
      try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const data = await res.json();
        if (data.success) setDiscordData(data.data);
      } catch (error) { console.error("Lanyard Error:", error); }
    };
    fetchLanyard();
    setInterval(fetchLanyard, 30000);

    // 3. Weather
    const fetchWeather = async () => {
        try {
            const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.00&current_weather=true');
            const data = await res.json();
            setWeather(data.current_weather);
        } catch (e) {}
    };
    fetchWeather();

    // 4. Visit Stats
    const today = new Date().toISOString().split('T')[0];
    supabase.from('daily_stats').select('count').eq('date', today).maybeSingle()
       .then(({ data }) => { if(data) setVisitCount(data.count); });

    // 5. ADMIN STATUS (Supabase Realtime)
    const checkStatus = async () => {
        const { data } = await supabase.from('admin_status').select('*').eq('id', 1).maybeSingle();
        if (data) {
            // Check if heartbeat is fresh (2 mins)
            const lastBeat = new Date(data.last_heartbeat).getTime();
            const now = new Date().getTime();
            const isLive = (now - lastBeat) < 120000; 
            setAdminStatus({ online: data.is_online && isLive, task: data.current_task });
        }
    };
    checkStatus();

    const statusSub = supabase.channel('public-status-hero')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'admin_status' }, (payload) => {
          if(payload.new) {
            setAdminStatus({ 
                online: payload.new.is_online === true, 
                task: payload.new.current_task 
            });
          }
      })
      .subscribe();

    return () => {
        clearInterval(timer);
        supabase.removeChannel(statusSub);
    };
  }, []);

  const nyTime = time.toLocaleString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false });

  // LOGIC: What text to show?
  // 1. If Admin is Online & has a task -> Show Task
  // 2. Else if Playing Discord Game -> Show Game
  // 3. Else -> System Idle
  const getStatusText = () => {
      if (adminStatus.online && adminStatus.task && adminStatus.task !== "System Idle") {
          return adminStatus.task; // Shows "Researching: google.com"
      }
      if (discordData?.activities?.[0]) {
          return `Playing: ${discordData.activities[0].name}`;
      }
      return "System Idle";
  };

  return (
    <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12 font-mono text-slate-300">
      
      {/* HEADER STATS */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4 mb-8">
        <span className="text-4xl drop-shadow-md grayscale-[0.2]">🇺🇸</span>
        
        <div className="flex gap-3 text-[11px] font-bold tracking-wide">
            <div className="bg-slate-800/80 border border-slate-700 px-3 py-1 rounded text-slate-400">
                Unique visitors: <span className="text-cyan-400">12,403</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 px-3 py-1 rounded text-slate-400">
                Visits today: <span className="text-cyan-400">{visitCount}</span>
            </div>
        </div>
      </motion.div>

      {/* TITLE */}
      <motion.h1 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ delay: 0.2 }} 
        className="text-3xl md:text-5xl font-bold mb-4 flex items-center gap-2 text-slate-100"
      >
        <span className="text-cyan-500">&lt;</span>
        <span className="glitch-wrapper">
            <span className="glitch-text" data-text="Aakshat_Hariharan">
                Aakshat_Hariharan
            </span>
        </span>
        <span className="text-cyan-500">/&gt;</span>
      </motion.h1>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-sm md:text-base text-slate-400 mb-8">
        OSINT Analyst <span className="mx-2 text-slate-600">|</span> Fullstack Developer <span className="mx-2 text-slate-600">|</span> Red Team
      </motion.p>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="max-w-2xl text-center space-y-2 mb-10 text-xs md:text-sm leading-relaxed text-slate-400">
        <p>I’m an OSINT-driven cybersecurity researcher turning information into insight.</p>
        <p>My approach is simple: "Make the problem, sell the solution."</p>
        <p>I uncover risks, analyze footprints, and build automated defenses.</p>
        <p>More about me below!</p>
      </motion.div>

      {/* SOCIALS */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex gap-4 mb-12">
        <TooltipWrapper content="GitHub"><a href="https://github.com/aaks-hath" target="_blank" className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 hover:text-white transition-colors"><Github className="w-5 h-5" /></a></TooltipWrapper>
        <TooltipWrapper content="Email"><a href="mailto:hariharanaakshat@gmail.com" className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 hover:text-cyan-400 transition-colors"><Mail className="w-5 h-5" /></a></TooltipWrapper>
      </motion.div>

      {/* PILLS */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex flex-wrap justify-center gap-4 mb-12 w-full max-w-4xl">
        <div className="bg-[#1e293b] border-l-4 border-cyan-500 px-4 py-2 rounded shadow-lg flex items-center gap-2 text-xs md:text-sm">
            <span className="text-cyan-500 font-bold">Time in my country:</span><span className="text-slate-200">{nyTime}</span>
        </div>
        <div className="bg-[#1e293b] border-l-4 border-amber-500 px-4 py-2 rounded shadow-lg flex items-center gap-2 text-xs md:text-sm">
            <span className="text-amber-500 font-bold">Temperature in NYC:</span><span className="text-slate-200 flex items-center gap-1">{weather ? `${weather.temperature}°C` : '--'} <Cloud className="w-3 h-3 text-slate-400"/></span>
        </div>
        <div className="bg-[#1e293b] border-l-4 border-red-500 px-4 py-2 rounded shadow-lg flex items-center gap-2 text-xs md:text-sm">
            <span className="text-red-500 font-bold">Am I sleeping right now?</span><span className="text-slate-200">{isSleeping ? "Yes 😴" : "No 🚀"}</span>
        </div>
      </motion.div>

      {/* STATUS CARD */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }} className="bg-slate-900/80 border border-slate-700 rounded-xl p-6 w-full max-w-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-slate-800 to-slate-900"></div>
        <div className="relative flex flex-col items-center mt-4">
            <div className="relative">
                {discordData?.discord_user ? (<img src={`https://cdn.discordapp.com/avatars/${discordData.discord_user.id}/${discordData.discord_user.avatar}.png`} className="w-20 h-20 rounded-full border-4 border-slate-900 shadow-xl" />) : (<div className="w-20 h-20 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center"><User className="w-10 h-10 text-slate-500" /></div>)}
                <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-slate-900 ${adminStatus.online ? 'bg-green-500' : 'bg-slate-500'}`}></div>
            </div>
            <h3 className="mt-3 text-lg font-bold text-white">@{discordData?.discord_user?.username || 'Aakshat'}</h3>
            <p className="text-xs text-slate-500 mb-4">{adminStatus.online ? 'Online' : 'Offline'}</p>
            
            {/* UPDATED STATUS BOX */}
            <div className="w-full bg-slate-950/50 rounded p-3 text-center border border-slate-800/50">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Current Status</p>
                <p className="text-xs text-cyan-400 font-mono">
                    {getStatusText()}
                </p>
            </div>
        </div>
      </motion.div>

    </section>
  );
}
