import React, { useEffect, useState } from 'react';
import { AlertTriangle, Eye, Lock, FileX, MousePointer2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AntiTamper() {
  const [warning, setWarning] = useState(null);
  const [icon, setIcon] = useState(null); // Dynamic icon based on threat

  const logIncident = (type, customIcon) => {
    // 1. Console Psy-Op
    if (type.includes('DevTools')) {
      console.clear();
      console.log("%c⛔ SECURITY ALERT ⛔", "color: red; font-size: 30px; font-weight: bold;");
    }

    // 2. Telemetry
    const data = JSON.stringify({
      actor_type: 'SUSPICIOUS_VISITOR',
      action: 'RECON_ATTEMPT',
      details: `Trigger: ${type}`
    });
    
    if (navigator.sendBeacon) navigator.sendBeacon('/api/collect_telemetry', data);
    else fetch('/api/collect_telemetry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data }).catch(() => {});

    // 3. UI Feedback
    setIcon(customIcon || <AlertTriangle className="w-5 h-5 text-red-500" />);
    setWarning(type);
    setTimeout(() => setWarning(null), 3000);
  };

  useEffect(() => {
    // A. Context Menu (Passive Monitor)
    const handleContextMenu = () => logIncident('Context Menu Scan', <Eye className="w-5 h-5 text-yellow-500" />);

    // B. Data Exfiltration (Copy/Cut)
    const handleCopy = () => logIncident('Clipboard Exfiltration', <Eye className="w-5 h-5 text-red-400" />);

    // C. Asset Theft (Drag & Drop)
    const handleDragStart = (e) => {
        e.preventDefault(); // BLOCK dragging images
        logIncident('Asset Extraction Attempt', <Lock className="w-5 h-5 text-orange-500" />);
    };

    // D. Keyboard Shortcuts (Save, Print, Source)
    const handleKeyDown = (e) => {
      // F12 or Ctrl+Shift+I/J/C (DevTools)
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key.toUpperCase()))) {
        logIncident('DevTools Shortcut');
      }
      
      // Ctrl+S (Save Page)
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault(); // BLOCK Saving
        logIncident('Source Code Dump (Ctrl+S)', <FileX className="w-5 h-5 text-red-600" />);
      }

      // Ctrl+P (Print)
      if (e.ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault(); // BLOCK Printing
        logIncident('Print-to-PDF Scrape', <FileX className="w-5 h-5 text-red-600" />);
      }

      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key.toLowerCase() === 'u') {
        e.preventDefault(); // BLOCK Source View
        logIncident('Source Code Inspection', <Code className="w-5 h-5 text-red-500" />);
      }
    };

    // E. Touch Gestures (Mobile/Tablet Hybrid)
    const handleTouchStart = (e) => {
      if (e.touches.length > 2) logIncident('Multi-Touch Probe', <MousePointer2 className="w-5 h-5 text-blue-400" />);
    };

    // Attach Listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCopy);
    document.addEventListener('dragstart', handleDragStart); // Added Drag Block
    document.addEventListener('touchstart', handleTouchStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCopy);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  return (
    <AnimatePresence>
      {warning && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/95 border border-red-500/50 text-red-100 px-6 py-3 rounded-lg shadow-[0_0_50px_rgba(220,38,38,0.4)] backdrop-blur-md flex items-center gap-4 min-w-[320px]"
        >
          <div className="bg-red-500/10 p-2 rounded-full border border-red-500/30">
            {icon}
          </div>
          <div>
            <h4 className="font-bold text-[10px] tracking-[0.2em] text-red-500 mb-1 uppercase">
              Security Protocol Active
            </h4>
            <p className="text-xs font-mono text-slate-300">
              Intervention: <span className="text-white font-bold">{warning}</span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}