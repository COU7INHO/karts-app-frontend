import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  back?: { to: string; label: string };
  actions?: React.ReactNode;
  leading?: React.ReactNode;
  className?: string;
}

const PageHeader = ({ title, subtitle, back, actions, leading, className }: PageHeaderProps) => (
  <header className={cn('space-y-4', className)}>
    {back && (
      <Link
        to={back.to}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {back.label}
      </Link>
    )}
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex items-center gap-4 min-w-0">
        {leading}
        <div className="min-w-0">
          <h1 className="page-title">{title}</h1>
          {subtitle && <div className="page-subtitle">{subtitle}</div>}
        </div>
      </div>
      {actions && <div className="flex flex-col sm:flex-row gap-2 shrink-0">{actions}</div>}
    </div>
    <div className="h-1 w-16 bg-primary -skew-x-12" aria-hidden />
  </header>
);

export default PageHeader;
