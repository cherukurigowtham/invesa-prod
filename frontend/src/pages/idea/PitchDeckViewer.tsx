/**
 * PitchDeckViewer.tsx
 *
 * Full interactive slide carousel for the "Pitch Deck" tab:
 * - Progress bar at top
 * - Keyboard (←/→) + touch swipe navigation
 * - Auto-play toggle
 * - Dot indicators
 * - Per-slide icon rendering
 * - CTA button for builders on the Team slide
 */

import { Rocket, AlertTriangle, Lightbulb, User, ShieldCheck, MessageSquare } from 'lucide-react';
import type { Idea, User as UserType } from '../../shared/lib/api';
import { useToast } from '../../shared/components/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Slide {
  title: string;
  subtitle: string;
  content: string;
  accentText?: string;
  iconType: 'rocket' | 'alert' | 'lightbulb' | 'users' | 'shield';
  isStamp?: boolean;
  teamSlots?: string[];
}

interface PitchDeckViewerProps {
  idea: Idea;
  slides: Slide[];
  slideIndex: number;
  isAutoplay: boolean;
  isFounder: boolean;
  user: UserType | null;
  onSlideChange: (index: number) => void;
  onAutoplayToggle: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

// ─── Icon map ─────────────────────────────────────────────────────────────────

function SlideIcon({ type }: { type: Slide['iconType'] }) {
  switch (type) {
    case 'rocket':    return <Rocket    className="w-6 h-6 text-indigo-400 animate-pulse" />;
    case 'alert':     return <AlertTriangle className="w-6 h-6 text-amber-400" />;
    case 'lightbulb': return <Lightbulb  className="w-6 h-6 text-yellow-400 animate-pulse" />;
    case 'users':     return <User       className="w-6 h-6 text-teal-400" />;
    case 'shield':    return <ShieldCheck className="w-6 h-6 text-emerald-400" />;
    default:          return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PitchDeckViewer({
  slides,
  slideIndex,
  isAutoplay,
  isFounder,
  user,
  onSlideChange,
  onAutoplayToggle,
  onTouchStart,
  onTouchEnd,
}: PitchDeckViewerProps) {
  const { success } = useToast();
  const currentSlide = slides[slideIndex];
  if (!currentSlide) return null;

  const goTo = (idx: number) => {
    onSlideChange(idx);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Main slide card ── */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="glass-card p-8 sm:p-10 border border-indigo-500/10 min-h-[380px] flex flex-col justify-between relative overflow-hidden"
      >
        {/* Top progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 flex">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-full flex-1 transition-all duration-300 ${
                idx <= slideIndex ? 'bg-indigo-500' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Slide counter */}
        <div className="flex items-center justify-between text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4">
          <span>Startup Pitch Deck</span>
          <span>
            Slide {slideIndex + 1} of {slides.length}
          </span>
        </div>

        {/* Slide body */}
        <div className="flex-1 flex flex-col justify-center space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 mb-1">
              <SlideIcon type={currentSlide.iconType} />
              <h3 className="text-2xl font-extrabold text-white tracking-tight">
                {currentSlide.title}
              </h3>
            </div>
            <p className="text-xs text-white/40">{currentSlide.subtitle}</p>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-2xl p-6 text-sm leading-relaxed text-white/80 whitespace-pre-wrap font-sans">
            {currentSlide.content}
          </div>

          {/* CTA on Team slide for builders */}
          {currentSlide.teamSlots &&
            currentSlide.teamSlots.length > 0 &&
            !isFounder &&
            user?.role === 'builder' && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    const joinForm = document.getElementById('join-request-form');
                    if (joinForm) {
                      joinForm.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      success('Use the join form in the sidebar to submit your application.');
                    }
                  }}
                  className="btn-primary py-1.5 px-4 text-xs inline-flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Apply to Join Team
                </button>
              </div>
            )}
        </div>

        {/* Footer pagination controls */}
        <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-6">
          <button
            disabled={slideIndex === 0}
            onClick={() => goTo(slideIndex - 1)}
            className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-30 cursor-pointer"
          >
            &larr; Previous
          </button>

          <div className="flex items-center gap-4">
            {/* Auto-play toggle */}
            <button
              type="button"
              onClick={onAutoplayToggle}
              className={`px-2 py-1 text-[9px] font-bold rounded border transition-all cursor-pointer ${
                isAutoplay
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
              }`}
            >
              {isAutoplay ? '⏸ Pause' : '▶ Auto'}
            </button>

            {/* Dot indicators */}
            <div className="flex gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === slideIndex
                      ? 'bg-indigo-500 scale-125'
                      : 'bg-white/20 hover:bg-white/45'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            disabled={slideIndex === slides.length - 1}
            onClick={() => goTo(slideIndex + 1)}
            className="btn-primary py-1.5 px-4 text-xs disabled:opacity-30 cursor-pointer"
          >
            Next &rarr;
          </button>
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-[10px] text-white/30 text-center select-none">
        💡 Tip: You can also use the Left and Right Arrow keys on your keyboard to navigate slides.
      </p>
    </div>
  );
}
