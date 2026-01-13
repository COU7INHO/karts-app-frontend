import { cn } from '@/lib/utils';

interface PositionBadgeProps {
  position: number;
}

const PositionBadge = ({ position }: PositionBadgeProps) => {
  return (
    <span
      className={cn(
        'position-badge',
        position === 1 && 'position-1',
        position === 2 && 'position-2',
        position === 3 && 'position-3',
        position > 3 && 'bg-secondary text-secondary-foreground'
      )}
    >
      {position}
    </span>
  );
};

export default PositionBadge;
