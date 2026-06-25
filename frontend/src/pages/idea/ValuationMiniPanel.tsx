/**
 * ValuationMiniPanel.tsx
 *
 * The "Dilution" tab mini-simulator inside IdeaDetail:
 * - 4 adjustable sliders (pre-money, raise, option pool, co-founder split)
 * - Cap table legend table (right column)
 * - Pin to Profile button (founder only)
 */

import { Save } from 'lucide-react';
import type { SavedSimulation } from '../../shared/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CapTableEntry {
  name: string;
  pct: number;
  value: number;
  color: string;
}

interface ValuationMiniPanelProps {
  pinnedSim: SavedSimulation | null;
  localPreMoney: number;
  localRaise: number;
  localOptionPool: number;
  localCoFounder: number;
  localCapTable: CapTableEntry[];
  isFounder: boolean;
  ideaTitle?: string;
  ideaId?: string;
  formatCurrency: (v: number) => string;
  onPreMoneyChange: (v: number) => void;
  onRaiseChange: (v: number) => void;
  onOptionPoolChange: (v: number) => void;
  onCoFounderChange: (v: number) => void;
  onPinSimulation: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ValuationMiniPanel({
  pinnedSim,
  localPreMoney,
  localRaise,
  localOptionPool,
  localCoFounder,
  localCapTable,
  isFounder,
  formatCurrency,
  onPreMoneyChange,
  onRaiseChange,
  onOptionPoolChange,
  onCoFounderChange,
  onPinSimulation,
}: ValuationMiniPanelProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="glass-card p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Founder Share & Vesting Planner</h3>
            <p className="text-xs text-white/40 mt-0.5">
              {pinnedSim
                ? 'Loaded pinned model. Adjust inputs to see how shares are split.'
                : 'No model pinned yet. Adjust inputs below.'}
            </p>
          </div>
          {isFounder && (
            <button
              onClick={onPinSimulation}
              className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Pin to Profile
            </button>
          )}
        </div>

        {/* Two-column layout: sliders | cap table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: sliders */}
          <div className="space-y-4">
            <SliderRow
              label="Company Value Before Investment"
              value={formatCurrency(localPreMoney)}
            >
              <input
                type="range"
                min={500_000}
                max={20_000_000}
                step={100_000}
                value={localPreMoney}
                onChange={e => onPreMoneyChange(+e.target.value)}
                className="w-full accent-indigo-500 bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </SliderRow>

            <SliderRow
              label="New Investment Amount"
              value={formatCurrency(localRaise)}
            >
              <input
                type="range"
                min={100_000}
                max={10_000_000}
                step={50_000}
                value={localRaise}
                onChange={e => onRaiseChange(+e.target.value)}
                className="w-full accent-indigo-500 bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </SliderRow>

            <SliderRow
              label="Employee Share Reserve"
              value={`${localOptionPool}%`}
            >
              <input
                type="range"
                min={0}
                max={30}
                value={localOptionPool}
                onChange={e => onOptionPoolChange(+e.target.value)}
                className="w-full accent-indigo-500 bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </SliderRow>

            <SliderRow
              label="Founder Share Split"
              value={`${localCoFounder}% co-founder / ${100 - localCoFounder}% lead`}
            >
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={localCoFounder}
                onChange={e => onCoFounderChange(+e.target.value)}
                className="w-full accent-indigo-500 bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </SliderRow>
          </div>

          {/* Right: cap table */}
          <div className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Share Split
              </div>
              <div className="space-y-2.5">
                {localCapTable.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-xs py-1 border-b border-white/[0.03]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-white/70">{item.name}</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-white font-semibold">{item.pct.toFixed(1)}%</span>
                      <span className="text-[10px] text-white/40 block">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/5 flex justify-between items-center text-xs">
              <span className="text-white/45">Final Value</span>
              <span className="text-sm font-extrabold text-white font-mono">
                {formatCurrency(localPreMoney + localRaise)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Internal helper ──────────────────────────────────────────────────────────

function SliderRow({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex justify-between items-center text-xs mb-1">
        <span className="text-white/60">{label}</span>
        <span className="text-white font-semibold font-mono">{value}</span>
      </div>
      {children}
    </div>
  );
}
