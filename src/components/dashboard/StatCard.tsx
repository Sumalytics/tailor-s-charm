import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info';
}

const variants = {
  default: 'bg-card',
  primary: 'bg-primary/5 border-primary/20',
  success: 'bg-success/5 border-success/20',
  warning: 'bg-warning/5 border-warning/20',
  info: 'bg-info/5 border-info/20',
};

const iconVariants = {
  default: 'bg-secondary text-secondary-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
};

export function StatCard({ title, value, description, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <div className={cn(
      'rounded-xl border p-4 sm:p-6 shadow-soft transition-all duration-200 hover:shadow-md animate-fade-in',
      variants[variant]
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1 min-w-0 overflow-hidden">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground break-words">{title}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight break-words">{value}</p>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground break-words">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 text-xs sm:text-sm">
              <span className={cn(
                'font-medium',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn('rounded-lg p-2 sm:p-3 flex-shrink-0', iconVariants[variant])}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </div>
  );
}
