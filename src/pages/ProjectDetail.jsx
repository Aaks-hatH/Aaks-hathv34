import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  ArrowLeft, 
  ExternalLink, 
  Github, 
  Calendar, 
  Star, 
  GitFork,
  Eye,
  Code2,
  FileCode,
  Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// Project data with GitHub repo names
const projectsData = {
  'army-knife': {
    title: 'Cyber Army Knife',
    emoji: '⚔️',
    description: 'The ultimate browser-based Red Team dashboard. Features real-time GPS tracking, Steganography tools, Neural WAF, and Dead Man\'s Switch authentication.',
    longDescription: `A comprehensive Security Operations Center (SOC) running entirely in the browser and Cloudflare Edge.

**Core Capabilities:**
• **War Room Map**: Real-time GPS tracking of visitors using Leaflet & Supabase.
• **Neural WAF**: Client-side Heuristic analysis to block SQLi/XSS payloads.
• **Sentinel System**: Auto-bans brute force attackers and sends forensic email alerts.
• **Steganography Studio**: Hide encrypted text inside PNG image pixels.
• **Dead Man's Switch**: Physical security layer preventing admin login if HUD is offline.

This project demonstrates advanced React patterns, Edge computing security, and real-time database management.`,
    features: [
      'Real-time GPS Visitor Tracking',
      'AES & Steganography Encryption',
      'Auto-Ban & Email Alerting',
      'AI Code Auditing (GPT-4o)',
      'Forensic EXIF Extraction'
    ],
    technologies: ['React', 'Supabase Realtime', 'Cloudflare Workers', 'EmailJS', 'Leaflet', 'OpenAI'],
    github: 'cyber-army-knife',
    demo: '/tools',
    category: 'Security',
    inProgress: false
  },
  'face-rec': {
    title: 'Face Recognizer',
    emoji: '👤',
    description: 'A browser-based face recognition tool using machine learning and detection libraries. This project leverages TensorFlow.js and face-api.js.',
    longDescription: `This face recognition tool demonstrates the power of client-side machine learning. It uses:

• **Face Detection**: Identifies faces in images or video streams
• **Landmark Detection**: Maps 68 facial landmarks for precise analysis
• **Face Recognition**: Compares faces against known samples
• **Expression Analysis**: Detects emotions like happy, sad, angry, etc.

The entire process runs in the browser, ensuring privacy as no images are sent to external servers.`,
    features: [
      'Real-time face detection via webcam',
      'Multiple face detection support',
      'Facial landmark visualization',
      'Expression recognition',
      'No server required - runs entirely in browser'
    ],
    technologies: ['JavaScript', 'TensorFlow.js', 'face-api.js', 'HTML5 Canvas', 'WebRTC'],
    github: 'face-rec',
    demo: 'https://aaks-hath.github.io/face-rec/',
    category: 'AI/ML'
  },
  'password-generator': {
    title: 'Password Generator',
    emoji: '🔐',
    description: 'Creates secure, randomized passwords with adjustable strength options. Uses cryptographically secure random number generation.',
    longDescription: `A security-focused password generator that creates strong, unique passwords using cryptographic randomness.

Key Features:
• **Customizable Length**: Generate passwords from 8 to 128 characters
• **Character Options**: Include/exclude uppercase, lowercase, numbers, symbols
• **Entropy Calculation**: Shows password strength in bits
• **Copy to Clipboard**: One-click copying with visual feedback`,
    features: [
      'Cryptographically secure randomization',
      'Adjustable password length',
      'Character set customization',
      'Password strength indicator',
      'Instant copy to clipboard'
    ],
    technologies: ['JavaScript', 'Web Crypto API', 'HTML5', 'CSS3'],
    github: 'Password-Generator',
    demo: 'https://aaks-hath.github.io/Password-Generator/',
    category: 'Security'
  },
  'password-checker': {
    title: 'Password Strength Checker',
    emoji: '🛡️',
    description: 'Evaluates password strength based on entropy, complexity, and known weak patterns.',
    longDescription: `An advanced password analysis tool that evaluates security based on multiple factors:

• **Entropy Calculation**: Mathematical measure of randomness
• **Pattern Detection**: Identifies common weak patterns (123, abc, qwerty)
• **Dictionary Check**: Compares against known weak passwords
• **Time-to-Crack Estimation**: Shows how long it would take to brute force`,
    features: [
      'Real-time strength analysis',
      'Entropy calculation in bits',
      'Common pattern detection',
      'Visual strength meter'
    ],
    technologies: ['JavaScript', 'Regex', 'HTML5', 'CSS3'],
    github: 'Password-Checker',
    demo: 'https://aaks-hath.github.io/Password-Checker/',
    category: 'Security'
  },
  'halloween-game': {
    title: 'Halloween Game',
    emoji: '🎃',
    description: 'A themed web game with backend-style components and progression logic. Full-stack project with user authentication.',
    longDescription: `A spooky Halloween-themed web game featuring:

• **User System**: Registration and login functionality
• **Game Mechanics**: Interactive gameplay with scoring
• **Progression System**: Levels and achievements
• **Leaderboard**: Compete with other players`,
    features: [
      'User authentication system',
      'Interactive game mechanics',
      'Score tracking and leaderboards',
      'Progressive difficulty levels'
    ],
    technologies: ['JavaScript', 'PHP', 'MySQL', 'HTML5', 'CSS3'],
    github: 'Halloween-Game',
    demo: 'https://aaks-hath.github.io/Halloween-Game/',
    category: 'Game'
  },
  'keylogger-py': {
    title: 'Advanced Keylogger',
    emoji: '⌨️',
    description: 'Educational Python script demonstrating input capturing, log encryption, and remote exfiltration techniques.',
    longDescription: `An advanced educational malware simulation written in Python.

**Warning: For Educational Use Only.**

Features:
• **Keystroke Capture**: Hooks into system events to record input.
• **Screenshot Capability**: Captures screen on specific triggers.
• **Log Encryption**: Encrypts logs locally before storage.
• **Exfiltration**: Sends reports via SMTP or FTP.`,
    features: [
      'System Hooking',
      'Automated Screenshots',
      'AES Encryption of Logs',
      'Email Exfiltration',
      'Persistence Mechanisms'
    ],
    technologies: ['Python', 'pynput', 'smtplib', 'cryptography'],
    github: 'keylogger-py',
    demo: null,
    category: 'Security',
    inProgress: true
  },
  'network-scanner': {
    title: 'Network Scanner',
    emoji: '🔍',
    description: 'Building a network scanner using Nmap for reconnaissance and security analysis. Currently in active development.',
    longDescription: `A Python-based network scanning tool leveraging Nmap for comprehensive network analysis:

• **Host Discovery**: Find active hosts on a network
• **Port Scanning**: Identify open ports and services
• **Service Detection**: Determine running services and versions`,
    features: [
      'Multiple scan types (SYN, TCP, UDP)',
      'Service version detection',
      'OS fingerprinting',
      'Scriptable and automatable'
    ],
    technologies: ['Python', 'Nmap', 'python-nmap', 'Bash'],
    github: 'Aaks-hatH',
    demo: null,
    category: 'Security',
    inProgress: true
  },
  'portfolio': {
    title: 'Personal Portfolio',
    emoji: '🌐',
    description: 'My personal portfolio and project showcase hosted on GitHub Pages.',
    longDescription: `A personal portfolio website showcasing my projects, skills, and experience in cybersecurity and web development.`,
    features: [
      'Responsive design',
      'Project showcase',
      'GitHub Pages hosting',
      'Clean, modern UI'
    ],
    technologies: ['HTML5', 'CSS3', 'JavaScript', 'GitHub Pages'],
    github: 'aaks-hath.github.io',
    demo: 'https://aaks-hath.github.io/',
    category: 'Web'
  }
};

export default function ProjectDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');
  const project = projectsData[projectId];
  
  const [repoData, setRepoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readmeContent, setReadmeContent] = useState(null);

  useEffect(() => {
    const fetchRepoData = async () => {
      if (!project?.github) {
        setLoading(false);
        return;
      }
      
      try {
        const [repoRes, readmeRes] = await Promise.all([
          fetch(`https://api.github.com/repos/aaks-hath/${project.github}`),
          fetch(`https://api.github.com/repos/aaks-hath/${project.github}/readme`)
        ]);
        
        if (repoRes.ok) {
          const data = await repoRes.json();
          setRepoData(data);
        }
        
        if (readmeRes.ok) {
          const readmeData = await readmeRes.json();
          const content = atob(readmeData.content);
          setReadmeContent(content);
        }
      } catch (err) {
        console.log('Error fetching repo data');
      } finally {
        setLoading(false);
      }
    };

    fetchRepoData();
  }, [project?.github]);

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Project Not Found</h1>
          <p className="text-slate-400 mb-6">The project you're looking for doesn't exist.</p>
          <Link to={createPageUrl('Home')}>
            <Button className="bg-cyan-600 hover:bg-cyan-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-slate-900 text-white"
    >
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Link 
              to={createPageUrl('Home')}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors group"
            >
              <motion.span whileHover={{ x: -3 }}>
                <ArrowLeft className="w-4 h-4" />
              </motion.span>
              <span>Back to Portfolio</span>
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700">
                <span className="text-5xl">{project.emoji}</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-100">
                  {project.title}
                </h1>
                {project.inProgress && (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    In Progress
                  </Badge>
                )}
              </div>
              <p className="text-slate-400 text-lg mb-4">{project.description}</p>
              
              <div className="flex flex-wrap gap-3">
                {project.demo && (
                  <a href={project.demo} target={project.demo.startsWith('http') ? "_blank" : "_self"} rel="noopener noreferrer">
                    <Button className="bg-cyan-600 hover:bg-cyan-700">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Live Demo
                    </Button>
                  </a>
                )}
                {project.github && (
                  <a 
                    href={`https://github.com/aaks-hath/${project.github}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                      <Github className="w-4 h-4 mr-2" />
                      View Source
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-slate-800/30 border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">About</h3>
                <p className="text-slate-400 whitespace-pre-line leading-relaxed">{project.longDescription}</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">Features</h3>
                <ul className="space-y-2">
                  {project.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-slate-400">
                      <span className="text-cyan-400 mt-1">▹</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-cyan-400" />
                Technologies Used
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech, index) => (
                  <Badge 
                    key={index}
                    className="bg-slate-700/50 text-slate-300 border-slate-600 px-3 py-1"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
