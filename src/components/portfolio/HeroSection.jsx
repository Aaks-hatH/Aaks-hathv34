import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, Mail } from 'lucide-react';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';

// ⚠️ PASTE YOUR DISCORD ID HERE
const DISCORD_ID = "1168575437723680850"; 

export default function HeroSection() {
  const [time, setTime] = useState(new Date());
  const [discordData, setDiscordData] = useState(null);
  const [isSleeping, setIsSleeping] = useState(false);

  useEffect(() => {
    // Time Logic
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);
      const nyHour = parseInt(now.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }));
      setIsSleeping(nyHour >= 23 || nyHour < 7);
    }, 1000);

    // Discord Lanyard Logic
    const fetchLanyard = async () => {
      if (!DISCORD_ID || DISCORD_ID.includes("YOUR_DISCORD")) return;
      try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const data = await res.json();
        if (data.success) setDiscordData(data.data);
      } catch (error) {
        console.error("Lanyard Error:", error);
      }
    };

    fetchLanyard();
    const lanyardInterval = setInterval(fetchLanyard, 30000);

    return () => {
      clearInterval(timer);
      clearInterval(lanyardInterval);
    };
  }, []);

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
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <span className="text-4xl">🇺🇸</span>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-2 mb-8"
      >
        <span className="bg-slate-800/80 border border-slate-700 px-3 py-1 rounded text-sm font-mono">
          <span className="text-slate-400">Status:</span>{' '}
          <span className="text-cyan-400">🎯 Focusing</span>
        </span>
      </motion.div>

      {/* Main Title - TERMINAL STYLE */}
      <motion.h1 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="text-4xl md:text-6xl font-mono font-bold text-center mb-4"
      >
        <span className="text-cyan-500">root@</span>
        <span className="text-slate-100">Aakshat</span>
        <span className="text-cyan-500">:~$</span>
        <motion.span 
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="bg-cyan-500 w-4 h-8 inline-block ml-2 align-middle"
        ></motion.span>
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-slate-400 text-lg md:text-xl text-center mb-2"
      >
        OSINT Analyst | Gray Hat Hacker | Web Developer
        <div>
        Hi, My name is Aakshat Hariharan, I like Computers and I love Hacking things.</div> <div>My motto is "Create the Problem, Sell the solution".</div> <div>Which is the motto of Gray/Red hat hacking.</div>

      </motion.p>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex gap-8 mb-8 mt-4"
      >
        <TooltipWrapper content="GitHub Profile">
          <motion.a 
            href="https://github.com/aaks-hath" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Github className="w-8 h-8 text-slate-400 group-hover:text-white transition-colors" />
            <div className="absolute inset-0 bg-white/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </motion.a>
        </TooltipWrapper>

        <TooltipWrapper content="TikTok">
          <motion.a 
            href="https://tiktok.com/@Aakshat.Hariharan" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative"
            whileHover={{ scale: 1.1, rotate: -5 }}
          >
            <svg className="w-8 h-8 text-slate-400 group-hover:text-[#ff0050] transition-colors" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
            <div className="absolute inset-0 bg-[#ff0050]/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </motion.a>
        </TooltipWrapper>

        <TooltipWrapper content="Send Email">
          <motion.a 
            href="mailto:hariharanaakshat@gmail.com"
            className="group relative"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Mail className="w-8 h-8 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            <div className="absolute inset-0 bg-cyan-400/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </motion.a>
        </TooltipWrapper>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-wrap justify-center gap-2"
      >
        <TooltipWrapper content="Live time in New York timezone (America/New_York)" side="bottom">
          <motion.span 
            className="bg-slate-800/80 border border-cyan-500/30 px-4 py-2 rounded font-mono text-sm cursor-help"
            whileHover={{ scale: 1.02 }}
          >
            <span className="text-slate-400">Time in NY:</span>{' '}
            <span className="text-cyan-400">{nyTime}</span>
          </motion.span>
        </TooltipWrapper>
        <TooltipWrapper content="Based on NY time: sleeping if between 11 PM - 7 AM" side="bottom">
          <motion.span 
            className="bg-slate-800/80 border border-cyan-500/30 px-4 py-2 rounded font-mono text-sm cursor-help"
            whileHover={{ scale: 1.02 }}
          >
            <span className="text-slate-400">Am I sleeping?</span>{' '}
            <span className="text-cyan-400">{isSleeping ? 'Yes 😴' : 'No 👀'}</span>
          </motion.span>
        </TooltipWrapper>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mt-8 bg-slate-900/60 border border-slate-700 rounded-xl p-4 flex items-center gap-4 min-w-[320px] backdrop-blur-sm"
      >
        <div className="relative">
          {discordData?.discord_user ? (
            <img 
              src={`https://cdn.discordapp.com/avatars/${discordData.discord_user.id}/${discordData.discord_user.avatar}.png`} 
              alt="Discord" 
              className="w-16 h-16 rounded-full border-2 border-slate-600"
            />
          ) : (
             <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-700">
                <span className="text-2xl">?</span>
             </div>
          )}
          <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-slate-900 ${getStatusColor(discordData?.discord_status)}`}></span>
        </div>
        <div>
          <p className="text-slate-200 font-semibold">
            {discordData?.discord_user?.username || "@Aaks-hatH"}
          </p>
          <p className="text-slate-400 text-sm">
            Status: <span className={discordData ? `text-${getStatusColor(discordData.discord_status).replace('bg-', '')}` : 'text-slate-400'}>
              {discordData?.discord_status || "Offline (Loading...)"}
            </span>
          </p>
          {discordData?.activities?.[0] && (
             <div className="mt-1">
               <p className="text-xs text-slate-500">Playing:</p>
               <p className="text-cyan-400 text-xs truncate max-w-[150px]">{discordData.activities[0].name}</p>
             </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}