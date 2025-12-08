import React, { useEffect, useState } from 'react';
import { Github, Mail, Shield, Users } from 'lucide-react';
import { supabase } from '@/api/base44Client';

export default function Footer() {
  const [defcon, setDefcon] = useState(5);
  const [dailyCount, setDailyCount] = useState(0);

  useEffect(() => {
    supabase.from('system_config').select('value').eq('key', 'defcon_level').maybeSingle()
      .then(({ data }) => { if(data) setDefcon(parseInt(data.value)); });

    const today = new Date().toISOString().split('T')[0];
    supabase.from('daily_stats').select('count').eq('date', today).maybeSingle()
       .then(({ data }) => { if(data) setDailyCount(data.count); });

    const sub = supabase.channel('footer-stats')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_config' }, (payload) => {
        if(payload.new.key === 'defcon_level') setDefcon(parseInt(payload.new.value));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_stats' }, (payload) => {
        if(payload.new && payload.new.date === today) setDailyCount(payload.new.count);
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  const getDefconColor = () => {
    if(defcon === 1) return 'text-red-600 animate-pulse';
    if(defcon === 2) return 'text-orange-500';
    if(defcon === 3) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <footer className="relative z-10 py-8 px-4 border-t border-slate-800 bg-slate-950">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono border border-slate-800 px-4 py-2 rounded-full bg-slate-900 shadow-sm">
                <Shield className={`w-4 h-4 ${getDefconColor()}`} />
                <span className="text-slate-500">THREAT LEVEL:</span>
                <span className={`font-bold ${getDefconColor()}`}>DEFCON {defcon}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono border border-slate-800 px-4 py-2 rounded-full bg-slate-900 shadow-sm">
                <Users className="w-4 h-4 text-cyan-500" />
                <span className="text-slate-500">TODAY'S VISITS:</span>
                <span className="text-cyan-400 font-bold">{dailyCount}</span>
            </div>
        </div>
        <div className="flex justify-center gap-6">
          <a href="https://github.com/aaks-hath" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
          <a href="mailto:hariharanaakshat@gmail.com" className="text-slate-500 hover:text-cyan-400 transition-colors"><Mail className="w-5 h-5" /></a>
        </div>
        <div className="text-slate-600 text-[10px] font-mono uppercase tracking-widest">
          <p>© {new Date().getFullYear()} Aakshat Hariharan</p>
        </div>
        <div>
          <p className="mt-1 opacity-50">Secure Infrastructure • End-to-End Encrypted</p>
        </div>
      </div>
    </footer>
  );
}
