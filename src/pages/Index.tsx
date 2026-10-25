import { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Flag, ChevronRight, Timer, Users, Medal, Upload } from 'lucide-react';
import type { ChampionshipDetail } from '@/lib/api';
import { api } from '@/lib/api';
import { groupRaceDays } from '@/lib/race';
import { shortLap } from '@/lib/timing';
import { useCountUp } from '@/hooks/use-count-up';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import RaceDayCard from '@/components/racing/RaceDayCard';
import HeroRotator from '@/components/home/HeroRotator';
import SeasonPulse from '@/components/home/SeasonPulse';
import { getCircuitLayout } from '@/lib/circuitLayouts';

const SeasonStat = ({ label, value, icon: Icon }: { label: string; value?: number; icon: typeof Flag }) => {
  const { ref, value: shown } = useCountUp<HTMLParagraphElement>(value);
  return (
    <div className="bg-card p-4 md:p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <p ref={ref} className="display lap-time text-4xl md:text-6xl mt-2" aria-label={value?.toString()}>
        {value === undefined ? '–' : shown.toLocaleString('en')}
      </p>
    </div>
  );
};

const Index = () => {
  const { isLoggedIn } = useAuth();
  const [pickedSessionId, setPickedSessionId] = useState<number>();

  const { data: races, isLoading: racesLoading } = useQuery({
    queryKey: ['races'],
    queryFn: () => api.getRaces(),
  });

  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => api.getDrivers(),
  });

  const { data: circuits } = useQuery({
    queryKey: ['circuits'],
    queryFn: () => api.getCircuits(),
  });

  const { data: championships } = useQuery({
    queryKey: ['championships'],
    queryFn: () => api.getChampionships(),
  });

  const allRaceDays = groupRaceDays(races ?? []);
  const latestDay = allRaceDays[0];
  const latestRaceId = pickedSessionId ?? latestDay?.sessions[latestDay.sessions.length - 1].id;

  const { data: latestRace, isLoading: latestLoading } = useQuery({
    queryKey: ['race', String(latestRaceId)],
    queryFn: () => api.getRace(latestRaceId!),
    enabled: latestRaceId !== undefined,
    // Keep the current classification on screen while switching sessions
    placeholderData: previous => previous,
  });

  const circuitDetails = useQueries({
    queries: (circuits ?? []).map(c => ({
      queryKey: ['circuit', String(c.id)],
      queryFn: () => api.getCircuit(c.id),
    })),
  });

  const championshipDetails = useQueries({
    queries: (championships ?? []).map(c => ({
      queryKey: ['championship', String(c.id)],
      queryFn: () => api.getChampionship(c.id),
    })),
  });

  const loadedChampionships = championshipDetails
    .map(q => q.data)
    .filter((c): c is ChampionshipDetail => !!c && c.standings.length > 0);
  const totalLaps = circuitDetails.every(q => q.data)
    ? circuitDetails.reduce((sum, q) => sum + (q.data?.stats.total_laps ?? 0), 0)
    : undefined;

  return (
    <div className="space-y-10 md:space-y-14">
      <HeroRotator
        latestDay={latestDay}
        latestRace={latestRace}
        latestRaceId={latestRaceId}
        onPickSession={setPickedSessionId}
        raceLoading={racesLoading || latestLoading}
        championships={loadedChampionships}
      />

      {/* Season numbers */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-sm overflow-hidden">
        <SeasonStat label="Races run" value={races?.length} icon={Flag} />
        <SeasonStat label="Laps timed" value={totalLaps} icon={Timer} />
        <SeasonStat label="Drivers" value={drivers?.length} icon={Users} />
        <SeasonStat label="Championships" value={championships?.length} icon={Medal} />
      </section>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Recent race days */}
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <h2 className="section-title">Recent race days</h2>
            <Link to="/races" className="text-sm text-primary hover:underline flex items-center gap-1">
              All races <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {racesLoading ? (
            <LoadingSpinner className="py-8 justify-center" />
          ) : (
            <div className="space-y-2">
              {allRaceDays.slice(0, 4).map(day => (
                <RaceDayCard key={day.key} day={day} />
              ))}
            </div>
          )}
        </section>

        <div className="space-y-10">
          {/* Track records */}
          <section className="space-y-4">
            <h2 className="section-title">Track records</h2>
            <div className="space-y-2">
              {circuitDetails.map(({ data: c }) =>
                c ? (
                  <Link
                    key={c.id}
                    to={`/circuits/${c.id}`}
                    className="panel flex items-center gap-4 p-4 hover:border-primary/60 transition-colors"
                  >
                    {getCircuitLayout(c.id) && (
                      <img
                        src={getCircuitLayout(c.id)}
                        alt=""
                        aria-hidden
                        className="h-12 w-16 object-contain shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{c.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {c.stats.fastest_lap_driver ? `Held by ${c.stats.fastest_lap_driver}` : 'No record yet'}
                      </p>
                    </div>
                    <span className="display lap-time text-3xl t-purple">{shortLap(c.stats.fastest_lap_ever)}</span>
                  </Link>
                ) : null
              )}
            </div>
          </section>

          <SeasonPulse raceDays={allRaceDays} />

          {isLoggedIn && (
            <section className="panel p-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">Back from the track?</p>
                <p className="text-sm text-muted-foreground">Upload the timing sheet photo.</p>
              </div>
              <Button asChild>
                <Link to="/upload">
                  <Upload />
                  Upload race
                </Link>
              </Button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
