import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AntiTamper() {
  const [warning, setWarning] = useState(null);

  // Helper to log the incident to your backend
  const logIncident = (type) => {
    // We use sendBeacon for reliability when closing tabs/windows
    const data = JSON.stringify({
      actor_type: 'SUSPICIOUS_VISITOR',
      action: 'RECON_ATTEMPT',
      details: `Trigger: ${type}`
    });
    
    // Try Beacon first, fall back to Fetch
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/collect_telemetry', data);
    } else {
      fetch('/api/collect_telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data
      }).catch(() => {});
    }

    // Show UI Warning
    setWarning(type);
    
    // Hide warning after 4 seconds
    setTimeout(() => setWarning(null), 4000);
  };

  useEffect(() => {
    // 1. Disable Right Click (Context Menu)
    const handleContextMenu = (e) => {
      e.preventDefault();
      logIncident('Right-Click / Inspect Attempt');
    };

    // 2. Detect DevTools Shortcuts (F12, Ctrl+Shift+I, etc)
    const handleKeyDown = (e) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        logIncident('F12 DevTools Trigger');
      }
      
      // Ctrl+Shift+I (Inspect), J (Console), C (Element), U (Source)
      if (e.ctrlKey && e.shiftKey && (['I','J','C'].includes(e.key.toUpperCase()))) {
        e.preventDefault();
        logIncident(`DevTools Shortcut (Ctrl+Shift+${e.key.toUpperCase()})`);
      }
      
      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key.toUpperCase() === 'U') {
        e.preventDefault();
        logIncident('View Source Attempt');
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <AnimatePresence>
      {warning && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-red-950/90 border border-red-500 text-red-100 px-6 py-4 rounded-lg shadow-[0_0_30px_rgba(220,38,38,0.5)] backdrop-blur-md flex items-center gap-4 min-w-[300px]"
        >
          <div className="bg-red-500/20 p-2 rounded-full animate-pulse">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h4 className="font-bold text-sm tracking-widest text-red-500">SECURITY ALERT</h4>
            <p className="text-xs font-mono mt-1">
              Tampering detected. Incident logged.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
