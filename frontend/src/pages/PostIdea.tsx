import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../shared/lib/api';
import { Lightbulb, Shield, Info, Rocket, ChevronDown, AlertCircle } from 'lucide-react';
import { useToast } from '../shared/components/Toast';

const CATEGORIES = ['AI', 'Fintech', 'SaaS', 'Security', 'Healthtech', 'Web3', 'Hardware'];
const STAGES = ['Idea', 'Prototype', 'MVP', 'Scaling'];

export default function PostIdea() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form values
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [stage, setStage] = useState(STAGES[0]);
  const [slotsText, setSlotsText] = useState('');
  const [ipHashVal, setIpHashVal] = useState('Drafting...');

  // Pitch Deck Builder states
  const [addSlides, setAddSlides] = useState(false);
  const [slideProblem, setSlideProblem] = useState('');
  const [slideSolution, setSlideSolution] = useState('');
  const [previewTab, setPreviewTab] = useState<'problem' | 'solution'>('problem');

  // Ensure only founders can access
  useEffect(() => {
    const user = apiService.getCurrentUser();
    if (!user || user.role !== 'founder') {
      navigate('/ideas');
    }
  }, []);

  // Compute live hash of the description to show dynamic IP protection
  useEffect(() => {
    if (!description) {
      setIpHashVal('Start typing description to generate hash...');
      return;
    }
    const generateHash = async () => {
      const encoder = new TextEncoder();
      const data = encoder.encode(description);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setIpHashVal(hashHex);
    };
    generateHash();
  }, [description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const teamSlots = slotsText 
        ? slotsText.split(',').map(s => s.trim()).filter(Boolean) 
        : [];
      
      let finalDescription = description;
      if (addSlides) {
        const slidesObj = {
          problem: slideProblem || 'No problem details provided yet.',
          solution: slideSolution || 'No solution details provided yet.'
        };
        finalDescription = `${description}\n\n---PITCH_SLIDES---\n${JSON.stringify(slidesObj)}\n---PITCH_SLIDES---`;
      }

      const newIdea = await apiService.createIdea({
        title,
        summary,
        description: finalDescription,
        category,
        stage,
        teamSlots
      });
      success('Project shared successfully!');
      navigate(`/ideas/${newIdea.id}`);
    } catch (err: any) {
      toastError(err.message || 'Failed to submit idea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-default pt-10 sm:pt-12 pb-24 relative">
      
      
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Title Block */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="font-display text-3xl font-extrabold text-white flex items-center justify-center sm:justify-start gap-2.5">
            <Lightbulb className="w-8 h-8 text-indigo-400" />
            Post a Project
          </h1>
          <p className="text-white/50 text-sm mt-2">Share your project, find team members, and connect with backers.</p>
        </div>

        {/* Main Grid: Form | IP Hash preview */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">
          
          {/* Form Area */}
          <form onSubmit={handleSubmit} className="xl:col-span-8 space-y-8">
            
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Project Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g. Decentracard"
                className="input-field"
              />
              <p className="text-[11px] text-white/45 mt-0.5">Keep it short and recognizable.</p>
            </div>

            {/* Category & Stage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Category</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-field bg-surface-card appearance-none pr-10"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-white/40">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-white/45 mt-0.5">Select the sector for your project.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Project Stage</label>
                <div className="relative">
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="input-field bg-surface-card appearance-none pr-10"
                  >
                    {STAGES.map(stg => (
                      <option key={stg} value={stg}>{stg}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-white/40">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-white/45 mt-0.5">Help others understand your progress status.</p>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Short Summary</label>
              <input
                type="text"
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Describe your idea in one sentence (max 150 chars)"
                maxLength={150}
                className="input-field"
              />
              <p className="text-[11px] text-white/45 mt-0.5">Provide a brief pitch of your project.</p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Detailed Description</label>
              <textarea
                required
                rows={8}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed breakdown of your idea. Describe the problem, your solution, market sizing and architecture..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-sm outline-none text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 placeholder-white/30 resize-y"
              />
              <p className="text-[11px] text-white/45 mt-0.5 font-normal">Explain the project goals and description.</p>
            </div>

            {/* Team Roles */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Positions to Fill</label>
              </div>
              <input
                type="text"
                value={slotsText}
                onChange={(e) => setSlotsText(e.target.value)}
                placeholder="UI Designer, React Developer, Marketing Manager"
                className="input-field"
              />
              <p className="text-[11px] text-white/45 mt-0.5">Separate roles with a comma (e.g. Designer, Developer, Product Manager).</p>
            </div>

            {/* Optional Pitch Slides */}
            <div className="glass-card p-5 border border-white/[0.04] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">Add Custom Pitch Slides</span>
                </div>
                <input
                  type="checkbox"
                  checked={addSlides}
                  onChange={(e) => setAddSlides(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-white/45">
                Enable this to structure your problem and solution statements into visual pitch deck slides.
              </p>

              {addSlides && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5 animate-fade-in">
                  {/* Left Column: Form Inputs */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/60">Slide: The Problem</label>
                      <textarea
                        rows={3}
                        value={slideProblem}
                        onChange={(e) => setSlideProblem(e.target.value)}
                        placeholder="What specific problem is your product solving? Keep it punchy."
                        className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 text-xs outline-none text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 placeholder-white/30 resize-y"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/60">Slide: The Solution</label>
                      <textarea
                        rows={3}
                        value={slideSolution}
                        onChange={(e) => setSlideSolution(e.target.value)}
                        placeholder="How does your product solve this problem? Highlight key value props."
                        className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 text-xs outline-none text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 placeholder-white/30 resize-y"
                      />
                    </div>
                  </div>

                  {/* Right Column: Live Mockup Preview */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-white/40 uppercase tracking-wider">
                      <span>Live Slide Preview</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewTab('problem')}
                          className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                            previewTab === 'problem' ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/40 hover:text-white'
                          }`}
                        >
                          Problem
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewTab('solution')}
                          className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                            previewTab === 'solution' ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/40 hover:text-white'
                          }`}
                        >
                          Solution
                        </button>
                      </div>
                    </div>

                    {/* Mockup Presentation Slide Card */}
                    <div className="glass-card p-5 border border-indigo-500/10 min-h-[170px] flex flex-col justify-between relative overflow-hidden bg-black/25">
                      <div className="flex items-center justify-between text-[8px] font-bold text-indigo-400 uppercase tracking-widest mb-2 select-none">
                        <span>Startup Pitch Deck Mockup</span>
                        <span>{previewTab === 'problem' ? 'Slide 2 of 5' : 'Slide 3 of 5'}</span>
                      </div>

                      <div className="flex-1 flex flex-col justify-center space-y-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            {previewTab === 'problem' ? (
                              <AlertCircle className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Lightbulb className="w-4 h-4 text-yellow-400 animate-pulse" />
                            )}
                            <h4 className="text-sm font-extrabold text-white tracking-tight">
                              {previewTab === 'problem' ? 'The Problem' : 'The Solution'}
                            </h4>
                          </div>
                          <p className="text-[10px] text-white/40">
                            {previewTab === 'problem' ? 'What challenge are we addressing?' : 'Our product and technology approach'}
                          </p>
                        </div>

                        <div className="bg-black/20 border border-white/5 rounded-xl p-3 text-[11px] leading-relaxed text-white/80 whitespace-pre-wrap font-sans min-h-[70px] max-h-[100px] overflow-y-auto">
                          {previewTab === 'problem' 
                            ? (slideProblem || 'What specific problem is your product solving? Keep it punchy.') 
                            : (slideSolution || 'How does your product solve this problem? Highlight key value props.')
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Rocket className="w-5 h-5" />
              {loading ? 'Posting Project...' : 'Post Project'}
            </button>

          </form>

          {/* Hashing Side Widget */}
          <div className="xl:col-span-4 space-y-8">
            
            {/* IP Lock Panel */}
            <div className="glass-card p-6 space-y-5 border border-indigo-500/15 bg-indigo-950/5 rounded-2xl">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm border-b border-white/5 pb-3">
                <Shield className="w-4.5 h-4.5 text-indigo-400" />
                Project Security &amp; Ownership
              </div>
              
              {/* Step-by-Step Flow */}
              <div className="space-y-3.5">
                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-semibold text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                  <p className="text-[11px] text-white/60 leading-normal">
                    <strong>Write Details:</strong> Describe your project. The security fingerprint is generated right in your browser to keep it confidential.
                  </p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-semibold text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                  <p className="text-[11px] text-white/60 leading-normal">
                    <strong>Create Fingerprint:</strong> We generate a unique, un-copyable digital fingerprint (hash) of your exact words.
                  </p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-semibold text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                  <p className="text-[11px] text-white/60 leading-normal">
                    <strong>Proof Established:</strong> Once published, this timestamped fingerprint is stored to prove you had this idea first.
                  </p>
                </div>
              </div>
              
              <div className="p-3.5 bg-black/40 rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-white/40 font-bold uppercase tracking-wider">
                  <span>Security Fingerprint</span>
                  <span className="text-emerald-400 animate-pulse text-[9px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">active</span>
                </div>
                <div className="text-[11px] text-indigo-300 font-mono break-all leading-normal bg-[#04040a] p-2.5 rounded border border-indigo-500/15 select-all">
                  {ipHashVal}
                </div>
              </div>
            </div>

            {/* Info panel */}
            <div className="glass p-5 flex items-start gap-3 text-xs text-white/50 leading-relaxed">
              <Info className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
              <div>
                Once posted, builders can request to join your team and backers can see updates. You can manage requests at any time.
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
