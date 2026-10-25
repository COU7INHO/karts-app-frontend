import { cn } from '@/lib/utils';

interface PositionBadgeProps {
  position: number;
  className?: string;
}

const PositionBadge = ({ position, className }: PositionBadgeProps) => {
  return (
    <span
      className={cn(
        'pos-tag',
        position === 1 && 'pos-1',
        position === 2 && 'pos-2',
        position === 3 && 'pos-3',
        className
      )}
      aria-label={`Position ${position}`}
    >
      {position}
    </span>
  );
};

export default PositionBadge;
