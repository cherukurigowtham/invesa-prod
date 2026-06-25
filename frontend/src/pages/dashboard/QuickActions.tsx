import { Link } from 'react-router-dom';
import { PieChart, Sliders, Clock, Users, ArrowRight } from 'lucide-react';

export default function QuickActions({ density = 'spacious' }: { density?: 'spacious' | 'compact' }) {
  const isCompact = density === 'compact';

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in ${isCompact ? 'mb-6' : 'mb-12'}`}>
      {/* Cap Table */}
      <Link to="/cap-table"
        className={`glass-card flex items-center gap-4 hover:border-indigo-500/25 transition-colors group no-underline ${isCompact ? 'p-3.5' : 'p-6'}`}>
        <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 flex-shrink-0">
          <PieChart className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">Shares Simulator</div>
          <div className="text-[11px] text-white/40 mt-0.5">Simulate funding rounds, option pools, and dilution</div>
        </div>
        <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-indigo-400 ml-auto flex-shrink-0 transition-colors" />
      </Link>

      {/* Term Sheets */}
      <Link to="/term-sheets"
        className={`glass-card flex items-center gap-4 hover:border-purple-500/25 transition-colors group no-underline ${isCompact ? 'p-3.5' : 'p-6'}`}>
        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 flex-shrink-0">
          <Sliders className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">Offers Sandbox</div>
          <div className="text-[11px] text-white/40 mt-0.5">Compare VC offers side-by-side and simulate exits</div>
        </div>
        <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-purple-400 ml-auto flex-shrink-0 transition-colors" />
      </Link>

      {/* Vesting */}
      <Link to="/vesting"
        className={`glass-card flex items-center gap-4 hover:border-rose-500/25 transition-colors group no-underline ${isCompact ? 'p-3.5' : 'p-6'}`}>
        <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 flex-shrink-0">
          <Clock className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors">Timeline Scheduler</div>
          <div className="text-[11px] text-white/40 mt-0.5">Plan share earning schedules and cliffs</div>
        </div>
        <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-rose-400 ml-auto flex-shrink-0 transition-colors" />
      </Link>

      {/* Matchmaker */}
      <Link to="/matchmaker"
        className={`glass-card flex items-center gap-4 hover:border-emerald-500/25 transition-colors group no-underline ${isCompact ? 'p-3.5' : 'p-6'}`}>
        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 flex-shrink-0">
          <Users className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">Find Partners</div>
          <div className="text-[11px] text-white/40 mt-0.5">Find people with the right skills to help build ideas</div>
        </div>
        <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-emerald-400 ml-auto flex-shrink-0 transition-colors" />
      </Link>
    </div>
  );
}
