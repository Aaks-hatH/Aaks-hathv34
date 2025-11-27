import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const keywords = [
  'OSINT', 'Python', 'Nmap', 'CSS', 'return', 'async', 'await',
  'function()', 'import', 'export', 'class', 'while()', 'for()',
  'useState', 'props', 'const', 'let', 'cybersec', '&&', '</>', 
  'grep', 'sudo', 'chmod', 'ssh', 'C#', 'PHP', 'Bash', 'HTML5',
  'JavaScript', 'recon', 'enum', 'shell'
];

export default function FloatingKeywords() {
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    const newPositions = keywords.map(() => ({
      left: Math.random() * 90 + 5,
      top: Math.random() * 90 + 5,
      delay: Math.random() * 5,
      duration: 15 + Math.random() * 10
    }));
    setPositions(newPositions);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {keywords.map((keyword, index) => (
        <motion.span
          key={index}
          className="absolute text-cyan-500/10 font-mono text-xs md:text-sm whitespace-nowrap select-none"
          style={{
            left: `${positions[index]?.left || 0}%`,
            top: `${positions[index]?.top || 0}%`,
          }}
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0.2, 0.5, 0.2],
            y: [0, -20, 0]
          }}
          transition={{
            duration: positions[index]?.duration || 15,
            repeat: Infinity,
            delay: positions[index]?.delay || 0,
            ease: "easeInOut"
          }}
        >
          {keyword}
        </motion.span>
      ))}
    </div>
  );
}