import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";

const quotes = [
  "The quieter you become, the more you can hear.",
  "In the world of OSINT, patience is your greatest weapon.",
  "Every digital footprint tells a story.",
  "Security is not a product, but a process.",
  "The best defense is understanding how attacks work.",
  "Information is the oil of the 21st century.",
  "Trust, but verify. Then verify again.",
  "The code that you write makes you a programmer. The code you delete makes you a good one.",
  "Hackers are breaking systems for profit. Before, it was about curiosity and exploration.",
  "Privacy is not about having something to hide. It's about having something to protect.",
  "The strongest exploits begin with understanding, not code.",
"To master security, first master observation.",
"Attackers automate. Defenders anticipate.",
"Your greatest vulnerability is assuming you have none.",
"Every system is secure until someone patient tests it.",
"Cybersecurity is a war of preparation, not reaction.",
"Complexity is the enemy of security.",
"Visibility is power. Blind spots are breaches waiting to happen.",
"The best hackers read more than they type.",
"Curiosity is the spark. Discipline is the fuel.",
"Tools don’t make a hacker. Mindset does.",
"Assume compromise. Design for resilience.",
"Security fails quietly, then all at once.",
"Data is valuable. Context is priceless.",
"The deeper you dig, the more the system reveals itself.",
"Every breach begins with a misconfiguration someone ignored.",
"To understand a network, map its silence as well as its traffic.",
"The most dangerous bias in cybersecurity is confidence.",
"Discovery is the first step in both defense and attack.",
"The best exploit is preventing one.",
"Logs don’t lie. People do.",
"Cybersecurity is not about paranoia; it’s about preparedness.",
"Those who rush miss the vulnerability hiding in plain sight.",
"You can't secure what you don't understand.",
"Behind every exploit is a missed assumption.",
"The smallest mistake often opens the largest door.",
"Audit everything. Trust nothing without proof.",
"Security is everyone’s job, but nobody’s habit.",
"Great hackers question the things others take for granted.",
"The network never forgets—only humans do.",
"A system reveals its truth under pressure.",
"Good hackers find bugs. Great hackers find patterns.",
"Patience beats zero-days.",
"Skill finds vulnerabilities. Wisdom prevents them.",
"The easiest exploit is a careless user.",
"True security is verified, not declared.",
"Code is a mirror of the person who wrote it.",
"Every bypass starts with a why.",
"Good recon solves half the problem before you write a line of code."
];

export default function QuoteSection() {
  const [quote, setQuote] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  const getRandomQuote = () => {
    setIsAnimating(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      setQuote(quotes[randomIndex]);
      setIsAnimating(false);
    }, 300);
  };

  useEffect(() => {
    getRandomQuote();
  }, []);

  return (
    <section className="relative z-10 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center"
        >
          <h3 className="text-cyan-400 font-mono text-sm mb-4">Random quote or joke</h3>
          <motion.p 
            key={quote}
            initial={{ opacity: 0 }}
            animate={{ opacity: isAnimating ? 0 : 1 }}
            className="text-slate-300 text-lg italic mb-4 min-h-[60px] flex items-center justify-center"
          >
            "{quote}"
          </motion.p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={getRandomQuote}
            className="text-slate-400 hover:text-cyan-400"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isAnimating ? 'animate-spin' : ''}`} />
            New Quote
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
