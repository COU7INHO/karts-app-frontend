import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Flag, Gauge, Timer, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useMemo } from 'react';
import { groupRaceDays } from '@/lib/race';
import { shortLap, timeToSeconds } from '@/lib/timing';
import PageHeader from '@/components/racing/PageHeader';
import RaceDayCard from '@/components/racing/RaceDayCard';
import EvolutionChart, { EvolutionPoint } from '@/components/racing/EvolutionChart';
import { getCircuitLayout } from '@/lib/circuitLayouts';
import { cn } from '@/lib/utils';

const CircuitDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: circuit, isLoading, error } = useQuery({
    queryKey: ['circuit', id],
    queryFn: () => api.getCircuit(parseInt(id!)),
    enabled: !!id,
  });

  const { data: races } = useQuery({
    queryKey: ['races', id],
    queryFn: () => api.getRaces(parseInt(id!)),
    enabled: !!id,
  });

  const { data: evolution } = useQuery({
    queryKey: ['circuit-evolution', id],
    queryFn: () => api.getCircuitEvolution(parseInt(id!)),
    enabled: !!id,
  });

  // Merge the per-race fastest and average series into one set of points
  const chartData = useMemo<EvolutionPoint[]>(() => {
    if (!evolution) return [];
    const byRace = new Map<number, EvolutionPoint>();
    evolution.fastest_lap_evolution.forEach(item => {
      byRace.set(item.race_id, {
        date: item.date,
        race_id: item.race_id,
        fastest: timeToSeconds(item.lap_time),
        fastest_display: item.lap_time,
        average: null,
      });
    });
    evolution.average_lap_evolution.forEach(item => {
      const point = byRace.get(item.race_id) ?? { date: item.date, race_id: item.race_id, fastest: null };
      byRace.set(item.race_id, { ...point, average: timeToSeconds(item.lap_time), average_display: item.lap_time });
    });
    return [...byRace.values()].sort((a, b) => a.date.localeCompare(b.date) || (a.race_id ?? 0) - (b.race_id ?? 0));
  }, [evolution]);

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
        <p className="text-muted-foreground">This circuit doesn't exist.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/circuits">
            <ArrowLeft />
            Back to circuits
          </Link>
        </Button>
      </div>
    );
  }

  const raceDays = groupRaceDays(races ?? []);
  const layout = getCircuitLayout(circuit.id);

  return (
    <div className="space-y-8 md:space-y-10 animate-fade-in">
      <PageHeader
        back={{ to: '/circuits', label: 'Circuits' }}
        title={circuit.name}
        subtitle={`${circuit.city}, ${circuit.type} track`}
      />

      {/* Track drawing next to the numbers; the stats stack beside it on desktop */}
      <div className={cn('grid gap-2 md:gap-3', layout && 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]')}>
        {layout && (
          <div className="panel flex items-center justify-center p-6 md:p-8">
            <img
              src={layout}
              alt={`${circuit.name} track layout`}
              className="w-auto h-auto max-w-full max-h-[280px] md:max-h-[420px] object-contain"
            />
          </div>
        )}
        <div className={cn('grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3', layout && 'lg:grid-cols-1')}>
          <StatCard
            title="Lap record"
            value={shortLap(circuit.stats.fastest_lap_ever)}
            icon={Timer}
            highlight
            subtitle={circuit.stats.fastest_lap_driver ? `Set by ${circuit.stats.fastest_lap_driver}` : undefined}
          />
          <StatCard title="Races held" value={circuit.stats.total_races} icon={Flag} />
          <StatCard title="Laps driven" value={circuit.stats.total_laps.toLocaleString('en')} icon={Gauge} />
        </div>
      </div>

      <section className="panel p-4 md:p-6">
        <h2 className="section-title mb-4">Getting faster?</h2>
        {!evolution ? (
          <LoadingSpinner className="py-8 justify-center" />
        ) : chartData.length > 0 ? (
          <EvolutionChart
            data={chartData}
            fastestLabel="Fastest lap of the race"
            averageLabel="Best average of the race"
            onPointClick={point => point.race_id && navigate(`/races/${point.race_id}`)}
          />
        ) : (
          <p className="text-muted-foreground text-center py-8">No timed laps here yet.</p>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="section-title">Race days here</h2>
          <Link to={`/races?circuit=${id}`} className="text-primary hover:underline text-sm flex items-center gap-1">
            All races <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {raceDays.length > 0 ? (
          <div className="grid gap-2 md:grid-cols-2">
            {raceDays.slice(0, 6).map(day => (
              <RaceDayCard key={day.key} day={day} showCircuit={false} />
            ))}
          </div>
        ) : (
          <div className="panel text-center py-12">
            <Flag className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No races held at this circuit yet.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default CircuitDetailPage;
