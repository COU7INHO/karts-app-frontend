import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Timer, Gauge, Hash } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { sortByFastestLap } from '@/lib/race';
import {
  chartAxis,
  formatGap,
  formatLapSeconds,
  formatRaceDate,
  getDriverColor,
  shortLap,
  timeToSeconds,
} from '@/lib/timing';
import PageHeader from '@/components/racing/PageHeader';
import TimingTower, { TowerRow } from '@/components/racing/TimingTower';

const RaceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set());

  const { data: race, isLoading, error } = useQuery({
    queryKey: ['race', id],
    queryFn: () => api.getRace(parseInt(id!)),
    enabled: !!id,
  });

  const { data: circuits } = useQuery({
    queryKey: ['circuits'],
    queryFn: () => api.getCircuits(),
  });

  const sortedResults = useMemo(() => (race ? sortByFastestLap(race.results) : []), [race]);
  const leaderTime = timeToSeconds(sortedResults[0]?.fastest_lap);

  const bestAverage = useMemo(() => {
    return [...sortedResults]
      .filter(r => r.average_lap)
      .sort((a, b) => (timeToSeconds(a.average_lap) ?? Infinity) - (timeToSeconds(b.average_lap) ?? Infinity))[0];
  }, [sortedResults]);

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
        const seconds = timeToSeconds(lap?.lap_time);
        if (lap?.lap_time && seconds !== null) {
          lapData.push({ driverName: result.driver_name, time: lap.lap_time, seconds });
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
    const data: Record<string, number | string | null>[] = [];

    for (let i = 1; i <= maxLaps; i++) {
      const point: Record<string, number | string | null> = { lap: i };
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

  // Fit the Y axis to the drivers currently shown, so hiding one tightens the scale
  const yAxisDomain = useMemo(() => {
    if (!race) return [0, 60];
    const shown = race.results.filter(r => selectedDrivers.size === 0 || selectedDrivers.has(r.driver_name));
    const allValues = chartData.flatMap(point =>
      shown.map(r => point[r.driver_name]).filter((v): v is number => typeof v === 'number')
    );
    if (allValues.length === 0) return [0, 60];
    // Whole seconds at the edges keep the tick labels round
    return [Math.max(0, Math.floor(Math.min(...allValues) - 0.5)), Math.ceil(Math.max(...allValues) + 0.5)];
  }, [chartData, race, selectedDrivers]);

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="panel p-3 shadow-xl">
          <p className="font-semibold mb-2">Lap {label}</p>
          {[...payload]
            .sort((a: any, b: any) => a.value - b.value)
            .map((entry: any) => (
              <p key={entry.name} className="text-sm flex justify-between gap-6" style={{ color: entry.color }}>
                <span>{entry.name}</span>
                <span className="lap-time">{shortLap(entry.payload[`${entry.name}_display`])}</span>
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
        <p className="text-muted-foreground">This race doesn't exist or was removed.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/races">
            <ArrowLeft />
            Back to races
          </Link>
        </Button>
      </div>
    );
  }

  const circuit = circuits?.find(c => c.id === race.circuit);
  const driverNames = race.results.map(r => r.driver_name);
  const totalLaps = race.results.reduce((sum, r) => sum + r.laps.length, 0);
  const { fastestOverall } = lapComparisonData;

  // Initialize selected drivers when race data loads
  if (race && selectedDrivers.size === 0 && driverNames.length > 0) {
    setSelectedDrivers(new Set(driverNames));
  }

  const toggleDriver = (driverName: string) => {
    setSelectedDrivers(prev => {
      const next = new Set(prev);
      if (next.has(driverName)) {
        // Don't allow deselecting the last driver
        if (next.size > 1) {
          next.delete(driverName);
        }
      } else {
        next.add(driverName);
      }
      return next;
    });
  };

  const filteredDriverNames = driverNames.filter(name => selectedDrivers.has(name));

  return (
    <div className="space-y-8 md:space-y-10 animate-fade-in">
      <PageHeader
        back={{ to: '/races', label: 'Races' }}
        title={circuit?.name ?? race.circuit_name ?? 'Race'}
        subtitle={
          <>
            {formatRaceDate(race.date, 'EEEE d MMMM yyyy')}
            {circuit && `, ${circuit.city}`}
          </>
        }
      />

      {/* Race summary */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border border border-border rounded-sm overflow-hidden">
        <div className="bg-card p-4 md:p-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Timer className="w-4 h-4" /> Fastest lap
          </p>
          <p className="display lap-time text-4xl md:text-5xl t-purple mt-2">
            {Number.isFinite(fastestOverall.time) ? formatLapSeconds(fastestOverall.time).replace(/^0:/, '') : '—'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {fastestOverall.driverName}, lap {fastestOverall.lapNumber}
          </p>
        </div>
        <div className="bg-card p-4 md:p-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Gauge className="w-4 h-4" /> Best average
          </p>
          <p className="display lap-time text-4xl md:text-5xl t-avg mt-2">{shortLap(bestAverage?.average_lap)}</p>
          <p className="text-sm text-muted-foreground mt-1">{bestAverage?.driver_name}</p>
        </div>
        <div className="bg-card p-4 md:p-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Hash className="w-4 h-4" /> Laps timed
          </p>
          <p className="display lap-time text-4xl md:text-5xl mt-2">{totalLaps}</p>
          <p className="text-sm text-muted-foreground mt-1">{race.results.length} drivers on track</p>
        </div>
      </section>

      {/* Classification */}
      <section className="space-y-4">
        <h2 className="section-title">Classification</h2>
        <TimingTower
          header={
            <div className="panel-head text-xs text-muted-foreground">
              <span>Tap a driver to see every lap</span>
              <span className="pr-8">Gap / Best lap</span>
            </div>
          }
        >
          {sortedResults.map((result, index) => {
            const isExpanded = expandedDriver === result.driver_name;
            return (
              <div key={result.driver_name}>
                <TowerRow
                  position={index + 1}
                  name={result.driver_name}
                  meta={`Avg ${shortLap(result.average_lap)}, total ${result.total_time}`}
                  gap={formatGap(timeToSeconds(result.fastest_lap), leaderTime)}
                  value={shortLap(result.fastest_lap)}
                  valueClassName={index === 0 ? 't-purple' : undefined}
                  onClick={() => setExpandedDriver(isExpanded ? null : result.driver_name)}
                  trailing={
                    <ChevronDown
                      className={cn('w-4 h-4 text-muted-foreground shrink-0 transition-transform', isExpanded && 'rotate-180')}
                    />
                  }
                />
                {isExpanded && (
                  <div className="bg-background/60 border-b border-border/60 p-3 md:p-4 animate-fade-in">
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-1.5">
                      {result.laps.map(lap => {
                        const isPersonalBest = lap.lap_time === result.fastest_lap;
                        const isRaceBest =
                          fastestOverall.driverName === result.driver_name && fastestOverall.lapNumber === lap.lap_number;
                        return (
                          <div
                            key={lap.lap_number}
                            className={cn(
                              'rounded-sm px-2 py-1.5 bg-card border border-border',
                              isRaceBest && 'border-purple/70 bg-purple/10',
                              isPersonalBest && !isRaceBest && 'border-pb/60 bg-pb/10'
                            )}
                          >
                            <p className="text-[11px] text-muted-foreground">L{lap.lap_number}</p>
                            <p
                              className={cn(
                                'lap-time text-sm',
                                isRaceBest && 't-purple',
                                isPersonalBest && !isRaceBest && 't-pb'
                              )}
                            >
                              {shortLap(lap.lap_time)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </TimingTower>
      </section>

      {/* Lap Time Progression Chart */}
      {chartData.length > 0 && (
        <section className="panel p-4 md:p-6">
          <h2 className="section-title">Pace, lap by lap</h2>

          <div className="flex flex-wrap gap-2 mt-4 mb-6">
            {driverNames.map((driverName, index) => {
              const isSelected = selectedDrivers.has(driverName);
              const color = getDriverColor(index);
              const isLastSelected = isSelected && selectedDrivers.size === 1;

              return (
                <button
                  key={driverName}
                  onClick={() => toggleDriver(driverName)}
                  disabled={isLastSelected}
                  aria-pressed={isSelected}
                  className={cn(
                    'inline-flex items-center gap-2 h-8 px-3 rounded-sm text-sm font-medium border transition-colors',
                    isSelected ? 'bg-secondary border-border' : 'border-dashed border-border text-muted-foreground',
                    isLastSelected && 'cursor-not-allowed'
                  )}
                  title={isLastSelected ? 'At least one driver must be selected' : ''}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: isSelected ? color : 'transparent', boxShadow: `inset 0 0 0 1.5px ${color}` }}
                  />
                  {driverName}
                </button>
              );
            })}
          </div>

          <div className="h-72 md:h-96 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
                <XAxis dataKey="lap" {...chartAxis} />
                <YAxis
                  {...chartAxis}
                  width={52}
                  domain={yAxisDomain}
                  allowDataOverflow
                  tickFormatter={value => formatLapSeconds(value, 1).replace(/^0:/, '')}
                />
                <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '3 3' }} />
                {filteredDriverNames.map(driverName => {
                  const originalIndex = driverNames.indexOf(driverName);
                  return (
                    <Line
                      key={driverName}
                      type="monotone"
                      dataKey={driverName}
                      name={driverName}
                      stroke={getDriverColor(originalIndex)}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      connectNulls
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Lap-by-Lap Comparison Table */}
      {lapComparisonData.laps.length > 0 && (
        <section className="panel overflow-hidden">
          <div className="panel-head flex-wrap">
            <h2 className="section-title">Lap chart</h2>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-purple/30 border border-purple/70" /> Fastest of the race
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-pb/20 border border-pb/60" /> Fastest on that lap
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="racing-table">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-card z-10 w-16">Lap</th>
                  {sortedResults.map(r => (
                    <th key={r.driver_name}>{r.driver_name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lapComparisonData.laps.map(lap => {
                  const fastestInLap = lap.times.reduce(
                    (min, t) => (t.seconds < min.seconds ? t : min),
                    { driverName: '', time: '', seconds: Infinity }
                  );

                  return (
                    <tr key={lap.lapNumber}>
                      <td className="sticky left-0 bg-card z-10 text-muted-foreground font-medium">{lap.lapNumber}</td>
                      {sortedResults.map(({ driver_name: driverName }) => {
                        const lapTime = lap.times.find(t => t.driverName === driverName);
                        const isFastestInLap = lapTime && lapTime.driverName === fastestInLap.driverName;
                        const isFastestOverall =
                          fastestOverall.driverName === driverName && fastestOverall.lapNumber === lap.lapNumber;

                        return (
                          <td
                            key={driverName}
                            className={cn(
                              'lap-time',
                              isFastestOverall && 'bg-purple/15 t-purple',
                              isFastestInLap && !isFastestOverall && 'bg-pb/10 t-pb'
                            )}
                          >
                            {lapTime ? shortLap(lapTime.time) : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default RaceDetailPage;
