import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { api } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import { shortLap } from '@/lib/timing';
import PageHeader from '@/components/racing/PageHeader';
import DriverPlate from '@/components/racing/DriverPlate';

const DriversPage = () => {
  const { data: drivers, isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => api.getDrivers(),
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

  const ranking = leaderboard?.overall.fastest_lap ?? [];
  const rankOf = (id: number) => ranking.findIndex(e => e.driver_id === id);

  // Ranked drivers first, in ranking order; the rest alphabetically
  const sorted = [...(drivers ?? [])].sort((a, b) => {
    const ra = rankOf(a.id);
    const rb = rankOf(b.id);
    if (ra === -1 && rb === -1) return a.name.localeCompare(b.name);
    if (ra === -1) return 1;
    if (rb === -1) return -1;
    return ra - rb;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="Drivers" subtitle={`${drivers?.length ?? 0} drivers, ordered by their best lap ever`} />

      {sorted.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
          {sorted.map(driver => {
            const rank = rankOf(driver.id);
            const best = ranking[rank]?.fastest_lap;
            return (
              <Link
                key={driver.id}
                to={`/drivers/${driver.id}`}
                className="panel group relative flex items-center gap-4 p-4 overflow-hidden hover:border-primary/60 transition-colors"
              >
                <span
                  className="absolute -right-2 -bottom-6 display text-8xl text-foreground/[0.04] select-none pointer-events-none"
                  aria-hidden
                >
                  {rank >= 0 ? rank + 1 : ''}
                </span>
                <DriverPlate name={driver.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="display text-2xl uppercase truncate group-hover:text-primary transition-colors">
                    {driver.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {best ? (
                      <>
                        Best lap <span className="lap-time text-foreground">{shortLap(best)}</span>
                      </>
                    ) : (
                      'No timed laps yet'
                    )}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="panel text-center py-12">
          <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No drivers yet. They're added automatically when you upload a race.</p>
        </div>
      )}
    </div>
  );
};

export default DriversPage;
