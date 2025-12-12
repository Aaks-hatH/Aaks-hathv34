import React, { useEffect, useState } from 'react';
import { AlertTriangle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AntiTamper() {
  const [warning, setWarning] = useState(null);

  // Helper to log the incident to your backend
  const logIncident = (type) => {
    // 1. Console "Psychological Warfare"
    if (type.includes('DevTools')) {
      console.clear();
      console.log(
        "%c⛔ SECURITY ALERT ⛔", 
        "color: red; font-size: 30px; font-weight: bold; text-shadow: 2px 2px black;"
      );
      console.log(
        "%cYour IP and Actions are being logged by the Vigilante Security System.", 
        "color: white; font-size: 16px; background: black; padding: 5px;"
      );
    }

    // 2. Send to Backend
    const data = JSON.stringify({
      actor_type: 'SUSPICIOUS_VISITOR',
      action: 'RECON_ATTEMPT',
      details: `Trigger: ${type}`
    });
    
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/collect_telemetry', data);
    } else {
      fetch('/api/collect_telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data
      }).catch(() => {});
    }

    // 3. Show UI Warning
    setWarning(type);
    
    // Hide warning after 3 seconds
    setTimeout(() => setWarning(null), 3000);
  };

  useEffect(() => {
    // A. PASSIVE Right Click (Detects but allows)
    const handleContextMenu = () => {
      // e.preventDefault(); <--- WE REMOVED THIS (Allows the menu)
      logIncident('Context Menu / Inspection');
    };

    // B. Detect DevTools Shortcuts (F12, Ctrl+Shift+I)
    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toUpperCase() === 'U')
      ) {
        // We still block these because they open the pane immediately
        // e.preventDefault(); // Optional: Uncomment to block F12
        logIncident('DevTools Shortcut Triggered');
      }
    };

    // C. Detect Copy/Cut (Data Exfiltration)
    const handleCopy = () => {
        logIncident('Clipboard Copy / Exfiltration');
    };

    // D. Console Trap (Debugger)
    // This slows down the script if DevTools is open
    const antiDebug = setInterval(() => {
        const start = performance.now();
        // debugger; // <--- Uncomment this line to PAUSE hackers (Aggressive)
        const end = performance.now();
        if (end - start > 100) {
            logIncident('DevTools Debugger Attached');
        }
    }, 2000);

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCopy);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCopy);
      clearInterval(antiDebug);
    };
  }, []);

  return (
    <AnimatePresence>
      {warning && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 border border-red-500 text-red-100 px-6 py-3 rounded-lg shadow-[0_0_50px_rgba(220,38,38,0.4)] backdrop-blur-md flex items-center gap-4 min-w-[320px]"
        >
          <div className="bg-red-500/20 p-2 rounded-full animate-pulse border border-red-500/50">
            {warning.includes('Clipboard') ? <Eye className="w-5 h-5 text-red-400" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
          </div>
          <div>
            <h4 className="font-bold text-xs tracking-[0.2em] text-red-500 mb-1">SURVEILLANCE ACTIVE</h4>
            <p className="text-[10px] font-mono text-slate-400">
              LOGGED: <span className="text-white">{warning}</span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}