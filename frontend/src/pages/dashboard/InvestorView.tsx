/**
 * InvestorView.tsx
 *
 * Renders the dashboard view for Investors:
 * - Starred pipeline / project watchlist (with quick view links)
 * - Feed of all listed projects (with category badges and creator names)
 */

import { Link } from 'react-router-dom';
import { Bookmark, Eye, TrendingUp } from 'lucide-react';
import { ProjectsGridSkeleton } from '../../shared/components/SkeletonLoaders';
import { motion } from 'framer-motion';

const listContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const listItemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 25 } }
};

interface InvestorViewProps {
  dashboardData: any;
  loading: boolean;
  density?: 'spacious' | 'compact';
}

export default function InvestorView({ dashboardData, loading, density = 'spacious' }: InvestorViewProps) {
  const isCompact = density === 'compact';

  return (
    <div className={`grid grid-cols-1 md:grid-cols-12 animate-fade-in ${isCompact ? 'gap-4' : 'gap-8'}`}>
      
      {/* Starred pipeline */}
      <div className={`md:col-span-8 ${isCompact ? 'space-y-3' : 'space-y-6'}`}>
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Bookmark className="w-4.5 h-4.5 text-amber-400" />
          My Watchlist
        </h2>

        {loading ? (
          <ProjectsGridSkeleton count={2} />
        ) : dashboardData?.pipeline && dashboardData.pipeline.length > 0 ? (
          <motion.div 
            variants={listContainerVariants}
            initial="hidden"
            animate="show"
            className={isCompact ? 'space-y-3' : 'space-y-4'}
          >
            {dashboardData.pipeline.map((idea: any) => (
              <motion.div 
                key={idea.id} 
                variants={listItemVariants}
                whileHover={{ scale: 1.005, y: -2 }}
                transition={{ duration: 0.2 }}
                className={`glass-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-amber-500/10 hover:border-amber-500/30 transition-all ${isCompact ? 'p-4' : 'p-6'}`}
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[9px] bg-amber-500/10 text-amber-400 font-semibold px-2 py-0.5 rounded border border-amber-500/20 uppercase">
                      {idea.category}
                    </span>
                    <span className="text-[9px] bg-white/5 text-white/50 px-2 py-0.5 rounded">
                      {idea.stage}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{idea.title}</h3>
                  <p className="text-xs text-white/50 mt-1 max-w-md line-clamp-1">{idea.summary}</p>
                </div>
                <Link 
                  to={`/ideas/${idea.id}`} 
                  className="btn-secondary py-1.5 px-3 text-xs flex items-center justify-center gap-1 hover:bg-amber-500/10 hover:border-amber-500/30"
                >
                  <Eye className="w-3 h-3" />
                  View Details
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className={`glass-card flex flex-col items-center gap-3 text-center ${isCompact ? 'p-6 py-8' : 'p-8 py-12'}`}>
            <Bookmark className="w-8 h-8 text-white/20" />
            <p className="text-xs text-white/50">You aren't tracking any projects yet.</p>
            <Link to="/ideas" className="btn-primary py-1.5 px-4 text-xs mt-1">Find Projects</Link>
          </div>
        )}
      </div>

      {/* General Startup List feed */}
      <div className={`md:col-span-4 ${isCompact ? 'space-y-3' : 'space-y-6'}`}>
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-4.5 h-4.5 text-indigo-400" />
          All Projects
        </h2>
        
        {loading ? (
          <div className="space-y-3">
            <div className="h-16 bg-white/[0.02] border border-white/[0.06] rounded-xl animate-pulse" />
            <div className="h-16 bg-white/[0.02] border border-white/[0.06] rounded-xl animate-pulse" />
            <div className="h-16 bg-white/[0.02] border border-white/[0.06] rounded-xl animate-pulse" />
          </div>
        ) : dashboardData?.allStartups && (
          <motion.div 
            variants={listContainerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3 max-h-[500px] overflow-y-auto pr-1"
          >
            {dashboardData.allStartups.map((idea: any) => (
              <motion.div 
                key={idea.id} 
                variants={listItemVariants}
                whileHover={{ scale: 1.01, y: -2 }}
                transition={{ duration: 0.2 }}
                className="glass p-3 space-y-2 hover:border-white/10 transition-all"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded text-white/60">{idea.category}</span>
                  <span className="text-[8px] text-indigo-400 font-medium">Founder: {idea.founderName}</span>
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-1">{idea.title}</h4>
                <p className="text-[11px] text-white/40 line-clamp-2">{idea.summary}</p>
                <Link 
                  to={`/ideas/${idea.id}`}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold block pt-0.5"
                >
                  View Details &rarr;
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

    </div>
  );
}
