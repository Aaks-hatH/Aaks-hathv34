import React from 'react';
export default function TooltipWrapper({ children, content }) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100 border border-slate-700 z-50">
        {content}
      </div>
    </div>
  );
}