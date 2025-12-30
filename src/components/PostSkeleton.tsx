"use client";

export default function PostSkeleton() {
  return (
    <div className="rounded-[2.5rem] bg-secondary p-8 shadow-xl border border-white/5 animate-pulse">
      <div className="flex items-start gap-5">
        {/* Profile Pic Skeleton */}
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white/5 border-2 border-white/5" />
        
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            {/* Name/Username Skeleton */}
            <div className="flex items-center gap-3">
              <div className="h-6 w-32 bg-white/10 rounded-lg" />
              <div className="h-3 w-20 bg-white/5 rounded-lg" />
            </div>
          </div>
          
          {/* Content Lines Skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-white/10 rounded-lg" />
            <div className="h-4 w-3/4 bg-white/10 rounded-lg" />
          </div>

          {/* Image Placeholder Skeleton (optional, shown if we want to mimic an image post) */}
          <div className="mt-6 h-64 w-full bg-white/5 rounded-3xl border border-white/5" />
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="mt-8 flex items-center gap-8 border-t border-white/5 pt-8">
        <div className="h-8 w-16 bg-white/5 rounded-xl" />
        <div className="h-8 w-24 bg-white/5 rounded-xl" />
      </div>
    </div>
  );
}