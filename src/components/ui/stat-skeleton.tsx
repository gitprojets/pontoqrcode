import { cn } from "@/lib/utils";

interface StatSkeletonProps {
  className?: string;
}

export function StatSkeleton({ className }: StatSkeletonProps) {
  return (
    <div className={cn("bg-card border border-border rounded-xl p-4 animate-pulse", className)}>
      {/* Icon skeleton */}
      <div className="w-5 h-5 bg-muted rounded mx-auto mb-2" />
      
      {/* Number skeleton */}
      <div className="h-8 w-16 bg-muted rounded mx-auto mb-2" />
      
      {/* Label skeleton */}
      <div className="h-3 w-20 bg-muted/60 rounded mx-auto" />
    </div>
  );
}

export function StatSkeletonRow() {
  return (
    <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-8">
      <StatSkeleton />
      <StatSkeleton />
      <StatSkeleton />
    </div>
  );
}

export function LoginStatSkeleton() {
  return (
    <div className="bg-white/10 rounded-xl p-3 xl:p-4 animate-pulse">
      <div className="h-6 xl:h-8 w-12 bg-white/20 rounded mb-1" />
      <div className="h-3 xl:h-4 w-16 bg-white/10 rounded" />
    </div>
  );
}

export function LoginStatSkeletonRow() {
  return (
    <div className="grid grid-cols-3 gap-3 xl:gap-4">
      <LoginStatSkeleton />
      <LoginStatSkeleton />
      <LoginStatSkeleton />
    </div>
  );
}