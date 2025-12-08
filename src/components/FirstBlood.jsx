import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, X, Terminal } from 'lucide-react';
import Confetti from 'react-confetti';

export default function FirstBlood({ onClose }) {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Play a sound effect
  useEffect(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md">
      <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} colors={['#22c55e', '#000000', '#ffffff']} />
      
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="max-w-lg w-full bg-slate-950 border-2 border-green-500 p-8 rounded-xl text-center relative shadow-[0_0_50px_rgba(34,197,94,0.3)]"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
            <X className="w-6 h-6" />
        </button>

        <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-500/20 rounded-full border border-green-500 animate-pulse">
                <Trophy className="w-16 h-16 text-green-400" />
            </div>
        </div>

        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">ACHIEVEMENT UNLOCKED</h1>
        <h2 className="text-xl font-mono text-green-500 mb-6 flex items-center justify-center gap-2">
            <Crown className="w-5 h-5" /> FIRST_BLOOD
        </h2>

        <div className="bg-black border border-slate-800 p-4 font-mono text-xs text-left space-y-2 text-slate-300">
            <p className="flex gap-2"><span className="text-green-500">➜</span> <span>PROTOCOL: DAY_ZERO_ACCESS</span></p>
            <p className="flex gap-2"><span className="text-green-500">➜</span> <span>STATUS: You are the first visitor today.</span></p>
            <p className="flex gap-2"><span className="text-green-500">➜</span> <span>REWARD: Admin Recognition +1</span></p>
        </div>

        <button 
            onClick={onClose}
            className="mt-8 w-full bg-green-600 hover:bg-green-500 text-black font-bold py-3 rounded uppercase tracking-widest transition-colors"
        >
            Claim Reward & Enter
        </button>

      </motion.div>
    </div>
  );
}
