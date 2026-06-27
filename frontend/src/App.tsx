import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { apiService } from './shared/lib/api';
import { Search, Sparkles } from 'lucide-react';
import type { User } from './shared/lib/api';
import Navbar from './shared/components/Navbar';
import Sidebar from './shared/components/Sidebar';
import Footer from './shared/components/Footer';
import ProtectedRoute from './shared/components/ProtectedRoute';
import { ToastProvider } from './shared/components/Toast';

// Lazy load page components for route-based code splitting
const Landing = lazy(() => import('./pages/Landing'));
const Auth = lazy(() => import('./pages/Auth'));
const Explore = lazy(() => import('./pages/Explore'));
const IdeaDetail = lazy(() => import('./pages/IdeaDetail'));
const PostIdea = lazy(() => import('./pages/PostIdea'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const FounderDashboard = lazy(() => import('./pages/dashboard/FounderDashboard'));
const BuilderDashboard = lazy(() => import('./pages/dashboard/BuilderDashboard'));
const InvestorDashboard = lazy(() => import('./pages/dashboard/InvestorDashboard'));
const Equity = lazy(() => import('./pages/Equity'));
const Matchmaker = lazy(() => import('./pages/Matchmaker'));
const Chat = lazy(() => import('./pages/Chat'));

// Sleek glassmorphic Loading fallback UI
function RouteLoader({ invisible = false }: { invisible?: boolean }) {
  if (invisible) {
    // Invisible placeholder — preserves layout without painting a visible element.
    // Lighthouse FCP then captures the first real content paint instead of a spinner.
    return <div className="flex-1" style={{ minHeight: 'calc(100vh - 52px)' }} aria-hidden="true" />;
  }
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[60vh] animate-pulse">
      <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin mb-4" />
      <p className="text-xs text-white/40 tracking-wider uppercase font-semibold">Loading Workspace...</p>
    </div>
  );
}


// Inner layout wrapper that can read location
function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  // Command Palette states
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const commands = [
    { name: 'Go to Dashboard', path: '/dashboard', desc: 'View projects and team requests' },
    { name: 'Browse Projects', path: '/ideas', desc: 'Explore and filter startup ideas' },
    { name: 'Shares Simulator', path: '/cap-table', desc: 'Simulate cap tables and dilution' },
    { name: 'Offers Sandbox', path: '/term-sheets', desc: 'Compare VC offers side-by-side' },
    { name: 'Timeline Scheduler', path: '/vesting', desc: 'Plan vesting schedules and cliffs' },
    { name: 'Find Partners (Matchmaker)', path: '/matchmaker', desc: 'Find builders based on skills' },
    { name: 'Chat & Collaborations', path: '/chat', desc: 'Message matched partners' },
    user?.role === 'founder' && { name: 'Post a Project', path: '/post-idea', desc: 'Share a new startup idea' }
  ].filter(Boolean) as { name: string; path: string; desc: string }[];

  const filteredCommands = commands.filter(cmd => 
    cmd.name.toLowerCase().includes(paletteSearch.toLowerCase()) ||
    cmd.desc.toLowerCase().includes(paletteSearch.toLowerCase())
  );

  const runCommand = (path: string) => {
    navigate(path);
    setPaletteOpen(false);
    setPaletteSearch('');
    setHighlightedIndex(0);
  };

  useEffect(() => {
    setUser(apiService.getCurrentUser());
  }, [location]);

  // Global keydown listeners for K key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
        setPaletteSearch('');
        setHighlightedIndex(0);
      } else if (e.key === 'Escape') {
        setPaletteOpen(false);
      } else if (paletteOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setHighlightedIndex(prev => (prev + 1) % (filteredCommands.length || 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setHighlightedIndex(prev => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const activeCmd = filteredCommands[highlightedIndex];
          if (activeCmd) {
            runCommand(activeCmd.path);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paletteOpen, filteredCommands, highlightedIndex]);

  // Global event listener for Navbar trigger click
  useEffect(() => {
    const handleToggle = () => {
      setPaletteOpen(prev => !prev);
      setPaletteSearch('');
      setHighlightedIndex(0);
    };
    window.addEventListener('invesa_toggle_command_palette', handleToggle);
    return () => window.removeEventListener('invesa_toggle_command_palette', handleToggle);
  }, []);

  // Pages that are "shell" pages — no sidebar/footer
  const shellPages = ['/', '/login', '/register'];
  const isShellPage = shellPages.includes(location.pathname);
  const showSidebar = !!user && !isShellPage;

  return (
    <div className="min-h-screen bg-surface-default text-white selection:bg-indigo-500/40 selection:text-white flex flex-col">
      {/* Top Navbar – always visible */}
      <Navbar />

      {/* Body: sidebar + content */}
      <div className={`flex flex-1 ${showSidebar ? 'app-with-sidebar' : ''}`}>
        {showSidebar && <Sidebar user={user} />}

        <main
          id="main-content"
          className={`flex-1 flex flex-col min-w-0 ${showSidebar ? 'app-main-content' : ''}`}
          style={{ minHeight: 'calc(100vh - 52px)' }}
        >
          <Suspense fallback={<RouteLoader invisible={isShellPage} />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/register" element={<Auth />} />

              <Route
                path="/ideas"
                element={
                  <ProtectedRoute>
                    <Explore />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ideas/:id"
                element={
                  <ProtectedRoute>
                    <IdeaDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/feed"
                element={
                  <ProtectedRoute>
                    <Explore />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/valuation-simulator"
                element={<Navigate to="/cap-table" replace />}
              />
              <Route
                path="/cap-table"
                element={
                  <ProtectedRoute>
                    <Equity />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/term-sheets"
                element={
                  <ProtectedRoute>
                    <Equity />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vesting"
                element={
                  <ProtectedRoute>
                    <Equity />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/matchmaker"
                element={
                  <ProtectedRoute>
                    <Matchmaker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/post-idea"
                element={
                  <ProtectedRoute role="founder">
                    <PostIdea />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/founder"
                element={
                  <ProtectedRoute role="founder">
                    <FounderDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/builder"
                element={
                  <ProtectedRoute role="builder">
                    <BuilderDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/investor"
                element={
                  <ProtectedRoute role="investor">
                    <InvestorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            {/* Footer inside Suspense — renders only after page content resolves, preventing CLS */}
            {!showSidebar && <Footer />}
          </Suspense>
        </main>
      </div>

      {/* Command Palette Overlay Modal */}
      {paletteOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh] px-4 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-950/95 border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.2)] overflow-hidden">
            <div className="relative p-4 border-b border-white/10 flex items-center gap-3">
              <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search pages, tools, or actions..."
                value={paletteSearch}
                onChange={(e) => {
                  setPaletteSearch(e.target.value);
                  setHighlightedIndex(0);
                }}
                className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none"
              />
              <button
                onClick={() => setPaletteOpen(false)}
                className="text-[10px] text-white/30 hover:text-white bg-white/5 px-2 py-0.5 rounded cursor-pointer"
              >
                ESC
              </button>
            </div>

            <div className="p-2 max-h-[300px] overflow-y-auto">
              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd, idx) => (
                  <button
                    key={cmd.path}
                    onClick={() => runCommand(cmd.path)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                      idx === highlightedIndex 
                        ? 'bg-indigo-500/10 border border-indigo-500/30 text-white' 
                        : 'border border-transparent text-white/60 hover:bg-white/[0.02] hover:text-white'
                    }`}
                  >
                    <div className="min-w-0 text-left">
                      <div className="text-xs font-bold leading-tight">{cmd.name}</div>
                      <div className="text-[10px] text-white/40 mt-0.5 truncate">{cmd.desc}</div>
                    </div>
                    {idx === highlightedIndex && (
                      <span className="text-[9px] text-indigo-400 font-bold bg-indigo-500/15 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                        Enter
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-white/35 flex flex-col items-center justify-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-indigo-400/40 animate-pulse" />
                  No matching commands found.
                </div>
              )}
            </div>

            <div className="p-3 border-t border-white/5 bg-black/25 flex justify-between items-center text-[9px] text-white/30 select-none">
              <span>Use Arrow keys to navigate, Enter to select</span>
              <span className="flex items-center gap-1 font-mono">
                <kbd className="bg-white/5 px-1 rounded border border-white/10">⌘</kbd> + <kbd className="bg-white/5 px-1 rounded border border-white/10">K</kbd>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
