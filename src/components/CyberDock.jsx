import React from 'react';
import { motion } from 'framer-motion';
import { Home, Terminal, Shield, Lock, LayoutGrid } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const items = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: LayoutGrid, label: 'Projects', path: '/#projects' }, 
  { icon: Terminal, label: 'Tools', path: '/tools' },
  { icon: Shield, label: 'Admin', path: '/admin' },
  { icon: Lock, label: 'HUD', path: '/hud' },
];

export default function CyberDock() {
  const location = useLocation();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <motion.div 
        className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-4 py-3 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)]"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {items.map((item) => {
          // Check active state (handle root path vs subpaths)
          const isActive = item.path === '/' 
            ? location.pathname === '/' 
            : location.pathname.startsWith(item.path);

          return (
            <Link key={item.label} to={item.path}>
              <motion.div
                whileHover={{ scale: 1.2, y: -5 }}
                whileTap={{ scale: 0.9 }}
                className={`relative p-3 rounded-xl transition-colors group ${
                  isActive ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <item.icon className="w-6 h-6" />
                
                {/* Tooltip on Hover */}
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-[10px] px-2 py-1 rounded border border-slate-800 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap text-cyan-400 font-mono tracking-widest">
                  {item.label}
                </span>
                
                {/* Active Dot */}
                {isActive && (
                  <motion.div 
                    layoutId="activeDot" 
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-500 rounded-full" 
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
}
