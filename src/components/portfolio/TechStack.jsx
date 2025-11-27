import React from 'react';
import { motion } from 'framer-motion';

const technologies = [
  { name: "C#", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { name: "JavaScript", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { name: "Python", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { name: "Bash", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { name: "PHP", color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
  { name: "HTML5", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { name: "CSS3", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  { name: "Nmap", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { name: "OSINT", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { name: "Git", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
];

export default function TechStack() {
  return (
    <section className="relative z-10 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-mono font-bold text-center mb-8"
        >
          <span className="text-cyan-500">&lt;</span>
          <span className="text-slate-100">Tech Stack</span>
          <span className="text-cyan-500">/&gt;</span>
        </motion.h2>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3"
        >
          {technologies.map((tech, index) => (
            <motion.span
              key={tech.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              className={`px-4 py-2 rounded-lg border font-mono text-sm ${tech.color} cursor-default`}
            >
              {tech.name}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}