import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import PositionBadge from '@/components/PositionBadge';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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

  // Sort results by total time (fastest first)
  const sortedResults = [...race.results].sort((a, b) => {
    const timeToSeconds = (time: string) => {
      const parts = time.split(':');
      const mins = parseInt(parts[0]);
      const secs = parseFloat(parts[1]);
      return mins * 60 + secs;
    };
    return timeToSeconds(a.total_time) - timeToSeconds(b.total_time);
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/races">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="page-title">RACE #{race.id}</h1>
          <div className="flex items-center gap-4 mt-2 text-muted-foreground">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {race.date}
            </span>
            {circuit && (
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {circuit.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
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
    </div>
  );
};

export default RaceDetailPage;
