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
  "Privacy is not about having something to hide. It's about having something to protect."
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