/**
 * IdeaTabs.tsx
 *
 * Horizontal tab navigation bar for the IdeaDetail page.
 * Tabs: Overview | Pitch Deck | Updates | AI Review | Dilution
 */

import { Rocket } from 'lucide-react';

export type IdeaTab = 'overview' | 'pitch-deck' | 'updates' | 'ai-evaluation' | 'valuation' | 'tasks';

interface IdeaTabsProps {
  activeTab: IdeaTab;
  onTabChange: (tab: IdeaTab) => void;
  postsCount: number;
  isTeamMember: boolean;
  analysisScore: number | null;
}

export default function IdeaTabs({
  activeTab,
  onTabChange,
  postsCount,
  isTeamMember,
  analysisScore,
}: IdeaTabsProps) {
  const tab = (id: IdeaTab, label: React.ReactNode) => (
    <button
      onClick={() => onTabChange(id)}
      className={`pb-4 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer ${
        activeTab === id ? 'text-indigo-400 font-bold' : 'text-white/40 hover:text-white'
      }`}
    >
      {label}
      {activeTab === id && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500 rounded-full animate-fade-in" />
      )}
    </button>
  );

  return (
    <div className="flex border-b border-white/5 mb-6 gap-6 overflow-x-auto scrollbar-hide">
      {tab('overview', 'Overview')}

      {tab(
        'pitch-deck',
        <>
          <Rocket className="w-4 h-4" />
          Pitch Deck
        </>,
      )}

      {tab(
        'updates',
        <>
          Updates
          {postsCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'updates'
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'bg-white/5 text-white/50'
              }`}
            >
              {postsCount}
            </span>
          )}
        </>,
      )}

      {tab(
        'ai-evaluation',
        <>
          Scorecard
          {analysisScore !== null && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-bold">
              {analysisScore}
            </span>
          )}
        </>,
      )}

      {tab('valuation', 'Dilution')}

      {isTeamMember && tab(
        'tasks',
        <>
          Tasks
        </>
      )}
    </div>
  );
}
