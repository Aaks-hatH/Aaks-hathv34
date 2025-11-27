import React from 'react';
import { Github, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative z-10 py-8 px-4 border-t border-slate-800">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex justify-center gap-4 mb-4">
          <a 
            href="https://github.com/aaks-hath" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <Github className="w-5 h-5" />
          </a>
          <a 
            href="mailto:hariharanaakshat@gmail.com"
            className="text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <Mail className="w-5 h-5" />
          </a>
        </div>
        <p className="text-slate-500 text-sm font-mono">
          © {new Date().getFullYear()} Aakshat Hariharan | Built with 💻
        </p>
        <p className="text-slate-600 text-xs mt-2">
          Inspired by kotokk.dev
        </p>
      </div>
    </footer>
  );
}