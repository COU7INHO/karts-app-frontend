import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';

const DriversPage = () => {
  const { data: drivers, isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => api.getDrivers(),
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
        <h1 className="page-title">DRIVERS</h1>
        <p className="page-subtitle">All registered racers</p>
      </div>

      {drivers && drivers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((driver) => (
            <Link
              key={driver.id}
              to={`/drivers/${driver.id}`}
              className="stat-card group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <span className="font-display text-xl text-primary">
                    {driver.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-lg">{driver.name}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No drivers registered yet</p>
        </div>
      )}
    </div>
  );
};

export default DriversPage;
