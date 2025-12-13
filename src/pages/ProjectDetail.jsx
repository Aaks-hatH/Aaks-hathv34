import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  ArrowLeft, ExternalLink, Github, FileCode, ShieldAlert, ImageOff 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// ==========================================
// PROJECT DATA (Now with Image Paths)
// ==========================================
const projectsData = {
  'army-knife': {
    title: 'Cyber Army Knife',
    image: '/projects/army-knife.png', // <--- Added
    description: 'The ultimate browser-based Red Team dashboard.',
    longDescription: `A comprehensive Security Operations Center (SOC) running entirely in the browser.
    
    **Core Capabilities:**
    • War Room Map: Real-time GPS tracking.
    • Neural WAF: Client-side Heuristic analysis.
    • Sentinel System: Auto-bans brute force attackers.
    
    **Intercepted Artifact:**
    We recovered this file during the last Red Team engagement. Intelligence suggests it contains a hidden transmission (The Flag), but standard text editors show nothing. Analysis via the internal Steganography Studio is recommended.`,
    features: ['Real-time Tracking', 'AES/Stego Encryption', 'Auto-Ban & Email', 'AI Auditing', 'Forensics'],
    technologies: ['React', 'Supabase', 'Cloudflare', 'EmailJS', 'Leaflet'],
    github: 'cyber-army-knife',
    demo: '/tools',
    hiddenClueImage: "/projects/suspect_artifact_v4.png", 
    inProgress: false
  },
  'face-rec': {
    title: 'Face Recognizer',
    image: '/projects/face-rec.png', // <--- Added
    description: 'Browser-based face recognition using TensorFlow.js.',
    longDescription: 'Face Detection, Landmarks, and Expression analysis running client-side.',
    features: ['Face Detection', 'Expression Recognition', 'Client-side ML'],
    technologies: ['JavaScript', 'TensorFlow.js', 'HTML5 Canvas'],
    github: 'face-rec', 
    demo: 'https://aaks-hath.github.io/face-rec/',
    inProgress: false
  },
  'password-generator': {
    title: 'Password Generator',
    image: '/projects/password-gen.png', // <--- Added
    description: 'Creates secure, randomized passwords with adjustable strength options.',
    longDescription: 'Cryptographically secure random number generation for passwords.',
    features: ['Adjustable Length', 'Entropy Calc', 'Copy to Clipboard'],
    technologies: ['JS', 'Web Crypto API'],
    github: 'Password-Generator', 
    demo: 'https://aaks-hath.github.io/Password-Generator/',
    inProgress: false
  },
  'password-checker': {
    title: 'Password Checker',
    image: '/projects/password-check.png', // <--- Added
    description: 'Analyzes password strength vs known patterns.',
    longDescription: 'Checks entropy and common dictionary words.',
    features: ['Strength Meter', 'Time-to-Crack Est'],
    technologies: ['JS', 'Regex'],
    github: 'Password-Checker', 
    demo: 'https://aaks-hath.github.io/Password-Checker/',
    inProgress: false
  },
  'halloween-game': {
    title: 'Halloween Game',
    image: '/projects/halloween.png', // <--- Added
    description: 'Full-stack web game with scoring system.',
    longDescription: 'Spooky themed game with user auth and leaderboards.',
    features: ['Auth', 'Leaderboard', 'Game Loop'],
    technologies: ['PHP', 'MySQL', 'JS'],
    github: 'Halloween-Game', 
    demo: 'https://aaks-hath.github.io/Halloween-Game/',
    inProgress: false
  },
  'keylogger-py': {
    title: 'Python Keylogger',
    image: '/projects/keylogger.png', // <--- Added
    description: 'Educational malware demonstration.',
    longDescription: 'Demonstrates hooks, logging, and exfiltration.',
    features: ['Hooks', 'Logging', 'Encryption'],
    technologies: ['Python', 'pynput'],
    github: 'keylogger-py', 
    demo: null,
    inProgress: true
  },
  'network-scanner': {
    title: 'Network Scanner',
    image: '/projects/network.png', // <--- Added
    description: 'Python Nmap wrapper.',
    longDescription: 'Automated port scanning and recon.',
    features: ['Port Scan', 'Service Detect'],
    technologies: ['Python', 'Nmap'],
    github: 'Aaks-hatH', 
    demo: null,
    inProgress: true
  },
  'portfolio': {
    title: 'Portfolio',
    image: '/projects/portfolio.png', // <--- Added
    description: 'This website.',
    longDescription: 'React + Vite + Cloudflare Pages.',
    features: ['Animations', 'Security', 'Themes'],
    technologies: ['React', 'Tailwind'],
    github: 'aaks-hath.github.io', 
    demo: 'https://aaks-hath.github.io/',
    inProgress: false
  }
};

export default function ProjectDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');
  const project = projectsData[projectId];
  
  const [repoData, setRepoData] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const fetchRepoData = async () => {
      if (!project?.github) return;
      try {
        const res = await fetch(`https://api.github.com/repos/aaks-hath/${project.github}`);
        if (res.ok) setRepoData(await res.json());
      } catch (err) {}
    };
    fetchRepoData();
  }, [project?.github]);

  if (!project) return (<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Project Not Found</div>);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-slate-900 text-white pb-20">
      
      {/* TOP NAV */}
      <div className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-opacity-80">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link to={createPageUrl('Home')} className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Portfolio
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* HERO HEADER WITH IMAGE */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* LARGE PROJECT SCREENSHOT */}
          <div className="w-full md:w-1/2 aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-700 shadow-2xl relative group">
            {!imgError ? (
                <img 
                    src={project.image} 
                    alt={project.title} 
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                    <ImageOff className="w-12 h-12 mb-2 opacity-50" />
                    <span className="text-xs font-mono">IMAGE NOT FOUND</span>
                </div>
            )}
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* PROJECT INFO */}
          <div className="flex-1 space-y-4 pt-2">
            <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold text-white tracking-tight">{project.title}</h1>
                {project.inProgress && <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">WIP</Badge>}
            </div>
            
            <p className="text-lg text-slate-400 leading-relaxed">{project.description}</p>
            
            <div className="flex flex-wrap gap-3 pt-2">
                {project.demo && (
                    <a href={project.demo} target={project.demo.startsWith('http') ? "_blank" : "_self"} rel="noreferrer">
                        <Button className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-6">
                            <ExternalLink className="w-4 h-4 mr-2"/> Live Demo
                        </Button>
                    </a>
                )}
                {project.github && (
                    <a href={`https://github.com/aaks-hath/${project.github}`} target="_blank" rel="noreferrer">
                        <Button variant="outline" className="border-slate-700 hover:bg-slate-800 text-slate-300">
                            <Github className="w-4 h-4 mr-2"/> Source Code
                        </Button>
                    </a>
                )}
            </div>

            {/* Repo Stats */}
            {repoData && (
                <div className="flex gap-4 text-xs font-mono text-slate-500 pt-2">
                    <span>⭐ {repoData.stargazers_count} Stars</span>
                    <span>🍴 {repoData.forks_count} Forks</span>
                    <span>👁️ {repoData.watchers_count} Watchers</span>
                </div>
            )}
          </div>
        </div>

        {/* 🕵️ EVIDENCE LOCKER (CTF TRAP) */}
        {project.hiddenClueImage && (
          <Card className="bg-red-950/10 border-red-900/50 border-dashed animate-in slide-in-from-bottom-4 duration-700">
            <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-5 h-5"/> EVIDENCE LOCKER
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  "The truth is often hidden in plain sight." <br/>
                  <span className="text-xs text-slate-600 font-mono">
                    File: suspect_artifact_v4.png | Status: ENCRYPTED
                  </span>
                </p>
                <p className="text-xs text-cyan-500 font-mono">
                  &gt; Hint: Download this and run it through the Steganography Studio.
                </p>
              </div>
              <div className="shrink-0">
                <a href={project.hiddenClueImage} download="suspect_artifact.png">
                  <img 
                    src={project.hiddenClueImage} 
                    alt="Encrypted Artifact" 
                    className="w-32 h-32 object-cover rounded border border-red-500/30 hover:opacity-80 transition-opacity cursor-download"
                    title="Click to Download Evidence"
                  />
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* DETAILS GRID */}
        <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-slate-200 mb-4">About the Project</h3>
                    <p className="text-slate-400 whitespace-pre-line leading-relaxed text-sm">
                        {project.longDescription}
                    </p>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-slate-200 mb-4">Key Features</h3>
                        <ul className="space-y-2">
                            {project.features.map((f,i) => (
                                <li key={i} className="flex gap-2 text-slate-400 text-sm">
                                    <span className="text-cyan-500">▹</span> {f}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-slate-200 mb-4 flex gap-2 items-center">
                            <FileCode className="w-5 h-5 text-cyan-500"/> Tech Stack
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {project.technologies.map((t,i) => (
                                <Badge key={i} className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700">
                                    {t}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

      </div>
    </motion.div>
  );
}
