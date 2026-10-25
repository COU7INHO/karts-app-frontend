import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatRaceDate, shortLap, timeToSeconds } from '@/lib/timing';
import PageHeader from '@/components/racing/PageHeader';
import CircuitFilter from '@/components/racing/CircuitFilter';
import EvolutionChart, { EvolutionPoint } from '@/components/racing/EvolutionChart';

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

  const chartData = useMemo<EvolutionPoint[]>(() => {
    if (!evolution) return [];
    return evolution.evolution
      .filter(item => item.fastest_lap && item.average_lap)
      .map(item => ({
        date: item.date,
        fastest: timeToSeconds(item.fastest_lap),
        average: timeToSeconds(item.average_lap),
        fastest_display: item.fastest_lap,
        average_display: item.average_lap,
      }));
  }, [evolution]);

  // Personal best lap across the shown races, highlighted in the table
  const personalBest = useMemo(
    () => Math.min(...chartData.map(d => d.fastest ?? Infinity)),
    [chartData]
  );

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
        <p className="text-muted-foreground">No lap history for this driver.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/drivers">
            <ArrowLeft />
            Back to drivers
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        back={{ to: `/drivers/${id}`, label: evolution.driver_name }}
        title="Lap time evolution"
        subtitle={`${evolution.driver_name}${selectedCircuit ? ` at ${selectedCircuit.name}` : ', every circuit'}`}
      />

      <CircuitFilter value={circuitFilter} onChange={setCircuitFilter} />

      {chartData.length > 0 ? (
        <section className="panel p-4 md:p-6">
          <EvolutionChart data={chartData} />
        </section>
      ) : (
        <div className="panel text-center py-12">
          <p className="text-muted-foreground">No timed races for this selection.</p>
        </div>
      )}

      {evolution.evolution.length > 0 && (
        <section className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="racing-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Circuit</th>
                  <th className="text-right">Fastest</th>
                  <th className="text-right">Average</th>
                </tr>
              </thead>
              <tbody>
                {[...evolution.evolution].reverse().map((item, index) => {
                  const circuit = circuits?.find(c => c.id === item.circuit_id);
                  const isPb = timeToSeconds(item.fastest_lap) === personalBest;
                  return (
                    <tr key={index}>
                      <td className="lap-time whitespace-nowrap">{formatRaceDate(item.date)}</td>
                      <td className="text-muted-foreground whitespace-nowrap">{circuit?.name || 'Unknown circuit'}</td>
                      <td className={cn('lap-time text-right', isPb && 't-purple')}>{shortLap(item.fastest_lap)}</td>
                      <td className="lap-time text-right">{shortLap(item.average_lap)}</td>
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

export default DriverEvolutionPage;
