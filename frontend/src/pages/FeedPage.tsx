import { useState, useEffect } from 'react';
import { apiService } from '../shared/lib/api';
import type { IdeaPost, Idea, User } from '../shared/lib/api';
import PostCard from '../shared/components/PostCard';
import PostComposer from '../shared/components/PostComposer';
import { Compass, Flame, ShieldAlert, Sparkles, SlidersHorizontal, Plus } from 'lucide-react';
import { useToast } from '../shared/components/Toast';
import { PostsListSkeleton } from '../shared/components/SkeletonLoaders';

type PostTypeFilter = 'all' | 'update' | 'milestone' | 'media' | 'announcement';

export default function FeedPage({ isSubComponent = false }: { isSubComponent?: boolean }) {
  const { success, error: toastError } = useToast();
  const [posts, setPosts] = useState<IdeaPost[]>([]);
  const [allIdeas, setAllIdeas] = useState<Idea[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [myStartups, setMyStartups] = useState<Idea[]>([]);
  const [activeIdeaIdForComposer, setActiveIdeaIdForComposer] = useState<string>('');
  
  const [filterType, setFilterType] = useState<PostTypeFilter>('all');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = apiService.getCurrentUser();
    setCurrentUser(user);
    loadFeedData(user);
  }, []);

  const loadFeedData = async (user: User | null) => {
    setLoading(true);
    setError(null);
    try {
      const fetchedPosts = await apiService.getPosts();
      const fetchedIdeas = await apiService.getIdeas();
      
      setPosts(fetchedPosts);
      setAllIdeas(fetchedIdeas);

      if (user) {
        // Find ideas where user is the founder or a team member
        const userStartups = fetchedIdeas.filter(idea => 
          idea.founderId === user.id || 
          (idea.teamMembers && idea.teamMembers.some(member => member.userId === user.id))
        );
        setMyStartups(userStartups);
        if (userStartups.length > 0) {
          setActiveIdeaIdForComposer(userStartups[0].id);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch the startup feed. Please try again.');
      toastError('Failed to fetch the startup feed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost: IdeaPost) => {
    setPosts(prev => [newPost, ...prev]);
    success('Post published successfully!');
    setShowComposer(false);
  };

  const handleLikeToggle = (updatedPost: IdeaPost) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  const handleIdeaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveIdeaIdForComposer(e.target.value);
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesType = filterType === 'all' || post.postType === filterType;
    
    // Find the corresponding idea to match category
    const idea = allIdeas.find(i => i.id === post.ideaId);
    const matchesCategory = filterCategory === 'All' || (idea && idea.category === filterCategory);
    
    return matchesType && matchesCategory;
  });

  const categories = ['All', 'Fintech', 'Security', 'Web3', 'SaaS', 'AI'];

  const wrapperClass = isSubComponent
    ? "relative animate-fade-in"
    : "min-h-screen bg-surface-default pt-10 sm:pt-12 pb-24 relative animate-fade-in";

  const containerClass = isSubComponent
    ? ""
    : "max-w-3xl mx-auto px-4 sm:px-6";

  return (
    <div className={wrapperClass}>
      <div className={containerClass}>
        
        {/* Title Header */}
        {isSubComponent ? (
          <div className="flex justify-end gap-2 mb-6">
            {/* Filters Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                showFilters || filterCategory !== 'All' || filterType !== 'all'
                  ? 'bg-[#8ab4f8]/15 text-[#8ab4f8] border-[#8ab4f8]/30'
                  : 'bg-white/[0.01] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {(filterCategory !== 'All' || filterType !== 'all') && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#8ab4f8]" />
              )}
            </button>

            {/* New Post Toggle Button */}
            {currentUser && myStartups.length > 0 && (
              <button
                onClick={() => setShowComposer(!showComposer)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  showComposer
                    ? 'bg-[#8ab4f8]/15 text-[#8ab4f8] border-[#8ab4f8]/30'
                    : 'bg-white/[0.01] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Post</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Feed
                </h1>
                <p className="text-white/40 text-xs mt-0.5">
                  Real-time updates, milestones, and announcements.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Filters Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  showFilters || filterCategory !== 'All' || filterType !== 'all'
                    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                    : 'bg-white/[0.01] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {(filterCategory !== 'All' || filterType !== 'all') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
              </button>

              {/* New Post Toggle Button */}
              {currentUser && myStartups.length > 0 && (
                <button
                  onClick={() => setShowComposer(!showComposer)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    showComposer
                      ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                      : 'bg-white/[0.01] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Post</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Collapsible Filters Panel */}
        {showFilters && (
          <div className="glass-card p-5 border border-white/[0.04] flex flex-col gap-5 animate-fade-in mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Filter */}
              <div>
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-indigo-400" />
                  Categories
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => {
                    const isActive = filterCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          isActive 
                            ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' 
                            : 'bg-white/[0.01] border border-white/[0.04] text-white/60 hover:bg-white/[0.03] hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Post Type Filter */}
              <div>
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-purple-400" />
                  Post Types
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {([
                    { key: 'all', label: 'All', emoji: '✨' },
                    { key: 'update', label: 'Updates', emoji: '📢' },
                    { key: 'milestone', label: 'Milestones', emoji: '🏆' },
                    { key: 'media', label: 'Demos', emoji: '🎬' },
                    { key: 'announcement', label: 'Announcements', emoji: '📣' }
                  ] as { key: PostTypeFilter; label: string; emoji: string }[]).map((type) => {
                    const isActive = filterType === type.key;
                    return (
                      <button
                        key={type.key}
                        onClick={() => setFilterType(type.key)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          isActive 
                            ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' 
                            : 'bg-white/[0.01] border border-white/[0.04] text-white/60 hover:bg-white/[0.03] hover:text-white'
                        }`}
                      >
                        <span>{type.emoji}</span>
                        <span>{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <div className="flex flex-col gap-6">
          
          {/* Show composer if logged-in user belongs to any startup and composer is toggled open */}
          {showComposer && currentUser && myStartups.length > 0 && (
            <div className="flex flex-col gap-3 mb-2">
              {myStartups.length > 1 && (
                <div className="flex items-center justify-between px-1.5 text-xs">
                  <label className="font-semibold text-white/40 uppercase tracking-wider">
                    Post as:
                  </label>
                  <select
                    value={activeIdeaIdForComposer}
                    onChange={handleIdeaChange}
                    className="bg-[#0f0f20] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white/80 outline-none focus:border-indigo-500/50"
                  >
                    {myStartups.map(startup => (
                      <option key={startup.id} value={startup.id}>
                        {startup.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <PostComposer 
                ideaId={activeIdeaIdForComposer || (myStartups[0] ? myStartups[0].id : '')} 
                onPostCreated={handlePostCreated} 
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="glass-card p-5 border border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Posts List / Skeleton */}
          {loading ? (
            <PostsListSkeleton count={3} />
          ) : filteredPosts.length > 0 ? (
            <div className="flex flex-col gap-6">
              {filteredPosts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onLikeToggle={handleLikeToggle}
                  showIdeaLink={true}
                />
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center border border-dashed border-white/10 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/30 mb-4">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-white mb-1">No updates yet</h3>
              <p className="text-white/40 text-xs sm:text-sm max-w-sm">
                No teams have posted updates in this category.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
