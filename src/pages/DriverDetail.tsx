import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Flag, Gauge, TrendingUp, GitCompare, Calendar, MapPin, Users, ChevronRight, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

const DriverDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: driver, isLoading, error } = useQuery({
    queryKey: ['driver', id],
    queryFn: () => api.getDriver(parseInt(id!)),
    enabled: !!id,
  });

  const { data: driverRaces, isLoading: isLoadingRaces } = useQuery({
    queryKey: ['driver-races', id],
    queryFn: () => api.getRaces(undefined, parseInt(id!)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Driver not found</p>
        <Link to="/drivers">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Drivers
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/drivers">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="font-display text-3xl text-primary">
              {driver.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="page-title">{driver.name.toUpperCase()}</h1>
            <p className="text-muted-foreground">Driver Profile</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Total Races"
          value={driver.total_races}
          icon={Flag}
          subtitle="Race sessions completed"
        />
        <StatCard
          title="Total Laps"
          value={driver.total_laps}
          icon={Gauge}
          subtitle="Laps driven"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Link to={`/drivers/${id}/evolution`}>
          <Button className="gap-2 racing-gradient">
            <TrendingUp className="w-4 h-4" />
            View Evolution Chart
          </Button>
        </Link>
        <Link to={`/compare?ids=${id}`}>
          <Button variant="outline" className="gap-2">
            <GitCompare className="w-4 h-4" />
            Compare with Others
          </Button>
        </Link>
      </div>

      {/* Race History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Race History
            {driverRaces && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({driverRaces.length} {driverRaces.length === 1 ? 'race' : 'races'})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingRaces ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : !driverRaces || driverRaces.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Flag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No races found for this driver</p>
            </div>
          ) : (
            <div className="space-y-2">
              {driverRaces.map((race) => (
                <Link
                  key={race.id}
                  to={`/races/${race.id}`}
                  className="block group"
                >
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium text-foreground">
                          {format(new Date(race.date), 'dd MMM yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{race.circuit_name || 'Unknown Circuit'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverDetailPage;
