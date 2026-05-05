import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { GitCompare, X, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

const ComparePage = () => {
  const [searchParams] = useSearchParams();
  const initialIds = searchParams.get('ids')?.split(',').map(Number).filter(Boolean) || [];
  const [selectedIds, setSelectedIds] = useState<number[]>(initialIds);
  const [circuitFilter, setCircuitFilter] = useState<string>('all');

  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => api.getDrivers(),
  });

  const { data: circuits } = useQuery({
    queryKey: ['circuits'],
    queryFn: () => api.getCircuits(),
  });

  const { data: comparison, isLoading } = useQuery({
    queryKey: ['compare', selectedIds, circuitFilter],
    queryFn: () => api.compareDrivers(
      selectedIds,
      circuitFilter === 'all' ? undefined : parseInt(circuitFilter)
    ),
    enabled: selectedIds.length >= 2,
  });

  const selectedCircuit = circuits?.find(c => c.id.toString() === circuitFilter);

  const addDriver = (id: string) => {
    if (selectedIds.length < 4 && !selectedIds.includes(parseInt(id))) {
      setSelectedIds([...selectedIds, parseInt(id)]);
    }
  };

  const removeDriver = (id: number) => {
    setSelectedIds(selectedIds.filter(i => i !== id));
  };

  const timeToSeconds = (time: string | null): number | null => {
    if (!time) return null;
    const parts = time.split(':');
    const mins = parseInt(parts[0]);
    const secs = parseFloat(parts[1]);
    return mins * 60 + secs;
  };

  const chartData = comparison?.drivers
    .filter(driver => driver.best_lap && driver.average_lap)
    .map(driver => ({
      name: driver.name,
      best_lap: timeToSeconds(driver.best_lap),
      average_lap: timeToSeconds(driver.average_lap),
      best_lap_display: driver.best_lap,
      average_lap_display: driver.average_lap,
    })) || [];

  // Calculate dynamic Y-axis domain for charts
  const allBestLaps = chartData.map(d => d.best_lap).filter((v): v is number => v !== null);
  const allAvgLaps = chartData.map(d => d.average_lap).filter((v): v is number => v !== null);
  
  const bestLapDomain = allBestLaps.length > 0 
    ? [Math.min(...allBestLaps) - 2, Math.max(...allBestLaps) + 2] as [number, number]
    : undefined;
  
  const avgLapDomain = allAvgLaps.length > 0
    ? [Math.min(...allAvgLaps) - 2, Math.max(...allAvgLaps) + 2] as [number, number]
    : undefined;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <p className="text-sm text-primary">Best Lap: {data.best_lap_display}</p>
          <p className="text-sm text-accent">Average Lap: {data.average_lap_display}</p>
        </div>
      );
    }
    return null;
  };

  const availableDrivers = drivers?.filter(d => !selectedIds.includes(d.id)) || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="page-header flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg racing-gradient flex items-center justify-center">
            <GitCompare className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="page-title">COMPARE DRIVERS</h1>
            <p className="page-subtitle">
              {selectedCircuit 
                ? `Comparing at ${selectedCircuit.name}`
                : 'Select 2-4 drivers to compare their performance'
              }
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

      {/* Warning for cross-circuit comparison */}
      {circuitFilter === 'all' && selectedIds.length >= 2 && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-600">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            <strong>Warning:</strong> Comparing across all circuits. Lap times may not be directly comparable as track lengths and conditions vary.
          </p>
        </div>
      )}

      {/* Driver Selection */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="font-display text-lg tracking-wider mb-4">SELECT DRIVERS</h3>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedIds.map(id => {
            const driver = drivers?.find(d => d.id === id);
            return (
              <div
                key={id}
                className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg"
              >
                <span className="font-medium">{driver?.name || 'Unknown Driver'}</span>
                <button
                  onClick={() => removeDriver(id)}
                  className="p-1 hover:bg-primary/20 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {selectedIds.length < 4 && availableDrivers.length > 0 && (
          <Select onValueChange={addDriver}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Add a driver to compare" />
            </SelectTrigger>
            <SelectContent>
              {availableDrivers.map(driver => (
                <SelectItem key={driver.id} value={driver.id.toString()}>
                  {driver.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedIds.length < 2 && (
          <p className="text-muted-foreground text-sm mt-4">
            Select at least 2 drivers to compare
          </p>
        )}
      </div>

      {/* Comparison Results */}
      {isLoading && selectedIds.length >= 2 ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : comparison && comparison.drivers.length > 0 ? (
        <>
          {/* Stats Table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
            <table className="racing-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Total Races</th>
                  <th>Total Laps</th>
                  <th>Best Lap</th>
                  <th>Average Lap</th>
                </tr>
              </thead>
              <tbody>
                {comparison.drivers.map(driver => (
                  <tr key={driver.id}>
                    <td>
                      <Link
                        to={`/drivers/${driver.id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {driver.name}
                      </Link>
                    </td>
                    <td>{driver.total_races}</td>
                    <td>{driver.total_laps}</td>
                    <td className="lap-time text-primary">{driver.best_lap || 'N/A'}</td>
                    <td className="lap-time">{driver.average_lap || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="font-display text-lg tracking-wider mb-6">FASTEST LAP COMPARISON</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      domain={bestLapDomain}
                      tickFormatter={(value) => {
                        const mins = Math.floor(value / 60);
                        const secs = (value % 60).toFixed(1);
                        return `${mins}:${secs.padStart(4, '0')}`;
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="best_lap" name="Best Lap" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="font-display text-lg tracking-wider mb-6">AVERAGE LAP COMPARISON</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      domain={avgLapDomain}
                      tickFormatter={(value) => {
                        const mins = Math.floor(value / 60);
                        const secs = (value % 60).toFixed(1);
                        return `${mins}:${secs.padStart(4, '0')}`;
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="average_lap" name="Average Lap" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default ComparePage;
