import React, { useEffect, useState } from 'react';
import { Github, Mail, Shield } from 'lucide-react';
import { supabase } from '@/api/base44Client';

export default function Footer() {
  const [defcon, setDefcon] = useState(5); // 5 = Low, 1 = Critical

  useEffect(() => {
    // 1. Get Initial Level
    supabase.from('system_config').select('value').eq('key', 'defcon_level').maybeSingle()
      .then(({ data }) => { if(data) setDefcon(parseInt(data.value)); });

    // 2. Listen for Changes
    const sub = supabase.channel('defcon-alert')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_config' }, (payload) => {
        if(payload.new.key === 'defcon_level') setDefcon(parseInt(payload.new.value));
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  const getDefconColor = () => {
    if(defcon === 1) return 'text-red-600 animate-pulse'; // Critical
    if(defcon === 2) return 'text-orange-500';
    if(defcon === 3) return 'text-yellow-500';
    return 'text-green-500'; // Normal
  };

  return (
    <footer className="relative z-10 py-8 px-4 border-t border-slate-800 bg-slate-950">
      <div className="max-w-4xl mx-auto text-center">
        
        {/* DEFCON WIDGET */}
        <div className="mb-6 flex items-center justify-center gap-2 text-xs font-mono border border-slate-800 inline-block px-4 py-2 rounded-full bg-slate-900">
            <Shield className={`w-4 h-4 ${getDefconColor()}`} />
            <span className="text-slate-400">THREAT LEVEL:</span>
            <span className={`font-bold ${getDefconColor()}`}>DEFCON {defcon}</span>
        </div>

        <div className="flex justify-center gap-4 mb-4">
          <a href="https://github.com/aaks-hath" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400">
            <Github className="w-5 h-5" />
          </a>
          <a href="mailto:hariharanaakshat@gmail.com" className="text-slate-400 hover:text-cyan-400">
            <Mail className="w-5 h-5" />
          </a>
          <div>
            <p className="text-slate-500 text-sm font-mono"> Made, Developed, and Pentested by Aakshat Hariharan
            </p>
          </div>
        </div>
        <p className="text-slate-500 text-sm font-mono">© {new Date().getFullYear()} Aakshat Hariharan</p>
      </div>
      <div>
        <p className="text-slate-500 text-sm font-mono"> Inspired By kotokk.dev
        </p>
      </div>
    </footer>
  );
}
