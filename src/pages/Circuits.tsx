import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MapPin, ChevronRight, Sun, Building } from 'lucide-react';
import { api } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import { cn } from '@/lib/utils';

const CircuitsPage = () => {
  const { data: circuits, isLoading } = useQuery({
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

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">CIRCUITS</h1>
        <p className="page-subtitle">All available racing tracks</p>
      </div>

      {circuits && circuits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {circuits.map((circuit) => (
            <Link
              key={circuit.id}
              to={`/circuits/${circuit.id}`}
              className="stat-card group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">{circuit.name}</p>
                    <p className="text-muted-foreground">{circuit.city}</p>
                    <div className="flex items-center gap-2 mt-2">
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
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No circuits available</p>
        </div>
      )}
    </div>
  );
};

export default CircuitsPage;
