import React from 'react';
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

export default function Home() {
  return (
    // REMOVED "bg-slate-900" so it doesn't block the canvas
    <div className="min-h-screen text-white overflow-x-hidden relative bg-black">
      
      {/* 1. Matrix Background (Fixed Position, z-index 0) */}
      <div className="fixed inset-0 z-0">
        <MatrixRain />
      </div>
      
      {/* 2. Floating Words (Fixed Position, z-index 0) */}
      <FloatingKeywords />
      
      {/* 3. Gradient Overlay - FIXED: Made top transparent so you can see the rain */}
      {/* z-index 1 sits ON TOP of the rain but UNDER the content */}
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-slate-900/60 to-slate-900 pointer-events-none z-[1]"></div>

      {/* Main Content (z-index 10 to sit above everything) */}
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
      
      {/* Interactive Terminal (Highest z-index) */}
      <Terminal />

      {/* Global Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 41, 59, 0.5); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.3); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.5); }
        html { scroll-behavior: smooth; }
        *:focus-visible { outline: 2px solid rgba(6, 182, 212, 0.5); outline-offset: 2px; }
      `}</style>
    </div>
  );
}