/**
 * BuilderView.tsx
 *
 * Renders the dashboard view for Builders:
 * - Join request applications sent to startup founders with status tags (Pending/Accepted/Declined)
 * - Teams joined successfully
 */

import { Link } from 'react-router-dom';
import { MessageSquare, Users, ArrowRight } from 'lucide-react';
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

interface BuilderViewProps {
  dashboardData: any;
  loading: boolean;
  density?: 'spacious' | 'compact';
}

export default function BuilderView({ dashboardData, loading, density = 'spacious' }: BuilderViewProps) {
  const isCompact = density === 'compact';

  return (
    <div className={`grid grid-cols-1 md:grid-cols-12 animate-fade-in ${isCompact ? 'gap-4' : 'gap-8'}`}>
      
      {/* Applied ideas */}
      <div className={`md:col-span-8 ${isCompact ? 'space-y-3' : 'space-y-6'}`}>
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-4.5 h-4.5 text-emerald-400" />
          My Join Requests
        </h2>

        {loading ? (
          <ProjectsGridSkeleton count={2} />
        ) : dashboardData?.appliedRequests && dashboardData.appliedRequests.length > 0 ? (
          <motion.div 
            variants={listContainerVariants}
            initial="hidden"
            animate="show"
            className={isCompact ? 'space-y-3' : 'space-y-4'}
          >
            {dashboardData.appliedRequests.map((req: any) => (
              <motion.div 
                key={req.id} 
                variants={listItemVariants}
                whileHover={{ scale: 1.005, y: -2 }}
                transition={{ duration: 0.2 }}
                className={`glass-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-emerald-500/15 transition-all ${isCompact ? 'p-4' : 'p-6'}`}
              >
                <div>
                  <h3 className="text-sm font-bold text-white">{req.ideaTitle}</h3>
                  <p className="text-xs text-white/50 mt-1 italic">Message: "{req.message}"</p>
                  <span className="text-[9px] text-white/30 block mt-1.5">Applied: {new Date(req.createdAt).toLocaleDateString()}</span>
                </div>
                
                {/* Status indicator */}
                <div>
                  {req.status === 'accepted' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      Accepted
                    </span>
                  ) : req.status === 'rejected' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 border border-red-500/20 text-red-400">
                      Declined
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      Pending Review
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className={`glass-card flex flex-col items-center gap-3 text-center ${isCompact ? 'p-6 py-8' : 'p-8 py-12'}`}>
            <MessageSquare className="w-8 h-8 text-white/20" />
            <p className="text-xs text-white/50">You haven't applied to join any projects yet.</p>
            <p className="text-[11px] text-white/30">Find projects looking for builders and send a request.</p>
            <Link to="/ideas" className="btn-primary py-1.5 px-4 text-xs mt-1">Find Projects</Link>
          </div>
        )}
      </div>

      {/* Active joined teams */}
      <div className={`md:col-span-4 ${isCompact ? 'space-y-3' : 'space-y-6'}`}>
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Users className="w-4.5 h-4.5 text-indigo-400" />
          Teams I'm In
        </h2>
        {loading ? (
          <div className="space-y-3">
            <div className="h-20 bg-white/[0.02] border border-white/[0.06] rounded-xl animate-pulse" />
          </div>
        ) : dashboardData?.myTeams && dashboardData.myTeams.length > 0 ? (
          <motion.div 
            variants={listContainerVariants}
            initial="hidden"
            animate="show"
            className={isCompact ? 'space-y-3' : 'space-y-4'}
          >
            {dashboardData.myTeams.map((team: any) => (
              <motion.div 
                key={team.id} 
                variants={listItemVariants}
                whileHover={{ scale: 1.01, y: -2 }}
                transition={{ duration: 0.2 }}
                className={`glass-card space-y-3 border border-indigo-500/10 ${isCompact ? 'p-3' : 'p-4'}`}
              >
                <div>
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded uppercase font-semibold">
                    {team.category}
                  </span>
                  <h4 className="text-xs font-bold text-white mt-1.5">{team.title}</h4>
                </div>
                <Link 
                  to={`/ideas/${team.id}`} 
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  Go to Workspace <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className={`glass-card flex flex-col items-center gap-2.5 text-center ${isCompact ? 'p-4 py-6' : 'p-6 py-8'}`}>
            <Users className="w-6 h-6 text-white/15" />
            <p className="text-[11px] text-white/40">You haven't joined a team yet.</p>
            <p className="text-[10px] text-white/25">Once a team accepts your request, it will appear here.</p>
          </div>
        )}
      </div>

    </div>
  );
}
