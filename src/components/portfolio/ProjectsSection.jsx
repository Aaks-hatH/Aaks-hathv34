import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ProjectCard from './ProjectCard';
import { Filter, SortAsc, Terminal } from 'lucide-react';

const projects = [
  {
    id: "army-knife", // Updated to point to new detail entry
    title: "Cyber Army Knife", 
    description: "The ultimate Red Team dashboard. Includes GPS Map, Neural WAF, Steganography & Auto-Ban systems.",
    link: "/tools",
    emoji: "⚔️",
    tags: ["Red Team", "React", "Supabase"],
    updated: "Live",
    category: "security"
  },
  {
    id: "face-rec",
    title: "Face Recognizer",
    description: "A browser-based face recognition tool using machine learning and detection libraries.",
    link: "https://aaks-hath.github.io/face-rec/",
    emoji: "👤",
    tags: ["ML", "JavaScript", "AI"],
    updated: "2025",
    category: "ai"
  },
  {
    id: "keylogger-py", // New Project
    title: "Python Keylogger",
    description: "Advanced educational malware demonstrating hooks, screenshotting, and SMTP exfiltration.",
    link: "https://github.com/aaks-hath/keylogger-py",
    emoji: "⌨️",
    tags: ["Python", "Malware Dev", "Education"],
    updated: "2025",
    category: "security"
  },
  {
    id: "password-generator",
    title: "Password Generator",
    description: "Creates secure, randomized passwords with adjustable strength options.",
    link: "https://aaks-hath.github.io/Password-Generator/",
    emoji: "🔐",
    tags: ["Security", "JavaScript"],
    updated: "2025",
    category: "security"
  },
  {
    id: "password-checker",
    title: "Password Strength Checker",
    description: "Evaluates password strength based on entropy, complexity, and known weak patterns.",
    link: "https://aaks-hath.github.io/Password-Checker/",
    emoji: "🛡️",
    tags: ["Security", "Analysis"],
    updated: "2025",
    category: "security"
  },
  {
    id: "halloween-game",
    title: "Halloween Game",
    description: "A themed web game with backend-style components and progression logic.",
    link: "https://aaks-hath.github.io/Halloween-Game/",
    emoji: "🎃",
    tags: ["Game", "Full-Stack", "JavaScript"],
    updated: "2025",
    category: "game"
  },
  {
    id: "network-scanner",
    title: "Network Scanner",
    description: "Python-based Nmap scanner for vulnerability assessment and port discovery.",
    link: "https://github.com/aaks-hath",
    emoji: "🔍",
    tags: ["Python", "Networking", "Nmap"],
    updated: "WIP",
    category: "security"
  },
  {
    id: "portfolio",
    title: "Personal Website",
    description: "My personal portfolio and project showcase hosted on GitHub Pages.",
    link: "https://aaks-hath.github.io/",
    emoji: "🌐",
    tags: ["HTML", "CSS", "Portfolio"],
    updated: "2024",
    category: "web"
  }
];

export default function ProjectsSection() {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("default");

  const filteredProjects = projects.filter(p => 
    filter === "all" || p.category === filter
  );

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sort === "name") return a.title.localeCompare(b.title);
    return 0;
  });

  return (
    <section className="relative z-10 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12"
        >
          <div className="p-3 bg-slate-900 rounded-xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
             <Terminal className="w-8 h-8 text-cyan-400" /> 
          </div>

          <h2 className="text-3xl md:text-5xl font-mono font-bold text-slate-100 tracking-tight">
            <span className="text-cyan-500">./</span>
            <span>Aakshat_Hariharan</span>
            <span className="animate-pulse text-cyan-500">_</span>
          </h2>
        </motion.div>

        {/* Dropdowns */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap gap-4 mb-8 justify-center md:justify-start"
        >
          <div className="relative group">
            <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 pointer-events-none z-10" />
            <select 
              value={sort} 
              onChange={(e) => setSort(e.target.value)}
              className="w-48 bg-slate-900 border border-slate-700 text-slate-300 rounded-lg py-2 pl-10 pr-8 appearance-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 cursor-pointer hover:bg-slate-800 transition-colors"
            >
              <option value="default">Featured</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>

          <div className="relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 pointer-events-none z-10" />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="w-48 bg-slate-900 border border-slate-700 text-slate-300 rounded-lg py-2 pl-10 pr-8 appearance-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 cursor-pointer hover:bg-slate-800 transition-colors"
            >
              <option value="all">All Projects</option>
              <option value="security">Security</option>
              <option value="web">Web</option>
              <option value="ai">AI/ML</option>
              <option value="game">Games</option>
            </select>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProjects.map((project, index) => (
            <ProjectCard key={project.title} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
