import { useLocation, useNavigate } from 'react-router-dom';
import ValuationSimulator from './ValuationSimulator';
import TermSheetSandbox from './valuation/TermSheetSandbox';
import VestingLedger from './valuation/VestingLedger';
import { PieChart, Sliders, Clock, Wallet } from 'lucide-react';

export default function Equity() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  let activeTab: 'shares' | 'offers' | 'timeline' = 'shares';
  if (pathname === '/term-sheets') activeTab = 'offers';
  if (pathname === '/vesting') activeTab = 'timeline';

  return (
    <div className="min-h-screen bg-surface-default pt-10 sm:pt-12 pb-24 relative animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#8ab4f8]/10 border border-[#8ab4f8]/20 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-5 h-5 text-[#8ab4f8]" />
          </div>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
              Equity Planning
            </h1>
            <p className="text-white/40 text-xs mt-0.5">
              Simulate shares, compare VC offers, and schedule vesting timelines.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 border-b border-white/5 mb-8 overflow-x-auto pb-px">
          <button
            onClick={() => navigate('/cap-table')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'shares'
                ? 'border-[#8ab4f8] text-[#8ab4f8]'
                : 'border-transparent text-white/40 hover:text-white hover:bg-white/[0.01]'
            }`}
          >
            <PieChart className="w-4 h-4" />
            Shares Simulator
          </button>
          <button
            onClick={() => navigate('/term-sheets')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'offers'
                ? 'border-[#8ab4f8] text-[#8ab4f8]'
                : 'border-transparent text-white/40 hover:text-white hover:bg-white/[0.01]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Offers Sandbox
          </button>
          <button
            onClick={() => navigate('/vesting')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-[#8ab4f8] text-[#8ab4f8]'
                : 'border-transparent text-white/40 hover:text-white hover:bg-white/[0.01]'
            }`}
          >
            <Clock className="w-4 h-4" />
            Timeline Scheduler
          </button>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'shares' && <ValuationSimulator isSubComponent />}
          {activeTab === 'offers' && <TermSheetSandbox isSubComponent />}
          {activeTab === 'timeline' && <VestingLedger isSubComponent />}
        </div>

      </div>
    </div>
  );
}
