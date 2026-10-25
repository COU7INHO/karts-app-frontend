import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import PositionBadge from '@/components/PositionBadge';

export interface TowerRowProps {
  position: number;
  name: string;
  href?: string;
  /** Main value, right aligned (lap time, points…) */
  value: React.ReactNode;
  /** Muted value shown before the main one (gap to leader…) */
  gap?: React.ReactNode;
  /** Small line under the driver name */
  meta?: React.ReactNode;
  valueClassName?: string;
  /** Stagger index for the entrance animation; omit for no animation */
  animateIndex?: number;
  onClick?: () => void;
  trailing?: React.ReactNode;
  compact?: boolean;
}

export const TowerRow = ({
  position,
  name,
  href,
  value,
  gap,
  meta,
  valueClassName,
  animateIndex,
  onClick,
  trailing,
  compact,
}: TowerRowProps) => {
  const nameNode = href ? (
    <Link
      to={href}
      onClick={e => e.stopPropagation()}
      className="hover:text-primary transition-colors"
    >
      {name}
    </Link>
  ) : (
    name
  );

  return (
    <div
      onClick={onClick}
      onKeyDown={onClick ? e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onClick()) : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'relative flex items-center gap-3 px-3 md:px-4 border-b border-border/60 last:border-b-0',
        compact ? 'h-12' : 'h-14',
        position === 1 && 'bg-primary/[0.06]',
        onClick && 'cursor-pointer hover:bg-secondary/60 transition-colors',
        animateIndex !== undefined && 'animate-tower-in'
      )}
      style={animateIndex !== undefined ? { animationDelay: `${animateIndex * 45}ms` } : undefined}
    >
      {position === 1 && <span className="absolute left-0 inset-y-0 w-1 bg-primary" aria-hidden />}
      <PositionBadge position={position} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold truncate leading-tight">{nameNode}</p>
        {meta && <div className="text-xs text-muted-foreground truncate mt-0.5">{meta}</div>}
      </div>
      {gap !== undefined && (
        <span className="lap-time text-sm text-muted-foreground text-right w-16 md:w-20 shrink-0">{gap}</span>
      )}
      <span className={cn('lap-time text-base md:text-lg text-right shrink-0 min-w-[4.5rem]', valueClassName)}>
        {value}
      </span>
      {trailing}
    </div>
  );
};

interface TimingTowerProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
}

const TimingTower = ({ children, header, className }: TimingTowerProps) => (
  <div className={cn('panel overflow-hidden', className)}>
    {header}
    <div>{children}</div>
  </div>
);

export default TimingTower;
