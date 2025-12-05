import React from 'react';
import { motion } from 'framer-motion';

const badges = [
  // --- SECURITY & NETWORKING ---
  { name: "TOR", url: "https://img.shields.io/badge/tor-%237E4798.svg?style=for-the-badge&logo=tor-project&logoColor=white" },
  { name: "Wireguard", url: "https://img.shields.io/badge/wireguard-%2388171A.svg?style=for-the-badge&logo=wireguard&logoColor=white" },
  { name: "Cisco", url: "https://img.shields.io/badge/cisco-%23049fd9.svg?style=for-the-badge&logo=cisco&logoColor=black" },
  { name: "Bitwarden", url: "https://img.shields.io/badge/bitwarden-%23175DDC.svg?style=for-the-badge&logo=bitwarden&logoColor=white" },
  
  // --- DEVELOPMENT ---
  { name: "Python", url: "https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54" },
  { name: "JavaScript", url: "https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E" },
  { name: "TypeScript", url: "https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" },
  { name: "C#", url: "https://img.shields.io/badge/c%23-%23239120.svg?style=for-the-badge&logo=csharp&logoColor=white" },
  { name: "HTML5", url: "https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white" },
  { name: "CSS3", url: "https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white" },
  { name: "Bash", url: "https://img.shields.io/badge/bash_script-%23121011.svg?style=for-the-badge&logo=gnu-bash&logoColor=white" },
  { name: "PowerShell", url: "https://img.shields.io/badge/PowerShell-%235391FE.svg?style=for-the-badge&logo=powershell&logoColor=white" },
  { name: "Arduino", url: "https://img.shields.io/badge/-Arduino-00979D?style=for-the-badge&logo=Arduino&logoColor=white" },
  { name: "Selenium", url: "https://img.shields.io/badge/-selenium-%43B02A?style=for-the-badge&logo=selenium&logoColor=white" },
  { name: "OpenCV", url: "https://img.shields.io/badge/opencv-%23white.svg?style=for-the-badge&logo=opencv&logoColor=white" },

  // --- FRAMEWORKS & LIBS ---
  { name: "React Native", url: "https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" },
  { name: "React Query", url: "https://img.shields.io/badge/-React%20Query-FF4154?style=for-the-badge&logo=react%20query&logoColor=white" },
  { name: "Next JS", url: "https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white" },
  { name: "NodeJS", url: "https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white" },
  { name: "NestJS", url: "https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white" },
  { name: "Express.js", url: "https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB" },
  { name: "Django", url: "https://img.shields.io/badge/django-%23092E20.svg?style=for-the-badge&logo=django&logoColor=white" },
  { name: "Vue.js", url: "https://img.shields.io/badge/vue.js-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D" },
  { name: "Vite", url: "https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" },
  { name: "Bootstrap", url: "https://img.shields.io/badge/bootstrap-%238511FA.svg?style=for-the-badge&logo=bootstrap&logoColor=white" },
  { name: "WindiCSS", url: "https://img.shields.io/badge/windicss-48B0F1.svg?style=for-the-badge&logo=windi-css&logoColor=white" },

  // --- INFRASTRUCTURE & TOOLS ---
  { name: "Git", url: "https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white" },
  { name: "GitHub", url: "https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white" },
  { name: "Docker", url: "https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white" },
  { name: "NPM", url: "https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white" },
  { name: "Windows Terminal", url: "https://img.shields.io/badge/Windows%20Terminal-%234D4D4D.svg?style=for-the-badge&logo=windows-terminal&logoColor=white" },
  
  // --- CLOUD & DB ---
  { name: "Cloudflare", url: "https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white" },
  { name: "Supabase", url: "https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" },
  { name: "Firebase", url: "https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase" },
  { name: "AWS", url: "https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white" },
  { name: "Azure", url: "https://img.shields.io/badge/azure-%230072C6.svg?style=for-the-badge&logo=microsoftazure&logoColor=white" },
  { name: "Google Cloud", url: "https://img.shields.io/badge/GoogleCloud-%234285F4.svg?style=for-the-badge&logo=google-cloud&logoColor=white" },
  { name: "Netlify", url: "https://img.shields.io/badge/netlify-%23000000.svg?style=for-the-badge&logo=netlify&logoColor=#00C7B7" },
  { name: "Vercel", url: "https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white" },
  { name: "Render", url: "https://img.shields.io/badge/Render-%46E3B7.svg?style=for-the-badge&logo=render&logoColor=white" },
  { name: "Linode", url: "https://img.shields.io/badge/linode-00A95C?style=for-the-badge&logo=linode&logoColor=white" },
  { name: "OpenStack", url: "https://img.shields.io/badge/Openstack-%23f01742.svg?style=for-the-badge&logo=openstack&logoColor=white" },
  { name: "MongoDB", url: "https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white" },
  { name: "MySQL", url: "https://img.shields.io/badge/mysql-4479A1.svg?style=for-the-badge&logo=mysql&logoColor=white" },
  
  // --- GAMING & PLATFORMS ---
  { name: "Steam", url: "https://img.shields.io/badge/steam-%23000000.svg?style=for-the-badge&logo=steam&logoColor=white" },
  { name: "PSN", url: "https://img.shields.io/badge/PSN-%230070D1.svg?style=for-the-badge&logo=Playstation&logoColor=white" },
  { name: "Epic Games", url: "https://img.shields.io/badge/epicgames-%23313131.svg?style=for-the-badge&logo=epicgames&logoColor=white" },
  { name: "Unreal Engine", url: "https://img.shields.io/badge/unrealengine-%23313131.svg?style=for-the-badge&logo=unrealengine&logoColor=white" },
  { name: "NVIDIA", url: "https://img.shields.io/badge/nVIDIA-%2376B900.svg?style=for-the-badge&logo=nVIDIA&logoColor=white" },
  { name: "Uber", url: "https://img.shields.io/badge/Uber-%23000000.svg?style=for-the-badge&logo=Uber&logoColor=white" },
  
  // --- CREATIVE SUITE ---
  { name: "Adobe", url: "https://img.shields.io/badge/adobe-%23FF0000.svg?style=for-the-badge&logo=adobe&logoColor=white" },
  { name: "Photoshop", url: "https://img.shields.io/badge/adobe%20photoshop-%2331A8FF.svg?style=for-the-badge&logo=adobe%20photoshop&logoColor=white" },
  { name: "Illustrator", url: "https://img.shields.io/badge/adobe%20illustrator-%23FF9A00.svg?style=for-the-badge&logo=adobe%20illustrator&logoColor=white" },
  { name: "Premiere Pro", url: "https://img.shields.io/badge/Adobe%20Premiere%20Pro-9999FF.svg?style=for-the-badge&logo=Adobe%20Premiere%20Pro&logoColor=white" },
  { name: "After Effects", url: "https://img.shields.io/badge/Adobe%20After%20Effects-9999FF.svg?style=for-the-badge&logo=Adobe%20After%20Effects&logoColor=white" },
  { name: "Lightroom", url: "https://img.shields.io/badge/Adobe%20Lightroom-31A8FF.svg?style=for-the-badge&logo=Adobe%20Lightroom&logoColor=white" },
  { name: "Lightroom Classic", url: "https://img.shields.io/badge/Adobe%20Lightroom%20Classic-31A8FF.svg?style=for-the-badge&logo=Adobe%20Lightroom%20Classic&logoColor=white" },
  { name: "InDesign", url: "https://img.shields.io/badge/Adobe%20InDesign-49021F?style=for-the-badge&logo=adobeindesign&logoColor=FF3366" },
  { name: "XD", url: "https://img.shields.io/badge/Adobe%20XD-470137?style=for-the-badge&logo=Adobe%20XD&logoColor=#FF61F6" },
  { name: "Dreamweaver", url: "https://img.shields.io/badge/Adobe%20Dreamweaver-FF61F6.svg?style=for-the-badge&logo=Adobe%20Dreamweaver&logoColor=white" },
  { name: "Audition", url: "https://img.shields.io/badge/Adobe%20Audition-9999FF.svg?style=for-the-badge&logo=Adobe%20Audition&logoColor=white" },
  { name: "Creative Cloud", url: "https://img.shields.io/badge/Adobe%20Creative%20Cloud-DA1F26.svg?style=for-the-badge&logo=Adobe%20Creative%20Cloud&logoColor=white" },
  { name: "Acrobat Reader", url: "https://img.shields.io/badge/Adobe%20Acrobat%20Reader-EC1C24.svg?style=for-the-badge&logo=Adobe%20Acrobat%20Reader&logoColor=white" },
  { name: "Adobe Fonts", url: "https://img.shields.io/badge/Adobe%20Fonts-000B1D.svg?style=for-the-badge&logo=Adobe%20Fonts&logoColor=white" },
  
  // --- MISC ---
  { name: "JWT", url: "https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens" },
  { name: "Portfolio", url: "https://img.shields.io/badge/Portfolio-%23000000.svg?style=for-the-badge&logo=firefox&logoColor=#FF7139" },
];

export default function TechStack() {
  return (
    <section className="relative z-10 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-mono font-bold text-center mb-8"
        >
          <span className="text-cyan-500">&lt;</span>
          <span className="text-slate-100">Tech Stack & Tools</span>
          <span className="text-cyan-500">/&gt;</span>
        </motion.h2>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-2"
        >
          {badges.map((badge, index) => (
            <motion.img
              key={badge.name}
              src={badge.url}
              alt={badge.name}
              title={badge.name}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.15, zIndex: 10 }}
              className="h-7 md:h-8 shadow-lg rounded-sm cursor-pointer transition-all"
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
