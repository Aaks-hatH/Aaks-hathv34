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
      // 1. Log Visit & Check for "First Blood" Achievement
      const logVisit = async () => {
          try {
              // We use sessionStorage to ensure we don't count the same tab refresh twice
              if (!sessionStorage.getItem('visited_today')) {
                  
                  // Call the backend to increment counter and check rank
                  const res = await fetch('/api/net_handshake', { method: 'POST' });
                  
                  if (res.ok) {
                      const data = await res.json();
                      
                      // If backend says we are #1 today
                      if (data.isFirst) {
                          setShowReward(true);
                      }
                      
                      // Mark session as visited
                      sessionStorage.setItem('visited_today', 'true');
                  }
              }
          } catch(e) {
              console.error("Handshake failed");
          }
      };
      
      logVisit();
  }, []);

  return (
    <div className="min-h-screen text-white overflow-x-hidden relative bg-black">
      
      {/* 0. FIRST BLOOD OVERLAY (Only shows for visitor #1) */}
      {showReward && <FirstBlood onClose={() => setShowReward(false)} />}

      {/* 1. Matrix Background (Fixed Layer) */}
      <div className="fixed inset-0 z-0 opacity-40">
        <MatrixRain />
      </div>
      
      {/* 2. Floating Words (Fixed Layer) */}
      <FloatingKeywords />
      
      {/* 3. Gradient Overlay (Fade from Transparent to Dark) */}
      {/* Allows the Matrix rain to be seen at top, but fades to black for readability at bottom */}
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-slate-900/80 to-slate-950 pointer-events-none z-[1]"></div>

      {/* 4. Main Content (High Z-Index) */}
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
      
      {/* 5. Interactive Terminal (Draggable/Fixed) */}
      <Terminal />

      {/* Global Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 41, 59, 0.5); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.3); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.5); }
        
        /* Smooth Scroll */
        html { scroll-behavior: smooth; }
        
        /* Selection Color */
        ::selection { background: rgba(6, 182, 212, 0.3); color: white; }
      `}</style>
    </div>
  );
}
