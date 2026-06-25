/**
 * EvaluationPanel.tsx
 *
 * "AI Review" tab content for IdeaDetail:
 * - Loading skeleton with animated steps
 * - Error state with retry
 * - Empty prompt state
 * - Results: overall score, 3 rating cards, SWOT matrix, recommendations
 */

import {
  Brain, Sparkles, Check, AlertCircle, AlertTriangle,
  Target, TrendingUp, Lightbulb, ChevronRight,
} from 'lucide-react';
import type { IdeaAnalysis } from '../../shared/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvaluationPanelProps {
  analysis: IdeaAnalysis | null;
  analysisLoading: boolean;
  analysisStep: number;
  analysisError: string | null;
  analysisSteps: string[];
  onAnalyze: () => void;
}

// ─── Internal sub-components ──────────────────────────────────────────────────

function RatingCard({
  icon,
  label,
  rating,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  rating: number;
  colorClass: 'indigo' | 'emerald' | 'amber';
}) {
  const colors = {
    indigo:  { bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20',  bar: 'bg-indigo-500',  text: 'text-indigo-400'  },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', bar: 'bg-emerald-500', text: 'text-emerald-400' },
    amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   bar: 'bg-amber-500',   text: 'text-amber-400'   },
  }[colorClass];

  return (
    <div className={`glass-card p-5 ${colors.bg} ${colors.border} flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className={`text-xs font-semibold ${colors.text}`}>{label}</span>
        </div>
        <span className="text-2xl font-extrabold text-white">{rating}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.bar} rounded-full transition-all duration-700`}
          style={{ width: `${(rating / 5) * 100}%` }}
        />
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= rating ? colors.bar : 'bg-white/5'}`} />
        ))}
      </div>
    </div>
  );
}

function SwotCard({
  title, items, icon, bgClass, borderClass, textClass, dotClass,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
  bgClass: string;
  borderClass: string;
  textClass: string;
  dotClass: string;
}) {
  return (
    <div className={`glass-card p-5 ${bgClass} border ${borderClass}`}>
      <div className={`flex items-center gap-2 mb-4 ${textClass}`}>
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
      </div>
      <ul className="space-y-2.5">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-xs text-white/60 leading-relaxed">
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass} mt-1.5 flex-shrink-0`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EvaluationPanel({
  analysis,
  analysisLoading,
  analysisStep,
  analysisError,
  analysisSteps,
  onAnalyze,
}: EvaluationPanelProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Loading skeleton ── */}
      {analysisLoading && (
        <div className="glass-card p-8 sm:p-12">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-violet-500/20 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-violet-400 animate-pulse" />
                </div>
                <div className="absolute inset-0 rounded-full border-t-2 border-violet-500 animate-spin" />
              </div>
            </div>
            <div className="space-y-3">
              {analysisSteps.map((step, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-500 ${
                    analysisStep > idx
                      ? 'bg-violet-500/10 border-violet-500/20 text-violet-300'
                      : analysisStep === idx
                      ? 'bg-white/[0.03] border-white/10 text-white/80 animate-pulse'
                      : 'bg-transparent border-transparent text-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      analysisStep > idx ? 'bg-violet-500/30' : 'bg-white/5'
                    }`}
                  >
                    {analysisStep > idx ? (
                      <Check className="w-3 h-3 text-violet-300" />
                    ) : (
                      <span className="text-[9px] text-white/30">{idx + 1}</span>
                    )}
                  </div>
                  <span className="text-xs font-medium">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Error state ── */}
      {analysisError && !analysisLoading && (
        <div className="glass-card p-6 border border-red-500/20 bg-red-500/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-400">Analysis Failed</p>
            <p className="text-xs text-white/40 mt-1">{analysisError}</p>
            <button
              onClick={onAnalyze}
              className="mt-3 text-xs text-red-400 hover:text-red-300 underline cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* ── Empty / prompt state ── */}
      {!analysis && !analysisLoading && !analysisError && (
        <div className="glass-card p-12 py-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.05)_0%,_transparent_70%)]" />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-5">
              <Sparkles className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Get Strategic Scorecard</h3>
            <p className="text-sm text-white/50 leading-relaxed max-w-md mx-auto mb-6">
              Evaluate this project's structural parameters (Market Fit, Viability, Innovation) and SWOT matrix using our rule-based diagnostic engine.
            </p>
            <button
              onClick={onAnalyze}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 active:scale-97 shadow-lg shadow-violet-500/20 cursor-pointer"
            >
              <Brain className="w-4 h-4" />
              Generate Scorecard
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {analysis && !analysisLoading && (
        <div className="space-y-6">
          {/* Re-analyze header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <Brain className="w-4 h-4 text-violet-400" />
              <span>Invesa Diagnostic Engine</span>
            </div>
            <button
              onClick={onAnalyze}
              className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-violet-400" />
              Re-analyze
            </button>
          </div>

          {/* Score row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Overall score — large card */}
            <div className="sm:col-span-1 glass-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden border-violet-500/20 border">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.07)_0%,_transparent_80%)]" />
              <div className="relative">
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400/70 mb-2">
                  Overall Score
                </p>
                <div className="text-5xl font-extrabold text-white leading-none mb-1">
                  {analysis.overallScore}
                </div>
                <div className="text-xs text-white/30 mb-3">/ 99</div>
                <div
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    analysis.overallScore >= 80
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : analysis.overallScore >= 65
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}
                >
                  {analysis.overallScore >= 80
                    ? '🚀 High Potential'
                    : analysis.overallScore >= 65
                    ? '⚡ Promising'
                    : '🌱 Early Stage'}
                </div>
              </div>
            </div>

            {/* Three rating cards */}
            <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <RatingCard icon={<Target className="w-4 h-4 text-indigo-400" />}  label="Market Fit"  rating={analysis.marketFitRating}   colorClass="indigo"  />
              <RatingCard icon={<TrendingUp className="w-4 h-4 text-emerald-400" />} label="Viability"   rating={analysis.viabilityRating}    colorClass="emerald" />
              <RatingCard icon={<Lightbulb className="w-4 h-4 text-amber-400" />}  label="Innovation"  rating={analysis.innovationRating}   colorClass="amber"   />
            </div>
          </div>

          {/* SWOT matrix */}
          <div>
            <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-1 h-3.5 bg-violet-500 rounded-full" />
              SWOT Analysis
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SwotCard title="Strengths"    items={analysis.strengths}    icon={<Check className="w-3.5 h-3.5" />}         bgClass="bg-emerald-500/5" borderClass="border-emerald-500/15" textClass="text-emerald-400" dotClass="bg-emerald-500" />
              <SwotCard title="Weaknesses"   items={analysis.weaknesses}   icon={<AlertTriangle className="w-3.5 h-3.5" />} bgClass="bg-rose-500/5"    borderClass="border-rose-500/15"    textClass="text-rose-400"    dotClass="bg-rose-500"    />
              <SwotCard title="Opportunities" items={analysis.opportunities} icon={<TrendingUp className="w-3.5 h-3.5" />}  bgClass="bg-violet-500/5"  borderClass="border-violet-500/15"  textClass="text-violet-400"  dotClass="bg-violet-500"  />
              <SwotCard title="Threats"      items={analysis.threats}      icon={<AlertCircle className="w-3.5 h-3.5" />}  bgClass="bg-amber-500/5"   borderClass="border-amber-500/15"   textClass="text-amber-400"   dotClass="bg-amber-500"   />
            </div>
          </div>

          {/* Strategic recommendations */}
          <div className="glass-card p-5 border-l-4 border-violet-500">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Strategic Recommendations
              </h3>
            </div>
            <div className="space-y-3">
              {analysis.recommendations
                .split('\n')
                .filter(l => l.trim())
                .map((line, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-white/70 leading-relaxed">
                    <ChevronRight className="w-3.5 h-3.5 text-violet-400 mt-0.5 flex-shrink-0" />
                    <span>{line.replace(/^\d+\.\s*/, '')}</span>
                  </div>
                ))}
            </div>
            <p className="text-[9px] text-white/20 mt-4 pt-3 border-t border-white/5">
              Scorecard generated by Invesa Diagnostic Engine ·{' '}
              {new Date(analysis.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
