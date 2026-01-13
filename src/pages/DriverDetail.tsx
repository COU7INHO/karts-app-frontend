import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Flag, Gauge, TrendingUp, GitCompare } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';

const DriverDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: driver, isLoading, error } = useQuery({
    queryKey: ['driver', id],
    queryFn: () => api.getDriver(parseInt(id!)),
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
    </div>
  );
};

export default DriverDetailPage;
