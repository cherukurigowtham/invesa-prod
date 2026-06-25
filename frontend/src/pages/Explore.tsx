import { useLocation, useNavigate } from 'react-router-dom';
import IdeaFeed from './IdeaFeed';
import FeedPage from './FeedPage';
import { Compass, Sparkles } from 'lucide-react';

export default function Explore() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeTab = pathname === '/feed' ? 'updates' : 'startups';

  return (
    <div className="min-h-screen bg-surface-default pt-10 sm:pt-12 pb-24 relative animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#8ab4f8]/10 border border-[#8ab4f8]/20 flex items-center justify-center flex-shrink-0">
            <Compass className="w-5 h-5 text-[#8ab4f8]" />
          </div>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
              Explore
            </h1>
            <p className="text-white/40 text-xs mt-0.5">
              Discover project startups and recent updates.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 border-b border-white/5 mb-8">
          <button
            onClick={() => navigate('/ideas')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'startups'
                ? 'border-[#8ab4f8] text-[#8ab4f8]'
                : 'border-transparent text-white/40 hover:text-white hover:bg-white/[0.01]'
            }`}
          >
            <Compass className="w-4 h-4" />
            Startups
          </button>
          <button
            onClick={() => navigate('/feed')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'updates'
                ? 'border-[#8ab4f8] text-[#8ab4f8]'
                : 'border-transparent text-white/40 hover:text-white hover:bg-white/[0.01]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Recent Updates
          </button>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'startups' ? (
            <IdeaFeed isSubComponent />
          ) : (
            <FeedPage isSubComponent />
          )}
        </div>

      </div>
    </div>
  );
}
