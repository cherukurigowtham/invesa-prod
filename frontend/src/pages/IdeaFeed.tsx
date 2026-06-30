import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../shared/lib/api';
import type { Idea } from '../shared/lib/api';
import { motion } from 'framer-motion';
import { Search, Compass, Users, ShieldCheck, ArrowUpRight, Plus, HelpCircle, Grid, List } from 'lucide-react';

const CATEGORIES = ['All', 'AI', 'Fintech', 'SaaS', 'Security', 'Healthtech', 'Web3', 'Hardware'];

export default function IdeaFeed({ isSubComponent = false }: { isSubComponent?: boolean }) {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    setUser(apiService.getCurrentUser());
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchQuery);
    }, 350);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    fetchIdeas();
  }, [category, search]);

  const fetchIdeas = async () => {
    setLoading(true);
    try {
      const data = await apiService.getIdeas(category === 'All' ? undefined : category, search || undefined);
      setIdeas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'Idea': return <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400">{stage}</span>;
      case 'Prototype': return <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-500/10 border border-purple-500/20 text-purple-400">{stage}</span>;
      case 'MVP': return <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{stage}</span>;
      case 'Scaling': return <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">{stage}</span>;
      default: return null;
    }
  };

  const wrapperClass = isSubComponent
    ? "relative animate-fade-in"
    : "min-h-screen bg-surface-default pt-10 sm:pt-12 pb-24 relative animate-fade-in";

  const containerClass = isSubComponent
    ? ""
    : "max-w-3xl mx-auto px-4 sm:px-6";

  return (
    <div className={wrapperClass}>
      <div className={containerClass}>
        
        {/* Header Title & Actions */}
        {isSubComponent ? (
          <div className="flex justify-end gap-2 mb-6 border-b border-white/5 pb-4">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/5 border border-white/[0.08] rounded-lg p-0.5 mr-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-[#8ab4f8]/20 text-[#8ab4f8]' : 'text-white/40 hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1 rounded transition-all cursor-pointer ${
                  viewMode === 'list' ? 'bg-[#8ab4f8]/20 text-[#8ab4f8]' : 'text-white/40 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Filters Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                showFilters || searchQuery.trim() !== '' || category !== 'All'
                  ? 'bg-[#8ab4f8]/15 text-[#8ab4f8] border-[#8ab4f8]/30'
                  : 'bg-white/[0.01] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Filters</span>
              {(searchQuery.trim() !== '' || category !== 'All') && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#8ab4f8]" />
              )}
            </button>

            {user && user.role === 'founder' && (
              <button
                onClick={() => navigate('/post-idea')}
                className="btn-primary px-3 py-1.5 text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post Project</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <Compass className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Browse
                </h1>
                <p className="text-white/40 text-xs mt-0.5">
                  Find interesting projects to join or support.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-white/5 border border-white/[0.08] rounded-lg p-0.5 mr-1">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded transition-all cursor-pointer ${
                    viewMode === 'grid' ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/40 hover:text-white'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded transition-all cursor-pointer ${
                    viewMode === 'list' ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/40 hover:text-white'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Filters Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  showFilters || searchQuery.trim() !== '' || category !== 'All'
                    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                    : 'bg-white/[0.01] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Filters</span>
                {(searchQuery.trim() !== '' || category !== 'All') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
              </button>

              {user && user.role === 'founder' && (
                <button
                  onClick={() => navigate('/post-idea')}
                  className="btn-primary px-3 py-1.5 text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Post Project</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Collapsible Search & Filters Panel */}
        {showFilters && (
          <div className="space-y-4 mb-8 p-6 bg-white/[0.02] border border-white/5 rounded-2xl animate-fade-in">
            {/* Search Input */}
            <div className="relative w-full">
              <Search className="absolute left-4 top-3 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search projects by name, description or needs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>

            {/* Category Filter Pills */}
            <div>
              <div className="text-[10px] text-white/40 uppercase tracking-wide mb-2">Categories</div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border whitespace-nowrap cursor-pointer ${
                      category === cat
                        ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400'
                        : 'bg-white/[0.01] border-white/[0.08] text-white/60 hover:bg-white/[0.03]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* IDEAS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="glass-card p-6 h-64 animate-pulse flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-6 bg-white/5 rounded-md w-3/4" />
                  <div className="h-4 bg-white/5 rounded-md w-full" />
                  <div className="h-4 bg-white/5 rounded-md w-5/6" />
                </div>
                <div className="h-10 bg-white/5 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : ideas.length > 0 ? (
          <motion.div 
            className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-8" : "flex flex-col gap-4"}
            key={viewMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {ideas.map((idea) => (
              viewMode === 'grid' ? (
                <div
                  key={idea.id}
                  onClick={() => navigate(`/ideas/${idea.id}`)}
                  onMouseEnter={() => (window as any).__invesa_prefetch?.(`/ideas/${idea.id}`)}
                  className="idea-card flex flex-col justify-between relative group"
                >
                  {/* Top Row: category & Stage */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                        {idea.category}
                      </span>
                      {getStageBadge(idea.stage)}
                    </div>

                    {/* Title & summary */}
                    <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-indigo-300 transition-colors mb-2.5 flex items-center gap-1.5">
                      {idea.title}
                      <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </h3>
                    <p className="text-sm text-white/50 leading-relaxed line-clamp-3 mb-6">
                      {idea.summary}
                    </p>
                  </div>

                  {/* Bottom Row details */}
                  <div className="space-y-4 pt-4 border-t border-white/[0.04]">
                    
                    {/* Team needs */}
                    {idea.teamSlots && idea.teamSlots.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-white/40 mr-1 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          Needs:
                        </span>
                        {idea.teamSlots.map((slot, sIdx) => (
                          <span key={sIdx} className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-medium">
                            {slot}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* IP safe & active team count */}
                    <div className="flex items-center justify-between text-xs text-white/40">
                      <div className="flex items-center gap-1 text-emerald-400/80">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Ownership Secured</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{idea.teamMembers?.length || 1} members</span>
                      </div>
                    </div>

                  </div>

                </div>
              ) : (
                <div
                  key={idea.id}
                  onClick={() => navigate(`/ideas/${idea.id}`)}
                  onMouseEnter={() => (window as any).__invesa_prefetch?.(`/ideas/${idea.id}`)}
                  className="glass-card p-5 hover:border-indigo-500/20 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all group"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10">
                        {idea.category}
                      </span>
                      {getStageBadge(idea.stage)}
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                      {idea.title}
                      <ArrowUpRight className="w-3.5 h-3.5 text-white/30 group-hover:text-indigo-400 transition-all" />
                    </h3>
                    <p className="text-xs text-white/50 truncate max-w-xl">
                      {idea.summary}
                    </p>
                    
                    {idea.teamSlots && idea.teamSlots.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <span className="text-[10px] text-white/40 mr-1">Needs:</span>
                        {idea.teamSlots.map((slot, sIdx) => (
                          <span key={sIdx} className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                            {slot}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0 text-[10px] text-white/40">
                    <div className="flex items-center gap-1 text-emerald-400/80">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Secured</span>
                    </div>
                    <div>{idea.teamMembers?.length || 1} members</div>
                  </div>
                </div>
              )
            ))}
          </motion.div>
        ) : (
          <div className="glass-card p-12 text-center max-w-lg mx-auto">
            <HelpCircle className="w-12 h-12 text-white/20 mx-auto mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-white mb-2">No Projects Found</h3>
            <p className="text-sm text-white/50 mb-6">
              No projects match your search filters.
            </p>
            <button
              onClick={() => { setSearch(''); setCategory('All'); }}
              className="btn-secondary py-2 px-5 text-sm"
            >
              Show All
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
