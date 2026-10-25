import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import SegmentedControl from './SegmentedControl';

interface CircuitFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// "all" or a circuit id as string
const CircuitFilter = ({ value, onChange, className }: CircuitFilterProps) => {
  const { data: circuits } = useQuery({
    queryKey: ['circuits'],
    queryFn: () => api.getCircuits(),
  });

  return (
    <SegmentedControl
      className={className}
      label="Filter by circuit"
      value={value}
      onChange={onChange}
      options={[
        { value: 'all', label: 'All circuits' },
        ...(circuits ?? []).map(c => ({ value: c.id.toString(), label: c.name })),
      ]}
    />
  );
};

export default CircuitFilter;
