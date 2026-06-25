// Pulsing card placeholder skeletons for loading states

// Single Project Card Skeleton (for Dashboard & Matchmaker)
export function ProjectCardSkeleton() {
  return (
    <div className="glass-card p-6 border border-white/[0.04] flex flex-col justify-between items-start gap-4 animate-pulse">
      <div className="w-full">
        {/* Category & Stage tags */}
        <div className="flex gap-2 mb-3">
          <div className="w-16 h-4 bg-white/10 rounded" />
          <div className="w-14 h-4 bg-white/5 rounded" />
        </div>
        {/* Title */}
        <div className="w-1/2 h-5 bg-white/10 rounded mb-2.5" />
        {/* Description / Summary */}
        <div className="w-full h-3 bg-white/5 rounded mb-1.5" />
        <div className="w-4/5 h-3 bg-white/5 rounded" />
      </div>
      {/* Action button skeleton */}
      <div className="w-24 h-7 bg-white/10 rounded-lg mt-2" />
    </div>
  );
}

// Grid of Project Card Skeletons
export function ProjectsGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <ProjectCardSkeleton key={idx} />
      ))}
    </div>
  );
}

// Single Feed Post Card Skeleton
export function PostCardSkeleton() {
  return (
    <div className="glass-card p-6 border border-white/[0.04] animate-pulse space-y-4">
      {/* Post header (Avatar + Author + Metadata) */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10" />
        <div className="space-y-1.5 flex-1">
          <div className="w-32 h-4 bg-white/10 rounded" />
          <div className="w-20 h-3 bg-white/5 rounded" />
        </div>
        {/* Post Type Badge */}
        <div className="w-16 h-5 bg-white/10 rounded-md" />
      </div>

      {/* Post content */}
      <div className="space-y-2">
        <div className="w-full h-3 bg-white/5 rounded" />
        <div className="w-full h-3 bg-white/5 rounded" />
        <div className="w-2/3 h-3 bg-white/5 rounded" />
      </div>

      {/* Post footer (Likes, details) */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="w-12 h-6 bg-white/10 rounded-lg" />
        <div className="w-16 h-3 bg-white/5 rounded" />
      </div>
    </div>
  );
}

// List of Feed Post Skeletons
export function PostsListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-5 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <PostCardSkeleton key={idx} />
      ))}
    </div>
  );
}

// Matchmaker Candidate Card Skeleton
export function MatchmakerCardSkeleton() {
  return (
    <div className="glass-card p-6 border border-white/[0.04] animate-pulse space-y-5">
      <div className="flex justify-between items-start">
        {/* Avatar + name */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/10" />
          <div className="space-y-1.5">
            <div className="w-28 h-4 bg-white/10 rounded" />
            <div className="w-16 h-3 bg-white/5 rounded" />
          </div>
        </div>
        {/* Compatibility badge */}
        <div className="w-16 h-6 bg-white/10 rounded-full" />
      </div>

      {/* Bio / statement */}
      <div className="space-y-1.5">
        <div className="w-full h-3 bg-white/5 rounded" />
        <div className="w-5/6 h-3 bg-white/5 rounded" />
      </div>

      {/* Skills tags list */}
      <div className="space-y-2">
        <div className="w-24 h-3 bg-white/10 rounded" />
        <div className="flex flex-wrap gap-1.5">
          <div className="w-14 h-5 bg-white/5 rounded" />
          <div className="w-16 h-5 bg-white/5 rounded" />
          <div className="w-12 h-5 bg-white/5 rounded" />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-full h-9 bg-white/10 rounded-xl" />
        <div className="w-full h-9 bg-white/5 rounded-xl" />
      </div>
    </div>
  );
}

export function MatchmakerGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <MatchmakerCardSkeleton key={idx} />
      ))}
    </div>
  );
}
