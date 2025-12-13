
import React from 'react';

const Certifications = () => {
  return (
    <div className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-8">
          Certifications & Badges
        </h2>
      </div>
      <div className="flex flex-wrap justify-center items-center gap-4 max-w-4xl mx-auto">
        <a href="https://tryhackme.com/p/aakshathariharan" target="_blank" rel="noopener noreferrer">
          <img
            src="https://tryhackme-badges.s3.amazonaws.com/aakshathariharan.png"
            alt="TryHackMe Profile Badge"
            className="transition-transform duration-300 hover:scale-110"
          />
        </a>
        <img src="https://img.shields.io/badge/Cybersecurity-Enthusiast-black?style=for-the-badge&logo=hackthebox" alt="Cybersecurity Enthusiast Badge" className="transition-transform duration-300 hover:scale-110" />
        <img src="https://img.shields.io/badge/Ethical-Hacking-red?style=for-the-badge&logo=kalilinux" alt="Ethical Hacking Badge" className="transition-transform duration-300 hover:scale-110" />
        <img src="https://img.shields.io/badge/OSINT-Explorer-darkgreen?style=for-the-badge" alt="OSINT Explorer Badge" className="transition-transform duration-300 hover:scale-110" />
        <img src="https://img.shields.io/badge/CTF-Player-blue?style=for-the-badge" alt="CTF Player Badge" className="transition-transform duration-300 hover:scale-110" />
        <img src="https://img.shields.io/badge/Certified-Hacker-critical?style=for-the-badge" alt="Certified Hacker Badge" className="transition-transform duration-300 hover:scale-110" />
        <img src="https://img.shields.io/badge/CompTIA-Security%2B-red?style=for-the-badge&logo=comptia" alt="CompTIA Security+ Badge" className="transition-transform duration-300 hover:scale-110" />
        <img src="https://img.shields.io/badge/Linux-Power%20User-yellow?style=for-the-badge&logo=linux" alt="Linux Power User Badge" className="transition-transform duration-300 hover:scale-110" />
        <img src="https://img.shields.io/badge/Networking-Fundamentals-blueviolet?style=for-the-badge" alt="Networking Fundamentals Badge" className="transition-transform duration-300 hover:scale-110" />
        <img src="https://img.shields.io/badge/Blue%20Team-Foundations-navy?style=for-the-badge" alt="Blue Team Foundations Badge" className="transition-transform duration-300 hover:scale-110" />
        <img src="https://img.shields.io/badge/Threat-Analysis-orange?style=for-the-badge" alt="Threat Analysis Badge" className="transition-transform duration-300 hover:scale-110" />
        <img src="https://img.shields.io/badge/Security-First-purple?style=for-the-badge" alt="Security First Badge" className="transition-transform duration-300 hover:scale-110" />
        <img src="https://img.shields.io/badge/Always-Learning-informational?style=for-the-badge" alt="Always Learning Badge" className="transition-transform duration-300 hover:scale-110" />
        <img src="https://img.shields.io/badge/Defense-in--Depth-9cf?style=for-the-badge" alt="Defense in Depth Badge" className="transition-transform duration-300 hover:scale-110" />
      </div>
      <p className="text-center text-sm opacity-80 mt-8 max-w-2xl mx-auto">
        Badges reflect certifications, hands-on platforms, and technical focus areas.
      </p>
    </div>
  );
};

export default Certifications;
