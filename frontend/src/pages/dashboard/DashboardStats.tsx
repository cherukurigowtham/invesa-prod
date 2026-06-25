/**
 * DashboardStats.tsx
 *
 * Renders the quick statistics grid (Views, Requests, Valuation, Matches)
 * with glassmorphic styling, animations, and live SVG sparkline graphs.
 */

import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 220, damping: 20 } }
};

export default function DashboardStats({ density = 'spacious' }: { density?: 'spacious' | 'compact' }) {
  const isCompact = density === 'compact';

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${isCompact ? 'mb-6 gap-3' : 'mb-12'}`}
    >
      {/* Card 1: Views */}
      <motion.div 
        variants={cardVariants}
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
        className={`glass-card flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/25 transition-colors duration-300 cursor-pointer ${isCompact ? 'p-3 h-22' : 'p-4 h-28'}`}
      >
        <div className="space-y-0.5">
          <span className="text-[9px] text-white/40 uppercase font-bold tracking-wide">Project Views</span>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-extrabold text-white font-mono ${isCompact ? 'text-lg' : 'text-xl'}`}>1,420</span>
            <span className="text-[8px] font-semibold text-emerald-400 font-mono">+12.4%</span>
          </div>
        </div>
        
        {/* Sparkline SVG */}
        <div className={`absolute bottom-0 left-0 right-0 w-full overflow-hidden opacity-60 group-hover:opacity-95 transition-opacity duration-300 ${isCompact ? 'h-6' : 'h-10'}`}>
          <svg viewBox="0 0 120 40" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path 
              d="M0 35 Q15 15, 30 25 T60 10 T90 20 T120 5" 
              fill="none" 
              stroke="#6366f1" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.0, ease: "easeInOut", delay: 0.1 }}
            />
            <motion.path 
              d="M0 35 Q15 15, 30 25 T60 10 T90 20 T120 5 L120 40 L0 40 Z" 
              fill="url(#viewsGrad)" 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.8 }}
            />
          </svg>
        </div>
      </motion.div>

      {/* Card 2: Active Requests */}
      <motion.div 
        variants={cardVariants}
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
        className={`glass-card flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/25 transition-colors duration-300 cursor-pointer ${isCompact ? 'p-3 h-22' : 'p-4 h-28'}`}
      >
        <div className="space-y-0.5">
          <span className="text-[9px] text-white/40 uppercase font-bold tracking-wide">Active Requests</span>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-extrabold text-white font-mono ${isCompact ? 'text-lg' : 'text-xl'}`}>24</span>
            <span className="text-[8px] font-semibold text-emerald-400 font-mono">+8.3%</span>
          </div>
        </div>
        
        {/* Sparkline SVG */}
        <div className={`absolute bottom-0 left-0 right-0 w-full overflow-hidden opacity-60 group-hover:opacity-95 transition-opacity duration-300 ${isCompact ? 'h-6' : 'h-10'}`}>
          <svg viewBox="0 0 120 40" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path 
              d="M0 25 Q15 35, 30 20 T60 30 T90 10 T120 15" 
              fill="none" 
              stroke="#10b981" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.0, ease: "easeInOut", delay: 0.2 }}
            />
            <motion.path 
              d="M0 25 Q15 35, 30 20 T60 30 T90 10 T120 15 L120 40 L0 40 Z" 
              fill="url(#appGrad)" 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.9 }}
            />
          </svg>
        </div>
      </motion.div>

      {/* Card 3: Valuation */}
      <motion.div 
        variants={cardVariants}
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
        className={`glass-card flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/25 transition-colors duration-300 cursor-pointer ${isCompact ? 'p-3 h-22' : 'p-4 h-28'}`}
      >
        <div className="space-y-0.5">
          <span className="text-[9px] text-white/40 uppercase font-bold tracking-wide">Avg Valuation</span>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-extrabold text-white font-mono ${isCompact ? 'text-lg' : 'text-xl'}`}>$4.8M</span>
            <span className="text-[8px] font-semibold text-emerald-400 font-mono">+15.0%</span>
          </div>
        </div>
        
        {/* Sparkline SVG */}
        <div className={`absolute bottom-0 left-0 right-0 w-full overflow-hidden opacity-60 group-hover:opacity-95 transition-opacity duration-300 ${isCompact ? 'h-6' : 'h-10'}`}>
          <svg viewBox="0 0 120 40" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path 
              d="M0 30 Q15 25, 30 35 T60 15 T90 20 T120 5" 
              fill="none" 
              stroke="#f59e0b" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.0, ease: "easeInOut", delay: 0.3 }}
            />
            <motion.path 
              d="M0 30 Q15 25, 30 35 T60 15 T90 20 T120 5 L120 40 L0 40 Z" 
              fill="url(#valGrad)" 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.0 }}
            />
          </svg>
        </div>
      </motion.div>

      {/* Card 4: Active Matches */}
      <motion.div 
        variants={cardVariants}
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
        className={`glass-card flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/25 transition-colors duration-300 cursor-pointer ${isCompact ? 'p-3 h-22' : 'p-4 h-28'}`}
      >
        <div className="space-y-0.5">
          <span className="text-[9px] text-white/40 uppercase font-bold tracking-wide">Co-founder Matches</span>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-extrabold text-white font-mono ${isCompact ? 'text-lg' : 'text-xl'}`}>12</span>
            <span className="text-[8px] font-semibold text-indigo-400 font-mono">+25.0%</span>
          </div>
        </div>
        
        {/* Sparkline SVG */}
        <div className={`absolute bottom-0 left-0 right-0 w-full overflow-hidden opacity-60 group-hover:opacity-95 transition-opacity duration-300 ${isCompact ? 'h-6' : 'h-10'}`}>
          <svg viewBox="0 0 120 40" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="matchesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path 
              d="M0 35 Q15 30, 30 25 T60 20 T90 10 T120 5" 
              fill="none" 
              stroke="#6366f1" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.0, ease: "easeInOut", delay: 0.4 }}
            />
            <motion.path 
              d="M0 35 Q15 30, 30 25 T60 20 T90 10 T120 5 L120 40 L0 40 Z" 
              fill="url(#matchesGrad)" 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.1 }}
            />
          </svg>
        </div>
      </motion.div>
    </motion.div>
  );
}
