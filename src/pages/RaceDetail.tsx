import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import PositionBadge from '@/components/PositionBadge';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DRIVER_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(142, 76%, 36%)',
  'hsl(48, 96%, 53%)',
  'hsl(262, 83%, 58%)',
  'hsl(199, 89%, 48%)',
  'hsl(315, 70%, 50%)',
  'hsl(25, 95%, 53%)',
];

const RaceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);

  const { data: race, isLoading, error } = useQuery({
    queryKey: ['race', id],
    queryFn: () => api.getRace(parseInt(id!)),
    enabled: !!id,
  });

  const { data: circuits } = useQuery({
    queryKey: ['circuits'],
    queryFn: () => api.getCircuits(),
  });

  // Convert lap time string to seconds
  const timeToSeconds = (time: string | null): number | null => {
    if (!time) return null;
    const parts = time.split(':');
    const mins = parseInt(parts[0]);
    const secs = parseFloat(parts[1]);
    return mins * 60 + secs;
  };

  // Sort results by total time (fastest first)
  const sortedResults = useMemo(() => {
    if (!race) return [];
    return [...race.results].sort((a, b) => {
      const timeA = timeToSeconds(a.total_time) ?? Infinity;
      const timeB = timeToSeconds(b.total_time) ?? Infinity;
      return timeA - timeB;
    });
  }, [race]);

  // Build lap-by-lap comparison data
  const lapComparisonData = useMemo(() => {
    if (!race) return { laps: [], fastestOverall: { driverName: '', lapNumber: 0, time: Infinity } };
    
    const maxLaps = Math.max(...race.results.map(r => r.laps.length));
    const laps: { lapNumber: number; times: { driverName: string; time: string; seconds: number }[] }[] = [];
    
    let fastestOverall = { driverName: '', lapNumber: 0, time: Infinity };
    
    for (let i = 1; i <= maxLaps; i++) {
      const lapData: { driverName: string; time: string; seconds: number }[] = [];
      
      race.results.forEach(result => {
        const lap = result.laps.find(l => l.lap_number === i);
        if (lap) {
          const seconds = timeToSeconds(lap.lap_time);
          lapData.push({
            driverName: result.driver_name,
            time: lap.lap_time,
            seconds,
          });
          
          if (seconds < fastestOverall.time) {
            fastestOverall = { driverName: result.driver_name, lapNumber: i, time: seconds };
          }
        }
      });
      
      laps.push({ lapNumber: i, times: lapData });
    }
    
    return { laps, fastestOverall };
  }, [race]);

  // Build chart data for lap progression
  const chartData = useMemo(() => {
    if (!race) return [];
    
    const maxLaps = Math.max(...race.results.map(r => r.laps.length));
    const data: any[] = [];
    
    for (let i = 1; i <= maxLaps; i++) {
      const point: any = { lap: i };
      
      race.results.forEach(result => {
        const lap = result.laps.find(l => l.lap_number === i);
        if (lap) {
          point[result.driver_name] = timeToSeconds(lap.lap_time);
          point[`${result.driver_name}_display`] = lap.lap_time;
        }
      });
      
      data.push(point);
    }
    
    return data;
  }, [race]);

  // Calculate dynamic Y-axis domain for chart
  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0 || !race) return [0, 60];
    
    const allValues: number[] = [];
    chartData.forEach(point => {
      race.results.forEach(result => {
        if (point[result.driver_name]) {
          allValues.push(point[result.driver_name]);
        }
      });
    });
    
    if (allValues.length === 0) return [0, 60];
    
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    
    return [Math.max(0, minValue - 2), maxValue + 2];
  }, [chartData, race]);

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">Lap {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.payload[`${entry.name}_display`]}
            </p>
          ))}
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

  if (error || !race) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Race not found</p>
        <Link to="/races">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Races
          </Button>
        </Link>
      </div>
    );
  }

  const circuit = circuits?.find(c => c.id === race.circuit);
  const driverNames = race.results.map(r => r.driver_name);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/races">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="page-title">{circuit?.name?.toUpperCase() || 'RACE'}</h1>
          <div className="flex items-center gap-4 mt-2 text-muted-foreground">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {race.date}
            </span>
            {circuit && (
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {circuit.city}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <h3 className="font-display text-xl tracking-wider p-4 border-b border-border">RACE RESULTS</h3>
        <table className="racing-table">
          <thead>
            <tr>
              <th className="w-16">Pos</th>
              <th>Driver</th>
              <th>Total Time</th>
              <th>Fastest Lap</th>
              <th>Average Lap</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((result, index) => {
              const isExpanded = expandedDriver === result.driver_name;
              return (
                <>
                  <tr
                    key={result.driver_name}
                    className="cursor-pointer"
                    onClick={() => setExpandedDriver(isExpanded ? null : result.driver_name)}
                  >
                    <td>
                      <PositionBadge position={index + 1} />
                    </td>
                    <td className="font-medium">{result.driver_name}</td>
                    <td className="lap-time">{result.total_time}</td>
                    <td className="lap-time text-primary">{result.fastest_lap}</td>
                    <td className="lap-time">{result.average_lap}</td>
                    <td>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${result.driver_name}-laps`}>
                      <td colSpan={6} className="bg-secondary/30 p-0">
                        <div className="p-4">
                          <p className="text-sm font-medium mb-3">Lap-by-Lap Times</p>
                          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                            {result.laps.map((lap) => (
                              <div
                                key={lap.lap_number}
                                className={cn(
                                  'bg-card rounded p-2 text-center',
                                  lap.lap_time === result.fastest_lap && 'border border-primary'
                                )}
                              >
                                <p className="text-xs text-muted-foreground">Lap {lap.lap_number}</p>
                                <p className={cn(
                                  'lap-time text-sm',
                                  lap.lap_time === result.fastest_lap && 'text-primary font-bold'
                                )}>
                                  {lap.lap_time}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Lap Time Progression Chart */}
      {chartData.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="font-display text-xl tracking-wider mb-6">LAP TIME PROGRESSION</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="lap"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `Lap ${value}`}
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
                <Tooltip content={<CustomChartTooltip />} />
                <Legend />
                {driverNames.map((driverName, index) => (
                  <Line
                    key={driverName}
                    type="monotone"
                    dataKey={driverName}
                    name={driverName}
                    stroke={DRIVER_COLORS[index % DRIVER_COLORS.length]}
                    strokeWidth={2}
                    dot={{ fill: DRIVER_COLORS[index % DRIVER_COLORS.length], r: 4 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Lap-by-Lap Comparison Table */}
      {lapComparisonData.laps.length > 0 && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <h3 className="font-display text-xl tracking-wider p-4 border-b border-border">LAP-BY-LAP COMPARISON</h3>
          <div className="overflow-x-auto">
            <table className="racing-table">
              <thead>
                <tr>
                  <th className="w-24 whitespace-nowrap">Lap</th>
                  {driverNames.map(name => (
                    <th key={name}>{name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lapComparisonData.laps.map(lap => {
                  // Find fastest time for this lap
                  const fastestInLap = lap.times.reduce(
                    (min, t) => (t.seconds < min.seconds ? t : min),
                    { driverName: '', time: '', seconds: Infinity }
                  );
                  
                  return (
                    <tr key={lap.lapNumber}>
                      <td className="font-medium">Lap {lap.lapNumber}</td>
                      {driverNames.map(driverName => {
                        const lapTime = lap.times.find(t => t.driverName === driverName);
                        const isFastestInLap = lapTime && lapTime.driverName === fastestInLap.driverName;
                        const isFastestOverall = 
                          lapComparisonData.fastestOverall.driverName === driverName &&
                          lapComparisonData.fastestOverall.lapNumber === lap.lapNumber;
                        
                        return (
                          <td 
                            key={driverName}
                            className={cn(
                              'lap-time',
                              isFastestOverall && 'bg-amber-400/30 text-amber-600 font-bold',
                              isFastestInLap && !isFastestOverall && 'bg-green-500/20 text-green-600 font-medium'
                            )}
                          >
                            {lapTime ? lapTime.time : '-'}
                            {isFastestOverall && ' 🏆'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-border text-sm text-muted-foreground">
            <span className="inline-block w-4 h-4 bg-green-500/20 rounded mr-2"></span>
            Fastest in lap
            <span className="inline-block w-4 h-4 bg-amber-400/30 rounded ml-6 mr-2"></span>
            Fastest overall (race record) 🏆
          </div>
        </div>
      )}
    </div>
  );
};

export default RaceDetailPage;
