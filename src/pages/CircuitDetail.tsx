import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Flag, Gauge, Zap, Calendar, ChevronRight, Sun, Building } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';

const CircuitDetailPage = () => {
  const { id } = useParams<{ id: string }>();

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
          subtitle="Fastest lap ever"
        />
      </div>

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
