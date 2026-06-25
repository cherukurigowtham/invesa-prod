/**
 * BuilderMatchCard.tsx
 *
 * Renders a card displaying a matched Builder profile for startup founders.
 */

import { Link } from 'react-router-dom';
import { User as UserIcon, MessageSquare, Zap } from 'lucide-react';
import type { BuilderMatch } from '../../shared/lib/api';
import MatchScoreCircle from './MatchScoreCircle';
import { motion } from 'framer-motion';

interface BuilderMatchCardProps {
  match: BuilderMatch;
  getPercentageColor: (score: number) => string;
  onInviteClick: (match: BuilderMatch) => void;
}

export default function BuilderMatchCard({ match, getPercentageColor, onInviteClick }: BuilderMatchCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring" as const, stiffness: 450, damping: 25 }}
      className="glass-card p-8 flex flex-col justify-between hover:border-indigo-500/30 transition-colors duration-300 h-full"
    >
      <div className="space-y-6">
        
        {/* Top match row */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white/70" />
            </div>
            <div>
              <h3 className="font-bold text-white leading-tight">{match.builder.name}</h3>
              <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">Builder</span>
            </div>
          </div>
          
          {/* Score circle */}
          <MatchScoreCircle score={match.matchScore} getPercentageColor={getPercentageColor} />
        </div>

        {/* Bio */}
        <p className="text-xs text-white/50 line-clamp-3 leading-relaxed">
          {match.builder.bio || "No biography provided."}
        </p>

        {/* Skills overlap details */}
        <div className="space-y-2 pt-2">
          <div className="text-[10px] text-white/40 uppercase tracking-wide">Matching Skills</div>
          <div className="flex flex-wrap gap-1.5">
            {match.matchingSkills.length > 0 ? (
              match.matchingSkills.map((s, idx) => (
                <span key={idx} className="text-[9px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                  {s}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-white/30 italic">No exact skill tag overlap</span>
            )}
          </div>
        </div>

        {match.missingSkills.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] text-white/40 uppercase tracking-wide">Missing requirements</div>
            <div className="flex flex-wrap gap-1.5">
              {match.missingSkills.slice(0, 3).map((s, idx) => (
                <span key={idx} className="text-[9px] bg-white/5 text-white/40 px-2 py-0.5 rounded">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>

      <div className="pt-6 mt-6 border-t border-white/5 flex gap-3">
        <Link 
          to={`/chat?with=${match.builder.id}`}
          className="btn-secondary py-2 text-xs flex-1 text-center flex items-center justify-center gap-1.5 no-underline"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Message
        </Link>
        <button 
          onClick={() => onInviteClick(match)}
          className="btn-primary py-2 text-xs flex-1 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5" />
          Invite
        </button>
      </div>
    </motion.div>
  );
}
