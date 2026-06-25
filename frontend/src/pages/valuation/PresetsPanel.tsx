import { Sliders } from 'lucide-react';

interface PresetData {
  title: string;
  preMoney: number;
  raise: number;
  optionPool: number;
  coFounderSplit: number;
  enableSeriesA: boolean;
  seriesAPreMoney?: number;
  seriesARaise?: number;
  seriesAOptionPool?: number;
}

interface PresetsPanelProps {
  showPresets: boolean;
  onApplyPreset: (preset: PresetData) => void;
}

export default function PresetsPanel({ showPresets, onApplyPreset }: PresetsPanelProps) {
  if (!showPresets) return null;

  return (
    <div className="glass-card p-5 border border-white/[0.04] flex flex-col gap-4 animate-fade-in mb-8 bg-indigo-500/[0.01]">
      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <Sliders className="w-3.5 h-3.5 text-indigo-400" />
        Funding Presets
      </h3>
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() =>
            onApplyPreset({
              title: 'Pre-Seed Model',
              preMoney: 1500000,
              raise: 250000,
              optionPool: 10,
              coFounderSplit: 40,
              enableSeriesA: false,
            })
          }
          className="py-2 px-3 rounded-lg bg-white/5 border border-white/10 hover:border-indigo-500/30 text-xs font-semibold text-white/80 hover:text-white cursor-pointer transition-all text-center"
        >
          🌱 Pre-Seed
        </button>
        <button
          type="button"
          onClick={() =>
            onApplyPreset({
              title: 'Seed Model',
              preMoney: 5000000,
              raise: 1000000,
              optionPool: 15,
              coFounderSplit: 45,
              enableSeriesA: false,
            })
          }
          className="py-2 px-3 rounded-lg bg-white/5 border border-white/10 hover:border-indigo-500/30 text-xs font-semibold text-white/80 hover:text-white cursor-pointer transition-all text-center"
        >
          ⚡ Seed
        </button>
        <button
          type="button"
          onClick={() =>
            onApplyPreset({
              title: 'Series A Model',
              preMoney: 15000000,
              raise: 3000000,
              optionPool: 15,
              coFounderSplit: 50,
              enableSeriesA: true,
              seriesAPreMoney: 40000000,
              seriesARaise: 8000000,
              seriesAOptionPool: 10,
            })
          }
          className="py-2 px-3 rounded-lg bg-white/5 border border-white/10 hover:border-indigo-500/30 text-xs font-semibold text-white/80 hover:text-white cursor-pointer transition-all text-center"
        >
          🚀 Series A
        </button>
      </div>
    </div>
  );
}
