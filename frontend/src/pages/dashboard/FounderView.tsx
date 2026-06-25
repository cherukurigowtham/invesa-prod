/**
 * FounderView.tsx
 *
 * Renders the dashboard view for Founders:
 * - List of posted projects (with view details link)
 * - Co-founder join requests inbox (with Accept/Reject actions)
 * - Interested investors signals watchlist
 */

import { Link } from 'react-router-dom';
import { Briefcase, Eye, Users, TrendingUp } from 'lucide-react';
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

interface FounderViewProps {
  dashboardData: any;
  loading: boolean;
  handleRequestStatus: (ideaId: string, requestId: string, accept: boolean) => void;
  density?: 'spacious' | 'compact';
}

export default function FounderView({ dashboardData, loading, handleRequestStatus, density = 'spacious' }: FounderViewProps) {
  const isCompact = density === 'compact';

  return (
    <div className={`grid grid-cols-1 md:grid-cols-12 animate-fade-in ${isCompact ? 'gap-4' : 'gap-8'}`}>
      {/* Left Column: My Ideas */}
      <div className={`md:col-span-8 ${isCompact ? 'space-y-3' : 'space-y-6'}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Briefcase className="w-4.5 h-4.5 text-indigo-400" />
            My Projects
          </h2>
          <span className="text-xs text-white/40">
            {loading ? '...' : `${dashboardData?.myIdeas?.length || 0} active`}
          </span>
        </div>

        {loading ? (
          <ProjectsGridSkeleton count={2} />
        ) : dashboardData?.myIdeas && dashboardData.myIdeas.length > 0 ? (
          <motion.div 
            variants={listContainerVariants}
            initial="hidden"
            animate="show"
            className={isCompact ? 'space-y-3' : 'space-y-4'}
          >
            {dashboardData.myIdeas.map((idea: any) => (
              <motion.div 
                key={idea.id} 
                variants={listItemVariants}
                whileHover={{ scale: 1.005, y: -2 }}
                transition={{ duration: 0.2 }}
                className={`glass-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-indigo-500/20 transition-all ${isCompact ? 'p-4' : 'p-6'}`}
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-semibold px-2 py-0.5 rounded border border-indigo-500/20 uppercase">
                      {idea.category}
                    </span>
                    <span className="text-[9px] bg-white/5 text-white/60 px-2 py-0.5 rounded border border-white/5">
                      {idea.stage}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{idea.title}</h3>
                  <p className="text-xs text-white/50 mt-1 max-w-md line-clamp-1">{idea.summary}</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Link 
                    to={`/ideas/${idea.id}`} 
                    className="btn-secondary py-1.5 px-3 text-xs w-full sm:w-auto text-center flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Details
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className={`glass-card flex flex-col items-center gap-3 text-center ${isCompact ? 'p-6 py-8' : 'p-8 py-12'}`}>
            <Briefcase className="w-8 h-8 text-white/20" />
            <p className="text-xs text-white/50">You haven't posted any projects yet.</p>
            <Link to="/post-idea" className="btn-primary py-1.5 px-4 text-xs">Share an Idea</Link>
          </div>
        )}
      </div>

      {/* Right Column: Inboxes */}
      <div className={`md:col-span-4 ${isCompact ? 'space-y-4' : 'space-y-8'}`}>
        
        {/* Join Requests Inbox */}
        <div className={`glass-card space-y-4 ${isCompact ? 'p-4' : 'p-6'}`}>
          <h3 className="text-[10px] font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            People Wanting to Join ({loading ? '...' : (dashboardData?.pendingRequests?.length || 0)})
          </h3>

          {loading ? (
            <div className="space-y-3">
              <div className="h-20 bg-white/[0.02] border border-white/[0.06] rounded-xl animate-pulse" />
              <div className="h-20 bg-white/[0.02] border border-white/[0.06] rounded-xl animate-pulse" />
            </div>
          ) : dashboardData?.pendingRequests && dashboardData.pendingRequests.length > 0 ? (
            <motion.div 
              variants={listContainerVariants}
              initial="hidden"
              animate="show"
              className="space-y-3 max-h-[300px] overflow-y-auto pr-1"
            >
              {dashboardData.pendingRequests.map((req: any) => (
                <motion.div 
                  key={req.id} 
                  variants={listItemVariants}
                  className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-semibold text-white">{req.builderName}</div>
                      {req.builderSkills && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {req.builderSkills.slice(0, 2).map((s: string, idx: number) => (
                            <span key={idx} className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[8px] text-white/30">Just now</span>
                  </div>
                  <p className="text-[10px] text-white/50 bg-black/20 p-2 rounded border border-white/5 italic">
                    "{req.message}"
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleRequestStatus(req.ideaId, req.id, false)}
                      className="py-1 rounded-lg border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 text-[9px] font-semibold cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleRequestStatus(req.ideaId, req.id, true)}
                      className="py-1 rounded-lg bg-indigo-500 text-white hover:bg-indigo-400 text-[9px] font-semibold cursor-pointer"
                    >
                      Accept
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-[11px] text-white/40 py-1">No requests yet.</div>
          )}
        </div>

        {/* Investor signals inbox */}
        <div className={`glass-card space-y-4 ${isCompact ? 'p-4' : 'p-6'}`}>
          <h3 className="text-[10px] font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            Interested Investors ({loading ? '...' : (dashboardData?.investorSignals?.length || 0)})
          </h3>

          {loading ? (
            <div className="space-y-3">
              <div className="h-14 bg-white/[0.02] border border-white/[0.06] rounded-xl animate-pulse" />
            </div>
          ) : dashboardData?.investorSignals && dashboardData.investorSignals.length > 0 ? (
            <motion.div 
              variants={listContainerVariants}
              initial="hidden"
              animate="show"
              className="space-y-2 max-h-[300px] overflow-y-auto"
            >
              {dashboardData.investorSignals.map((sig: any) => (
                <motion.div 
                  key={sig.id} 
                  variants={listItemVariants}
                  className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-xl"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-semibold text-amber-400">{sig.investorName}</span>
                    <span className="text-[8px] text-white/40">Tracked</span>
                  </div>
                  <p className="text-[10px] text-white/60 italic">"{sig.note}"</p>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-[11px] text-white/40 py-1">No investors tracking yet.</div>
          )}
        </div>

      </div>
    </div>
  );
}
