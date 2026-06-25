import { useState } from 'react';
import { PieChart } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CapTableEntry {
  name: string;
  pct: number;
  value: number;
  color: string;
}

interface CapTableDonutProps {
  capTable: CapTableEntry[];
  /** Post-money valuation displayed in the footer row. */
  postMoney: number;
  /** Total raise shown in the centre of the donut when nothing is hovered. */
  totalRaise: number;
  formatCurrency: (v: number) => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns [x, y] on the unit circle for a given cumulative fraction (0–1). */
function coordsForPercent(fraction: number): [number, number] {
  return [Math.cos(2 * Math.PI * fraction), Math.sin(2 * Math.PI * fraction)];
}

/** Builds an SVG arc path for a single donut slice. */
function buildSlicePath(startFraction: number, slicePct: number): string {
  const endFraction = startFraction + slicePct / 100;
  const [sx, sy] = coordsForPercent(startFraction);
  const [ex, ey] = coordsForPercent(endFraction);
  const largeArc = slicePct > 50 ? 1 : 0;
  return [`M ${sx} ${sy}`, `A 1 1 0 ${largeArc} 1 ${ex} ${ey}`, 'L 0 0'].join(' ');
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CapTableDonut({
  capTable,
  postMoney,
  totalRaise,
  formatCurrency,
}: CapTableDonutProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="glass-card p-8 flex flex-col items-center gap-8">
      {/* ── Section header ── */}
      <h3 className="text-sm font-bold text-white uppercase tracking-wider self-start flex items-center gap-2.5">
        <PieChart className="w-4 h-4 text-indigo-400" />
        Ownership Distribution
      </h3>

      {/* ── SVG Donut ── */}
      <div className="relative w-48 h-48">
        <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-90">
          {/* Slices */}
          {(() => {
            let cumFraction = 0;
            return capTable.map((item, idx) => {
              if (item.pct <= 0) return null;
              const start = cumFraction;
              cumFraction += item.pct / 100;
              return (
                <path
                  key={idx}
                  d={buildSlicePath(start, item.pct)}
                  fill={item.color}
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    transformOrigin: '0 0',
                    transform: hoveredIdx === idx ? 'scale(1.05)' : 'scale(1)',
                    opacity: hoveredIdx !== null && hoveredIdx !== idx ? 0.6 : 1,
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            });
          })()}

          {/* Centre cutout */}
          <circle cx="0" cy="0" r="0.65" fill="#0c0f18" />
        </svg>

        {/* ── Centre dynamic text ── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          {hoveredIdx !== null && capTable[hoveredIdx] ? (
            <>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block truncate max-w-[110px]">
                {capTable[hoveredIdx].name}
              </span>
              <span className="text-base font-extrabold text-white mt-0.5 font-mono">
                {capTable[hoveredIdx].pct.toFixed(1)}%
              </span>
              <span className="text-[9px] text-white/50 font-mono block">
                {formatCurrency(capTable[hoveredIdx].value)}
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] text-white/40 uppercase">Total Raise</span>
              <span className="text-base font-extrabold text-white mt-0.5 font-mono">
                {formatCurrency(totalRaise)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Stakeholder legend table ── */}
      <div className="w-full space-y-2.5">
        {capTable.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center text-xs py-1 border-b border-white/[0.03]"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-white/70">{item.name}</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-white font-mono">{item.pct.toFixed(1)}%</span>
              <span className="text-[10px] text-white/40 block font-mono">
                {formatCurrency(item.value)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Treasury Info Banner ── */}
      {capTable.some(item => item.name.includes('Treasury')) && (
        <div className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-[10px] text-white/50 leading-relaxed italic animate-fade-in">
          ℹ️ Unvested co-founder equity has been returned to the company treasury. These shares are non-voting and do not receive exit waterfall payouts.
        </div>
      )}

      {/* ── Post-money footer ── */}
      <div className="w-full p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl flex justify-between items-center text-xs">
        <span className="text-white/40">Post-Money Valuation</span>
        <span className="font-mono font-bold text-white">{formatCurrency(postMoney)}</span>
      </div>
    </div>
  );
}
