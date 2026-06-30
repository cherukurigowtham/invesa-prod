import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../lib/api';
import type { User, Idea } from '../lib/api';
import { LogOut, User as UserIcon, ChevronDown, TrendingUp, ArrowUpRight, Search } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<{ totalUpdates: number; milestones: number } | null>(null);
  const [activeProjects, setActiveProjects] = useState<Idea[]>([]);

  useEffect(() => {
    setUser(apiService.getCurrentUser());
  }, [location]);

  useEffect(() => {
    if (!user) {
      setStats(null);
      setActiveProjects([]);
      return;
    }
    const loadProfileData = async () => {
      try {
        const fetchedPosts = await apiService.getPosts();
        const fetchedIdeas = await apiService.getIdeas();
        const milestoneCount = fetchedPosts.filter(p => p.postType === 'milestone').length;
        setStats({
          totalUpdates: fetchedPosts.length,
          milestones: milestoneCount
        });
        setActiveProjects(fetchedIdeas.slice(0, 3));
      } catch (err) {
        console.error('Failed to load stats/projects in navbar', err);
      }
    };
    loadProfileData();
  }, [user]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    apiService.logout();
    setUser(null);
    setOpen(false);
    navigate('/');
  };

  return (
    <header className="topbar">
      {/* Logo */}
      <Link to="/" className="topbar-logo" aria-label="Go to home">
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="navLogoBulbGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8ab4f8" />
              <stop offset="100%" stopColor="#c58af9" />
            </linearGradient>
            <linearGradient id="navLogoGrowthGrad" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34a853" />
              <stop offset="100%" stopColor="#8ab4f8" />
            </linearGradient>
          </defs>
          {/* Bulb outline */}
          <path
            d="M15 14c1.2-1.2 2-2.8 2-4.5a5 5 0 0 0-10 0c0 1.7.8 3.3 2 4.5"
            stroke="url(#navLogoBulbGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#navLogoBulbGrad)"
            fillOpacity="0.06"
          />
          {/* Bulb base lines */}
          <path
            d="M9 17.5h6"
            stroke="url(#navLogoBulbGrad)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M10 20.5h4"
            stroke="url(#navLogoBulbGrad)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Bar chart inside */}
          <rect x="9" y="11" width="1.5" height="3" rx="0.75" fill="url(#navLogoGrowthGrad)" fillOpacity="0.85" />
          <rect x="11.25" y="9" width="1.5" height="5" rx="0.75" fill="url(#navLogoGrowthGrad)" fillOpacity="0.85" />
          <rect x="13.5" y="7" width="1.5" height="7" rx="0.75" fill="url(#navLogoGrowthGrad)" fillOpacity="0.85" />
          {/* Trend arrow shooting through */}
          <path
            d="M7.5 13L10 11L12 12L17.5 7"
            stroke="url(#navLogoGrowthGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 7h2.5V9.5"
            stroke="url(#navLogoGrowthGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="topbar-logo-text">Invesa</span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-2.5">
        {user && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('invesa_toggle_command_palette'))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-white/[0.08] bg-white/[0.01] text-white/50 cursor-pointer transition-all hover:text-white hover:bg-white/[0.04]"
            title="Press Cmd+K / Ctrl+K to search"
          >
            <Search className="w-3.5 h-3.5" />
            <kbd className="hidden sm:inline bg-white/5 px-1 rounded text-[8px] border border-white/10 font-mono">⌘K</kbd>
          </button>
        )}
        {user ? (
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setOpen(!open)}
              className="topbar-avatar-btn"
              aria-haspopup="true"
              aria-expanded={open}
            >
              <div className="topbar-avatar">
                <UserIcon className="w-3.5 h-3.5 text-white/60" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-white/80">
                {user.name.split(' ')[0]}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-white/30 transition-transform ${open ? 'rotate-180' : ''}`}
              />
            </button>

            {open && (
              <div className="topbar-dropdown w-72 sm:w-80 animate-fade-in p-3 flex flex-col gap-4">
                <div className="flex flex-col pb-3 border-b border-white/[0.06]">
                  <span className="text-sm font-semibold text-white">{user.name}</span>
                  <span className="text-[11px] text-white/40 capitalize mt-0.5">{user.role}</span>
                </div>
                
                {/* Stats Section */}
                {stats && (
                  <div className="flex flex-col gap-2 pb-3 border-b border-white/[0.06]">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">
                      Platform Stats
                    </span>
                    <div className="grid grid-cols-2 gap-2 bg-white/[0.02] border border-white/[0.04] rounded-lg p-2.5">
                      <div className="flex flex-col">
                        <span className="text-base font-bold text-white">{stats.totalUpdates}</span>
                        <span className="text-[9px] text-white/40">Total Updates</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-bold text-emerald-400">{stats.milestones}</span>
                        <span className="text-[9px] text-white/40">Milestones</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Projects Section */}
                {activeProjects.length > 0 && (
                  <div className="flex flex-col gap-2 pb-1.5 border-b border-white/[0.06]">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      Active Projects
                    </span>
                    <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                      {activeProjects.map((idea) => (
                        <div key={idea.id} className="group flex flex-col gap-0.5 p-2 rounded-lg bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.03] transition-all">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300">
                              {idea.category}
                            </span>
                            <span className="text-[9px] text-white/30 capitalize">{idea.stage}</span>
                          </div>
                          <Link 
                            to={`/ideas/${idea.id}`}
                            onMouseEnter={() => (window as any).__invesa_prefetch?.(`/ideas/${idea.id}`)}
                            className="font-semibold text-xs text-white group-hover:text-indigo-400 transition-colors flex items-center justify-between gap-1 mt-1"
                          >
                            <span className="truncate">{idea.title}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-white/40 group-hover:text-indigo-400" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-2.5 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-secondary px-4 py-2 text-sm">
              Sign in
            </Link>
            <Link to="/register" className="btn-primary px-4 py-2 text-sm shadow-none">
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
