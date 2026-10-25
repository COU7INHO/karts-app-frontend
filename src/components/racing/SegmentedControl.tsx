import { cn } from '@/lib/utils';

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
  className?: string;
}

// Horizontally scrollable pill group; scrolls instead of wrapping on phones
const SegmentedControl = <T extends string>({ value, onChange, options, label, className }: SegmentedControlProps<T>) => (
  <div
    role="radiogroup"
    aria-label={label}
    className={cn('flex gap-1 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0', className)}
  >
    {options.map(option => {
      const active = option.value === value;
      return (
        <button
          key={option.value}
          role="radio"
          aria-checked={active}
          onClick={() => onChange(option.value)}
          className={cn(
            'shrink-0 h-9 px-4 rounded-sm text-sm font-medium border transition-colors whitespace-nowrap',
            active
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card border-border text-muted-foreground hover:text-foreground'
          )}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

export default SegmentedControl;
