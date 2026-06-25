import { HelpCircle } from 'lucide-react';

interface GlossaryDrawerProps {
  showGlossary: boolean;
  onClose: () => void;
}

const GLOSSARY_TERMS = [
  {
    term: 'Pre-Money Valuation',
    definition:
      'The agreed-upon value of the startup before receiving new investment capital.',
  },
  {
    term: 'Raise Amount',
    definition:
      'The total amount of cash the startup is securing from investors in the round.',
  },
  {
    term: 'Option Pool (Employee Reserve)',
    definition:
      'Shares set aside for future employee hiring, diluting the founders before the investment round closes.',
  },
  {
    term: 'Co-Founder Split',
    definition:
      'The fraction of the post-dilution founder pool allocated to the co-founder team member.',
  },
  {
    term: 'Liquidation Preference',
    definition:
      'Protective rule that ensures preferred shareholders (investors) get paid first in an exit event. A 1x preference means they recover their original investment.',
  },
  {
    term: 'Participating Preferred',
    definition:
      '"Double-dipping" shares. Investors receive their preference amount first, and then participate pro-rata in common payouts.',
  },
  {
    term: 'Non-Participating Preferred',
    definition:
      '"Single-choice" shares. Investors get the higher of their liquidation preference or their pro-rata common share value.',
  },
  {
    term: 'Vesting Cliff',
    definition:
      'The period (typically 12 months) before any shares vest. Departing before the cliff means forfeiting 100% of the equity split.',
  },
  {
    term: 'Full Ratchet Protection',
    definition:
      'Hostile down-round protection where the investor’s share purchase price is reduced to match the lower Series A price, leading to massive founder dilution.',
  },
  {
    term: 'Weighted Average Anti-Dilution',
    definition:
      'Standard VC protection that adjusts the investor’s share price based on a weighted average of old and new valuation levels, taking into account the size of the round.',
  },
];

export default function GlossaryDrawer({ showGlossary, onClose }: GlossaryDrawerProps) {
  if (!showGlossary) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-slate-950/95 border-l border-white/10 z-50 shadow-2xl p-6 overflow-y-auto animate-slide-in flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            Jargon Glossary
          </h3>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-xs cursor-pointer bg-white/5 hover:bg-white/10 px-2 py-1 rounded"
          >
            Close
          </button>
        </div>

        {/* Terms list */}
        <div className="space-y-6 text-xs text-white/70">
          {GLOSSARY_TERMS.map(({ term, definition }) => (
            <div key={term} className="space-y-1">
              <h4 className="font-bold text-white">{term}</h4>
              <p className="leading-relaxed text-white/50">{definition}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <div className="pt-6 border-t border-white/5 mt-6 text-[10px] text-white/30 text-center">
        💡 Drag sliders or select Presets to simulate dilution effects in real-time.
      </div>
    </div>
  );
}
