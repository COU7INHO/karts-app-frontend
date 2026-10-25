import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Three slanted bars pulsing like the rev lights on a steering wheel
const LoadingSpinner = ({ className, size = 'md' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-3 w-1.5',
    md: 'h-5 w-2',
    lg: 'h-8 w-3',
  };

  return (
    <div className={cn('flex items-center gap-1', className)} role="status" aria-label="Loading">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className={cn('-skew-x-12 bg-primary animate-pulse', sizeClasses[size])}
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
};

export default LoadingSpinner;
