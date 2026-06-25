/**
 * pages/valuation/VestingLedger.tsx
 * Dynamic Founder Equity Vesting Ledger & Cliff Stress-Tester + Employee Grants Ledger.
 */

import { useState, useMemo, useEffect } from 'react';
import { 
  UserCheck, 
  UserX, 
  AlertTriangle,
  Clock,
  HelpCircle,
  Plus,
  Trash2,
  Coins,
  PlusCircle
} from 'lucide-react';
import GlossaryDrawer from './GlossaryDrawer';

interface EmployeeGrant {
  id: string;
  name: string;
  shares: number;
  duration: number;
  cliff: number;
  startMonth: number;
}

export default function VestingLedger({ isSubComponent = false }: { isSubComponent?: boolean }) {
  // ── View Mode Toggle ──
  const [viewMode, setViewMode] = useState<'founders' | 'employees'>('founders');

  // ── Configurable inputs (Founders Mode) ──
  const [totalShares, setTotalShares] = useState(1_000_000);
  const [coFounderSplit, setCoFounderSplit] = useState(40); // 40% Co-founder, 60% Lead
  const [vestingDuration, setVestingDuration] = useState(48); // months
  const [cliffDuration, setCliffDuration] = useState(12); // months
  const [departureMonth, setDepartureMonth] = useState(48); // month of leaving
  const [departureTreatment, setDepartureTreatment] = useState<'treasury' | 'cancel'>('treasury');
  const [showGlossary, setShowGlossary] = useState(false);

  // ── Configurable inputs (Employee Mode) ──
  const [employeeGrants, setEmployeeGrants] = useState<EmployeeGrant[]>(() => {
    const saved = localStorage.getItem('invesa_employee_grants');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse employee grants', e);
      }
    }
    return [
      { id: '1', name: 'Sarah Chen (Lead Engineer)', shares: 25_000, duration: 48, cliff: 12, startMonth: 0 },
      { id: '2', name: 'Alex Rivera (Product Manager)', shares: 15_000, duration: 48, cliff: 12, startMonth: 2 },
      { id: '3', name: 'Emily Zhao (UX Designer)', shares: 10_000, duration: 48, cliff: 12, startMonth: 4 },
    ];
  });

  const [optionPoolSize, setOptionPoolSize] = useState(100_000);
  const [sharePrice, setSharePrice] = useState(5.00);
  const [employeeTimelineMonth, setEmployeeTimelineMonth] = useState(12);

  // Form states for adding a new employee grant
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpShares, setNewEmpShares] = useState(10_000);
  const [newEmpDuration, setNewEmpDuration] = useState(48);
  const [newEmpCliff, setNewEmpCliff] = useState(12);
  const [newEmpStart, setNewEmpStart] = useState(0);

  // Sync optionPoolSize if totalShares changes
  useEffect(() => {
    setOptionPoolSize(Math.floor(totalShares * 0.1));
  }, [totalShares]);

  // Save employee grants helper
  const saveEmployeeGrants = (newGrants: EmployeeGrant[]) => {
    setEmployeeGrants(newGrants);
    localStorage.setItem('invesa_employee_grants', JSON.stringify(newGrants));
  };

  // Co-founder initial splits
  const leadSharesInitial = useMemo(() => {
    return totalShares * ((100 - coFounderSplit) / 100);
  }, [totalShares, coFounderSplit]);

  const coFounderSharesInitial = useMemo(() => {
    return totalShares * (coFounderSplit / 100);
  }, [totalShares, coFounderSplit]);

  // Vesting calculations (Founders Mode)
  const vestingData = useMemo(() => {
    // 1. Lead Founder Vesting (assumed fully active/fully vested)
    const leadVestedPct = 100;
    const leadVestedShares = leadSharesInitial;
    const leadUnvestedShares = 0;

    // 2. Co-founder Vesting (stress-tested departure)
    let coVestedPct = 0;
    if (departureMonth >= cliffDuration) {
      coVestedPct = Math.min(100, (departureMonth / vestingDuration) * 100);
    }

    const coVestedShares = coFounderSharesInitial * (coVestedPct / 100);
    const coUnvestedShares = coFounderSharesInitial - coVestedShares;

    // 3. Forfeiture treatment
    let finalLeadShares = leadVestedShares;
    let finalCoShares = coVestedShares;
    let finalTreasuryShares = 0;
    let finalTotalShares = totalShares;

    if (departureTreatment === 'treasury') {
      finalTreasuryShares = coUnvestedShares;
    } else {
      finalTotalShares = totalShares - coUnvestedShares;
    }

    const leadFinalPct = finalTotalShares > 0 ? (finalLeadShares / finalTotalShares) * 100 : 0;
    const coFinalPct = finalTotalShares > 0 ? (finalCoShares / finalTotalShares) * 100 : 0;
    const treasuryFinalPct = finalTotalShares > 0 ? (finalTreasuryShares / finalTotalShares) * 100 : 0;

    return {
      lead: {
        initialPct: 100 - coFounderSplit,
        initialShares: leadSharesInitial,
        vestedPct: leadVestedPct,
        vestedShares: leadVestedShares,
        unvestedShares: leadUnvestedShares,
        finalShares: finalLeadShares,
        finalPct: leadFinalPct,
      },
      coFounder: {
        initialPct: coFounderSplit,
        initialShares: coFounderSharesInitial,
        vestedPct: coVestedPct,
        vestedShares: coVestedShares,
        unvestedShares: coUnvestedShares,
        finalShares: finalCoShares,
        finalPct: coFinalPct,
      },
      treasury: {
        shares: finalTreasuryShares,
        finalPct: treasuryFinalPct,
      },
      finalTotalShares,
      isForfeited: coUnvestedShares > 0,
      forfeitedSharesCount: coUnvestedShares,
    };
  }, [
    leadSharesInitial,
    coFounderSharesInitial,
    coFounderSplit,
    vestingDuration,
    cliffDuration,
    departureMonth,
    departureTreatment,
    totalShares
  ]);

  // Vesting calculations (Employee Mode)
  const employeeCalculations = useMemo(() => {
    let totalAllocated = 0;
    const items = employeeGrants.map(emp => {
      totalAllocated += emp.shares;

      let vestedPct = 0;
      let vestedShares = 0;
      let unvestedShares = emp.shares;

      if (employeeTimelineMonth >= emp.startMonth) {
        const monthsActive = employeeTimelineMonth - emp.startMonth;
        if (monthsActive >= emp.cliff) {
          vestedPct = Math.min(100, (monthsActive / emp.duration) * 100);
          vestedShares = Math.floor(emp.shares * (vestedPct / 100));
          unvestedShares = emp.shares - vestedShares;
        }
      }

      return {
        ...emp,
        vestedPct,
        vestedShares,
        unvestedShares,
        vestedValue: vestedShares * sharePrice,
        unvestedValue: unvestedShares * sharePrice,
        totalValue: emp.shares * sharePrice,
      };
    });

    const totalVestedShares = items.reduce((acc, x) => acc + x.vestedShares, 0);
    const totalUnvestedShares = items.reduce((acc, x) => acc + x.unvestedShares, 0);

    return {
      grants: items,
      totalAllocated,
      totalVestedShares,
      totalUnvestedShares,
      totalVestedValue: totalVestedShares * sharePrice,
      totalUnvestedValue: totalUnvestedShares * sharePrice,
      totalAllocatedValue: totalAllocated * sharePrice,
      remainingPool: optionPoolSize - totalAllocated,
      utilizationPct: optionPoolSize > 0 ? (totalAllocated / optionPoolSize) * 100 : 0,
    };
  }, [employeeGrants, employeeTimelineMonth, optionPoolSize, sharePrice]);

  const handleAddGrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim()) return;
    const newGrant: EmployeeGrant = {
      id: `emp-${Date.now()}`,
      name: newEmpName.trim(),
      shares: newEmpShares,
      duration: newEmpDuration,
      cliff: newEmpCliff,
      startMonth: newEmpStart,
    };
    saveEmployeeGrants([...employeeGrants, newGrant]);
    setNewEmpName('');
    setNewEmpShares(10_000);
  };

  const handleDeleteGrant = (id: string) => {
    saveEmployeeGrants(employeeGrants.filter(g => g.id !== id));
  };

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);

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
        {!isSubComponent && (
          <div className="flex items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#8ab4f8]/10 border border-[#8ab4f8]/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-[#8ab4f8]" />
              </div>
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Timeline Scheduler
                </h1>
                <p className="text-white/40 text-xs mt-0.5">
                  Plan equity vesting timelines and simulate founder departure scenarios.
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

        {isSubComponent && (
          <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
            <h2 className="text-sm font-semibold text-white/70">Timeline Scheduler</h2>
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
        )}

        {/* ── View Mode Selector Toggle (Founders vs Employees) ── */}
        <div className="flex items-center gap-2 mb-8 bg-white/[0.02] border border-white/[0.06] p-1 rounded-lg max-w-xs sm:max-w-sm font-sans">
          <button
            type="button"
            onClick={() => setViewMode('founders')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold cursor-pointer transition-all border ${
              viewMode === 'founders'
                ? 'bg-[#8ab4f8]/15 text-[#8ab4f8] border-[#8ab4f8]/20'
                : 'text-white/40 hover:text-white border-transparent'
            }`}
          >
            Founder Vesting
          </button>
          <button
            type="button"
            onClick={() => setViewMode('employees')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold cursor-pointer transition-all border ${
              viewMode === 'employees'
                ? 'bg-[#8ab4f8]/15 text-[#8ab4f8] border-[#8ab4f8]/20'
                : 'text-white/40 hover:text-white border-transparent'
            }`}
          >
            Employee Grants
          </button>
        </div>

        {/* ── FOUNDERS MODE CONTENT ── */}
        {viewMode === 'founders' && (
          <div className="space-y-8">
            {/* Control Configuration Panel */}
            <div className="bg-[#202124] border border-[#3c4043] rounded-lg p-6 space-y-6 shadow-sm">
              <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider">1. Setup Your Vesting Plan</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* Total Granted Shares */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Total Shares to Distribute</span>
                    <span className="text-white font-bold font-mono">{formatNumber(totalShares)}</span>
                  </div>
                  <input 
                    type="range" 
                    min={100_000} 
                    max={10_000_000} 
                    step={100_000} 
                    value={totalShares} 
                    onChange={e => {
                      setTotalShares(+e.target.value);
                      if (departureMonth > vestingDuration) setDepartureMonth(vestingDuration);
                    }} 
                    className="w-full accent-[#8ab4f8] bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer" 
                  />
                </div>

                {/* Founder Split */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">How to Split Shares at the Start</span>
                    <span className="text-white font-semibold font-mono">Co-founder: {coFounderSplit}% / Lead Founder: {100 - coFounderSplit}%</span>
                  </div>
                  <input 
                    type="range" 
                    min={10} 
                    max={90} 
                    step={5} 
                    value={coFounderSplit} 
                    onChange={e => setCoFounderSplit(+e.target.value)} 
                    className="w-full accent-[#8ab4f8] bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer" 
                  />
                </div>

                {/* Vesting Period */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Time to Earn All Shares</span>
                    <span className="text-white font-semibold font-mono">{vestingDuration} Months</span>
                  </div>
                  <input 
                    type="range" 
                    min={12} 
                    max={60} 
                    step={12} 
                    value={vestingDuration} 
                    onChange={e => {
                      const val = +e.target.value;
                      setVestingDuration(val);
                      if (departureMonth > val) setDepartureMonth(val);
                      if (cliffDuration > val) setCliffDuration(val);
                    }} 
                    className="w-full accent-[#8ab4f8] bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer" 
                  />
                  <div className="flex justify-between text-[9px] text-white/30 font-mono">
                    <span>1 Year (12 Mo)</span>
                    <span>2 Years (24 Mo)</span>
                    <span>3 Years (36 Mo)</span>
                    <span>4 Years (48 Mo)</span>
                    <span>5 Years (60 Mo)</span>
                  </div>
                </div>

                {/* Cliff Period */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Minimum Time Required before Getting Shares (Cliff)</span>
                    <span className="text-white font-semibold font-mono">{cliffDuration} Months</span>
                  </div>
                  <input 
                    type="range" 
                    min={0} 
                    max={24} 
                    step={6} 
                    value={cliffDuration} 
                    onChange={e => {
                      const val = +e.target.value;
                      if (val <= vestingDuration) setCliffDuration(val);
                    }} 
                    className="w-full accent-[#8ab4f8] bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer" 
                  />
                  <div className="flex justify-between text-[9px] text-white/30 font-mono">
                    <span>No Minimum</span>
                    <span>6 Months</span>
                    <span>12 Months (Standard)</span>
                    <span>18 Months</span>
                    <span>24 Months</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Stress-Tester Departure Slider Timeline */}
            <div className="bg-[#202124] border border-[#3c4043] rounded-lg p-6 space-y-5 shadow-sm">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider">
                  2. Simulate a Founder Leaving Early
                </h4>
                <span className="text-[11px] font-bold text-[#8ab4f8] bg-[#8ab4f8]/10 border border-[#8ab4f8]/20 px-2 py-0.5 rounded">
                  {departureMonth === vestingDuration
                    ? 'Stayed the whole time (Earned 100%)'
                    : `Co-founder leaves at Month ${departureMonth}`}
                </span>
              </div>

              {/* Departure slider */}
              <div className="space-y-1">
                <input 
                  type="range" 
                  min={0} 
                  max={vestingDuration} 
                  step={1} 
                  value={departureMonth} 
                  onChange={e => setDepartureMonth(+e.target.value)} 
                  className="w-full accent-[#8ab4f8] bg-white/5 h-2 rounded-lg appearance-none cursor-pointer" 
                />
                <div className="flex justify-between text-[9px] text-white/30 font-mono px-1">
                  <span>Month 0 (Start)</span>
                  {cliffDuration > 0 && <span>Month {cliffDuration} (Cliff)</span>}
                  <span>Month {Math.floor(vestingDuration / 2)} (Halfway)</span>
                  <span>Month {vestingDuration} (End)</span>
                </div>
              </div>

              {/* Departure Status Indicators */}
              <div className="pt-2">
                {departureMonth === vestingDuration ? (
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium font-sans">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    Co-founder stayed the full time! They earned all of their shares ({coFounderSplit}% of the company).
                  </div>
                ) : departureMonth < cliffDuration ? (
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium font-sans">
                    <UserX className="w-4 h-4 text-red-400" />
                    Left before the minimum time (cliff)! Since they left before Month {cliffDuration}, they get 0 shares, losing all {coFounderSplit}% of their starting split.
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium font-sans">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Left early after Month {cliffDuration}. They get to keep {((departureMonth / vestingDuration) * 100).toFixed(1)}% of their starting split ({formatNumber(vestingData.coFounder.vestedShares)} shares). The rest ({formatNumber(vestingData.coFounder.unvestedShares)} shares) is returned or canceled.
                  </div>
                )}
              </div>

              {/* Departure Treatment Selector */}
              {departureMonth < vestingDuration && (
                <div className="space-y-2 pt-2 border-t border-[#3c4043]">
                  <span className="text-white/60 text-xs block font-medium">What happens to the unearned shares?</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDepartureTreatment('treasury')}
                      className={`py-2 px-3 rounded border text-xs font-semibold cursor-pointer transition-all ${
                        departureTreatment === 'treasury'
                          ? 'bg-[#8ab4f8]/15 border-[#8ab4f8] text-[#8ab4f8]'
                          : 'bg-transparent border-[#3c4043] text-white/50 hover:border-[#8ab4f8]/30'
                      }`}
                    >
                      Keep them for future hires (Company Treasury)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepartureTreatment('cancel')}
                      className={`py-2 px-3 rounded border text-xs font-semibold cursor-pointer transition-all ${
                        departureTreatment === 'cancel'
                          ? 'bg-[#8ab4f8]/15 border-[#8ab4f8] text-[#8ab4f8]'
                          : 'bg-transparent border-[#3c4043] text-white/50 hover:border-[#8ab4f8]/30'
                      }`}
                    >
                      Delete them (Increases remaining founder's share %)
                    </button>
                  </div>
                  <p className="text-[10px] text-white/40 italic">
                    {departureTreatment === 'treasury'
                      ? 'The unearned shares are kept in the company\'s vault. Everyone\'s ownership percentage stays the same relative to the original plan.'
                      : 'The unearned shares are destroyed. Since there are fewer total shares now, the remaining founder owns a bigger piece of the company.'}
                  </p>
                </div>
              )}
            </div>

            {/* Visual Vesting Curve Progress Bar */}
            <div className="bg-[#202124] border border-[#3c4043] rounded-lg p-6 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider">
                3. How Shares are Earned Over Time
              </h4>
              
              <div className="space-y-6 pt-2">
                <div className="relative">
                  <div className="w-full h-4 rounded bg-[#303134] border border-[#3c4043] overflow-hidden relative flex font-sans">
                    {cliffDuration > 0 && (
                      <div 
                        className="bg-[#3c4043] border-r border-[#5f6368] h-full flex items-center justify-center text-[8px] text-white/40 font-bold"
                        style={{ width: `${(cliffDuration / vestingDuration) * 100}%` }}
                      >
                        Cliff ({cliffDuration} Mo)
                      </div>
                    )}
                    <div 
                      className="bg-[#8ab4f8] h-full relative"
                      style={{ 
                        width: `${(Math.max(0, departureMonth - (departureMonth < cliffDuration ? departureMonth : 0)) / vestingDuration) * 100}%`,
                        marginLeft: departureMonth >= cliffDuration ? 0 : `${(departureMonth / vestingDuration) * 100}%`
                      }}
                    />
                  </div>
                  <div 
                    className="absolute -top-1 w-0.5 h-6 bg-[#8ab4f8] z-10 shadow-lg"
                    style={{ left: `${(departureMonth / vestingDuration) * 100}%` }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[8px] font-bold font-mono text-[#8ab4f8] bg-[#202124] border border-[#8ab4f8]/30 px-1 rounded">
                      M{departureMonth}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-[10px] text-white/40 font-mono">
                  <div>
                    <span className="block text-white font-semibold">Start</span>
                    <span className="text-[9px]">Month 0</span>
                  </div>
                  <div>
                    <span className="block text-white font-semibold">Cliff</span>
                    <span className="text-[9px]">{cliffDuration > 0 ? `Month ${cliffDuration}` : 'No Cliff'}</span>
                  </div>
                  <div>
                    <span className="block text-white font-semibold">Halfway</span>
                    <span className="text-[9px]">Month {Math.floor(vestingDuration / 2)}</span>
                  </div>
                  <div>
                    <span className="block text-white font-semibold">All Shares Earned</span>
                    <span className="text-[9px]">Month {vestingDuration}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Side-by-Side Splits Comparison Metrics Table */}
            <div className="bg-[#202124] border border-[#3c4043] rounded-lg overflow-hidden shadow-sm">
              <div className="p-5 border-b border-[#3c4043]">
                <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider">
                  4. Share Ownership Summary
                </h4>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-[#303134]/50 border-b border-[#3c4043] text-white/40 font-bold">
                      <th className="p-4 pl-5">Who</th>
                      <th className="p-4 text-center">Starting Share %</th>
                      <th className="p-4 text-center">Starting Shares</th>
                      <th className="p-4 text-center">Shares Earned (Kept)</th>
                      <th className="p-4 text-center">Shares Unearned (Lost)</th>
                      <th className="p-4 text-center font-bold text-white">Final Share %</th>
                      <th className="p-4 text-center font-bold text-white">Final Shares</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3c4043]/50 text-white/60 text-xs">
                    
                    {/* Lead Founder Row */}
                    <tr>
                      <td className="p-4 pl-5 font-medium text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#8ab4f8]" />
                        Lead Founder
                      </td>
                      <td className="p-4 text-center font-mono">{vestingData.lead.initialPct.toFixed(1)}%</td>
                      <td className="p-4 text-center font-mono">{formatNumber(vestingData.lead.initialShares)}</td>
                      <td className="p-4 text-center font-mono text-emerald-400">{formatNumber(vestingData.lead.vestedShares)}</td>
                      <td className="p-4 text-center font-mono text-white/30">{formatNumber(vestingData.lead.unvestedShares)}</td>
                      <td className="p-4 text-center font-mono font-bold text-[#8ab4f8] bg-[#8ab4f8]/[0.02]">{vestingData.lead.finalPct.toFixed(1)}%</td>
                      <td className="p-4 text-center font-mono font-bold text-white bg-[#8ab4f8]/[0.02]">{formatNumber(vestingData.lead.finalShares)}</td>
                    </tr>

                    {/* Co-founder Row */}
                    <tr>
                      <td className="p-4 pl-5 font-medium text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#ea4335]" />
                        Co-founder
                      </td>
                      <td className="p-4 text-center font-mono">{vestingData.coFounder.initialPct.toFixed(1)}%</td>
                      <td className="p-4 text-center font-mono">{formatNumber(vestingData.coFounder.initialShares)}</td>
                      <td className="p-4 text-center font-mono text-emerald-400">{formatNumber(vestingData.coFounder.vestedShares)}</td>
                      <td className="p-4 text-center font-mono text-[#ea4335]">{formatNumber(vestingData.coFounder.unvestedShares)}</td>
                      <td className="p-4 text-center font-mono font-bold text-[#f28b82] bg-[#ea4335]/[0.02]">{vestingData.coFounder.finalPct.toFixed(1)}%</td>
                      <td className="p-4 text-center font-mono font-bold text-white bg-[#ea4335]/[0.02]">{formatNumber(vestingData.coFounder.finalShares)}</td>
                    </tr>

                    {/* Company Treasury Row (only shown if treatment is treasury and unvested exists) */}
                    {departureTreatment === 'treasury' && vestingData.treasury.shares > 0 && (
                      <tr className="bg-[#fbbc05]/5">
                        <td className="p-4 pl-5 font-medium text-white/70 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#fbbc05]" />
                          Company Vault (Treasury)
                        </td>
                        <td className="p-4 text-center font-mono text-white/30">0.0%</td>
                        <td className="p-4 text-center font-mono text-white/30">0</td>
                        <td className="p-4 text-center font-mono text-white/30">0</td>
                        <td className="p-4 text-center font-mono text-white/30">0</td>
                        <td className="p-4 text-center font-mono font-bold text-[#fdd663]">{vestingData.treasury.finalPct.toFixed(1)}%</td>
                        <td className="p-4 text-center font-mono font-bold text-slate-200">{formatNumber(vestingData.treasury.shares)}</td>
                      </tr>
                    )}

                    {/* Totals Row */}
                    <tr className="bg-[#303134]/30 font-semibold text-white">
                      <td className="p-4 pl-5">Total Shares</td>
                      <td className="p-4 text-center font-mono">100.0%</td>
                      <td className="p-4 text-center font-mono">{formatNumber(totalShares)}</td>
                      <td className="p-4 text-center font-mono">{formatNumber(vestingData.lead.vestedShares + vestingData.coFounder.vestedShares)}</td>
                      <td className="p-4 text-center font-mono text-[#ea4335]/80">{formatNumber(vestingData.coFounder.unvestedShares)}</td>
                      <td className="p-4 text-center font-mono bg-white/[0.02]">100.0%</td>
                      <td className="p-4 text-center font-mono bg-white/[0.02]">{formatNumber(vestingData.finalTotalShares)}</td>
                    </tr>

                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── EMPLOYEE MODE CONTENT ── */}
        {viewMode === 'employees' && (
          <div className="space-y-8 font-sans">
            
            {/* Config & Utilization Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Configuration Inputs */}
              <div className="bg-[#202124] border border-[#3c4043] rounded-lg p-6 space-y-5 shadow-sm">
                <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-[#8ab4f8]" />
                  Option Pool & Value Settings
                </h4>
                
                {/* Pool size */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Total Option Pool Shares</span>
                    <span className="text-white font-bold font-mono">{formatNumber(optionPoolSize)}</span>
                  </div>
                  <input 
                    type="range" 
                    min={10_000} 
                    max={1_000_000} 
                    step={10_000} 
                    value={optionPoolSize} 
                    onChange={e => setOptionPoolSize(+e.target.value)} 
                    className="w-full accent-[#8ab4f8] bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer" 
                  />
                </div>

                {/* Share Price */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Simulated Price per Share</span>
                    <span className="text-white font-bold font-mono">{formatCurrency(sharePrice)}</span>
                  </div>
                  <input 
                    type="range" 
                    min={0.1} 
                    max={50} 
                    step={0.1} 
                    value={sharePrice} 
                    onChange={e => setSharePrice(+e.target.value)} 
                    className="w-full accent-[#8ab4f8] bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer" 
                  />
                </div>
              </div>

              {/* Pool Utilization Card */}
              <div className="bg-[#202124] border border-[#3c4043] rounded-lg p-6 flex flex-col justify-between shadow-sm">
                <div>
                  <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center justify-between">
                    <span>Option Pool Utilization</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      employeeCalculations.utilizationPct > 100 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {employeeCalculations.utilizationPct.toFixed(1)}% Allocated
                    </span>
                  </h4>

                  {/* Visual Bar */}
                  <div className="w-full h-3 rounded-full bg-[#303134] border border-[#3c4043] overflow-hidden mt-4 relative">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        employeeCalculations.utilizationPct > 100 ? 'bg-[#ea4335]' : 'bg-[#8ab4f8]'
                      }`}
                      style={{ width: `${Math.min(100, employeeCalculations.utilizationPct)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#3c4043]/50 text-xs font-mono">
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase">Allocated to Employees</span>
                    <span className="text-white font-semibold text-sm">{formatNumber(employeeCalculations.totalAllocated)} shares</span>
                    <span className="text-white/40 block mt-0.5">{formatCurrency(employeeCalculations.totalAllocatedValue)}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase">Remaining Pool</span>
                    <span className={`font-semibold text-sm ${employeeCalculations.remainingPool < 0 ? 'text-red-400' : 'text-slate-200'}`}>
                      {formatNumber(employeeCalculations.remainingPool)} shares
                    </span>
                    <span className="text-white/40 block mt-0.5">
                      {employeeCalculations.remainingPool < 0 ? 'Pool Overdrawn!' : formatCurrency(employeeCalculations.remainingPool * sharePrice)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Timeline Slider */}
            <div className="bg-[#202124] border border-[#3c4043] rounded-lg p-6 space-y-5 shadow-sm">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#8ab4f8]" />
                  Interactive Grants Timeline Simulator
                </h4>
                <span className="text-xs font-bold text-[#8ab4f8] bg-[#8ab4f8]/10 border border-[#8ab4f8]/20 px-3 py-1 rounded-lg font-mono">
                  Active Month: Month {employeeTimelineMonth}
                </span>
              </div>

              {/* Slider */}
              <div className="space-y-1 pt-1">
                <input 
                  type="range" 
                  min={0} 
                  max={60} 
                  step={1} 
                  value={employeeTimelineMonth} 
                  onChange={e => setEmployeeTimelineMonth(+e.target.value)} 
                  className="w-full accent-[#8ab4f8] bg-white/5 h-2 rounded-lg appearance-none cursor-pointer" 
                />
                <div className="flex justify-between text-[9px] text-white/30 font-mono px-1">
                  <span>Month 0 (Start)</span>
                  <span>Month 12 (1 Year)</span>
                  <span>Month 24 (2 Years)</span>
                  <span>Month 36 (3 Years)</span>
                  <span>Month 48 (4 Years)</span>
                  <span>Month 60 (5 Years)</span>
                </div>
              </div>

              {/* Real-time Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#3c4043]/50">
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider block">Total Vested Equity Value</span>
                    <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5 block">
                      {formatCurrency(employeeCalculations.totalVestedValue)}
                    </span>
                  </div>
                  <div className="text-right text-xs font-mono text-white/50">
                    <div>{formatNumber(employeeCalculations.totalVestedShares)} shares</div>
                    <div className="text-[10px] text-emerald-400/60 mt-0.5">Earned by team</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#8ab4f8]/5 border border-[#8ab4f8]/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#8ab4f8]/80 font-bold uppercase tracking-wider block">Total Unvested Equity Value</span>
                    <span className="text-lg font-bold text-[#8ab4f8] font-mono mt-0.5 block">
                      {formatCurrency(employeeCalculations.totalUnvestedValue)}
                    </span>
                  </div>
                  <div className="text-right text-xs font-mono text-white/50">
                    <div>{formatNumber(employeeCalculations.totalUnvestedShares)} shares</div>
                    <div className="text-[10px] text-[#8ab4f8]/60 mt-0.5">Subject to vesting</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Employee Grant Form */}
            <div className="bg-[#202124] border border-[#3c4043] rounded-lg p-6 shadow-sm">
              <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5 mb-5">
                <PlusCircle className="w-4 h-4 text-[#8ab4f8]" />
                Grant Shares to a New Employee
              </h4>

              <form onSubmit={handleAddGrant} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-white/60 font-semibold block">Employee Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. David Kim" 
                      value={newEmpName}
                      onChange={e => setNewEmpName(e.target.value)}
                      className="w-full bg-[#171717] border border-[#3c4043] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#8ab4f8] placeholder-white/20"
                    />
                  </div>

                  {/* Shares */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-white/60 font-semibold block">Shares to Grant</label>
                    <input 
                      type="number" 
                      min={100} 
                      max={1_000_000} 
                      value={newEmpShares}
                      onChange={e => setNewEmpShares(+e.target.value)}
                      className="w-full bg-[#171717] border border-[#3c4043] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#8ab4f8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                  {/* Duration Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-white/60">Vesting Period</span>
                      <span className="text-white font-mono">{newEmpDuration} months</span>
                    </div>
                    <input 
                      type="range" 
                      min={12} 
                      max={60} 
                      step={12} 
                      value={newEmpDuration} 
                      onChange={e => {
                        const val = +e.target.value;
                        setNewEmpDuration(val);
                        if (newEmpCliff > val) setNewEmpCliff(val);
                      }}
                      className="w-full accent-[#8ab4f8] bg-white/5 h-1.5 rounded"
                    />
                  </div>

                  {/* Cliff Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-white/60">Cliff Period</span>
                      <span className="text-white font-mono">{newEmpCliff} months</span>
                    </div>
                    <input 
                      type="range" 
                      min={0} 
                      max={24} 
                      step={6} 
                      value={newEmpCliff} 
                      onChange={e => {
                        const val = +e.target.value;
                        if (val <= newEmpDuration) setNewEmpCliff(val);
                      }}
                      className="w-full accent-[#8ab4f8] bg-white/5 h-1.5 rounded"
                    />
                  </div>

                  {/* Start Month Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-white/60">Vesting Start Month</span>
                      <span className="text-white font-mono">Month {newEmpStart}</span>
                    </div>
                    <input 
                      type="range" 
                      min={0} 
                      max={24} 
                      step={1} 
                      value={newEmpStart} 
                      onChange={e => setNewEmpStart(+e.target.value)}
                      className="w-full accent-[#8ab4f8] bg-white/5 h-1.5 rounded"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    type="submit"
                    className="flex items-center gap-1.5 bg-[#8ab4f8] hover:bg-[#8ab4f8]/95 text-[#202124] px-4 py-1.5 rounded text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Grant Shares
                  </button>
                </div>
              </form>
            </div>

            {/* Employee Grants Ledger Table */}
            <div className="bg-[#202124] border border-[#3c4043] rounded-lg overflow-hidden shadow-sm">
              <div className="p-5 border-b border-[#3c4043] flex justify-between items-center">
                <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider">
                  Employee Grants Ledger
                </h4>
                <span className="text-xs text-white/40">
                  {employeeCalculations.grants.length} Employee Grants Listed
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#303134]/50 border-b border-[#3c4043] text-white/40 font-bold">
                      <th className="p-4 pl-5">Employee Name</th>
                      <th className="p-4">Grant Details</th>
                      <th className="p-4 text-center">Vesting Progress</th>
                      <th className="p-4 text-right">Value (Vested / Unvested)</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3c4043]/50 text-white/60">
                    {employeeCalculations.grants.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-white/30 italic">
                          No employee grants found. Use the form above to add a grant.
                        </td>
                      </tr>
                    ) : (
                      employeeCalculations.grants.map(emp => (
                        <tr key={emp.id} className="hover:bg-white/[0.01] transition-all">
                          {/* Name */}
                          <td className="p-4 pl-5 font-medium text-white">
                            {emp.name}
                          </td>
                          
                          {/* Details */}
                          <td className="p-4 text-white/70 leading-relaxed font-mono text-[10px]">
                            <div>Shares: {formatNumber(emp.shares)}</div>
                            <div className="text-white/40 text-[9px] mt-0.5">
                              {emp.duration}mo plan • {emp.cliff > 0 ? `${emp.cliff}mo cliff` : 'no cliff'} • starts M{emp.startMonth}
                            </div>
                          </td>

                          {/* Progress */}
                          <td className="p-4">
                            <div className="max-w-[150px] mx-auto space-y-1.5">
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                <span className="text-emerald-400 font-bold">{emp.vestedPct.toFixed(0)}% Vested</span>
                                <span className="text-white/40">{formatNumber(emp.vestedShares)} sh</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-[#303134] overflow-hidden relative">
                                <div 
                                  className="h-full bg-[#34a853] transition-all duration-300"
                                  style={{ width: `${emp.vestedPct}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Valuation */}
                          <td className="p-4 text-right font-mono text-[10px] leading-relaxed">
                            <div className="text-emerald-400 font-bold">{formatCurrency(emp.vestedValue)} vested</div>
                            <div className="text-white/40 mt-0.5">{formatCurrency(emp.unvestedValue)} unvested</div>
                          </td>

                          {/* Delete */}
                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteGrant(emp.id)}
                              className="text-white/30 hover:text-red-400 p-1.5 rounded transition-all cursor-pointer hover:bg-[#ea4335]/10"
                              title="Delete grant"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ── Glossary drawer ── */}
        <GlossaryDrawer showGlossary={showGlossary} onClose={() => setShowGlossary(false)} />

      </div>
    </div>
  );
}
