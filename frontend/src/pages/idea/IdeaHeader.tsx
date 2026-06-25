/**
 * IdeaHeader.tsx
 *
 * Renders the top hero card for a project:
 * - Category + Stage badges
 * - Project title
 * - L2 Blockchain Registry Proof card
 * - "Verify Fingerprint" button trigger
 */

import { ShieldCheck, Link2 } from 'lucide-react';
import { getL2Details } from '../../shared/lib/api';
import type { Idea } from '../../shared/lib/api';

interface IdeaHeaderProps {
  idea: Idea;
  onOpenVerifyModal: () => void;
  onDownloadCertificate: () => void;
}

export default function IdeaHeader({ idea, onOpenVerifyModal, onDownloadCertificate }: IdeaHeaderProps) {
  const l2Details = getL2Details(idea.id, idea.ipHash, idea.createdAt);

  return (
    <div className="glass-card p-8 sm:p-10 space-y-8">
      {/* ── Category / Stage badges ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-md border border-indigo-500/20">
          {idea.category}
        </span>
        <span className="px-3 py-1 rounded-md text-xs font-semibold bg-white/5 border border-white/10 text-white/70">
          Stage: {idea.stage}
        </span>
      </div>

      {/* ── Title ── */}
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white leading-tight">
        {idea.title}
      </h1>

      {/* ── L2 Blockchain Registry Proof Card ── */}
      <div className="p-6 rounded-xl bg-indigo-500/5 border border-indigo-500/15 space-y-4">
        {/* Header row */}
        <div className="flex justify-between items-center gap-4 border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <div className="font-bold text-xs text-white">L2 Blockchain Registry Proof</div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Priority Anchored &amp; Verified
              </div>
            </div>
          </div>
          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 uppercase tracking-wider font-mono">
            {l2Details.network}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[10px]">
          <div className="flex flex-col gap-0.5">
            <span className="text-white/40 uppercase font-semibold">Registry Block</span>
            <span className="font-mono font-bold text-white">#{l2Details.blockNumber}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-white/40 uppercase font-semibold">Gas Consumed</span>
            <span className="font-mono font-bold text-white">{l2Details.gasUsed} gas</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-white/40 uppercase font-semibold">Verification link</span>
            <a
              href={`https://sepolia.arbiscan.io/tx/${l2Details.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5 underline"
            >
              Arbiscan <Link2 className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Hash + verify button */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
          <div className="text-[10px] text-white/50 leading-relaxed font-mono select-all break-all bg-black/40 p-2.5 rounded border border-white/5">
            <span className="text-white/30 uppercase font-sans font-semibold block text-[9px] tracking-wider mb-1">
              Cryptographic Fingerprint (SHA-256)
            </span>
            {idea.ipHash}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={onOpenVerifyModal}
              className="btn-secondary py-2 px-3 text-[10px] font-bold flex items-center justify-center gap-1.5 active:scale-97 cursor-pointer hover:bg-white/[0.06]"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Verify Fingerprint Authenticity
            </button>
            <button
              onClick={onDownloadCertificate}
              className="btn-secondary py-2 px-3 text-[10px] font-bold flex items-center justify-center gap-1.5 active:scale-97 cursor-pointer hover:bg-white/[0.06]"
            >
              <span>📜</span>
              Download Verified IP Certificate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
