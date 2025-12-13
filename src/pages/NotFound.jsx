import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center overflow-hidden relative">
      
      {/* Background Noise */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")'}}>
      </div>

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 max-w-md w-full border border-red-900/50 bg-slate-900/80 p-8 rounded-xl backdrop-blur-md shadow-[0_0_50px_rgba(220,38,38,0.2)]"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-500/10 rounded-full border border-red-500/30 animate-pulse">
            <AlertTriangle className="w-16 h-16 text-red-500" />
          </div>
        </div>

        <h1 className="text-4xl font-mono font-bold text-white mb-2">404 ERROR</h1>
        <h2 className="text-xl font-mono text-red-400 mb-6 tracking-widest">SIGNAL LOST</h2>

        <p className="text-slate-400 text-sm mb-8 font-mono">
          The requested path does not exist in this sector. <br/>
          Connection terminated.
        </p>
        
<p className="text-slate-400 text-sm mb-8 font-mono"> Are you a hacker?</p>
        
        <div className="flex gap-4 justify-center">
            <Link to="/">
                <Button className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">
                    <Home className="w-4 h-4 mr-2" /> Return to Base
                </Button>
            </Link>
            <Button variant="ghost" onClick={() => window.history.back()} className="text-slate-500 hover:text-white">
                <RotateCcw className="w-4 h-4 mr-2" /> Go Back
            </Button>
        </div>
      </motion.div>

      {/* Decorative Glitch Text at bottom */}
      <div className="absolute bottom-10 font-mono text-xs text-slate-800 select-none">
        ERR_CONNECTION_REFUSED :: 0x000F404
      </div>
    </div>
  );
}
