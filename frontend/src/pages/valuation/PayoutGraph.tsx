import { useState } from 'react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GraphStep {
  exitValue: number;
  lead: number;
  co: number;
  seedInv: number;
  aInv: number;
  seedOpt: number;
  aOpt: number;
}

export interface ExitPayouts {
  lead: number;
  co: number;
  seedInv: number;
  aInv: number;
  seedOpt: number;
  aOpt: number;
}

interface PayoutGraphProps {
  graphSteps: GraphStep[];
  exitPayouts: ExitPayouts;
  exitValue: number;
  raise: number;
  seriesARaise: number;
  enableSeriesA: boolean;
  formatCurrency: (v: number) => string;
}

// ─── SVG constants ────────────────────────────────────────────────────────────

const SVG_WIDTH = 600;
const SVG_HEIGHT = 240;
const PAD_LEFT = 60;
const PAD_RIGHT = 30;
const PAD_TOP = 20;
const PAD_BOTTOM = 40;
const CHART_W = SVG_WIDTH - PAD_LEFT - PAD_RIGHT;
const CHART_H = SVG_HEIGHT - PAD_TOP - PAD_BOTTOM;
const MAX_EXIT = 150_000_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSvgX(exitVal: number) {
  return PAD_LEFT + (exitVal / MAX_EXIT) * CHART_W;
}

function toSvgY(payoutVal: number) {
  return SVG_HEIGHT - PAD_BOTTOM - (payoutVal / MAX_EXIT) * CHART_H;
}

function buildPath(steps: GraphStep[], key: keyof Omit<GraphStep, 'exitValue'>): string {
  return steps
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(s.exitValue)} ${toSvgY(s[key])}`)
    .join(' ');
}

// ─── Payout lines config ──────────────────────────────────────────────────────

const LINES = [
  { key: 'lead' as const, color: '#6366f1', label: 'Lead Founder', dash: '' },
  { key: 'co' as const, color: '#3b82f6', label: 'Co-founder', dash: '' },
  { key: 'seedInv' as const, color: '#f59e0b', label: 'Seed Investors', dash: '' },
  { key: 'aInv' as const, color: '#10b981', label: 'Series A', dash: '', seriesAOnly: true },
  { key: 'seedOpt' as const, color: '#ec4899', label: 'Seed Options', dash: '4,3' },
  { key: 'aOpt' as const, color: '#a855f7', label: 'Series A Opt', dash: '4,3', seriesAOnly: true },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function PayoutGraph({
  graphSteps,
  exitPayouts,
  exitValue,
  raise,
  seriesARaise,
  enableSeriesA,
  formatCurrency,
}: PayoutGraphProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  /** Map mouse X position within the SVG to the nearest graphStep index. */
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * SVG_WIDTH;
    const idx = Math.round(((relX - PAD_LEFT) / CHART_W) * 10);
    setHoveredIdx(idx >= 0 && idx <= 10 ? idx : null);
  };

  const visibleLines = LINES.filter(l => !l.seriesAOnly || enableSeriesA);

  // Summary cards data
  const summaryCards = [
    {
      label: 'Founders Combined Payout',
      value: exitPayouts.lead + exitPayouts.co,
      pct: ((exitPayouts.lead + exitPayouts.co) / (exitValue || 1)) * 100,
      color: 'text-indigo-400',
    },
    {
      label: 'Investors Combined Payout',
      value: exitPayouts.seedInv + exitPayouts.aInv,
      pct: ((exitPayouts.seedInv + exitPayouts.aInv) / (exitValue || 1)) * 100,
      color: 'text-emerald-400',
    },
    {
      label: 'Option Pool Payout',
      value: exitPayouts.seedOpt + exitPayouts.aOpt,
      pct: ((exitPayouts.seedOpt + exitPayouts.aOpt) / (exitValue || 1)) * 100,
      color: 'text-purple-400',
    },
  ];

  // Detailed splits data
  const splitRows = [
    { name: 'Lead Founder', payout: exitPayouts.lead, color: '#6366f1', role: 'Founder', invested: 0 },
    { name: 'Co-founder', payout: exitPayouts.co, color: '#3b82f6', role: 'Founder', invested: 0 },
    { name: 'Seed Investors', payout: exitPayouts.seedInv, color: '#f59e0b', role: 'Seed Preferred', invested: raise },
    ...(enableSeriesA
      ? [{ name: 'Series A Investors', payout: exitPayouts.aInv, color: '#10b981', role: 'Series A Preferred', invested: seriesARaise }]
      : []),
    { name: 'Seed Option Pool', payout: exitPayouts.seedOpt, color: '#ec4899', role: 'Option Pool', invested: 0 },
    ...(enableSeriesA
      ? [{ name: 'Series A Option Pool', payout: exitPayouts.aOpt, color: '#a855f7', role: 'Option Pool', invested: 0 }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* ── Section header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="font-display text-lg sm:text-xl font-extrabold text-white">
            Acquisition Payouts
          </h2>
          <p className="text-white/40 text-xs mt-0.5">
            How much everyone gets paid if your company is sold.
          </p>
        </div>
      </div>

      {/* ── Interactive waterfall graph ── */}
      <div className="glass-card p-6 flex flex-col gap-4 relative overflow-hidden">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
            Interactive Payout Waterfall
          </span>
          {hoveredIdx !== null && (
            <span className="text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded font-mono">
              Exit Value: {formatCurrency(graphSteps[hoveredIdx].exitValue)}
            </span>
          )}
        </div>

        <div className="relative w-full h-[220px] select-none">
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="w-full h-full overflow-visible"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {/* X-axis grid lines & labels */}
            {Array.from({ length: 6 }, (_, i) => {
              const val = i * 30_000_000;
              const x = toSvgX(val);
              return (
                <g key={i} className="opacity-25">
                  <line x1={x} y1={PAD_TOP} x2={x} y2={SVG_HEIGHT - PAD_BOTTOM} stroke="#fff" strokeWidth="0.5" strokeDasharray="3,3" />
                  <text x={x} y={SVG_HEIGHT - PAD_BOTTOM + 15} fill="#fff" fontSize="9" textAnchor="middle" className="font-mono opacity-60">
                    ${val / 1_000_000}M
                  </text>
                </g>
              );
            })}

            {/* Y-axis grid lines & labels */}
            {Array.from({ length: 4 }, (_, i) => {
              const val = i * 50_000_000;
              const y = toSvgY(val);
              return (
                <g key={i} className="opacity-25">
                  <line x1={PAD_LEFT} y1={y} x2={SVG_WIDTH - PAD_RIGHT} y2={y} stroke="#fff" strokeWidth="0.5" strokeDasharray="3,3" />
                  <text x={PAD_LEFT - 5} y={y + 3} fill="#fff" fontSize="9" textAnchor="end" className="font-mono opacity-60">
                    ${val / 1_000_000}M
                  </text>
                </g>
              );
            })}

            {/* Payout lines */}
            {visibleLines.map(({ key, color, dash }) => (
              <path
                key={key}
                d={buildPath(graphSteps, key)}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeDasharray={dash}
                className="transition-all duration-300"
              />
            ))}

            {/* Vertical hover indicator */}
            {hoveredIdx !== null && (
              <line
                x1={toSvgX(graphSteps[hoveredIdx].exitValue)}
                y1={PAD_TOP}
                x2={toSvgX(graphSteps[hoveredIdx].exitValue)}
                y2={SVG_HEIGHT - PAD_BOTTOM}
                stroke="#ffffff"
                strokeWidth="1.5"
                className="opacity-40 animate-fade-in"
              />
            )}

            {/* Hover dot markers */}
            {hoveredIdx !== null &&
              visibleLines.map(({ key, color }) => {
                const step = graphSteps[hoveredIdx];
                return (
                  <circle
                    key={key}
                    cx={toSvgX(step.exitValue)}
                    cy={toSvgY(step[key])}
                    r="4.5"
                    fill={color}
                    stroke="#0c0f18"
                    strokeWidth="1.5"
                    className="transition-all duration-150"
                  />
                );
              })}
          </svg>
        </div>

        {/* Hover tooltip table */}
        {hoveredIdx !== null && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 animate-fade-in text-[10px]">
            {visibleLines.map(({ key, color, label }) => (
              <div key={key} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 text-white/50 truncate">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="truncate">{label}</span>
                </div>
                <span className="font-semibold text-white font-mono">
                  {formatCurrency(graphSteps[hoveredIdx][key])}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map(card => (
          <div key={card.label} className="glass-card p-5 space-y-1 bg-white/[0.01]">
            <span className="text-[9px] text-white/40 uppercase tracking-wider block">{card.label}</span>
            <span className={`text-xl font-extrabold font-mono block ${card.color}`}>
              {formatCurrency(card.value)}
            </span>
            <span className="text-[9px] text-white/30 block">
              Combined Share: {card.pct.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      {/* ── Detailed payout split bars ── */}
      <div className="glass-card p-8 space-y-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          Detailed Payout Splits
        </h3>

        <div className="space-y-5">
          {splitRows.map((item, idx) => {
            const sharePct = (item.payout / (exitValue || 1)) * 100;
            const multiple = item.invested > 0 ? item.payout / item.invested : 0;
            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-white font-medium">{item.name}</span>
                    <span className="text-[9px] text-white/30 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">
                      {item.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    {item.invested > 0 && (
                      <span className={`text-[9px] font-semibold font-mono ${multiple >= 1 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {multiple.toFixed(1)}x return
                      </span>
                    )}
                    <div className="font-mono">
                      <span className="text-white font-bold">{formatCurrency(item.payout)}</span>
                      <span className="text-[9px] text-white/40 block">{sharePct.toFixed(1)}% of exit</span>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${sharePct}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
