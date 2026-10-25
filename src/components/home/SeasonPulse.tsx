import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { RaceDay } from '@/lib/race';
import { formatRaceDate } from '@/lib/timing';
import { useCountUp } from '@/hooks/use-count-up';
import { cn } from '@/lib/utils';

/**
 * Days since the last race plus a bar per year with how many races were run.
 * `raceDays` must be sorted newest first (as groupRaceDays returns them).
 */
const SeasonPulse = ({ raceDays }: { raceDays: RaceDay[] }) => {
  const latest = raceDays[0];
  const daysSince = latest ? Math.max(0, differenceInCalendarDays(new Date(), parseISO(latest.date))) : undefined;
  const { ref, value: shownDays } = useCountUp<HTMLParagraphElement>(daysSince);

  const years = Object.entries(
    raceDays.reduce<Record<string, { races: number; days: number }>>((acc, day) => {
      const year = day.date.slice(0, 4);
      acc[year] ??= { races: 0, days: 0 };
      acc[year].races += day.sessions.length;
      acc[year].days += 1;
      return acc;
    }, {})
  ).sort(([a], [b]) => b.localeCompare(a));

  const maxRaces = Math.max(1, ...years.map(([, y]) => y.races));
  const currentYear = String(new Date().getFullYear());

  if (!latest) return null;

  return (
    <section className="panel overflow-hidden">
      <div className="p-5 border-b border-border">
        <p className="text-sm text-muted-foreground">Since the last race</p>
        <div className="flex items-baseline gap-3 mt-1">
          <p ref={ref} className="display lap-time text-6xl md:text-7xl text-primary" aria-label={`${daysSince} days`}>
            {shownDays}
          </p>
          <span className="display text-2xl uppercase">{daysSince === 1 ? 'day' : 'days'}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {latest.circuitName}, {formatRaceDate(latest.date)}
        </p>
      </div>

      <div className="p-5">
        <p className="text-sm text-muted-foreground mb-3">Races per year</p>
        <div className="space-y-2.5">
          {years.map(([year, stats]) => (
            <div key={year} className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3">
              <span className={cn('lap-time text-sm', year === currentYear ? 'text-foreground' : 'text-muted-foreground')}>
                {year}
              </span>
              <div className="h-2.5 bg-secondary rounded-sm overflow-hidden">
                <div
                  className={cn('h-full -skew-x-12 origin-left', year === currentYear ? 'bg-primary' : 'bg-muted-foreground/50')}
                  style={{ width: `${(stats.races / maxRaces) * 100}%` }}
                />
              </div>
              <span className="text-sm text-right whitespace-nowrap">
                <span className="lap-time font-semibold">{stats.races}</span>
                <span className="text-muted-foreground text-xs ml-1.5">
                  in {stats.days} {stats.days === 1 ? 'day' : 'days'}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SeasonPulse;
