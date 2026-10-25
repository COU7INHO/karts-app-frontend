import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Flag, Gauge, TrendingUp, Timer, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { shortLap } from '@/lib/timing';
import { groupRaceDays } from '@/lib/race';
import RaceDayCard from '@/components/racing/RaceDayCard';
import PageHeader from '@/components/racing/PageHeader';
import DriverPlate from '@/components/racing/DriverPlate';

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

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', 'all'],
    queryFn: () => api.getLeaderboard(),
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
        <p className="text-muted-foreground">This driver doesn't exist.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/drivers">
            <ArrowLeft />
            Back to drivers
          </Link>
        </Button>
      </div>
    );
  }

  const fastestRank = leaderboard?.overall.fastest_lap.findIndex(e => e.driver_id === driver.id) ?? -1;
  const averageRank = leaderboard?.overall.best_average_lap.findIndex(e => e.driver_id === driver.id) ?? -1;
  const bestLap = leaderboard?.overall.fastest_lap[fastestRank]?.fastest_lap;
  const bestAverage = leaderboard?.overall.best_average_lap[averageRank]?.average_lap;

  return (
    <div className="space-y-8 md:space-y-10 animate-fade-in">
      <PageHeader
        back={{ to: '/drivers', label: 'Drivers' }}
        leading={<DriverPlate name={driver.name} size="xl" />}
        title={driver.name}
        subtitle={
          fastestRank >= 0
            ? `P${fastestRank + 1} on the all-time fastest lap ranking`
            : 'Not ranked yet'
        }
        actions={
          <Button asChild>
            <Link to={`/drivers/${id}/evolution`}>
              <TrendingUp />
              Lap time evolution
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        <StatCard title="Best lap" value={shortLap(bestLap)} icon={Timer} highlight={fastestRank === 0} />
        <StatCard title="Best average" value={shortLap(bestAverage)} icon={Trophy} />
        <StatCard title="Races" value={driver.total_races} icon={Flag} />
        <StatCard title="Laps" value={driver.total_laps} icon={Gauge} />
      </div>

      <section className="space-y-4">
        <h2 className="section-title">
          Race history
          {driverRaces && <span className="text-muted-foreground ml-3 text-xl">{driverRaces.length}</span>}
        </h2>
        {isLoadingRaces ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : !driverRaces || driverRaces.length === 0 ? (
          <div className="panel text-center py-10 text-muted-foreground">
            <Flag className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No races on record for this driver.</p>
          </div>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {groupRaceDays(driverRaces).map(day => (
              <RaceDayCard key={day.key} day={day} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default DriverDetailPage;
