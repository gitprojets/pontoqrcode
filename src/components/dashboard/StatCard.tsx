import { cn } from '@/lib/utils';
import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning';
  delay?: number;
}

const variantStyles = {
  default: {
    card: 'bg-card/90',
    icon: 'bg-muted/80 text-muted-foreground',
    accent: 'from-border/50',
  },
  primary: {
    card: 'bg-gradient-to-br from-primary/10 via-card to-card',
    icon: 'bg-primary/15 text-primary',
    accent: 'from-primary/40',
  },
  secondary: {
    card: 'bg-gradient-to-br from-secondary/10 via-card to-card',
    icon: 'bg-secondary/15 text-secondary',
    accent: 'from-secondary/40',
  },
  success: {
    card: 'bg-gradient-to-br from-success/10 via-card to-card',
    icon: 'bg-success/15 text-success',
    accent: 'from-success/40',
  },
  warning: {
    card: 'bg-gradient-to-br from-warning/10 via-card to-card',
    icon: 'bg-warning/15 text-warning',
    accent: 'from-warning/40',
  },
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default', delay = 0 }: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: delay * 0.1, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/50 backdrop-blur-xl p-5 sm:p-6 transition-all duration-300',
        'hover:border-border/80 hover:shadow-lg',
        styles.card
      )}
    >
      <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r to-transparent', styles.accent)} />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums tracking-tight">{value}</p>
          {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">{subtitle}</p>}
          {trend && (
            <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', trend.isPositive ? 'text-success' : 'text-destructive')}>
              {trend.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay * 0.1 + 0.2, type: "spring", stiffness: 200 }}
          className={cn('flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center', styles.icon)}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </motion.div>
      </div>
    </motion.div>
  );
}
