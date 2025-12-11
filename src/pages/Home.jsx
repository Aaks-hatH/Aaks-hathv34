import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FloatingKeywords from '@/components/portfolio/FloatingKeywords';
import HeroSection from '@/components/portfolio/HeroSection';
import QuoteSection from '@/components/portfolio/QuoteSection';
import ProjectsSection from '@/components/portfolio/ProjectsSection';
import TechStack from '@/components/portfolio/TechStack';
import ExperienceTimeline from '@/components/portfolio/ExperienceTimeline';
import ApiShowcase from '@/components/portfolio/ApiShowcase';
import MessageBoard from '@/components/portfolio/MessageBoard';
import Footer from '@/components/portfolio/Footer';
import Terminal from '@/components/portfolio/Terminal';
import MatrixRain from '@/components/portfolio/MatrixRain';
import FirstBlood from '@/components/FirstBlood';

export default function Home() {
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
      // Check First Blood Status
      const logVisit = async () => {
          try {
              // Only check if we haven't visited in this session
              if (!sessionStorage.getItem('visited_today')) {
                  const res = await fetch('/api/net_handshake', { method: 'POST' });
                  if (res.ok) {
                      const data = await res.json();
                      if (data.isFirst) setShowReward(true);
                      sessionStorage.setItem('visited_today', 'true');
                  }
              }
          } catch(e) {
              console.error("Connection Check Failed");
          }
      };
      logVisit();
  }, []);

  return (
    <div className="min-h-screen text-white overflow-x-hidden relative bg-black">
      {/* 1. First Blood Achievement Modal */}
      {showReward && <FirstBlood onClose={() => setShowReward(false)} />}
      
      {/* 2. Visual Effects Layer */}
      <div className="fixed inset-0 z-0 opacity-40"><MatrixRain /></div>
      <FloatingKeywords />
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-slate-900/80 to-slate-950 pointer-events-none z-[1]"></div>

      {/* 3. Main Content Layer */}
      <div className="relative z-10">
        <HeroSection />
        <QuoteSection />
        <ProjectsSection />
        <TechStack />
        <ExperienceTimeline />
        <ApiShowcase />
        <MessageBoard />
        <Footer />
        
        {/* 
            🕷️ HONEY LINK (TRIPWIRE) 
            Invisible to humans. If a bot or hacker clicks this while scraping,
            they get instant IP Ban via /api/tripwire 
        */}
        <a 
          href="/api/tripwire" 
          style={{ 
            opacity: 0, 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            zIndex: -1, 
            width: '1px', 
            height: '1px', 
            overflow: 'hidden' 
          }}
          aria-hidden="true"
          tabIndex="-1"
          rel="nofollow"
        >
          SysAdmin Backup Login (Do Not Click)
        </a>
      </div>
      
      {/* 4. Global Terminal Overlay */}
      <Terminal />

      {/* Global Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; } 
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 41, 59, 0.5); border-radius: 3px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.3); border-radius: 3px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.5); } 
        html { scroll-behavior: smooth; } 
        ::selection { background: rgba(6, 182, 212, 0.3); color: white; }
      `}</style>
    </div>
  );
}
