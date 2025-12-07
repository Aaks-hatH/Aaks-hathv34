import React, { useState, useEffect } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { ShieldCheck, Terminal, Lock } from 'lucide-react';

export default function LandingGate({ onVerify }) {
  const [text, setText] = useState('');
  const fullText = "INITIALIZING SECURE CONNECTION...";
  const [showCaptcha, setShowCaptcha] = useState(false);

  // Typewriter effect
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.substring(0, i));
      i++;
      if (i > fullText.length) {
        clearInterval(interval);
        setShowCaptcha(true);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full border border-green-900/50 bg-slate-950/50 p-8 rounded-xl shadow-[0_0_50px_rgba(0,255,0,0.1)] text-center">
        
        <div className="mb-8 relative inline-block">
          <ShieldCheck className="w-16 h-16 mx-auto text-green-600 animate-pulse" />
          <Lock className="w-6 h-6 text-white absolute bottom-0 right-0 bg-black rounded-full p-1 border border-green-600" />
        </div>

        <h1 className="text-xl font-bold tracking-widest text-white mb-2">SYSTEM DEFENSE</h1>
        <div className="h-4 mb-8 text-xs text-green-400">
            {text}<span className="animate-pulse">_</span>
        </div>

        <div className="flex justify-center min-h-[65px]">
          {showCaptcha && (
            <div className="animate-in fade-in zoom-in duration-500">
                {/* REUSE YOUR SITE KEY HERE */}
                <Turnstile 
                    siteKey="0x4AAAAAACFDgNVZZRDkdRXG" 
                    onSuccess={onVerify}
                    options={{ theme: 'dark', size: 'normal' }}
                />
            </div>
          )}
        </div>

        <div className="mt-8 text-[10px] text-slate-600 uppercase tracking-widest">
            DDoS Protection • Identity Verification • Secure Tunnel
        </div>
      </div>
    </div>
  );
}
