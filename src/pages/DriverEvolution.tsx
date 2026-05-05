import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/LoadingSpinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState, useMemo } from 'react';

const DriverEvolutionPage = () => {
  const { id } = useParams<{ id: string }>();
  const [circuitFilter, setCircuitFilter] = useState<string>('all');

  const { data: circuits } = useQuery({
    queryKey: ['circuits'],
    queryFn: () => api.getCircuits(),
  });

  const { data: evolution, isLoading, error } = useQuery({
    queryKey: ['driver-evolution', id, circuitFilter],
    queryFn: () => api.getDriverEvolution(
      parseInt(id!),
      circuitFilter === 'all' ? undefined : parseInt(circuitFilter)
    ),
    enabled: !!id,
  });

  const selectedCircuit = circuits?.find(c => c.id.toString() === circuitFilter);

  // Convert lap times to seconds for charting
  const timeToSeconds = (time: string | null): number | null => {
    if (!time) return null;
    const parts = time.split(':');
    const mins = parseInt(parts[0]);
    const secs = parseFloat(parts[1]);
    return mins * 60 + secs;
  };

  const chartData = useMemo(() => {
    if (!evolution) return [];
    return evolution.evolution
      .filter(item => item.fastest_lap && item.average_lap)
      .map(item => ({
        date: item.date,
        fastest_lap: timeToSeconds(item.fastest_lap),
        average_lap: timeToSeconds(item.average_lap),
        fastest_lap_display: item.fastest_lap,
        average_lap_display: item.average_lap,
      }));
  }, [evolution]);

  // Calculate dynamic Y-axis domain
  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 60];
    
    const allValues = chartData
      .flatMap(d => [d.fastest_lap, d.average_lap])
      .filter((v): v is number => v !== null);
    if (allValues.length === 0) return [0, 60];
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    
    // Add 2 seconds padding on each side
    return [Math.max(0, minValue - 2), maxValue + 2];
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            const isFastestLap = entry.dataKey === 'fastest_lap';
            return (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {isFastestLap ? 'Fastest Lap' : 'Average Lap'}:{' '}
                {entry.payload[isFastestLap ? 'fastest_lap_display' : 'average_lap_display']}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !evolution) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Evolution data not found</p>
        <Link to="/drivers">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Drivers
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={`/drivers/${id}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="page-title">{evolution.driver_name.toUpperCase()}</h1>
            <p className="text-muted-foreground">
              Performance Evolution
              {selectedCircuit && ` at ${selectedCircuit.name}`}
            </p>
          </div>
        </div>

        <Select value={circuitFilter} onValueChange={setCircuitFilter}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Filter by circuit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Circuits</SelectItem>
            {circuits?.map((circuit) => (
              <SelectItem key={circuit.id} value={circuit.id.toString()}>
                {circuit.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="font-display text-xl tracking-wider mb-6">LAP TIME PROGRESSION</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  domain={yAxisDomain}
                  tickFormatter={(value) => {
                    const mins = Math.floor(value / 60);
                    const secs = (value % 60).toFixed(1);
                    return `${mins}:${secs.padStart(4, '0')}`;
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="fastest_lap"
                  name="Fastest Lap"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
                <Line
                  type="monotone"
                  dataKey="average_lap"
                  name="Average Lap"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--accent))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground">No evolution data available</p>
        </div>
      )}

      {/* Data Table */}
      {evolution.evolution.length > 0 && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="racing-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Circuit</th>
                <th>Fastest Lap</th>
                <th>Average Lap</th>
              </tr>
            </thead>
            <tbody>
              {evolution.evolution.map((item, index) => {
                const circuit = circuits?.find(c => c.id === item.circuit_id);
                return (
                  <tr key={index}>
                    <td>{item.date}</td>
                    <td>{circuit?.name || 'Unknown Circuit'}</td>
                    <td className="lap-time text-primary">{item.fastest_lap}</td>
                    <td className="lap-time">{item.average_lap}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverEvolutionPage;
