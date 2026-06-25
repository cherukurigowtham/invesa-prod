/**
 * IdeaActionPanel.tsx
 *
 * Right-column sidebar for IdeaDetail:
 * - Open team slots widget
 * - Founder inbox: join requests + investor signals
 * - Builder: join request form
 * - Investor: interest tracking form
 * - Logged-out: "Get Involved" sign-in prompt
 */

import { Check, Send, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Idea, User } from '../../shared/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface IdeaActionPanelProps {
  idea: Idea;
  user: User | null;
  isFounder: boolean;
  isBuilder: boolean;
  isInvestor: boolean;
  hasApplied: boolean;
  pendingRequests: Idea['joinRequests'];
  investorInterests: Idea['investorInterests'];
  joinMsg: string;
  joinSubmitting: boolean;
  investorNote: string;
  investorSubmitting: boolean;
  investorSuccess: boolean;
  locationPathname: string;
  onJoinMsgChange: (v: string) => void;
  onJoinSubmit: (e: React.FormEvent) => void;
  onInvestorNoteChange: (v: string) => void;
  onInvestorSubmit: (e: React.FormEvent) => void;
  onAcceptRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function IdeaActionPanel({
  idea,
  user,
  isFounder,
  isBuilder,
  isInvestor,
  hasApplied,
  pendingRequests,
  investorInterests,
  joinMsg,
  joinSubmitting,
  investorNote,
  investorSubmitting,
  investorSuccess,
  locationPathname,
  onJoinMsgChange,
  onJoinSubmit,
  onInvestorNoteChange,
  onInvestorSubmit,
  onAcceptRequest,
  onRejectRequest,
}: IdeaActionPanelProps) {
  return (
    <div className="xl:col-span-4 space-y-8">

      {/* ── Open team slots widget ── */}
      <div className="glass-card p-8 space-y-6">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide">
          Positions to Fill
        </h3>
        {idea.teamSlots && idea.teamSlots.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {idea.teamSlots.map((slot, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm text-emerald-400 font-medium">{slot}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-white/40 py-2">No open positions.</div>
        )}
      </div>

      {/* ── Role-conditional interaction widgets ── */}

      {isFounder ? (
        /* ── Founder inbox ── */
        <div className="glass-card p-8 space-y-8">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide">Inbox</h3>

          {/* Join requests */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white/80 uppercase">
              Join Requests ({pendingRequests?.length ?? 0})
            </h4>
            {pendingRequests && pendingRequests.length > 0 ? (
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <div
                    key={req.id}
                    className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{req.builderName}</span>
                      <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/50">
                        Builder
                      </span>
                    </div>
                    <p className="text-xs text-white/60 leading-normal bg-black/20 p-2.5 rounded border border-white/5 italic">
                      "{req.message}"
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => onRejectRequest(req.id)}
                        className="py-1.5 rounded-lg border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 active:scale-95 transition-all text-xs font-medium cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => onAcceptRequest(req.id)}
                        className="py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white active:scale-95 transition-all text-xs font-semibold cursor-pointer"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-white/40 py-2">No requests yet.</div>
            )}
          </div>

          {/* Investor signals */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h4 className="text-xs font-bold text-white/80 uppercase">
              Interested Investors ({investorInterests?.length ?? 0})
            </h4>
            {investorInterests && investorInterests.length > 0 ? (
              <div className="space-y-3">
                {investorInterests.map(interest => (
                  <div
                    key={interest.id}
                    className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-amber-400">
                        {interest.investorName}
                      </span>
                      <span className="text-[10px] bg-amber-500/10 px-2 py-0.5 rounded text-amber-400 border border-amber-500/20">
                        Tracked
                      </span>
                    </div>
                    <p className="text-xs text-white/60 italic">"{interest.note}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-white/40 py-2">No investors tracking yet.</div>
            )}
          </div>
        </div>
      ) : !user ? (
        /* ── Logged-out prompt ── */
        <div className="glass-card p-6 text-center space-y-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-white">Get Involved</h4>
          <p className="text-xs text-white/50 leading-relaxed">
            Log in to contact the founder, request to join, or track updates.
          </p>
          <Link
            to={`/login?redirect=${encodeURIComponent(locationPathname)}`}
            className="btn-primary w-full py-2.5 text-xs inline-block text-center font-semibold"
          >
            Sign In
          </Link>
        </div>
      ) : isBuilder ? (
        /* ── Builder join form ── */
        <div className="glass-card p-6 space-y-4" id="join-request-form">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide">
            Request to Join
          </h3>
          {hasApplied ? (
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center text-xs text-indigo-400 font-semibold flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" /> Request Sent
            </div>
          ) : (
            <form onSubmit={onJoinSubmit} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-semibold text-white/50 uppercase block mb-1">
                  Introduce Yourself
                </label>
                <textarea
                  required
                  value={joinMsg}
                  onChange={e => onJoinMsgChange(e.target.value)}
                  placeholder="Hi, I'd like to join because..."
                  rows={4}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-xs outline-none text-white focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 placeholder-white/30 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={joinSubmitting}
                className="w-full btn-primary py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {joinSubmitting ? 'Submitting...' : 'Send'}
              </button>
            </form>
          )}
        </div>
      ) : isInvestor ? (
        /* ── Investor interest form ── */
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide">
            Track Startup
          </h3>
          {investorSuccess ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center text-xs text-amber-400 font-semibold flex items-center justify-center gap-1.5">
              <Bookmark className="w-4 h-4" /> Added to Watchlist
            </div>
          ) : (
            <form onSubmit={onInvestorSubmit} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-semibold text-white/50 uppercase block mb-1">
                  Add a Private Note
                </label>
                <textarea
                  required
                  value={investorNote}
                  onChange={e => onInvestorNoteChange(e.target.value)}
                  placeholder="Hi, I am tracking this project..."
                  rows={4}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-xs outline-none text-white focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 placeholder-white/30 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={investorSubmitting}
                className="w-full bg-amber-500 hover:bg-amber-400 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-amber-500/10"
              >
                <Bookmark className="w-3.5 h-3.5" />
                {investorSubmitting ? 'Submitting...' : 'Track Project'}
              </button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}
