import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Flag, Calendar, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useState } from 'react';

const RacesPage = () => {
  const [circuitFilter, setCircuitFilter] = useState<string>('all');

  const { data: circuits } = useQuery({
    queryKey: ['circuits'],
    queryFn: () => api.getCircuits(),
  });

  const { data: races, isLoading } = useQuery({
    queryKey: ['races', circuitFilter],
    queryFn: () => api.getRaces(circuitFilter === 'all' ? undefined : parseInt(circuitFilter)),
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title">RACES</h1>
          <p className="page-subtitle">View all recorded race sessions</p>
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

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : races && races.length > 0 ? (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="racing-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Circuit</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {races.map((race) => {
                const circuit = circuits?.find(c => c.id === race.circuit);
                return (
                  <tr key={race.id}>
                    <td>
                      <Link to={`/races/${race.id}`} className="flex items-center gap-2 hover:text-primary">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {race.date}
                      </Link>
                    </td>
                    <td>{circuit?.name || race.circuit_name || 'Unknown Circuit'}</td>
                    <td>
                      <Link
                        to={`/races/${race.id}`}
                        className="p-2 rounded-lg hover:bg-secondary inline-flex"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <Flag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No races found</p>
        </div>
      )}
    </div>
  );
};

export default RacesPage;
