import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ArrowRight, ExternalLink, Calendar, User as UserIcon } from 'lucide-react';
import { apiService } from '../lib/api';
import type { IdeaPost } from '../lib/api';

interface PostCardProps {
  post: IdeaPost;
  onLikeToggle?: (updatedPost: IdeaPost) => void;
  showIdeaLink?: boolean;
}

export default function PostCard({ post, onLikeToggle, showIdeaLink = true }: PostCardProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const currentUser = apiService.getCurrentUser();
  const isLiked = currentUser ? post.likedBy?.includes(currentUser.id) : false;

  const handleLike = async () => {
    if (!currentUser) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setIsLiking(true);
    try {
      const updated = await apiService.likePost(post.id);
      if (onLikeToggle) {
        onLikeToggle(updated);
      }
    } catch (err) {
      console.error('Failed to like post:', err);
    } finally {
      setIsLiking(false);
    }
  };

  const getPostTypeDetails = (type: IdeaPost['postType']) => {
    switch (type) {
      case 'milestone':
        return {
          label: 'Milestone',
          emoji: '🏆',
          bgColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          borderColor: 'border-emerald-500/10',
          glowColor: 'shadow-emerald-500/5',
        };
      case 'announcement':
        return {
          label: 'Announcement',
          emoji: '📣',
          bgColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          borderColor: 'border-amber-500/10',
          glowColor: 'shadow-amber-500/5',
        };
      case 'media':
        return {
          label: 'Media Walkthrough',
          emoji: '🎬',
          bgColor: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
          borderColor: 'border-purple-500/10',
          glowColor: 'shadow-purple-500/5',
        };
      case 'update':
      default:
        return {
          label: 'Update',
          emoji: '📢',
          bgColor: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
          borderColor: 'border-indigo-500/10',
          glowColor: 'shadow-indigo-500/5',
        };
    }
  };

  const parseMediaUrl = (url?: string) => {
    if (!url) return null;
    
    // YouTube
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = url.match(ytRegex);
    if (ytMatch && ytMatch[1]) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
      };
    }

    // Loom
    const loomRegex = /loom\.com\/(?:share|embed)\/([a-fA-F0-9]+)/;
    const loomMatch = url.match(loomRegex);
    if (loomMatch && loomMatch[1]) {
      return {
        type: 'loom',
        embedUrl: `https://www.loom.com/embed/${loomMatch[1]}`,
      };
    }

    return {
      type: 'generic',
      url,
    };
  };

  const media = parseMediaUrl(post.mediaUrl);
  const details = getPostTypeDetails(post.postType);
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={`glass-card p-6 border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300 shadow-xl ${details.glowColor} relative overflow-hidden group`}>
      {/* Type-based top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${
        post.postType === 'milestone' ? 'from-emerald-500 to-teal-400' :
        post.postType === 'announcement' ? 'from-amber-500 to-orange-400' :
        post.postType === 'media' ? 'from-purple-500 to-pink-400' :
        'from-indigo-500 to-violet-400'
      }`} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60">
            <UserIcon className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm sm:text-base leading-tight">
                {post.authorName}
              </span>
              <span className="text-white/40 text-xs">•</span>
              {showIdeaLink ? (
                <Link
                  to={`/ideas/${post.ideaId}`}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:underline transition-all"
                >
                  {post.ideaTitle}
                </Link>
              ) : (
                <span className="text-xs font-medium text-white/50">{post.ideaTitle}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-white/40">
              <Calendar className="w-3 h-3" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Post Type Badge */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${details.bgColor}`}>
          <span>{details.emoji}</span>
          <span>{details.label}</span>
        </span>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className={`text-white/80 text-sm sm:text-base leading-relaxed whitespace-pre-wrap ${!isExpanded ? 'line-clamp-4' : ''}`}>
          {post.content}
        </p>
        {post.content.length > 280 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Media Embedding */}
      {media && (
        <div className="mb-4 rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.01]">
          {media.type === 'youtube' || media.type === 'loom' ? (
            <div className="relative aspect-video w-full">
              <iframe
                src={media.embedUrl}
                title="Post video embed"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
          ) : (
            <a
              href={media.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 hover:bg-white/[0.02] transition-colors group/link text-xs sm:text-sm text-indigo-300 hover:text-indigo-200"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <span className="truncate font-medium">{post.mediaUrl}</span>
              </div>
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all text-white/50" />
            </a>
          )}
        </div>
      )}

      {/* Footer / Actions */}
      <div className="flex items-center justify-between border-t border-white/[0.05] pt-4 mt-4">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
            isLiked
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              : 'text-white/60 hover:text-rose-400 hover:bg-rose-500/5 border border-transparent cursor-pointer'
          } active:scale-95`}
          title={currentUser ? 'Like post' : 'Sign in to like posts'}
        >
          <Heart className={`w-4 h-4 transition-transform ${isLiked ? 'fill-rose-400 scale-110' : ''}`} />
          <span className="text-xs font-semibold">{post.likes}</span>
        </button>

        {showIdeaLink && (
          <Link
            to={`/ideas/${post.ideaId}`}
            className="flex items-center gap-1 text-xs font-semibold text-white/60 hover:text-indigo-400 transition-colors group/goto"
          >
            <span>View Project</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/goto:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>
    </div>
  );
}
