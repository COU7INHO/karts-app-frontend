import { useQueries, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MapPin, Sun, Building } from 'lucide-react';
import { api } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import { shortLap } from '@/lib/timing';
import PageHeader from '@/components/racing/PageHeader';
import { getCircuitLayout } from '@/lib/circuitLayouts';

const CircuitsPage = () => {
  const { data: circuits, isLoading } = useQuery({
    queryKey: ['circuits'],
    queryFn: () => api.getCircuits(),
  });

  const details = useQueries({
    queries: (circuits ?? []).map(c => ({
      queryKey: ['circuit', String(c.id)],
      queryFn: () => api.getCircuit(c.id),
    })),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="Circuits" subtitle="Where we race" />

      {circuits && circuits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {circuits.map((circuit, i) => {
            const stats = details[i]?.data?.stats;
            const layout = getCircuitLayout(circuit.id);
            return (
              <Link
                key={circuit.id}
                to={`/circuits/${circuit.id}`}
                className="panel group overflow-hidden hover:border-primary/60 transition-colors"
              >
                <div className="p-5 md:p-6 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {circuit.type === 'outdoor' ? <Sun className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                      {circuit.city}, {circuit.type}
                    </div>
                    <h2 className="display uppercase text-3xl md:text-4xl mt-3 group-hover:text-primary transition-colors">
                      {circuit.name}
                    </h2>
                  </div>
                  {layout && (
                    <img
                      src={layout}
                      alt={`${circuit.name} track layout`}
                      className="h-28 md:h-36 w-auto max-w-[45%] object-contain shrink-0 transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="grid grid-cols-3 gap-px bg-border border-t border-border">
                  <div className="bg-card px-5 py-3">
                    <p className="text-xs text-muted-foreground">Lap record</p>
                    <p className="lap-time text-lg t-purple">{shortLap(stats?.fastest_lap_ever)}</p>
                  </div>
                  <div className="bg-card px-5 py-3">
                    <p className="text-xs text-muted-foreground">Races</p>
                    <p className="lap-time text-lg">{stats?.total_races ?? '–'}</p>
                  </div>
                  <div className="bg-card px-5 py-3">
                    <p className="text-xs text-muted-foreground">Laps</p>
                    <p className="lap-time text-lg">{stats?.total_laps?.toLocaleString('en') ?? '–'}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="panel text-center py-12">
          <MapPin className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No circuits yet.</p>
        </div>
      )}
    </div>
  );
};

export default CircuitsPage;
