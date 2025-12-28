import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
}

// Base skeleton with shimmer effect
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-muted/60',
        'before:absolute before:inset-0',
        'before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
        'before:animate-shimmer',
        className
      )}
    />
  );
}

// Modern Stat Card Skeleton with gradient
export function StatCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-5 sm:p-6"
    >
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-muted/40 to-transparent" />
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex-shrink-0" />
      </div>
    </motion.div>
  );
}

// Dashboard Stats Grid Skeleton
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      {[0, 1, 2, 3].map((i) => (
        <StatCardSkeleton key={i} delay={i * 0.1} />
      ))}
    </div>
  );
}

// Chart Skeleton with gradient background
export function ChartSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      
      {/* Chart area */}
      <div className="relative h-64 flex items-end gap-2 px-4">
        {[0.4, 0.6, 0.8, 0.5, 0.7, 0.9, 0.6, 0.75, 0.55, 0.85, 0.65, 0.7].map((height, i) => (
          <motion.div
            key={i}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="flex-1 bg-gradient-to-t from-primary/30 to-primary/10 rounded-t-lg origin-bottom"
            style={{ height: `${height * 100}%` }}
          />
        ))}
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between mt-4 px-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>
    </motion.div>
  );
}

// Table Skeleton with rows
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl overflow-hidden"
    >
      {/* Header */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b border-border/50 bg-muted/30">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-full max-w-[100px]" />
        ))}
      </div>
      
      {/* Rows */}
      {[...Array(rows)].map((_, rowIndex) => (
        <motion.div
          key={rowIndex}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: rowIndex * 0.05 }}
          className="grid grid-cols-4 gap-4 p-4 border-b border-border/30 last:border-0"
        >
          {[...Array(4)].map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              className={cn(
                "h-4",
                colIndex === 0 ? "w-32" : "w-20"
              )} 
            />
          ))}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Calendar Skeleton
export function CalendarSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
      
      {/* Days header */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-8 mx-auto" />
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {[...Array(35)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, delay: i * 0.01 }}
          >
            <Skeleton className="h-10 w-10 rounded-lg mx-auto" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Profile Card Skeleton
export function ProfileSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl"
    >
      <Skeleton className="h-14 w-14 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-8 w-20 rounded-lg" />
    </motion.div>
  );
}

// List Item Skeleton
export function ListItemSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-4 rounded-xl border border-border/30 bg-card/50"
    >
      <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </motion.div>
  );
}

// History List Skeleton
export function HistoryListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(items)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.08 }}
        >
          <ListItemSkeleton />
        </motion.div>
      ))}
    </div>
  );
}

// Page Header Skeleton
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}

// Full Dashboard Skeleton
export function FullDashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeaderSkeleton />
      <DashboardStatsSkeleton />
      <ChartSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CalendarSkeleton />
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <HistoryListSkeleton items={4} />
        </div>
      </div>
    </div>
  );
}
