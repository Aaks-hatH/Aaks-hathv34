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
  ls: "List files and directories",
  whoami: "Show current user session info",
  projects: "List all available projects",
  scan: "Simulate a port scan on target",
  submit: "Submit a CTF Flag. Usage: submit <flag> <username>",
  leaderboard: "Show the CTF Hall of Fame",
  clear: "Clear terminal history",
  matrix: "Enter the Matrix",
};

const COMMANDS = {
  help: () => `
Available commands:
  help              - Show this help message
  ls                - List projects and files
  whoami            - Display user information
  projects          - List all projects
  scan <target>     - Simulate network scan
  submit <flag> <user> - Submit a captured flag
  leaderboard       - View CTF winners
  clear             - Clear terminal
  matrix            - ???
`,
  
  ls: () => `
drwxr-xr-x  projects/
drwxr-xr-x  skills/
-rw-r--r--  about.txt
-rwx------  secret.sh
drwxr-xr-x  .ctf_challenges/
`,

  whoami: () => `
User: visitor
Status: Authenticated
Access Level: Guest
Session: ${Math.random().toString(36).substring(7)}
`,

  projects: () => `
[*] Available Projects:
    1. Cyber Army Knife (Red Team Dashboard)
    2. Face Recognizer (AI/ML)
    3. Password Tools (Security)
    4. Python Keylogger (Malware Dev)
    Type 'project <name>' for details.
`,

  clear: () => 'CLEAR',
  
  matrix: () => `
Wake up, Neo...
The Matrix has you...
Follow the white rabbit.
`,
};

export default function Terminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [history, setHistory] = useState([
    { type: 'ascii', content: ASCII_BANNER },
    { type: 'output', content: 'Welcome to Aakshat\'s Terminal v2.0' },
    { type: 'output', content: 'Type "help" for commands. Happy Hacking.\n' },
  ]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestion, setSuggestion] = useState('');
  const inputRef = useRef(null);
  const terminalRef = useRef(null);

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

  const processCommand = async (cmd) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const parts = trimmed.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Add Input to History
    setHistory(prev => [...prev, { type: 'input', content: `visitor@aakshat:~$ ${cmd}` }]);

    // 1. CTF SUBMIT
    if (command === 'submit') {
        const [flag, username] = args;
        if (!flag || !username) {
            setHistory(prev => [...prev, { type: 'output', content: "Usage: submit <flag> <username>" }]);
            return;
        }
        
        setHistory(prev => [...prev, { type: 'output', content: "Transmitting flag to HQ..." }]);
        
        try {
            const res = await fetch('/api/submit_flag', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ flag, username })
            });
            const data = await res.json();
            const colorClass = data.success ? "text-green-400 font-bold" : "text-red-500 font-bold";
            setHistory(prev => [...prev, { type: 'output', content: data.message || data.error, className: colorClass }]);
        } catch (e) {
            setHistory(prev => [...prev, { type: 'output', content: "Connection Error." }]);
        }
        return;
    }

    // 2. LEADERBOARD
    if (command === 'leaderboard') {
        setHistory(prev => [...prev, { type: 'output', content: "Fetching Hall of Fame..." }]);
        try {
            const res = await fetch('/api/get_leaderboard');
            const data = await res.json();
            
            if (data.length === 0) {
                setHistory(prev => [...prev, { type: 'output', content: "No solvers yet. Be the first!" }]);
            } else {
                let board = "\n🏆 CTF HALL OF FAME 🏆\n──────────────────────────────\n";
                data.forEach((entry, i) => {
                    const date = new Date(entry.solved_at).toLocaleDateString();
                    board += `${i+1}. ${entry.username.padEnd(15)} [${entry.flag_level}] - ${date}\n`;
                });
                setHistory(prev => [...prev, { type: 'output', content: board }]);
            }
        } catch (e) {
            setHistory(prev => [...prev, { type: 'output', content: "Error fetching leaderboard." }]);
        }
        return;
    }

    // 3. HONEYTOKEN CHECK
    if ((command === 'cat' || command === './') && args[0] === 'secret.sh') {
        fetch('/api/collect_telemetry', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actor_type: 'ATTACKER', action: 'TRIPWIRE_TRIGGER', details: 'Attempted to read secret.sh' })
        });
        setHistory(prev => [...prev, { type: 'output', content: "\n[!] SYSTEM ALERT: INTEGRITY VIOLATION\n[!] UNAUTHORIZED FILE ACCESS DETECTED\n[!] LOCKING TERMINAL SESSION...\n", className: "text-red-500 font-bold animate-pulse" }]);
        return;
    }

    // 4. STANDARD COMMANDS
    if (command === 'clear') {
        setHistory([]);
        return;
    }

    if (COMMANDS[command]) {
        const output = COMMANDS[command](args.join(' '));
        setHistory(prev => [...prev, { type: 'output', content: output }]);
        return;
    }

    // 5. SIMULATIONS
    if (command === 'scan') {
        setHistory(prev => [...prev, { type: 'output', content: `Starting scan on ${args[0] || 'localhost'}...\n` }]);
        setTimeout(() => {
            setHistory(prev => [...prev, { type: 'output', content: `PORT      STATE     SERVICE\n22/tcp    open      ssh\n80/tcp    open      http\n443/tcp   open      https\n\nScan complete.` }]);
        }, 1000);
        return;
    }

    setHistory(prev => [...prev, { type: 'output', content: `Command not found: ${command}` }]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setCommandHistory([input, ...commandHistory]);
    setHistoryIndex(-1);
    processCommand(input);
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
      {/* Toggle Button */}
      <motion.button
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 bg-slate-800 border border-cyan-500/50 rounded-full shadow-lg shadow-cyan-500/20 hover:bg-slate-700 transition-all ${isOpen ? 'hidden' : ''}`}
      >
        <TerminalIcon className="w-6 h-6 text-cyan-400" />
      </motion.button>

      {/* Terminal Window */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: isMinimized ? 0 : 1, y: isMinimized ? 100 : 0, scale: isMinimized ? 0.9 : 1 }}
          className="fixed bottom-6 right-6 z-50 w-[90vw] md:w-[700px] h-[500px] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
            <div className="flex items-center gap-2"><TerminalIcon className="w-4 h-4 text-cyan-400" /><span className="text-slate-300 text-sm font-mono">visitor@aakshat:~</span></div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-slate-700 rounded"><Minus className="w-4 h-4 text-slate-400" /></button>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-red-500/20 rounded"><X className="w-4 h-4 text-slate-400 hover:text-red-400" /></button>
            </div>
          </div>

          <div ref={terminalRef} className="flex-1 p-4 overflow-y-auto font-mono text-sm bg-slate-950" onClick={() => inputRef.current?.focus()}>
            {history.map((item, index) => (
              <div key={index} className={`whitespace-pre-wrap mb-1 ${item.type === 'input' ? 'text-green-400' : item.type === 'ascii' ? 'text-cyan-400 text-xs' : item.className || 'text-slate-300'}`}>{item.content}</div>
            ))}
            <form onSubmit={handleSubmit} className="flex items-center relative">
              <span className="text-green-400">visitor@aakshat:~$&nbsp;</span>
              <div className="relative flex-1">
                <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} className="w-full bg-transparent text-slate-100 outline-none caret-cyan-400" autoFocus spellCheck={false} />
                {suggestion && <span className="absolute left-0 top-0 text-slate-600 pointer-events-none">{suggestion}</span>}
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {/* Minimized Tab */}
      {isOpen && isMinimized && (
        <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={() => setIsMinimized(false)} className="fixed bottom-6 right-6 z-50 px-4 py-2 bg-slate-800 border border-cyan-500/50 rounded-lg shadow-lg flex items-center gap-2 hover:bg-slate-700">
          <TerminalIcon className="w-4 h-4 text-cyan-400" /><span className="text-slate-300 text-sm font-mono">Terminal</span>
        </motion.button>
      )}
    </>
  );
}
