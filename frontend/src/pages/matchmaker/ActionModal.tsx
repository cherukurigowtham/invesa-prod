/**
 * ActionModal.tsx
 *
 * Renders the sliding overlay panel to invite a builder, apply to a team,
 * or express investor interest.
 */

import React from 'react';
import { Sparkles, Check, ArrowRight } from 'lucide-react';
import type { User } from '../../shared/lib/api';
import { motion } from 'framer-motion';

interface ActionModalProps {
  selectedMatch: any;
  user: User | null;
  actionSuccess: boolean;
  actionLoading: boolean;
  actionMsg: string;
  setActionMsg: (s: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function ActionModal({
  selectedMatch,
  user,
  actionSuccess,
  actionLoading,
  actionMsg,
  setActionMsg,
  onSubmit,
  onClose
}: ActionModalProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring" as const, stiffness: 350, damping: 25 }}
        className="glass-card max-w-md w-full p-6 space-y-4 relative"
      >
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          {user?.role === 'founder' 
            ? `Invite ${selectedMatch.builder.name}` 
            : user?.role === 'builder'
            ? `Apply to join ${selectedMatch.idea.title}`
            : `Interested in ${selectedMatch.idea.title}`}
        </h3>

        {actionSuccess ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 animate-bounce">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-white">Connection Proposal Sent!</h4>
            <p className="text-xs text-white/55">The recipient has been notified via the secure dashboard.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-white/55 block mb-1">
                {user?.role === 'founder' 
                  ? 'Message' 
                  : user?.role === 'builder'
                  ? 'Why do you want to join?'
                  : 'Note to Founder'}
              </label>
              <textarea 
                value={actionMsg}
                onChange={(e) => setActionMsg(e.target.value)}
                required
                placeholder={user?.role === 'founder' 
                  ? 'Hi, I saw your profile and would love to invite you to join our project.'
                  : user?.role === 'builder'
                  ? 'Hi, I would like to join your project. Here is why I am interested.'
                  : 'Hi, I am interested in supporting your project.'}
                className="w-full bg-black/25 border border-white/10 rounded-lg p-3 text-xs text-white placeholder-white/30 h-28 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={onClose}
                className="btn-secondary py-2 text-xs flex-1 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={actionLoading}
                className="btn-primary py-2 text-xs flex-1 flex items-center justify-center gap-1 cursor-pointer"
              >
                {actionLoading ? 'Submitting...' : 'Send Proposal'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
