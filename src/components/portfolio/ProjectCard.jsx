import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectCard({ project, index }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300"
    >
      {/* Project Image - Clickable */}
      <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 cursor-pointer">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl group-hover:scale-110 transition-transform duration-300">{project.emoji}</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60"></div>
          <div className="absolute bottom-3 left-3">
            <span className="text-xs text-slate-400 font-mono">Last updated: {project.updated}</span>
          </div>
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="bg-slate-900/80 px-3 py-1 rounded-full text-cyan-400 text-sm flex items-center gap-2">
              View Details <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-5">
        <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
          <h3 className="text-lg font-semibold text-slate-100 mb-2 group-hover:text-cyan-400 transition-colors cursor-pointer">
            {project.title}
          </h3>
        </Link>
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.map((tag, i) => (
            <span 
              key={i} 
              className="px-2 py-1 bg-slate-700/50 text-cyan-400 text-xs rounded font-mono"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Links */}
        <div className="flex items-center gap-4">
          <Link 
            to={createPageUrl(`ProjectDetail?id=${project.id}`)}
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors group/link"
          >
            <span>Details</span>
            <motion.span
              className="inline-block"
              whileHover={{ x: 3 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <ArrowRight className="w-4 h-4" />
            </motion.span>
          </Link>
          {project.link && (
            <motion.a 
              href={project.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 text-sm font-medium transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>Demo</span>
              <ExternalLink className="w-4 h-4" />
            </motion.a>
          )}
        </div>
      </div>
    </motion.div>
  );
}