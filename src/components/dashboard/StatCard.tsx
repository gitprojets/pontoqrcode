import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
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
  default: 'bg-card',
  primary: 'bg-primary/5 border-primary/20',
  secondary: 'bg-secondary/5 border-secondary/20',
  success: 'bg-success/5 border-success/20',
  warning: 'bg-warning/5 border-warning/20',
};

const iconStyles = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default', delay = 0 }: StatCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay: delay * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ 
        y: -2, 
        boxShadow: '0 8px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
        transition: { duration: 0.2 }
      }}
      className={cn(
        'stat-card p-4 sm:p-6 cursor-default',
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay * 0.1 + 0.2 }}
            className="mt-1 sm:mt-2 text-xl sm:text-3xl font-bold font-display text-foreground"
          >
            {value}
          </motion.p>
          {subtitle && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay * 0.1 + 0.3 }}
              className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground truncate"
            >
              {subtitle}
            </motion.p>
          )}
          {trend && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay * 0.1 + 0.4 }}
              className={cn(
                'mt-1 sm:mt-2 text-xs sm:text-sm font-medium inline-flex items-center gap-1',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay * 0.1 + 0.5, type: 'spring' }}
              >
                {trend.isPositive ? '↑' : '↓'}
              </motion.span>
              {Math.abs(trend.value)}%
            </motion.p>
          )}
        </div>
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            delay: delay * 0.1 + 0.1, 
            type: 'spring', 
            stiffness: 200 
          }}
          className={cn(
            'p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0',
            iconStyles[variant]
          )}
        >
          <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
        </motion.div>
      </div>
    </motion.div>
  );
}
