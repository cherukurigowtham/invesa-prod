/**
 * IdeaMatchCard.tsx
 *
 * Renders a card displaying a matched startup project idea for Builders or Investors.
 */

import { Link } from 'react-router-dom';
import { MessageSquare, Zap } from 'lucide-react';
import type { IdeaMatch } from '../../shared/lib/api';
import MatchScoreCircle from './MatchScoreCircle';
import { motion } from 'framer-motion';

interface IdeaMatchCardProps {
  match: IdeaMatch;
  role: 'builder' | 'investor';
  getPercentageColor: (score: number) => string;
  onActionClick: (match: IdeaMatch) => void;
}

export default function IdeaMatchCard({ match, role, getPercentageColor, onActionClick }: IdeaMatchCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring" as const, stiffness: 450, damping: 25 }}
      className="glass-card p-8 flex flex-col justify-between hover:border-indigo-500/30 transition-colors duration-300 h-full"
    >
      <div className="space-y-6">
        
        {/* Top Row */}
        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-semibold uppercase">
                {match.idea.category}
              </span>
              <span className="text-[9px] bg-white/5 text-white/55 px-2 py-0.5 rounded">
                {match.idea.stage}
              </span>
            </div>
            <h3 className="font-bold text-white text-base line-clamp-1">{match.idea.title}</h3>
            <span className="text-[10px] text-white/30 block mt-0.5">Founder: {match.founderName}</span>
          </div>
          
          {/* Score circle */}
          <MatchScoreCircle score={match.matchScore} getPercentageColor={getPercentageColor} />
        </div>

        {/* Summary */}
        <p className="text-xs text-white/50 line-clamp-3 leading-relaxed">
          {match.idea.summary}
        </p>

        {/* Match details */}
        <div className="space-y-2 pt-2">
          <div className="text-[10px] text-white/40 uppercase tracking-wide">
            {role === 'builder' ? 'Matching Roles' : 'Preferred Segments'}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {match.matchingSkills.map((s, idx) => (
              <span key={idx} className="text-[9px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                {s}
              </span>
            ))}
          </div>
        </div>

        {role === 'builder' && match.missingSkills.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] text-white/40 uppercase tracking-wide">Other Open Roles</div>
            <div className="flex flex-wrap gap-1.5">
              {match.missingSkills.slice(0, 3).map((s, idx) => (
                <span key={idx} className="text-[9px] bg-white/5 text-white/45 px-2 py-0.5 rounded">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>

      <div className="pt-6 mt-6 border-t border-white/5 flex gap-2">
        <Link 
          to={`/chat?with=${match.idea.founderId}`}
          className="btn-secondary p-2.5 text-xs flex-shrink-0 text-center flex items-center justify-center no-underline"
          title="Chat with Founder"
        >
          <MessageSquare className="w-4 h-4" />
        </Link>
        <Link 
          to={`/ideas/${match.idea.id}`}
          className="btn-secondary py-2 text-xs flex-1 text-center no-underline"
        >
          View Details
        </Link>
        <button 
          onClick={() => onActionClick(match)}
          className="btn-primary py-2 text-xs flex-1 flex items-center justify-center gap-1 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5" />
          {role === 'builder' ? 'Apply' : 'Interested'}
        </button>
      </div>
    </motion.div>
  );
}
