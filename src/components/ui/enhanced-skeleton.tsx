import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
}

// Base shimmer skeleton with gradient animation
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div 
      className={cn(
        "animate-pulse rounded-md bg-muted relative overflow-hidden",
        className
      )}
    >
      <div 
        className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)'
        }}
      />
    </div>
  );
}

// Stat Card Skeleton with precise layout
export function StatCardSkeleton({ className }: SkeletonProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("stat-card p-4 sm:p-6", className)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Title */}
          <Skeleton className="h-3 w-20 sm:w-24" />
          {/* Value */}
          <Skeleton className="h-7 sm:h-9 w-16 sm:w-20" />
          {/* Subtitle */}
          <Skeleton className="h-2.5 w-24 sm:w-28" />
        </div>
        {/* Icon */}
        <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex-shrink-0" />
      </div>
    </motion.div>
  );
}

// Chart Skeleton with realistic bars
export function ChartSkeleton({ className }: SkeletonProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("card-elevated p-6", className)}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="w-5 h-5 rounded" />
        <Skeleton className="h-5 w-40" />
      </div>
      
      {/* Chart area */}
      <div className="h-[300px] flex items-end justify-between gap-2 px-4">
        {[65, 45, 80, 55, 70, 40, 85, 60, 75, 50, 90, 45, 70, 55].map((height, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${height}%` }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }}
            className="flex-1"
          >
            <Skeleton className="w-full h-full rounded-t" />
          </motion.div>
        ))}
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between mt-4 px-4">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>
    </motion.div>
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5, cols = 4, className }: SkeletonProps & { rows?: number; cols?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("card-elevated overflow-hidden", className)}
    >
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-border">
        {[...Array(cols)].map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {[...Array(rows)].map((_, rowIndex) => (
        <motion.div 
          key={rowIndex}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: rowIndex * 0.05 }}
          className="flex gap-4 p-4 border-b border-border last:border-0"
        >
          {[...Array(cols)].map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              className={cn("h-4 flex-1", colIndex === 0 && "w-1/3")} 
            />
          ))}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Calendar Skeleton
export function CalendarSkeleton({ className }: SkeletonProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("card-elevated p-4", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
      
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-6 rounded" />
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {[...Array(35)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.01 }}
          >
            <Skeleton className="h-10 rounded" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Profile Card Skeleton
export function ProfileSkeleton({ className }: SkeletonProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-center gap-3", className)}
    >
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </motion.div>
  );
}

// Dashboard Stats Row Skeleton
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <StatCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}

// History List Skeleton
export function HistoryListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card-elevated p-4 space-y-3"
    >
      <Skeleton className="h-5 w-32 mb-4" />
      {[...Array(items)].map((_, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className="flex items-center justify-between py-2"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </motion.div>
      ))}
    </motion.div>
  );
}
