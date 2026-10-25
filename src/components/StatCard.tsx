import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  highlight?: boolean;
}

const StatCard = ({ title, value, icon: Icon, subtitle, highlight }: StatCardProps) => {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Icon className="w-4 h-4" />
        <span>{title}</span>
      </div>
      <p className={cn('display lap-time text-4xl md:text-5xl mt-3', highlight && 't-purple')}>
        {value}
      </p>
      {subtitle && <p className="text-muted-foreground text-sm mt-2">{subtitle}</p>}
    </div>
  );
};

export default StatCard;
