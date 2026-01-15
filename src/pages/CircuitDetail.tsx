import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Flag, Gauge, Zap, Calendar, ChevronRight, Sun, Building, ChevronDown, TrendingDown } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CircuitDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [evolutionOpen, setEvolutionOpen] = useState(false);

  const { data: circuit, isLoading, error } = useQuery({
    queryKey: ['circuit', id],
    queryFn: () => api.getCircuit(parseInt(id!)),
    enabled: !!id,
  });

  const { data: races } = useQuery({
    queryKey: ['races', 'circuit', id],
    queryFn: () => api.getRaces(parseInt(id!)),
    enabled: !!id,
  });

  const { data: evolution } = useQuery({
    queryKey: ['circuit-evolution', id],
    queryFn: () => api.getCircuitEvolution(parseInt(id!)),
    enabled: !!id && evolutionOpen,
  });

  // Time conversion helpers
  const timeToSeconds = (time: string | null): number | null => {
    if (!time) return null;
    const parts = time.split(':');
    const mins = parseInt(parts[0]);
    const secs = parseFloat(parts[1]);
    return mins * 60 + secs;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${mins}:${secs.padStart(6, '0')}`;
  };

  // Process evolution data for charts
  const fastestLapData = evolution?.fastest_lap_evolution.map(item => ({
    date: item.date,
    race_id: item.race_id,
    time: timeToSeconds(item.lap_time),
    display: item.lap_time,
  })).filter(d => d.time !== null) || [];

  const avgLapData = evolution?.average_lap_evolution.map(item => ({
    date: item.date,
    race_id: item.race_id,
    time: timeToSeconds(item.lap_time),
    display: item.lap_time,
  })).filter(d => d.time !== null) || [];

  // Calculate dynamic Y-axis domain
  const allTimes = [...fastestLapData, ...avgLapData].map(d => d.time).filter((v): v is number => v !== null);
  const yAxisDomain = allTimes.length > 0
    ? [Math.min(...allTimes) - 2, Math.max(...allTimes) + 2] as [number, number]
    : undefined;

  const handleChartClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.race_id) {
      navigate(`/races/${data.activePayload[0].payload.race_id}`);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-1">{label}</p>
          <p className="text-sm text-primary">Lap Time: {payload[0].payload.display}</p>
          <p className="text-xs text-muted-foreground mt-1">Click to view race</p>
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

  if (error || !circuit) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Circuit not found</p>
        <Link to="/circuits">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Circuits
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/circuits">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="page-title">{circuit.name.toUpperCase()}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-muted-foreground">{circuit.city}</span>
              {circuit.type === 'outdoor' ? (
                <span className="flex items-center gap-1 text-xs bg-success/20 text-success px-2 py-1 rounded">
                  <Sun className="w-3 h-3" />
                  Outdoor
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                  <Building className="w-3 h-3" />
                  Indoor
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Races"
          value={circuit.stats.total_races}
          icon={Flag}
          subtitle="Races held here"
        />
        <StatCard
          title="Total Laps"
          value={circuit.stats.total_laps}
          icon={Gauge}
          subtitle="Laps driven"
        />
        <StatCard
          title="Track Record"
          value={circuit.stats.fastest_lap_ever || 'N/A'}
          icon={Zap}
          subtitle={circuit.stats.fastest_lap_driver ? `by ${circuit.stats.fastest_lap_driver}` : 'Fastest lap ever'}
        />
      </div>

      {/* Evolution Charts - Collapsible */}
      <Collapsible open={evolutionOpen} onOpenChange={setEvolutionOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Circuit Evolution Charts
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${evolutionOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-6">
          {evolution ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fastest Lap Evolution Chart */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="font-display text-lg tracking-wider mb-6">FASTEST LAP EVOLUTION</h3>
                {fastestLapData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={fastestLapData} onClick={handleChartClick}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={12}
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          domain={yAxisDomain}
                          tickFormatter={(value) => formatTime(value)}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="time"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ r: 4, cursor: 'pointer' }}
                          activeDot={{ r: 6, cursor: 'pointer' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No data available</p>
                )}
              </div>

              {/* Average Lap Evolution Chart */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="font-display text-lg tracking-wider mb-6">AVERAGE LAP EVOLUTION</h3>
                {avgLapData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={avgLapData} onClick={handleChartClick}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={12}
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          domain={yAxisDomain}
                          tickFormatter={(value) => formatTime(value)}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="time"
                          stroke="hsl(var(--accent))"
                          strokeWidth={2}
                          dot={{ r: 4, cursor: 'pointer' }}
                          activeDot={{ r: 6, cursor: 'pointer' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No data available</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Races at this Circuit */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display tracking-wider">RACES AT THIS CIRCUIT</h2>
          <Link
            to={`/races?circuit=${id}`}
            className="text-primary hover:underline text-sm flex items-center gap-1"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {races && races.length > 0 ? (
          <div className="space-y-2">
            {races.slice(0, 5).map((race) => (
              <Link
                key={race.id}
                to={`/races/${race.id}`}
                className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Flag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{race.date}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      Race session
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <Flag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No races held at this circuit yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CircuitDetailPage;
