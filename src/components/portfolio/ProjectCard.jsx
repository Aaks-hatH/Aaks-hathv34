import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, ArrowRight, ImageOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProjectCard({ project, index }) {
  // Handle image loading errors
  const [imgError, setImgError] = useState(false);

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
        <div className="relative h-48 overflow-hidden bg-slate-900 cursor-pointer">
          
          {/* DISPLAY IMAGE OR FALLBACK */}
          {!imgError ? (
            <img 
              src={project.image} 
              alt={project.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
               <ImageOff className="w-8 h-8 opacity-50" />
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90"></div>
          
          <div className="absolute bottom-3 left-3">
            <span className="text-xs text-cyan-400 font-mono bg-cyan-950/50 px-2 py-1 rounded border border-cyan-900/50">
              Updated: {project.updated}
            </span>
          </div>
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="bg-slate-900/90 px-4 py-2 rounded-full text-cyan-400 text-sm flex items-center gap-2 border border-cyan-500/50">
              View Case File <ArrowRight className="w-4 h-4" />
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
              className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded font-mono border border-slate-600/50"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Links */}
        <div className="flex items-center gap-4 border-t border-slate-700/50 pt-4">
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
              className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 text-sm font-medium transition-colors ml-auto"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{project.link.startsWith('/') ? 'Open Tool' : 'Live Demo'}</span>
              <ExternalLink className="w-3 h-3" />
            </motion.a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
