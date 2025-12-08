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
import FirstBlood from '@/components/FirstBlood'; // <--- IMPORT

export default function Home() {
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
      // Check First Blood
      const logVisit = async () => {
          try {
              if (!sessionStorage.getItem('visited_today')) {
                  const res = await fetch('/api/net_handshake', { method: 'POST' });
                  if (res.ok) {
                      const data = await res.json();
                      if (data.isFirst) setShowReward(true);
                      sessionStorage.setItem('visited_today', 'true');
                  }
              }
          } catch(e) {}
      };
      logVisit();
  }, []);

  return (
    <div className="min-h-screen text-white overflow-x-hidden relative bg-black">
      {showReward && <FirstBlood onClose={() => setShowReward(false)} />}
      
      <div className="fixed inset-0 z-0 opacity-40"><MatrixRain /></div>
      <FloatingKeywords />
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-slate-900/80 to-slate-950 pointer-events-none z-[1]"></div>

      <div className="relative z-10">
        <HeroSection />
        <QuoteSection />
        <ProjectsSection />
        <TechStack />
        <ExperienceTimeline />
        <ApiShowcase />
        <MessageBoard />
        <Footer />
      </div>
      
      <Terminal />

      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 41, 59, 0.5); border-radius: 3px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.3); border-radius: 3px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.5); } html { scroll-behavior: smooth; } ::selection { background: rgba(6, 182, 212, 0.3); color: white; }`}</style>
    </div>
  );
}
