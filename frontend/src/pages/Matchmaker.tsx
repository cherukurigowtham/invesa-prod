import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, type MatchmakerRes, type BuilderMatch, type IdeaMatch, type User } from '../shared/lib/api';
import { Zap, AlertCircle, Search } from 'lucide-react';
import { useToast } from '../shared/components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

import BuilderMatchCard from './matchmaker/BuilderMatchCard';
import IdeaMatchCard from './matchmaker/IdeaMatchCard';
import ActionModal from './matchmaker/ActionModal';

export default function Matchmaker() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<MatchmakerRes | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Interactive Modal/Panel states for actions
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [actionMsg, setActionMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const currentUser = apiService.getCurrentUser();
    if (!currentUser) {
      navigate('/login?redirect=/matchmaker');
      return;
    }
    setUser(currentUser);
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const data = await apiService.getMatchmaker();
      setMatches(data);
    } catch (err) {
      console.error('Failed to fetch matches', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch || !actionMsg.trim()) return;
    
    setActionLoading(true);
    try {
      if (user?.role === 'builder') {
        // Builder applying to a matched startup
        await apiService.requestToJoin(selectedMatch.idea.id, actionMsg);
      } else if (user?.role === 'investor') {
        // Investor expressing interest in a matched startup
        await apiService.expressInterest(selectedMatch.idea.id, actionMsg);
      } else if (user?.role === 'founder') {
        // Founder recruiting a builder - simulate sending invitation
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      success(user?.role === 'founder' ? 'Recruiting invitation sent!' : 'Interest submitted successfully!');
      setActionSuccess(true);
      setTimeout(() => {
        setSelectedMatch(null);
        setActionMsg('');
        setActionSuccess(false);
        fetchMatches(); // refresh
      }, 1500);
    } catch (err: any) {
      toastError(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getPercentageColor = (score: number) => {
    if (score >= 80) return 'stroke-emerald-500 text-emerald-400';
    if (score >= 50) return 'stroke-indigo-500 text-indigo-400';
    return 'stroke-white/20 text-white/40';
  };

  // Filter builders based on search input
  const filteredBuilders = matches?.builderMatches?.filter((match: BuilderMatch) => {
    if (!debouncedSearchTerm.trim()) return true;
    const term = debouncedSearchTerm.toLowerCase();
    const nameMatch = match.builder.name?.toLowerCase().includes(term);
    const bioMatch = match.builder.bio?.toLowerCase().includes(term);
    const matchingSkillsMatch = match.matchingSkills?.some(skill => skill.toLowerCase().includes(term));
    const missingSkillsMatch = match.missingSkills?.some(skill => skill.toLowerCase().includes(term));
    return nameMatch || bioMatch || matchingSkillsMatch || missingSkillsMatch;
  }) || [];

  // Filter startup ideas based on search input
  const filteredIdeas = matches?.ideaMatches?.filter((match: IdeaMatch) => {
    if (!debouncedSearchTerm.trim()) return true;
    const term = debouncedSearchTerm.toLowerCase();
    const titleMatch = match.idea.title?.toLowerCase().includes(term);
    const summaryMatch = match.idea.summary?.toLowerCase().includes(term);
    const categoryMatch = match.idea.category?.toLowerCase().includes(term);
    const stageMatch = match.idea.stage?.toLowerCase().includes(term);
    const founderMatch = match.founderName?.toLowerCase().includes(term);
    const matchingSkillsMatch = match.matchingSkills?.some(skill => skill.toLowerCase().includes(term));
    const missingSkillsMatch = match.missingSkills?.some(skill => skill.toLowerCase().includes(term));
    return titleMatch || summaryMatch || categoryMatch || stageMatch || founderMatch || matchingSkillsMatch || missingSkillsMatch;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-default flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
          <span className="text-white/40 text-sm">Finding your best matches…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-default pt-10 sm:pt-12 pb-24 relative animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Matches
              </h1>
              <p className="text-white/40 text-xs mt-0.5">
                Find partners or projects based on skills.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Search Toggle Button */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                showSearch || searchTerm.trim() !== ''
                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                  : 'bg-white/[0.01] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
              {searchTerm.trim() !== '' && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              )}
            </button>

            <span className="text-xs px-3 py-1 bg-white/5 border border-white/8 rounded-full text-white/50 capitalize select-none">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Collapsible Search Panel */}
        <AnimatePresence>
          {showSearch && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: "2rem" }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search matches by name or skill..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-white/30" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Founder View - Matches with Builders */}
        {user?.role === 'founder' && matches?.builderMatches && (
          filteredBuilders.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <AnimatePresence mode="popLayout">
                {filteredBuilders.map((match: BuilderMatch) => (
                  <motion.div
                    key={match.builder.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25 }}
                  >
                    <BuilderMatchCard 
                      match={match}
                      getPercentageColor={getPercentageColor}
                      onInviteClick={(m) => setSelectedMatch(m)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="glass p-12 text-center text-white/40 text-sm max-w-md mx-auto">
              <Search className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
              No matches found.
            </div>
          )
        )}

        {/* Builder / Investor View - Matches with Startup Ideas */}
        {user && (user.role === 'builder' || user.role === 'investor') && matches?.ideaMatches && (
          filteredIdeas.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <AnimatePresence mode="popLayout">
                {filteredIdeas.map((match: IdeaMatch) => (
                  <motion.div
                    key={match.idea.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25 }}
                  >
                    <IdeaMatchCard 
                      match={match}
                      role={user.role as 'builder' | 'investor'}
                      getPercentageColor={getPercentageColor}
                      onActionClick={(m) => setSelectedMatch(m)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="glass p-12 text-center text-white/40 text-sm max-w-md mx-auto">
              <Search className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
              No matches found.
            </div>
          )
        )}

        {/* Empty State */}
        {(!matches?.builderMatches && !matches?.ideaMatches) && (
          <div className="glass p-12 text-center text-white/40 text-sm max-w-md mx-auto">
            <AlertCircle className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
            No matches found. Make sure your profile and tags are updated.
          </div>
        )}

      </div>

      {/* Action Overlay Slide-in Panel */}
      <AnimatePresence>
        {selectedMatch && (
          <ActionModal 
            selectedMatch={selectedMatch}
            user={user}
            actionSuccess={actionSuccess}
            actionLoading={actionLoading}
            actionMsg={actionMsg}
            setActionMsg={setActionMsg}
            onSubmit={handleActionSubmit}
            onClose={() => setSelectedMatch(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
