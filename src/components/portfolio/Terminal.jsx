import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal as TerminalIcon, X, Minus, Square } from 'lucide-react';

const ASCII_BANNER = `
 █████╗  █████╗ ██╗  ██╗███████╗██╗  ██╗ █████╗ ████████╗
██╔══██╗██╔══██╗██║ ██╔╝██╔════╝██║  ██║██╔══██╗╚══██╔══╝
███████║███████║█████╔╝ ███████╗███████║███████║   ██║   
██╔══██║██╔══██║██╔═██╗ ╚════██║██╔══██║██╔══██║   ██║   
██║  ██║██║  ██║██║  ██╗███████║██║  ██║██║  ██║   ██║   
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   
`;

const COMMAND_HELP = {
  help: "Display all available commands",
  ls: "List files and directories in current path",
  whoami: "Show current user session info",
  about: "Display information about Aakshat",
  skills: "Show technical skills with proficiency",
  contact: "Display contact information",
  projects: "List all available projects",
  scan: "Simulate a port scan on target IP/hostname",
  connect: "Attempt SSH connection to specified IP",
  nmap: "Run detailed Nmap scan simulation",
  ping: "Send ICMP packets to test connectivity",
  whois: "Lookup domain registration information",
  clear: "Clear terminal history",
  matrix: "???",
  hack: "???",
  sudo: "Execute command as superuser"
};

const COMMANDS = {
  help: () => `
Available commands:
  help              - Show this help message
  ls                - List projects and files
  whoami            - Display user information
  about             - About Aakshat
  skills            - List technical skills
  contact           - Show contact information
  projects          - List all projects
  scan <target>     - Simulate network scan
  connect <ip>      - Simulate connection attempt
  nmap <target>     - Run simulated nmap scan
  ping <host>       - Ping a host
  whois <domain>    - Lookup domain info
  clear             - Clear terminal
  matrix            - Enter the matrix
  hack              - ???
  sudo              - Try it...

Pro tip: Use ↑/↓ arrows to navigate command history
`,
  
  ls: () => `
drwxr-xr-x  projects/
drwxr-xr-x  skills/
-rw-r--r--  about.txt
-rw-r--r--  contact.txt
-rwx------  secret.sh
drwxr-xr-x  .hidden/
`,

  whoami: () => `
User: visitor
Shell: /bin/bash
Home: /home/visitor
Status: Authenticated
Access Level: Guest
Session: ${Math.random().toString(36).substring(7)}
`,

  about: () => `
╔══════════════════════════════════════════════════════════╗
║  AAKSHAT HARIHARAN                                       ║
║  ──────────────────────────────────────────────────────  ║
║  Role: OSINT Analyst | Gray Hat Hacker | Web Developer   ║
║  Location: Greater New York Area, NY                     ║
║  Focus: Cybersecurity, OSINT, Web Development            ║
║                                                          ║
║  Currently working on: Network Scanner using Nmap        ║
║  Learning: Python, Advanced Cybersecurity                ║
║                                                          ║
║  "In the world of OSINT, patience is your greatest       ║
║   weapon."                                               ║
╚══════════════════════════════════════════════════════════╝
`,

  skills: () => `
[+] Programming Languages:
    ├── Python ████████████████░░░░ 80%
    ├── JavaScript ██████████████░░░░░░ 70%
    ├── C# ████████████░░░░░░░░ 60%
    ├── PHP ██████████░░░░░░░░░░ 50%
    ├── Bash ████████████████░░░░ 80%
    └── HTML/CSS ██████████████████░░ 90%

[+] Security Tools:
    ├── Nmap
    ├── OSINT Frameworks
    ├── Network Analysis
    └── Vulnerability Assessment

[+] Other Skills:
    ├── Git/GitHub
    ├── Linux Administration
    └── Web Development
`,

  contact: () => `
╔═══════════════════════════════════════════╗
║  CONTACT INFORMATION                      ║
╠═══════════════════════════════════════════╣
║  📧 Email: hariharanaakshat@gmail.com     ║
║  🐙 GitHub: github.com/aaks-hath          ║
║  🎵 TikTok: @Aakshat.Hariharan            ║
║  🌐 Web: aaks-hath.github.io              ║
╚═══════════════════════════════════════════╝
`,

  projects: () => `
[*] Available Projects:
    
    1. face-rec          - Face Recognition Tool (ML/AI)
    2. Password-Generator - Secure Password Generator
    3. Password-Checker   - Password Strength Analyzer
    4. Halloween-Game     - Full-Stack Web Game
    5. Network-Scanner    - Nmap-based Scanner [WIP]
    
    Type 'project <name>' for details
`,

  clear: () => 'CLEAR',
  
  matrix: () => `
Wake up, Neo...
The Matrix has you...
Follow the white rabbit.

Knock, knock, Neo.

[SIGNAL LOST]
`,

  hack: () => `
[!] UNAUTHORIZED ACCESS DETECTED
[!] Tracing IP address...
[!] Location: ${['Moscow', 'Beijing', 'Pyongyang', 'Area 51', 'Your Mom\'s House'][Math.floor(Math.random() * 5)]}
[!] Dispatching cyber police...

Just kidding. Nice try though! 😄
`,

  sudo: () => `
[sudo] password for visitor: 
Sorry, user visitor is not in the sudoers file.
This incident will be reported.

(Not really, but you don't have root access here!)
`,
};

const simulateScan = (target) => {
  const ports = [
    { port: 22, service: 'ssh', state: 'open' },
    { port: 80, service: 'http', state: 'open' },
    { port: 443, service: 'https', state: 'open' },
    { port: 3306, service: 'mysql', state: 'filtered' },
    { port: 8080, service: 'http-proxy', state: 'closed' },
  ];
  
  const randomPorts = ports.sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 3));
  
  return `
Starting scan on ${target}...

Nmap scan report for ${target}
Host is up (0.${Math.floor(Math.random() * 100)}s latency).

PORT      STATE     SERVICE
${randomPorts.map(p => 
  `${p.port}/tcp`.padEnd(10) + p.state.padEnd(10) + p.service
).join('\n')}

Nmap done: 1 IP address (1 host up) scanned in ${(Math.random() * 5 + 1).toFixed(2)}s
`;
};

const simulateConnect = (ip) => {
  const success = Math.random() > 0.3;
  if (success) {
    return `
Connecting to ${ip}...
[+] Connection established
[+] SSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.5
[+] Authentication required
[!] Access denied - insufficient privileges

Connection closed.
`;
  }
  return `
Connecting to ${ip}...
[-] Connection timed out
[-] Host may be down or blocking connections
`;
};

const simulateNmap = (target) => {
  return `
Starting Nmap 7.92 ( https://nmap.org )
Nmap scan report for ${target}
Host is up (0.0${Math.floor(Math.random() * 99)}s latency).
Not shown: 997 closed tcp ports

PORT    STATE SERVICE VERSION
22/tcp  open  ssh     OpenSSH 8.2p1
80/tcp  open  http    Apache/2.4.41
443/tcp open  ssl     OpenSSL 1.1.1f

OS details: Linux 5.4.0-89-generic
Network Distance: ${Math.floor(Math.random() * 15) + 1} hops

Nmap done: 1 IP address (1 host up)
`;
};

const simulatePing = (host) => {
  const times = Array(4).fill(0).map(() => (Math.random() * 50 + 10).toFixed(1));
  return `
PING ${host} (${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}): 56 data bytes
64 bytes: icmp_seq=0 ttl=64 time=${times[0]} ms
64 bytes: icmp_seq=1 ttl=64 time=${times[1]} ms
64 bytes: icmp_seq=2 ttl=64 time=${times[2]} ms
64 bytes: icmp_seq=3 ttl=64 time=${times[3]} ms

--- ${host} ping statistics ---
4 packets transmitted, 4 received, 0% packet loss
round-trip min/avg/max = ${Math.min(...times.map(Number)).toFixed(1)}/${(times.reduce((a,b) => a + Number(b), 0) / 4).toFixed(1)}/${Math.max(...times.map(Number)).toFixed(1)} ms
`;
};

const simulateWhois = (domain) => {
  return `
Domain Name: ${domain.toUpperCase()}
Registry Domain ID: ${Math.random().toString(36).substring(2, 10).toUpperCase()}
Registrar: GoDaddy.com, LLC
Creation Date: 2020-01-15T00:00:00Z
Updated Date: 2024-01-15T00:00:00Z
Registry Expiry Date: 2025-01-15T00:00:00Z

Name Server: NS1.EXAMPLE.COM
Name Server: NS2.EXAMPLE.COM

DNSSEC: unsigned

>>> WHOIS lookup complete <<<
`;
};

export default function Terminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [history, setHistory] = useState([
    { type: 'ascii', content: ASCII_BANNER },
    { type: 'output', content: 'Welcome to Aakshat\'s Terminal v1.0.0' },
    { type: 'output', content: 'Type "help" for available commands.\n' },
  ]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestion, setSuggestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef(null);
  const terminalRef = useRef(null);

  // Auto-complete suggestions
  const commands = Object.keys(COMMANDS);
  
  useEffect(() => {
    if (input && !input.includes(' ')) {
      const match = commands.find(cmd => cmd.startsWith(input.toLowerCase()) && cmd !== input.toLowerCase());
      setSuggestion(match || '');
    } else {
      setSuggestion('');
    }
  }, [input]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const processCommand = (cmd) => {
    const trimmed = cmd.trim().toLowerCase();
    const parts = trimmed.split(' ');
    const command = parts[0];
    const args = parts.slice(1).join(' ');

    if (command === 'clear') {
      setHistory([]);
      return null;
    }

    if (command === 'scan' && args) {
      return simulateScan(args);
    }

    if (command === 'connect' && args) {
      return simulateConnect(args);
    }

    if (command === 'nmap' && args) {
      return simulateNmap(args);
    }

    if (command === 'ping' && args) {
      return simulatePing(args);
    }

    if (command === 'whois' && args) {
      return simulateWhois(args);
    }

    if (command === 'project' && args) {
      const projects = {
        'face-rec': 'Face Recognition - Browser-based ML face detection using TensorFlow.js',
        'password-generator': 'Generates cryptographically secure random passwords',
        'password-checker': 'Analyzes password strength using entropy calculations',
        'halloween-game': 'Full-stack game with PHP backend and progression system',
      };
      return projects[args] || `Project '${args}' not found. Type 'projects' to see all.`;
    }

    if (command === 'echo') {
      return args || '';
    }

    if (command === 'date') {
      return new Date().toString();
    }

    if (command === 'uptime') {
      return `System uptime: ${Math.floor(Math.random() * 100)} days, ${Math.floor(Math.random() * 24)} hours`;
    }

    if (COMMANDS[command]) {
      return COMMANDS[command]();
    }

    if (command === '') {
      return null;
    }

    return `Command not found: ${command}\nType 'help' for available commands.`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newHistory = [
      ...history,
      { type: 'input', content: `visitor@aakshat:~$ ${input}` }
    ];

    const output = processCommand(input);
    if (output) {
      newHistory.push({ type: 'output', content: output });
    }

    setHistory(newHistory);
    setCommandHistory([input, ...commandHistory]);
    setHistoryIndex(-1);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      setInput(suggestion);
      setSuggestion('');
    }
  };

  return (
    <>
      {/* Terminal Toggle Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 bg-slate-800 border border-cyan-500/50 rounded-full shadow-lg shadow-cyan-500/20 hover:bg-slate-700 transition-all ${isOpen ? 'hidden' : ''}`}
      >
        <TerminalIcon className="w-6 h-6 text-cyan-400" />
      </motion.button>

      {/* Terminal Window */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ 
            opacity: isMinimized ? 0 : 1, 
            y: isMinimized ? 100 : 0, 
            scale: isMinimized ? 0.9 : 1 
          }}
          className="fixed bottom-6 right-6 z-50 w-[90vw] md:w-[700px] h-[500px] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col"
        >
          {/* Title Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <TerminalIcon className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300 text-sm font-mono">visitor@aakshat:~</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMinimized(true)}
                className="p-1 hover:bg-slate-700 rounded"
              >
                <Minus className="w-4 h-4 text-slate-400" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-red-500/20 rounded"
              >
                <X className="w-4 h-4 text-slate-400 hover:text-red-400" />
              </button>
            </div>
          </div>

          {/* Terminal Content */}
          <div 
            ref={terminalRef}
            className="flex-1 p-4 overflow-y-auto font-mono text-sm bg-slate-950"
            onClick={() => inputRef.current?.focus()}
          >
            {history.map((item, index) => (
              <div 
                key={index} 
                className={`whitespace-pre-wrap mb-1 ${
                  item.type === 'input' 
                    ? 'text-green-400' 
                    : item.type === 'ascii'
                    ? 'text-cyan-400 text-xs'
                    : 'text-slate-300'
                }`}
              >
                {item.content}
              </div>
            ))}
            
            {/* Input Line */}
            <form onSubmit={handleSubmit} className="flex items-center relative">
              <span className="text-green-400">visitor@aakshat:~$&nbsp;</span>
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent text-slate-100 outline-none caret-cyan-400"
                  autoFocus
                  spellCheck={false}
                />
                {suggestion && (
                  <span className="absolute left-0 top-0 text-slate-600 pointer-events-none">
                    {suggestion}
                  </span>
                )}
              </div>
              {suggestion && (
                <span className="text-slate-600 text-xs ml-2">[Tab to complete]</span>
              )}
            </form>
          </div>
        </motion.div>
      )}

      {/* Minimized Terminal Tab */}
      {isOpen && isMinimized && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-6 right-6 z-50 px-4 py-2 bg-slate-800 border border-cyan-500/50 rounded-lg shadow-lg flex items-center gap-2 hover:bg-slate-700"
        >
          <TerminalIcon className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-300 text-sm font-mono">Terminal</span>
        </motion.button>
      )}
    </>
  );
}