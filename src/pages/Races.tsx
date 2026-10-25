import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Flag, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { groupRaceDays } from '@/lib/race';
import PageHeader from '@/components/racing/PageHeader';
import CircuitFilter from '@/components/racing/CircuitFilter';
import RaceDayCard from '@/components/racing/RaceDayCard';

const RacesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const circuitFilter = searchParams.get('circuit') ?? 'all';
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const setCircuitFilter = (value: string) =>
    setSearchParams(value === 'all' ? {} : { circuit: value }, { replace: true });

  const { data: races, isLoading } = useQuery({
    queryKey: ['races', circuitFilter],
    queryFn: () => api.getRaces(circuitFilter === 'all' ? undefined : parseInt(circuitFilter)),
  });

  const handleAddRaceClick = () => {
    if (isLoggedIn) {
      navigate('/upload');
    } else {
      navigate('/login', {
        state: { message: 'You need to login first to upload a new race' }
      });
    }
  };

  const raceDays = groupRaceDays(races ?? []);

  // Group race days under a year heading
  const years = raceDays.reduce<Record<string, typeof raceDays>>((acc, day) => {
    const year = day.date.slice(0, 4);
    (acc[year] ??= []).push(day);
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Races"
        subtitle={races ? `${races.length} sessions over ${raceDays.length} race days` : 'Every session on record'}
        actions={
          <Button onClick={handleAddRaceClick} variant={isLoggedIn ? 'default' : 'outline'}>
            <Plus />
            {isLoggedIn ? 'Add race' : 'Log in to add a race'}
          </Button>
        }
      />

      <CircuitFilter value={circuitFilter} onChange={setCircuitFilter} />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : raceDays.length > 0 ? (
        <div className="space-y-10">
          {Object.keys(years)
            .sort((a, b) => b.localeCompare(a))
            .map(year => (
              <section key={year} className="space-y-3">
                <h2 className="display text-4xl text-muted-foreground/60">{year}</h2>
                <div className="grid gap-2 md:grid-cols-2">
                  {years[year].map(day => (
                    <RaceDayCard key={day.key} day={day} />
                  ))}
                </div>
              </section>
            ))}
        </div>
      ) : (
        <div className="panel text-center py-12">
          <Flag className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No races at this circuit yet.</p>
        </div>
      )}
    </div>
  );
};

export default RacesPage;
