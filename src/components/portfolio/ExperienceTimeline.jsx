import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, GraduationCap, Calendar } from 'lucide-react';

const experiences = [
  {
    id: 1,
    role: "Cybersecurity Student",
    company: "Self-Employed",
    date: "2024 - Present",
    desc: "Conducting vulnerability assessments, configuring firewalls, and automating security audits using Python and Bash scripts.",
    type: "edu"
  },
  {
    id: 2,
    role: "Full Stack Developer Student",
    company: "N/A",
    date: "2024 - 2025",
    desc: "Built React/Node.js applications. Implemented JWT authentication and secured API endpoints against OWASP Top 10 vulnerabilities.",
    type: "edu"
  },
  {
    id: 3,
    role: "Computer Science Student",
    company: "University of At Home",
    date: "2023 - Present",
    desc: "Specializing in Cybersecurity and Network Administration.",
    type: "edu"
  }
];

export default function ExperienceTimeline() {
  return (
    <section className="relative z-10 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-3xl md:text-4xl font-mono font-bold text-center mb-16"
        >
          <span className="text-cyan-500">0x03</span> Experience
        </motion.h2>

        <div className="relative border-l-2 border-slate-800 ml-4 md:ml-12 space-y-12">
          {experiences.map((item, index) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true }}
              className="relative pl-8 md:pl-12"
            >
              {/* Timeline Dot */}
              <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${item.type === 'work' ? 'bg-cyan-900 border-cyan-500' : 'bg-purple-900 border-purple-500'}`}></div>
              
              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl hover:border-cyan-500/30 transition-colors">
                <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                  <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    {item.type === 'work' ? <Briefcase className="w-4 h-4 text-cyan-400"/> : <GraduationCap className="w-4 h-4 text-purple-400"/>}
                    {item.role}
                  </h3>
                  <span className="text-xs font-mono text-slate-500 flex items-center gap-1 bg-slate-950 px-2 py-1 rounded">
                    <Calendar className="w-3 h-3" /> {item.date}
                  </span>
                </div>
                <p className="text-cyan-500 text-sm mb-2">{item.company}</p>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}