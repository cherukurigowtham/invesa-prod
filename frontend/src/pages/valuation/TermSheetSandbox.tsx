/**
 * pages/valuation/TermSheetSandbox.tsx
 * Interactive side-by-side VC Term Sheet comparison dashboard.
 */

import { useState, useMemo } from 'react';
import { 
  HelpCircle, 
  Plus, 
  Trash2, 
  Sliders, 
  CheckCircle2
} from 'lucide-react';
import GlossaryDrawer from './GlossaryDrawer';

interface TermSheet {
  id: string;
  name: string;
  preMoney: number;
  raise: number;
  optionPool: number;
  prefMultiple: number;
  prefType: 'participating' | 'non-participating';
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

export default function TermSheetSandbox({ isSubComponent = false }: { isSubComponent?: boolean }) {
  // Global configuration states
  const [exitValue, setExitValue] = useState(15_000_000);
  const [coFounderSplit, setCoFounderSplit] = useState(40); // Lead Founder gets 100 - split
  const [showGlossary, setShowGlossary] = useState(false);

  // Term sheets state (minimum 2, maximum 3)
  const [offers, setOffers] = useState<TermSheet[]>([
    {
      id: 'offer-a',
      name: 'VC Offer A',
      preMoney: 5_000_000,
      raise: 1_000_000,
      optionPool: 10,
      prefMultiple: 1,
      prefType: 'non-participating',
    },
    {
      id: 'offer-b',
      name: 'VC Offer B',
      preMoney: 6_000_000,
      raise: 1_200_000,
      optionPool: 15,
      prefMultiple: 1,
      prefType: 'participating', // Double-Dipping
    }
  ]);

  // Add a third offer (Offer C)
  const handleAddOffer = () => {
    if (offers.length >= 3) return;
    setOffers([
      ...offers,
      {
        id: `offer-${Date.now()}`,
        name: 'VC Offer C',
        preMoney: 5_500_000,
        raise: 1_100_000,
        optionPool: 12,
        prefMultiple: 1.5,
        prefType: 'non-participating',
      }
    ]);
  };

  // Remove an offer
  const handleRemoveOffer = (id: string) => {
    if (offers.length <= 2) return;
    setOffers(offers.filter(o => o.id !== id));
  };

  // Update offer properties
  const handleUpdateOffer = (id: string, field: keyof TermSheet, value: any) => {
    setOffers(offers.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  // Calculations for all offers
  const comparisonData = useMemo(() => {
    return offers.map(offer => {
      // 1. Cap Table Calculations
      const postMoney = offer.preMoney + offer.raise;
      const investorPct = postMoney > 0 ? (offer.raise / postMoney) * 100 : 0;
      const remainingFounderPct = 100 - investorPct - offer.optionPool;
      const coFounderPct = Math.max(0, remainingFounderPct * (coFounderSplit / 100));
      const leadFounderPct = Math.max(0, remainingFounderPct - coFounderPct);

      // 2. Exit Payout Calculations (Waterfall model)
      const lp = offer.raise * offer.prefMultiple;

      let vcPayout = 0;
      let commonPayout = 0;

      if (offer.prefType === 'participating') {
        // Participating: VC gets their pref amount first, then splits the remainder pro-rata
        vcPayout = Math.min(exitValue, lp);
        const remainder = Math.max(0, exitValue - vcPayout);
        vcPayout += remainder * (investorPct / 100);
        commonPayout = remainder * ((100 - investorPct) / 100);
      } else {
        // Non-Participating: VC chooses the higher of: Liquidation Preference OR Pro-rata
        const lpPayout = Math.min(exitValue, lp);
        const proRataPayout = exitValue * (investorPct / 100);
        
        if (proRataPayout >= lpPayout) {
          vcPayout = proRataPayout;
          commonPayout = exitValue * ((100 - investorPct) / 100);
        } else {
          vcPayout = lpPayout;
          commonPayout = Math.max(0, exitValue - vcPayout);
        }
      }

      // Split common payout among founders and option pool
      const totalCommonPct = leadFounderPct + coFounderPct + offer.optionPool;
      const leadFounderPayout = totalCommonPct > 0 ? commonPayout * (leadFounderPct / totalCommonPct) : 0;
      const coFounderPayout = totalCommonPct > 0 ? commonPayout * (coFounderPct / totalCommonPct) : 0;
      const optionPoolPayout = totalCommonPct > 0 ? commonPayout * (offer.optionPool / totalCommonPct) : 0;

      return {
        offer,
        postMoney,
        investorPct,
        leadFounderPct,
        coFounderPct,
        totalFounderPct: leadFounderPct + coFounderPct,
        vcPayout,
        leadFounderPayout,
        coFounderPayout,
        totalFounderPayout: leadFounderPayout + coFounderPayout,
        optionPoolPayout,
        vcYieldMultiplier: offer.raise > 0 ? vcPayout / offer.raise : 0,
        founderRetainedValue: (leadFounderPct + coFounderPct) * postMoney / 100,
      };
    });
  }, [offers, exitValue, coFounderSplit]);

  // Find best offer for founders based on exit payout
  const bestFounderOfferIndex = useMemo(() => {
    let maxPayout = -1;
    let bestIndex = -1;
    comparisonData.forEach((d, idx) => {
      if (d.totalFounderPayout > maxPayout) {
        maxPayout = d.totalFounderPayout;
        bestIndex = idx;
      }
    });
    return bestIndex;
  }, [comparisonData]);

  const wrapperClass = isSubComponent
    ? "relative animate-fade-in"
    : "min-h-screen bg-surface-default pt-10 sm:pt-12 pb-24 relative animate-fade-in";

  const containerClass = isSubComponent
    ? ""
    : "max-w-3xl mx-auto px-4 sm:px-6";

  return (
    <div className={wrapperClass}>
      <div className={containerClass}>

        {/* ── Page header ── */}
        {isSubComponent ? (
          <div className="flex justify-end gap-2 mb-6 border-b border-white/5 pb-4">
            <button
              onClick={() => setShowGlossary(p => !p)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                showGlossary
                  ? 'bg-[#8ab4f8]/15 text-[#8ab4f8] border-[#8ab4f8]/30'
                  : 'bg-white/[0.01] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Glossary</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#8ab4f8]/10 border border-[#8ab4f8]/20 flex items-center justify-center flex-shrink-0">
                <Sliders className="w-5 h-5 text-[#8ab4f8]" />
              </div>
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Offers Sandbox
                </h1>
                <p className="text-white/40 text-xs mt-0.5">
                  Compare VC offers side-by-side and simulate exit payouts.
                </p>
              </div>
            </div>

            {/* Header action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowGlossary(p => !p)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  showGlossary
                    ? 'bg-[#8ab4f8]/15 text-[#8ab4f8] border-[#8ab4f8]/30'
                    : 'bg-white/[0.01] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Glossary</span>
              </button>
            </div>
          </div>
        )}

      {/* Global Config Card */}
      <div className="glass-card p-6 border border-white/[0.04] space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Exit Value slider */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/60 flex items-center gap-1">
                Sale Price
                <HelpCircle className="w-3.5 h-3.5 text-white/30 cursor-help" />
              </span>
              <span className="text-[#8ab4f8] font-bold font-mono">{formatCurrency(exitValue)}</span>
            </div>
            <input 
              type="range" 
              min={1_000_000} 
              max={100_000_000} 
              step={1_000_000} 
              value={exitValue} 
              onChange={e => setExitValue(+e.target.value)} 
              className="w-full accent-indigo-500 bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer" 
            />
            <div className="flex justify-between text-[9px] text-white/30 font-mono">
              <span>$1M</span>
              <span>$25M</span>
              <span>$50M</span>
              <span>$75M</span>
              <span>$100M</span>
            </div>
          </div>

          {/* Founder Split slider */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/60">Founder Split</span>
              <span className="text-white font-semibold font-mono">{coFounderSplit}% / {100 - coFounderSplit}%</span>
            </div>
            <input 
              type="range" 
              min={0} 
              max={100} 
              step={5} 
              value={coFounderSplit} 
              onChange={e => setCoFounderSplit(+e.target.value)} 
              className="w-full accent-indigo-500 bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer" 
            />
            <div className="flex justify-between text-[9px] text-white/30 font-mono">
              <span>Lead 100%</span>
              <span>50% / 50%</span>
              <span>Co-founder 100%</span>
            </div>
          </div>

        </div>
      </div>

      {/* VC Offers Configuration Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {offers.map((offer) => (
          <div key={offer.id} className="glass-card p-5 border border-white/[0.04] flex flex-col gap-4 relative">
            
            {/* Header / Name */}
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <input
                type="text"
                value={offer.name}
                onChange={e => handleUpdateOffer(offer.id, 'name', e.target.value)}
                className="bg-transparent text-sm font-bold text-white outline-none focus:border-b border-indigo-500 max-w-[120px]"
              />
              {offers.length > 2 && (
                <button
                  onClick={() => handleRemoveOffer(offer.id)}
                  className="text-white/30 hover:text-red-400 p-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  title="Remove Offer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Inputs sliders */}
            <div className="flex flex-col gap-3 text-xs">
              
              {/* Pre-Money */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-white/50">Company Value</span>
                  <span className="text-white font-mono font-semibold">{formatCurrency(offer.preMoney)}</span>
                </div>
                <input
                  type="range"
                  min={1_000_000}
                  max={20_000_000}
                  step={100_000}
                  value={offer.preMoney}
                  onChange={e => handleUpdateOffer(offer.id, 'preMoney', +e.target.value)}
                  className="w-full accent-indigo-400 bg-white/5 h-1 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Raise */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-white/50">Investment</span>
                  <span className="text-white font-mono font-semibold">{formatCurrency(offer.raise)}</span>
                </div>
                <input
                  type="range"
                  min={100_000}
                  max={5_000_000}
                  step={50_000}
                  value={offer.raise}
                  onChange={e => handleUpdateOffer(offer.id, 'raise', +e.target.value)}
                  className="w-full accent-indigo-400 bg-white/5 h-1 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Option Pool */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-white/50">Option Pool</span>
                  <span className="text-white font-mono font-semibold">{offer.optionPool}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={offer.optionPool}
                  onChange={e => handleUpdateOffer(offer.id, 'optionPool', +e.target.value)}
                  className="w-full accent-indigo-400 bg-white/5 h-1 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Liquidation Preference Multiple */}
              <div className="space-y-1">
                <span className="text-white/50 text-[11px] block">Payback Multiple</span>
                <div className="grid grid-cols-4 gap-1">
                  {[1, 1.5, 2, 3].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleUpdateOffer(offer.id, 'prefMultiple', m)}
                      className={`py-1 rounded text-[10px] font-semibold border transition-all ${
                        offer.prefMultiple === m
                          ? 'bg-indigo-500/15 border-indigo-500 text-[#8ab4f8]'
                          : 'bg-white/5 border-white/10 text-white/50 hover:border-indigo-500/20'
                      }`}
                    >
                      {m}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Preference Type Selector */}
              <div className="space-y-1">
                <span className="text-white/50 text-[11px] block">Profit Sharing</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateOffer(offer.id, 'prefType', 'non-participating')}
                    className={`py-1.5 px-1 rounded text-[10px] font-semibold border transition-all ${
                      offer.prefType === 'non-participating'
                        ? 'bg-indigo-500/15 border-indigo-500 text-[#8ab4f8]'
                        : 'bg-white/5 border-white/10 text-white/50 hover:border-indigo-500/20'
                    }`}
                  >
                    No - Exit Only
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateOffer(offer.id, 'prefType', 'participating')}
                    className={`py-1.5 px-1 rounded text-[10px] font-semibold border transition-all ${
                      offer.prefType === 'participating'
                        ? 'bg-indigo-500/15 border-indigo-500 text-[#8ab4f8]'
                        : 'bg-white/5 border-white/10 text-white/50 hover:border-indigo-500/20'
                    }`}
                  >
                    Yes - Share Profits
                  </button>
                </div>
              </div>

            </div>
          </div>
        ))}

        {/* Add Offer Column button */}
        {offers.length < 3 && (
          <button
            onClick={handleAddOffer}
            className="h-[360px] w-full border border-dashed border-white/10 hover:border-indigo-500/40 bg-white/[0.01] hover:bg-indigo-500/[0.02] rounded-2xl flex flex-col items-center justify-center text-center p-6 text-white/40 hover:text-white transition-all cursor-pointer"
          >
            <Plus className="w-8 h-8 text-indigo-400 mb-3 animate-pulse" />
            <h4 className="font-semibold text-xs mb-1">Add Another Offer</h4>
            <p className="text-[10px] text-white/30 max-w-[160px] leading-relaxed">
              Add a third offer.
            </p>
          </button>
        )}
      </div>      {/* Side-by-Side Payout Waterfall bar chart */}
      <div className="glass-card p-6 border border-white/[0.04] space-y-5">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
          Payout on Sale
        </h4>
        
        <div className="space-y-4">
          {comparisonData.map((data, idx) => {
            const foundersShare = data.totalFounderPayout;
            const optionPoolShare = data.optionPoolPayout;
            const vcShare = data.vcPayout;

            const total = foundersShare + optionPoolShare + vcShare;
            const foundersPct = total > 0 ? (foundersShare / total) * 100 : 0;
            const optionPoolPct = total > 0 ? (optionPoolShare / total) * 100 : 0;
            const vcPct = total > 0 ? (vcShare / total) * 100 : 0;

            const isBest = idx === bestFounderOfferIndex;

            return (
              <div key={data.offer.id} className="space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{data.offer.name}</span>
                    {isBest && (
                      <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Best Founder Payout
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-white/40 flex items-center gap-3">
                    <span>VC Yield: <strong className="text-white font-mono">{data.vcYieldMultiplier.toFixed(2)}x</strong></span>
                    <span>Founder Share: <strong className="text-white font-mono">{formatCurrency(foundersShare)}</strong></span>
                  </div>
                </div>

                {/* Stacked Payout Bar */}
                <div className="w-full h-7 rounded-xl overflow-hidden bg-white/5 flex border border-white/10 shadow-inner">
                  {foundersPct > 0 && (
                    <div 
                      className="bg-gradient-to-r from-indigo-600 to-indigo-500 flex items-center px-2.5 text-[9px] font-bold text-white truncate"
                      style={{ width: `${foundersPct}%` }}
                      title={`Founders: ${formatCurrency(foundersShare)} (${foundersPct.toFixed(1)}%)`}
                    >
                      Founders ({foundersPct.toFixed(0)}%)
                    </div>
                  )}
                  {optionPoolPct > 0 && (
                    <div 
                      className="bg-gradient-to-r from-pink-600 to-pink-500 flex items-center px-2.5 text-[9px] font-bold text-white truncate"
                      style={{ width: `${optionPoolPct}%` }}
                      title={`Option Pool: ${formatCurrency(optionPoolShare)} (${optionPoolPct.toFixed(1)}%)`}
                    >
                      Pool ({optionPoolPct.toFixed(0)}%)
                    </div>
                  )}
                  {vcPct > 0 && (
                    <div 
                      className="bg-gradient-to-r from-emerald-600 to-emerald-500 flex items-center px-2.5 text-[9px] font-bold text-white justify-end truncate"
                      style={{ width: `${vcPct}%` }}
                      title={`VC Investor: ${formatCurrency(vcShare)} (${vcPct.toFixed(1)}%)`}
                    >
                      VC ({vcPct.toFixed(0)}%)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-[10px] text-white/40 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-indigo-500" />
            <span>Founders (Lead + Co)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-pink-500" />
            <span>Option Pool</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-emerald-500" />
            <span>VC Investor</span>
          </div>
        </div>
      </div>

      {/* Comparison Metrics Table */}
      <div className="glass-card border border-white/[0.04] overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Full Comparison
          </h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-white/40 font-semibold">
                <th className="p-4 pl-5">Metric</th>
                {comparisonData.map(d => (
                  <th key={d.offer.id} className="p-4 text-center font-bold text-white">
                    {d.offer.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/60">
              
              {/* Pre-Money */}
              <tr>
                <td className="p-4 pl-5 font-medium">Company Value</td>
                {comparisonData.map(d => (
                  <td key={d.offer.id} className="p-4 text-center font-mono text-white">
                    {formatCurrency(d.offer.preMoney)}
                  </td>
                ))}
              </tr>

              {/* Raise */}
              <tr>
                <td className="p-4 pl-5 font-medium">Investment</td>
                {comparisonData.map(d => (
                  <td key={d.offer.id} className="p-4 text-center font-mono text-white">
                    {formatCurrency(d.offer.raise)}
                  </td>
                ))}
              </tr>

              {/* Post-Money */}
              <tr>
                <td className="p-4 pl-5 font-medium">Total Value After</td>
                {comparisonData.map(d => (
                  <td key={d.offer.id} className="p-4 text-center font-mono text-white/80">
                    {formatCurrency(d.postMoney)}
                  </td>
                ))}
              </tr>

              {/* Option Pool */}
              <tr>
                <td className="p-4 pl-5 font-medium">Employee Pool</td>
                {comparisonData.map(d => (
                  <td key={d.offer.id} className="p-4 text-center font-mono">
                    {d.offer.optionPool}%
                  </td>
                ))}
              </tr>

              {/* VC Preference terms */}
              <tr>
                <td className="p-4 pl-5 font-medium">Payback Rules</td>
                {comparisonData.map(d => (
                  <td key={d.offer.id} className="p-4 text-center text-[11px] capitalize">
                    {d.offer.prefMultiple}x {d.offer.prefType === 'participating' ? 'Yes' : 'No'}
                  </td>
                ))}
              </tr>

              {/* VC Ownership % */}
              <tr className="bg-white/[0.01]">
                <td className="p-4 pl-5 font-medium text-white/70">Investor Owns</td>
                {comparisonData.map(d => (
                  <td key={d.offer.id} className="p-4 text-center font-mono text-white">
                    {d.investorPct.toFixed(1)}%
                  </td>
                ))}
              </tr>

              {/* Founder Ownership % */}
              <tr className="bg-white/[0.01]">
                <td className="p-4 pl-5 font-medium text-white/70">Founders Own</td>
                {comparisonData.map(d => (
                  <td key={d.offer.id} className="p-4 text-center font-mono text-white">
                    {d.totalFounderPct.toFixed(1)}%
                  </td>
                ))}
              </tr>

              {/* Founder Value */}
              <tr>
                <td className="p-4 pl-5 font-medium">Founder Value</td>
                {comparisonData.map(d => (
                  <td key={d.offer.id} className="p-4 text-center font-mono">
                    {formatCurrency(d.founderRetainedValue)}
                  </td>
                ))}
              </tr>

              {/* VC Exit Payout */}
              <tr className="bg-emerald-500/[0.02]">
                <td className="p-4 pl-5 font-semibold text-emerald-400">Investor Gets</td>
                {comparisonData.map(d => (
                  <td key={d.offer.id} className="p-4 text-center font-mono font-bold text-emerald-300">
                    {formatCurrency(d.vcPayout)}
                  </td>
                ))}
              </tr>

              {/* Founder Exit Payout */}
              <tr className="bg-indigo-500/[0.02]">
                <td className="p-4 pl-5 font-semibold text-indigo-400">Founders Get</td>
                {comparisonData.map((d, idx) => {
                  const isBest = idx === bestFounderOfferIndex;
                  return (
                    <td key={d.offer.id} className={`p-4 text-center font-mono font-bold ${
                      isBest ? 'text-indigo-300 bg-indigo-500/5' : 'text-indigo-400/80'
                    }`}>
                      {formatCurrency(d.totalFounderPayout)}
                    </td>
                  );
                })}
              </tr>

              {/* Lead Founder Exit Payout */}
              <tr>
                <td className="p-4 pl-5 pl-8 text-white/45">↳ Lead Founder</td>
                {comparisonData.map(d => (
                  <td key={d.offer.id} className="p-4 text-center font-mono text-white/50">
                    {formatCurrency(d.leadFounderPayout)}
                  </td>
                ))}
              </tr>

              {/* Co-founder Exit Payout */}
              <tr>
                <td className="p-4 pl-5 pl-8 text-white/45">↳ Co-founder</td>
                {comparisonData.map(d => (
                  <td key={d.offer.id} className="p-4 text-center font-mono text-white/50">
                    {formatCurrency(d.coFounderPayout)}
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>
      </div>

    </div>

      {/* ── Glossary drawer ── */}
      <GlossaryDrawer showGlossary={showGlossary} onClose={() => setShowGlossary(false)} />
    </div>
  );
}
