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
  'face-rec': {
    title: 'Face Recognizer',
    emoji: '👤',
    description: 'A browser-based face recognition tool using machine learning and detection libraries. This project leverages TensorFlow.js and face-api.js to detect and recognize faces directly in the browser without any server-side processing.',
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
    description: 'Creates secure, randomized passwords with adjustable strength options. Uses cryptographically secure random number generation for maximum security.',
    longDescription: `A security-focused password generator that creates strong, unique passwords using cryptographic randomness.

Key Features:
• **Customizable Length**: Generate passwords from 8 to 128 characters
• **Character Options**: Include/exclude uppercase, lowercase, numbers, symbols
• **Entropy Calculation**: Shows password strength in bits
• **Copy to Clipboard**: One-click copying with visual feedback
• **No Storage**: Passwords are never stored or transmitted`,
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
    description: 'Evaluates password strength based on entropy, complexity, and known weak patterns. Helps users understand how secure their passwords really are.',
    longDescription: `An advanced password analysis tool that evaluates security based on multiple factors:

• **Entropy Calculation**: Mathematical measure of randomness
• **Pattern Detection**: Identifies common weak patterns (123, abc, qwerty)
• **Dictionary Check**: Compares against known weak passwords
• **Character Analysis**: Evaluates diversity and distribution
• **Time-to-Crack Estimation**: Shows how long it would take to brute force`,
    features: [
      'Real-time strength analysis',
      'Entropy calculation in bits',
      'Common pattern detection',
      'Detailed feedback and suggestions',
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
    description: 'A themed web game with backend-style components and progression logic. Full-stack project with user authentication and score tracking.',
    longDescription: `A spooky Halloween-themed web game featuring:

• **User System**: Registration and login functionality
• **Game Mechanics**: Interactive gameplay with scoring
• **Progression System**: Levels and achievements
• **Leaderboard**: Compete with other players
• **Admin Panel**: Manage users and game settings

This project demonstrates full-stack development skills with both frontend interactivity and backend data persistence.`,
    features: [
      'User authentication system',
      'Interactive game mechanics',
      'Score tracking and leaderboards',
      'Progressive difficulty levels',
      'Admin dashboard'
    ],
    technologies: ['JavaScript', 'PHP', 'MySQL', 'HTML5', 'CSS3'],
    github: 'Halloween-Game',
    demo: 'https://aaks-hath.github.io/Halloween-Game/',
    category: 'Game'
  },
  'network-scanner': {
    title: 'Network Scanner',
    emoji: '🔍',
    description: 'Building a network scanner using Nmap for reconnaissance and security analysis. Currently in active development.',
    longDescription: `A Python-based network scanning tool leveraging Nmap for comprehensive network analysis:

• **Host Discovery**: Find active hosts on a network
• **Port Scanning**: Identify open ports and services
• **Service Detection**: Determine running services and versions
• **OS Fingerprinting**: Identify operating systems
• **Vulnerability Detection**: Basic vulnerability checks

This tool is designed for ethical security testing and network administration.`,
    features: [
      'Multiple scan types (SYN, TCP, UDP)',
      'Service version detection',
      'OS fingerprinting',
      'Output to multiple formats',
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
    longDescription: `A personal portfolio website showcasing my projects, skills, and experience in cybersecurity and web development.

Features a clean, modern design with:
• Responsive layout for all devices
• Project showcase with live demos
• Contact information and social links
• Dark theme optimized for developers`,
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
          // Decode base64 content
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
      {/* Header */}
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

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Project Header */}
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
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {project.demo && (
                  <a href={project.demo} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-cyan-600 hover:bg-cyan-700">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Live Demo
                    </Button>
                  </a>
                )}
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
              </div>
            </div>
          </div>

          {/* GitHub Stats */}
          {loading ? (
            <Card className="bg-slate-800/30 border-slate-700">
              <CardContent className="p-6 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              </CardContent>
            </Card>
          ) : repoData && (
            <Card className="bg-slate-800/30 border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <Github className="w-5 h-5 text-cyan-400" />
                  Repository Stats
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                    <Star className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-200">{repoData.stargazers_count}</p>
                    <p className="text-slate-500 text-sm">Stars</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                    <GitFork className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-200">{repoData.forks_count}</p>
                    <p className="text-slate-500 text-sm">Forks</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                    <Eye className="w-5 h-5 text-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-200">{repoData.watchers_count}</p>
                    <p className="text-slate-500 text-sm">Watchers</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                    <Calendar className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                    <p className="text-lg font-bold text-slate-200">
                      {new Date(repoData.updated_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-slate-500 text-sm">Last Update</p>
                  </div>
                </div>
                {repoData.language && (
                  <div className="mt-4 flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-400">Primary Language:</span>
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                      {repoData.language}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* About */}
            <Card className="bg-slate-800/30 border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">About</h3>
                <p className="text-slate-400 whitespace-pre-line">{project.longDescription}</p>
              </CardContent>
            </Card>

            {/* Features */}
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

          {/* Technologies */}
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

          {/* README Content */}
          {readmeContent && (
            <Card className="bg-slate-800/30 border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-cyan-400" />
                  README.md
                </h3>
                <div className="bg-slate-900/50 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-slate-400 text-sm whitespace-pre-wrap font-mono">
                    {readmeContent.substring(0, 2000)}
                    {readmeContent.length > 2000 && '...'}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}