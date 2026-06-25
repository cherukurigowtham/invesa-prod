import { useState } from 'react';
import { Send, Link2, Video, AlertCircle } from 'lucide-react';
import { apiService } from '../lib/api';
import type { IdeaPost } from '../lib/api';

interface PostComposerProps {
  ideaId: string;
  onPostCreated?: (newPost: IdeaPost) => void;
}

type PostType = 'update' | 'milestone' | 'media' | 'announcement';

export default function PostComposer({ ideaId, onPostCreated }: PostComposerProps) {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('update');
  const [mediaUrl, setMediaUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const characterLimit = 1000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const newPost = await apiService.createPost(ideaId, {
        postType,
        content: content.trim(),
        mediaUrl: mediaUrl.trim() || undefined,
      });

      // Reset form
      setContent('');
      setMediaUrl('');
      setShowMediaInput(false);
      setPostType('update');

      if (onPostCreated) {
        onPostCreated(newPost);
      }
    } catch (err: any) {
      console.error('Failed to create post:', err);
      setError(err.message || 'Failed to publish post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPostTypeTheme = (type: PostType) => {
    switch (type) {
      case 'milestone':
        return {
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/30',
          activeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
          emoji: '🏆',
          placeholder: 'What major milestone did your project reach?',
        };
      case 'announcement':
        return {
          color: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/30',
          activeBg: 'bg-amber-500/20 text-amber-300 border-emerald-500/50',
          emoji: '📣',
          placeholder: 'Make an announcement...',
        };
      case 'media':
        return {
          color: 'text-purple-400',
          bg: 'bg-purple-500/10 border-purple-500/30',
          activeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
          emoji: '🎬',
          placeholder: 'Share a video link (YouTube or Loom)...',
        };
      case 'update':
      default:
        return {
          color: 'text-indigo-400',
          bg: 'bg-indigo-500/10 border-indigo-500/30',
          activeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50',
          emoji: '📢',
          placeholder: 'Share an update...',
        };
    }
  };

  const currentTheme = getPostTypeTheme(postType);

  return (
    <form onSubmit={handleSubmit} className="glass-card p-5 border border-white/[0.04] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500/20 via-indigo-500 to-indigo-500/20" />
      
      <div className="flex flex-col gap-4">
        {/* Post Type Selector Header */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Post Type
          </span>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            {(['update', 'milestone', 'media', 'announcement'] as PostType[]).map((type) => {
              const theme = getPostTypeTheme(type);
              const isSelected = postType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setPostType(type);
                    if (type === 'media' && !mediaUrl) {
                      setShowMediaInput(true);
                    }
                  }}
                  className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                    isSelected ? theme.activeBg : 'bg-white/[0.01] border-white/[0.04] text-white/60 hover:bg-white/[0.03] hover:text-white'
                  }`}
                >
                  <span className="text-sm">{theme.emoji}</span>
                  <span className="capitalize">{type}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, characterLimit))}
            placeholder={currentTheme.placeholder}
            rows={4}
            className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 text-sm sm:text-base text-white placeholder-white/20 outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all duration-200 resize-none"
            required
          />
          {error && (
            <div className="flex items-center gap-2 mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Media Link Expander */}
        {showMediaInput && (
          <div className="animate-slide-up flex flex-col gap-1.5 p-3.5 rounded-xl bg-white/[0.01] border border-white/[0.05]">
            <label className="text-xs font-semibold text-white/50 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-indigo-400" />
              Add Video Link
            </label>
            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Paste video link (YouTube or Loom)"
              className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-indigo-500/40 transition-all"
            />
            <span className="text-[10px] text-white/40">
              💡 Supports YouTube and Loom links.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-white/[0.04] pt-4 mt-1">
          {/* Toggle Media Link Input */}
          <button
            type="button"
            onClick={() => setShowMediaInput(!showMediaInput)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              showMediaInput || mediaUrl
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>{mediaUrl ? 'Edit Link' : 'Add Video'}</span>
          </button>

          <div className="flex items-center gap-4">
            {/* Character Count */}
            <span className={`text-xs ${content.length >= characterLimit - 50 ? 'text-amber-400 font-semibold' : 'text-white/30'}`}>
              {content.length}/{characterLimit}
            </span>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm font-semibold active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Post</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
