import { cn } from '@/lib/utils';

interface DriverPlateProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'w-7 h-7 text-sm',
  md: 'w-10 h-10 text-xl',
  lg: 'w-14 h-14 text-3xl',
  xl: 'w-20 h-20 md:w-24 md:h-24 text-5xl md:text-6xl',
};

// A kart nose-plate with the driver's initial
const DriverPlate = ({ name, size = 'md', className }: DriverPlateProps) => (
  <span className={cn('plate', sizes[size], className)} aria-hidden>
    {name.charAt(0).toUpperCase()}
  </span>
);

export default DriverPlate;
