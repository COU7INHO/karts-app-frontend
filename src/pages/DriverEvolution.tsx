import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DriverEvolutionPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: evolution, isLoading, error } = useQuery({
    queryKey: ['driver-evolution', id],
    queryFn: () => api.getDriverEvolution(parseInt(id!)),
    enabled: !!id,
  });

  const { data: circuits } = useQuery({
    queryKey: ['circuits'],
    queryFn: () => api.getCircuits(),
  });

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

  // Convert lap times to seconds for charting
  const chartData = evolution.evolution.map(item => {
    const timeToSeconds = (time: string) => {
      const parts = time.split(':');
      const mins = parseInt(parts[0]);
      const secs = parseFloat(parts[1]);
      return mins * 60 + secs;
    };

    return {
      date: item.date,
      fastest_lap: timeToSeconds(item.fastest_lap),
      average_lap: timeToSeconds(item.average_lap),
      fastest_lap_display: item.fastest_lap,
      average_lap_display: item.average_lap,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name === 'fastest_lap' ? 'Fastest Lap' : 'Average Lap'}:{' '}
              {entry.payload[entry.name === 'fastest_lap' ? 'fastest_lap_display' : 'average_lap_display']}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to={`/drivers/${id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="page-title">{evolution.driver_name.toUpperCase()}</h1>
          <p className="text-muted-foreground">Performance Evolution</p>
        </div>
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
                    <td>{circuit?.name || `Circuit #${item.circuit_id}`}</td>
                    <td className="lap-time text-primary">{item.fastest_lap}</td>
                    <td className="lap-time">{item.average_lap}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DriverEvolutionPage;
