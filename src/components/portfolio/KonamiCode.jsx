import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull } from 'lucide-react';

const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 
  'b', 'a'
];

export default function KonamiCode() {
  const [input, setInput] = useState([]);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const newItem = e.key;
      const newInput = [...input, newItem].slice(-KONAMI_CODE.length);
      setInput(newInput);

      if (JSON.stringify(newInput) === JSON.stringify(KONAMI_CODE)) {
        setUnlocked(true);
        // Play a sound if you want
        // new Audio('/unlock.mp3').play();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [input]);

  return (
    <AnimatePresence>
      {unlocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setUnlocked(false)}
        >
          <div className="text-center space-y-4 animate-pulse">
            <Skull className="w-32 h-32 text-red-600 mx-auto" />
            <h1 className="text-6xl font-black text-red-600 font-mono tracking-tighter">
              GOD MODE UNLOCKED
            </h1>
            <p className="text-red-400 font-mono">
              Admin Access Granted... (Just kidding, but nice find!)
            </p>
            <p className="text-slate-500 text-sm mt-8">Click anywhere to close</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}