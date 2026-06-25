/**
 * IdeaDetail.tsx  — Orchestrator (state + API only)
 *
 * All state, API calls, event handlers, and math live here.
 * Visual rendering is fully delegated to focused sub-components
 * in ./idea/.
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  apiService,
  type Idea,
  type User,
  type IdeaAnalysis,
  type IdeaPost,
  type SavedSimulation,
} from '../shared/lib/api';
import { ArrowLeft, AlertCircle, ShieldCheck, AlertTriangle, Check } from 'lucide-react';
import PostCard from '../shared/components/PostCard';
import PostComposer from '../shared/components/PostComposer';
import { useToast } from '../shared/components/Toast';
import { MessageSquare } from 'lucide-react';
import { useRef } from 'react';
import mermaid from 'mermaid';
import { jsPDF } from 'jspdf';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
});

const getCategoryMermaidChart = (category: string, title: string): string => {
  const cleanTitle = title.replace(/[^a-zA-Z0-9 ]/g, "");
  switch (category) {
    case 'AI':
      return `graph TD
  Client["React App (Frontend)"] -->|Secure HTTPS| API["Rust Server (Axum API)"]
  API -->|LLM Prompts| Gemini["Gemini 1.5 Pro API"]
  API -->|Read/Write| DB[("PostgreSQL DB (${cleanTitle})")]`;
    case 'Fintech':
      return `graph TD
  Client["React App (Frontend)"] -->|TLS 1.3 Encryption| API["Rust Server (Axum API)"]
  API -->|Query| DB[("PostgreSQL DB (${cleanTitle})")]
  API -->|Ledger Hash| Ledger["Cryptographic IP Ledger"]`;
    case 'Security':
      return `graph TD
  Client["React App (Frontend)"] -->|Zero Knowledge Auth| API["Rust Server (Axum API)"]
  API -->|Encrypt| Crypt["Local Crypto Vault"]
  API -->|Store| DB[("PostgreSQL DB (${cleanTitle})")]`;
    case 'SaaS':
      return `graph TD
  Client["React App (Frontend)"] -->|HTTPS| API["Rust Server (Axum API)"]
  API -->|Session| JWT["JWT Token Store"]
  API -->|Relational Data| DB[("PostgreSQL DB (${cleanTitle})")]`;
    default:
      return `graph TD
  Client["React App (Frontend)"] -->|API Calls| API["Rust Server (Axum API)"]
  API -->|Relational Data| DB[("PostgreSQL DB (${cleanTitle})")]`;
  }
};

function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.removeAttribute('data-processed');
      // Render asynchronously
      mermaid.run({
        nodes: [ref.current]
      }).catch(err => console.error("Mermaid run failed:", err));
    }
  }, [chart]);

  return (
    <div
      key={chart}
      ref={ref}
      className="mermaid flex justify-center bg-black/20 p-4 rounded-xl border border-white/5 my-4"
    >
      {chart}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
import IdeaHeader from './idea/IdeaHeader';
import IdeaTabs, { type IdeaTab } from './idea/IdeaTabs';
import PitchDeckViewer from './idea/PitchDeckViewer';
import EvaluationPanel from './idea/EvaluationPanel';
import ValuationMiniPanel from './idea/ValuationMiniPanel';
import IdeaActionPanel from './idea/IdeaActionPanel';
import TasksBoard from './idea/TasksBoard';

// ─── Constants ────────────────────────────────────────────────────────────────

const ANALYSIS_STEPS = [
  'Reading project scope document...',
  'Analyzing market fit and category trends...',
  'Running SWOT matrix calculation...',
  'Finalizing ratings and recommendations...',
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

// ─── Component ────────────────────────────────────────────────────────────────

export default function IdeaDetail() {
  const { id } = useParams<{ id: string }>();
  const { success, error: toastError } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);

  // ── Idea data ─────────────────────────────────────────────────────────────
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Posts ─────────────────────────────────────────────────────────────────
  const [posts, setPosts] = useState<IdeaPost[]>([]);

  // ── Analysis ──────────────────────────────────────────────────────────────
  const [analysis, setAnalysis] = useState<IdeaAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // ── Verification modal ────────────────────────────────────────────────────
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyText, setVerifyText] = useState('');
  const [verifyResult, setVerifyResult] = useState<'idle' | 'success' | 'fail'>('idle');
  const [computedHash, setComputedHash] = useState('');

  // ── Pitch deck ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<IdeaTab>('overview');
  const [slideIndex, setSlideIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // ── Join request form ─────────────────────────────────────────────────────
  const [joinMsg, setJoinMsg] = useState('');
  const [joinSubmitting, setJoinSubmitting] = useState(false);

  // ── Investor interest form ────────────────────────────────────────────────
  const [investorNote, setInvestorNote] = useState('');
  const [investorSubmitting, setInvestorSubmitting] = useState(false);
  const [investorSuccess, setInvestorSuccess] = useState(false);

  // ── Valuation mini-panel ──────────────────────────────────────────────────
  const [pinnedSim, setPinnedSim] = useState<SavedSimulation | null>(null);
  const [localPreMoney, setLocalPreMoney] = useState(3_000_000);
  const [localRaise, setLocalRaise] = useState(500_000);
  const [localOptionPool, setLocalOptionPool] = useState(10);
  const [localCoFounder, setLocalCoFounder] = useState(40);

  // ─── Bootstrap ─────────────────────────────────────────────────────────────

  useEffect(() => {
    setUser(apiService.getCurrentUser());
    fetchIdeaDetail();
    fetchPosts();
    fetchPinnedSimulation();
  }, [id]);

  // Keyboard slide navigation
  useEffect(() => {
    if (activeTab !== 'pitch-deck' || !idea) return;
    const slides = buildSlides(idea);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setSlideIndex(p => Math.min(p + 1, slides.length - 1));
      if (e.key === 'ArrowLeft')  setSlideIndex(p => Math.max(p - 1, 0));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, idea]);

  // Autoplay interval
  useEffect(() => {
    if (!isAutoplay || activeTab !== 'pitch-deck' || !idea) return;
    const slides = buildSlides(idea);
    const interval = setInterval(() => {
      setSlideIndex(p => (p + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoplay, activeTab, idea]);

  // Seed default valuation params from pinned sim or stage
  useEffect(() => {
    if (pinnedSim) {
      setLocalPreMoney(pinnedSim.preMoneyValuation);
      setLocalRaise(pinnedSim.raiseAmount);
      setLocalOptionPool(pinnedSim.optionPoolPercent);
      setLocalCoFounder(pinnedSim.coFounderPercent);
    } else if (idea) {
      const defaults: Record<string, [number, number]> = {
        Idea:      [1_000_000, 200_000],
        Prototype: [3_000_000, 500_000],
        MVP:       [6_000_000, 1_000_000],
        Scaling:   [12_000_000, 2_500_000],
      };
      const [pm, ra] = defaults[idea.stage] ?? [3_000_000, 500_000];
      setLocalPreMoney(pm);
      setLocalRaise(ra);
    }
  }, [pinnedSim, idea]);

  // Load cached analysis
  useEffect(() => {
    if (id) {
      apiService.getIdeaAnalysis(id).then(a => { if (a) setAnalysis(a); }).catch(() => {});
    }
  }, [id]);

  // ─── API helpers ─────────────────────────────────────────────────────────

  const fetchIdeaDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setIdea(await apiService.getIdeaById(id));
    } catch (err: any) {
      setError(err.message || 'Idea not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    if (!id) return;
    try {
      setPosts(await apiService.getPosts(id));
    } catch { /* ignore */ }
  };

  const fetchPinnedSimulation = async () => {
    if (!id) return;
    try {
      setPinnedSim(await apiService.getSimulationByIdea(id));
    } catch { /* ignore */ }
  };

  const requireAuth = () => {
    if (!user) {
      const redirect = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?redirect=${redirect}`);
      return false;
    }
    return true;
  };

  // ─── Event handlers ──────────────────────────────────────────────────────

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !joinMsg || !requireAuth()) return;
    setJoinSubmitting(true);
    try {
      await apiService.requestToJoin(id, joinMsg);
      setJoinMsg('');
      success('Request to join submitted successfully!');
      fetchIdeaDetail();
    } catch (err: any) {
      toastError(err.message || 'Failed to submit request');
    } finally {
      setJoinSubmitting(false);
    }
  };

  const handleInvestorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !investorNote || !requireAuth()) return;
    setInvestorSubmitting(true);
    try {
      await apiService.expressInterest(id, investorNote);
      setInvestorSuccess(true);
      setInvestorNote('');
      success('Interest expressed successfully!');
      fetchIdeaDetail();
    } catch (err: any) {
      toastError(err.message || 'Failed to express interest');
    } finally {
      setInvestorSubmitting(false);
    }
  };

  const handleRequestStatus = async (requestId: string, accept: boolean) => {
    if (!id || !requireAuth()) return;
    try {
      await apiService.handleJoinRequest(id, requestId, accept);
      success(accept ? 'Builder request accepted!' : 'Builder request rejected.');
      fetchIdeaDetail();
    } catch (err: any) {
      toastError(err.message || 'Failed to update request status');
    }
  };

  const handleAnalyze = async () => {
    if (!id || !requireAuth()) return;
    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysisStep(0);
    setActiveTab('ai-evaluation');

    const delay = (step: number) =>
      new Promise<void>(res => setTimeout(() => { setAnalysisStep(step); res(); }, step * 900));

    try {
      await delay(1); await delay(2); await delay(3);
      setAnalysis(await apiService.analyzeIdea(id));
    } catch (err: any) {
      setAnalysisError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handlePinSimulation = async () => {
    if (!requireAuth()) return;
    try {
      const saved = await apiService.saveSimulation({
        ideaId: id,
        title: `Pinned Model: ${idea?.title}`,
        preMoneyValuation: localPreMoney,
        raiseAmount: localRaise,
        optionPoolPercent: localOptionPool,
        coFounderPercent: localCoFounder,
      });
      setPinnedSim(saved);
      success('Successfully pinned share calculation model!');
    } catch (err: any) {
      toastError(err.message || 'Failed to pin simulation');
    }
  };

  const handleDownloadCertificate = () => {
    if (!idea) return;
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4'
      });

      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();

      // Slate dark theme background
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, width, height, 'F');

      // Glowing border
      doc.setDrawColor(99, 102, 241); // indigo-500
      doc.setLineWidth(3);
      doc.rect(20, 20, width - 40, height - 40);

      doc.setDrawColor(244, 63, 94); // rose-500
      doc.setLineWidth(1);
      doc.rect(24, 24, width - 48, height - 48);

      // Logo
      doc.setTextColor(99, 102, 241);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('I N V E S A', width / 2, 60, { align: 'center' });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.text('INTELLECTUAL PROPERTY CERTIFICATE', width / 2, 110, { align: 'center' });

      // Divider
      doc.setDrawColor(255, 255, 255, 0.1);
      doc.line(100, 130, width - 100, 130);

      // Description text
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFontSize(14);
      doc.text('This document certifies that the following startup project concept and initial description', width / 2, 165, { align: 'center' });
      doc.text('have been cryptographically registered and timestamped on the Invesa network.', width / 2, 183, { align: 'center' });

      // Startup details panel
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(80, 215, width - 160, 140, 'F');
      doc.setDrawColor(51, 65, 85); // slate-700
      doc.rect(80, 215, width - 160, 140);

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(`Project Title: ${idea.title}`, 100, 245);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225); // slate-300
      doc.setFontSize(13);
      doc.text(`Founder: ${idea.founderName}`, 100, 270);
      doc.text(`Category: ${idea.category}  |  Current Stage: ${idea.stage}`, 100, 295);
      doc.text(`Registration Time: ${new Date(idea.createdAt).toLocaleString()}`, 100, 320);

      // Cryptographic signature panel
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(80, 375, width - 160, 110, 'F');
      doc.rect(80, 375, width - 160, 110);

      doc.setTextColor(244, 63, 94); // rose-400
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('SHA-256 IP FINGERPRINT (DIGITAL HASH):', 100, 400);

      doc.setTextColor(255, 255, 255);
      doc.setFont('courier', 'bold');
      doc.setFontSize(11);
      doc.text(idea.ipHash, 100, 423);

      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text('This hash is computed directly in the founder\'s browser before registration, ensuring the', 100, 450);
      doc.text('underlying text/pitch content remains completely unchanged and secure.', 100, 465);

      // Verified mark
      doc.setTextColor(99, 102, 241);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('VERIFIED BY INVESA CRYPTOGRAPHIC TIMESTAMP PROTOCOL', width / 2, 530, { align: 'center' });

      doc.save(`${idea.title.replace(/\s+/g, '_')}_ip_certificate.pdf`);
      success('Verified IP Certificate downloaded successfully!');
    } catch (err: any) {
      toastError('Failed to generate PDF certificate.');
      console.error(err);
    }
  };

  const handleVerifyHash = async () => {
    if (!verifyText.trim() || !idea) return;
    try {
      let textToHash = verifyText.trim();
      const match = idea.description.match(/---PITCH_SLIDES---[\s\S]*---PITCH_SLIDES---/);
      if (match) {
        textToHash = `${textToHash}\n\n${match[0]}`;
      }

      const bytes = new TextEncoder().encode(textToHash);
      const buf = await crypto.subtle.digest('SHA-256', bytes);
      const hex = Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      setComputedHash(hex);
      setVerifyResult(hex === idea.ipHash ? 'success' : 'fail');
    } catch {
      setVerifyResult('fail');
    }
  };

  const handlePostCreated = (newPost: IdeaPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handleLikeToggle = (updatedPost: IdeaPost) => {
    setPosts(prev => prev.map(p => (p.id === updatedPost.id ? updatedPost : p)));
  };

  // ─── Pitch deck slide builder ─────────────────────────────────────────────

  const parseDescriptionAndSlides = (rawDesc: string) => {
    if (!rawDesc) return { descriptionText: '', customSlides: null };
    const parts = rawDesc.split('---PITCH_SLIDES---');
    if (parts.length >= 3) {
      try {
        return {
          descriptionText: (parts[0] + parts[parts.length - 1]).trim(),
          customSlides: JSON.parse(parts[1].trim()),
        };
      } catch { /* fall through */ }
    }
    return { descriptionText: rawDesc.trim(), customSlides: null };
  };

  const buildSlides = (idea: Idea) => {
    const { descriptionText, customSlides } = parseDescriptionAndSlides(idea.description);
    return [
      {
        title: idea.title,
        subtitle: `Stage: ${idea.stage} | Category: ${idea.category}`,
        content: idea.summary,
        accentText: `By Founder: ${idea.founderName}`,
        iconType: 'rocket' as const,
      },
      {
        title: 'The Problem',
        subtitle: 'What challenge are we addressing?',
        content:
          customSlides?.problem ||
          descriptionText.split('\n\n')[0] ||
          'Identifying key problem statements in the target market.',
        iconType: 'alert' as const,
      },
      {
        title: 'The Solution',
        subtitle: 'Our product and technology approach',
        content:
          customSlides?.solution ||
          descriptionText.split('\n\n')[1] ||
          descriptionText ||
          'Building Invesa integration channels to bridge the gap.',
        iconType: 'lightbulb' as const,
      },
      {
        title: 'Team & Collaboration',
        subtitle: 'Positions we are currently recruiting for',
        content:
          idea.teamSlots && idea.teamSlots.length > 0
            ? `We are actively recruiting matching builders for the following roles:\n\n${idea.teamSlots.map(s => `• ${s}`).join('\n')}`
            : 'We are currently fully staffed but open to advisory partnerships.',
        teamSlots: idea.teamSlots,
        iconType: 'users' as const,
      },
      {
        title: 'Blockchain Registration & Proof',
        subtitle: 'Cryptographic security stamp details',
        content: `This project is officially registered in Invesa's cryptographic registry. The local file hash guarantees founder creation priority.\n\nRegistry Hash:\n${idea.ipHash}`,
        isStamp: true,
        iconType: 'shield' as const,
      },
    ];
  };

  // ─── Cap table math ───────────────────────────────────────────────────────

  const localPostMoney = localPreMoney + localRaise;
  const localInvestorPct = localPostMoney > 0 ? (localRaise / localPostMoney) * 100 : 0;
  const localRemainingFounderPct = 100 - localInvestorPct - localOptionPool;
  const localCoFounderPct = localRemainingFounderPct * (localCoFounder / 100);
  const localLeadFounderPct = localRemainingFounderPct - localCoFounderPct;

  const localCapTable = [
    { name: 'Lead Founder', pct: localLeadFounderPct, value: (localLeadFounderPct / 100) * localPostMoney, color: '#6366f1' },
    { name: 'Co-founder',   pct: localCoFounderPct,   value: (localCoFounderPct   / 100) * localPostMoney, color: '#3b82f6' },
    { name: 'Option Pool',  pct: localOptionPool,      value: (localOptionPool      / 100) * localPostMoney, color: '#ec4899' },
    { name: 'Investors',    pct: localInvestorPct,     value: (localInvestorPct     / 100) * localPostMoney, color: '#f59e0b' },
  ];

  // ─── Touch handlers ───────────────────────────────────────────────────────

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null || !idea) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    const slides = buildSlides(idea);
    if (diff > 50)  setSlideIndex(p => Math.min(p + 1, slides.length - 1));
    if (diff < -50) setSlideIndex(p => Math.max(p - 1, 0));
    setTouchStart(null);
  };

  // ─── Loading / Error guards ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-default flex items-center justify-center text-white/50 text-sm">
        Loading project details...
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="min-h-screen bg-surface-default flex items-center justify-center flex-col px-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Error Loading Idea</h3>
        <p className="text-sm text-white/50 mb-6 max-w-sm">{error || 'Project detail could not be loaded.'}</p>
        <Link to="/ideas" className="btn-primary py-2 px-6 flex items-center gap-2 text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </Link>
      </div>
    );
  }

  // ─── Derived state ────────────────────────────────────────────────────────

  const isFounder  = user?.id === idea.founderId;
  const isTeamMember = !!(user && (isFounder || idea.teamMembers?.some(m => m.userId === user.id)));
  const isBuilder  = user?.role === 'builder';
  const isInvestor = user?.role === 'investor';
  const hasApplied = idea.joinRequests?.some(r => r.builderId === user?.id) ?? false;
  const pendingRequests  = idea.joinRequests?.filter(r => r.status === 'pending') ?? [];
  const investorInterests = idea.investorInterests ?? [];
  const slides = buildSlides(idea);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-surface-default pt-10 sm:pt-12 pb-24 relative">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">

        {/* Back link */}
        <Link
          to="/ideas"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        {/* Main grid: content | action panel */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">

          {/* ── Left column (8 cols) ── */}
          <div className="xl:col-span-8 space-y-10">

            {/* Header card */}
            <IdeaHeader
              idea={idea}
              onOpenVerifyModal={() => {
                setVerifyText('');
                setVerifyResult('idle');
                setComputedHash('');
                setShowVerifyModal(true);
              }}
              onDownloadCertificate={handleDownloadCertificate}
            />

            {/* Tab nav */}
            <IdeaTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              postsCount={posts.length}
              isTeamMember={isTeamMember}
              analysisScore={analysis?.overallScore ?? null}
            />

            {/* Tab: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-fade-in">
                {/* Description */}
                <div className="glass-card p-6 sm:p-8 space-y-4">
                  <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">
                    Project Description
                  </h2>
                  <p className="text-sm sm:text-base text-white/60 leading-relaxed whitespace-pre-wrap font-sans">
                    {parseDescriptionAndSlides(idea.description).descriptionText}
                  </p>
                </div>

                {/* System Architecture Diagram (Mermaid) */}
                <div className="glass-card p-6 sm:p-8 space-y-4">
                  <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">
                    System Architecture Visualizer
                  </h2>
                  <p className="text-xs text-white/40 leading-relaxed">
                    Interactive technical diagram auto-generated based on project category and scope.
                  </p>
                  <Mermaid chart={getCategoryMermaidChart(idea.category, idea.title)} />
                </div>

                {/* Founder */}
                <div className="glass-card p-6 sm:p-8 space-y-4">
                  <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">
                    About Founder
                  </h2>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <ArrowLeft className="w-6 h-6 text-white/60 hidden" />
                      <span className="text-white/60 text-xl">👤</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{idea.founderName}</h4>
                      <p className="text-xs text-white/40 mb-2">Platform Member</p>
                      <p className="text-sm text-white/60 leading-relaxed">
                        Student founder developing creative technologies. Passionate about
                        problem-solving and building functional teams.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Team members */}
                <div className="glass-card p-6 sm:p-8 space-y-4">
                  <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">
                    Current Team Members ({idea.teamMembers?.length || 1})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {idea.teamMembers?.map((member, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-indigo-400 text-xs">👤</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{member.name}</div>
                          <div className="text-xs text-white/50">{member.roleTitle}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Pitch Deck */}
            {activeTab === 'pitch-deck' && (
              <PitchDeckViewer
                idea={idea}
                slides={slides}
                slideIndex={slideIndex}
                isAutoplay={isAutoplay}
                isFounder={isFounder}
                user={user}
                onSlideChange={idx => { setSlideIndex(idx); setIsAutoplay(false); }}
                onAutoplayToggle={() => setIsAutoplay(p => !p)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              />
            )}

            {/* Tab: Updates */}
            {activeTab === 'updates' && (
              <div className="space-y-6 animate-fade-in">
                {user && (isFounder || idea.teamMembers?.some(m => m.userId === user.id)) ? (
                  <PostComposer ideaId={idea.id} onPostCreated={handlePostCreated} />
                ) : user ? (
                  <div className="glass-card p-4 border border-dashed border-white/10 text-xs sm:text-sm text-white/50 bg-indigo-500/[0.01]">
                    💡 Only founder and team members can publish updates.
                  </div>
                ) : null}

                {posts.length > 0 ? (
                  <div className="flex flex-col gap-6">
                    {posts.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onLikeToggle={handleLikeToggle}
                        showIdeaLink={false}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="glass-card p-12 py-16 text-center border border-dashed border-white/10 flex flex-col items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-white/25 mb-3" />
                    <h3 className="font-semibold text-white text-sm mb-1">No updates yet</h3>
                    <p className="text-white/40 text-xs max-w-xs">
                      The team has not posted any updates yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Scorecard */}
            {activeTab === 'ai-evaluation' && (
              <EvaluationPanel
                analysis={analysis}
                analysisLoading={analysisLoading}
                analysisStep={analysisStep}
                analysisError={analysisError}
                analysisSteps={ANALYSIS_STEPS}
                onAnalyze={handleAnalyze}
              />
            )}

            {/* Tab: Dilution */}
            {activeTab === 'valuation' && (
              <ValuationMiniPanel
                pinnedSim={pinnedSim}
                localPreMoney={localPreMoney}
                localRaise={localRaise}
                localOptionPool={localOptionPool}
                localCoFounder={localCoFounder}
                localCapTable={localCapTable}
                isFounder={isFounder}
                ideaTitle={idea.title}
                ideaId={id}
                formatCurrency={formatCurrency}
                onPreMoneyChange={setLocalPreMoney}
                onRaiseChange={setLocalRaise}
                onOptionPoolChange={setLocalOptionPool}
                onCoFounderChange={setLocalCoFounder}
                onPinSimulation={handlePinSimulation}
              />
            )}

            {/* Tab: Tasks Board */}
            {activeTab === 'tasks' && isTeamMember && (
              <TasksBoard idea={idea} />
            )}

          </div>

          {/* ── Right column (4 cols) — Action Panel ── */}
          <IdeaActionPanel
            idea={idea}
            user={user}
            isFounder={isFounder}
            isBuilder={isBuilder}
            isInvestor={isInvestor}
            hasApplied={hasApplied}
            pendingRequests={pendingRequests}
            investorInterests={investorInterests}
            joinMsg={joinMsg}
            joinSubmitting={joinSubmitting}
            investorNote={investorNote}
            investorSubmitting={investorSubmitting}
            investorSuccess={investorSuccess}
            locationPathname={location.pathname}
            onJoinMsgChange={setJoinMsg}
            onJoinSubmit={handleJoinSubmit}
            onInvestorNoteChange={setInvestorNote}
            onInvestorSubmit={handleInvestorSubmit}
            onAcceptRequest={id => handleRequestStatus(id, true)}
            onRejectRequest={id => handleRequestStatus(id, false)}
          />

        </div>{/* END main grid */}

        {/* ── Verify Fingerprint Modal ── */}
        {showVerifyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-white">
            <div className="glass-card w-full max-w-lg p-6 space-y-5 border border-white/10 shadow-2xl relative bg-[#111827]">
              {/* Modal header */}
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Verify Cryptographic Proof
                  </h3>
                </div>
                <button
                  onClick={() => setShowVerifyModal(false)}
                  className="text-white/40 hover:text-white text-xs font-semibold px-2 py-1 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Modal body */}
              <div className="text-xs space-y-3">
                <p className="text-white/60 leading-relaxed font-sans">
                  Paste the original project description text below to re-calculate its SHA-256
                  digital fingerprint and verify priority of creation.
                </p>
                <textarea
                  value={verifyText}
                  onChange={e => {
                    setVerifyText(e.target.value);
                    setVerifyResult('idle');
                    setComputedHash('');
                  }}
                  placeholder="Paste original project description text here..."
                  rows={5}
                  className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 text-white placeholder-white/30 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all font-mono text-[11px]"
                />
                <button
                  onClick={handleVerifyHash}
                  disabled={!verifyText.trim()}
                  className="btn-primary py-2 px-4 text-xs font-bold w-full active:scale-97 cursor-pointer hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Re-calculate &amp; Verify Hash
                </button>
              </div>

              {/* Result display */}
              {verifyResult !== 'idle' && (
                <div className="space-y-3 border-t border-white/[0.06] pt-4 animate-fade-in text-xs">
                  {verifyResult === 'success' ? (
                    <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 flex items-start gap-2">
                      <Check className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold font-sans">Cryptographic Fingerprint Matched!</div>
                        <div className="text-[10px] text-white/50 mt-0.5 font-sans">
                          The pasted description matches the registered blockchain registry
                          fingerprint perfectly. Integrity validated.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold font-sans">Fingerprint Mismatch!</div>
                        <div className="text-[10px] text-white/50 mt-0.5 font-sans">
                          The computed hash does not match. The text has been modified, contains
                          typos, or represents a different scope version.
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 font-mono text-[10px] bg-black/40 p-2.5 rounded border border-white/5">
                    <div>
                      <span className="text-white/30 block text-[9px] uppercase font-sans">
                        Registered Hash:
                      </span>
                      <span className="text-white/70 select-all break-all">{idea.ipHash}</span>
                    </div>
                    <div className="border-t border-white/5 pt-1.5 mt-1.5">
                      <span className="text-white/30 block text-[9px] uppercase font-sans">
                        Computed Hash:
                      </span>
                      <span className="text-white/70 select-all break-all">{computedHash}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
