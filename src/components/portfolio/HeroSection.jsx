import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, Mail } from 'lucide-react';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import { supabase } from '@/api/base44Client';

// YOUR DISCORD ID (Keep this for the avatar status)
const DISCORD_ID = "1168575437723680850"; 

export default function HeroSection() {
  const [time, setTime] = useState(new Date());
  const [discordData, setDiscordData] = useState(null);
  
  // Default to Offline until database connects
  const [adminStatus, setAdminStatus] = useState({ online: false, task: 'System Idle' });

  useEffect(() => {
    // 1. Time Logic
    const timer = setInterval(() => setTime(new Date()), 1000);

    // 2. Discord Lanyard Logic
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

    // 3. ADMIN STATUS LISTENER (The New Part)
    const fetchStatus = async () => {
        const { data } = await supabase.from('admin_status').select('*').eq('id', 1).single();
        if (data) {
            // Verify heartbeat isn't stale (older than 2 mins)
            const lastBeat = new Date(data.last_heartbeat).getTime();
            const now = new Date().getTime();
            const isLive = (now - lastBeat) < 120000; // 2 mins timeout
            
            setAdminStatus({
                online: data.is_online && isLive,
                task: data.current_task
            });
        }
    };
    fetchStatus();

    // Realtime Subscription
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

  const nyTime = time.toLocaleString('en-US', { 
    timeZone: 'America/New_York', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  return (
    <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <span className="text-4xl">🇺🇸</span>
      </motion.div>

      {/* LIVE STATUS BADGE */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center gap-2 mb-8"
      >
        <span className={`border px-4 py-1 rounded-full text-sm font-mono flex items-center gap-3 transition-all duration-500 ${adminStatus.online ? 'bg-green-900/30 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-slate-900/80 border-slate-700 text-slate-500'}`}>
          <span className="relative flex h-3 w-3">
            {adminStatus.online && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${adminStatus.online ? 'bg-green-500' : 'bg-slate-600'}`}></span>
          </span>
          {adminStatus.online ? "ADMIN ONLINE" : "ADMIN OFFLINE"}
        </span>
        
        {adminStatus.online && (
            <motion.span 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-cyan-500 font-mono bg-cyan-900/10 px-2 py-1 rounded border border-cyan-900/30"
            >
               CURRENT TASK: {adminStatus.task}
            </motion.span>
        )}
      </motion.div>

      {/* TERMINAL TITLE */}
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
      </motion.p>

      {/* ICONS */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex gap-8 mb-8 mt-4"
      >
        <TooltipWrapper content="GitHub">
          <motion.a href="https://github.com/aaks-hath" target="_blank" rel="noopener noreferrer" className="group relative" whileHover={{ scale: 1.1, rotate: 5 }}>
            <Github className="w-8 h-8 text-slate-400 group-hover:text-white transition-colors" />
          </motion.a>
        </TooltipWrapper>

        <TooltipWrapper content="Email">
          <motion.a href="mailto:hariharanaakshat@gmail.com" className="group relative" whileHover={{ scale: 1.1, rotate: 5 }}>
            <Mail className="w-8 h-8 text-slate-400 group-hover:text-cyan-400 transition-colors" />
          </motion.a>
        </TooltipWrapper>
      </motion.div>

      {/* TIME BADGE */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <TooltipWrapper content="Live NY Time">
          <span className="bg-slate-800/80 border border-cyan-500/30 px-4 py-2 rounded font-mono text-sm text-cyan-400">
            NY Time: {nyTime}
          </span>
        </TooltipWrapper>
      </motion.div>
    </section>
  );
}
