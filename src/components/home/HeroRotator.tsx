import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flag, Trophy } from 'lucide-react';
import type { ChampionshipDetail, RaceDetail } from '@/lib/api';
import type { RaceDay } from '@/lib/race';
import { sortByFastestLap } from '@/lib/race';
import { formatGap, formatRaceDate, shortLap, timeToSeconds } from '@/lib/timing';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import TimingTower, { TowerRow } from '@/components/racing/TimingTower';
import DriverPlate from '@/components/racing/DriverPlate';
import { getChampionshipLogo, getChampionshipLogoScale } from '@/lib/championshipLogos';

const SLIDE_MS = 5000;

interface HeroRotatorProps {
  latestDay?: RaceDay;
  latestRace?: RaceDetail;
  latestRaceId?: number;
  onPickSession: (id: number) => void;
  raceLoading: boolean;
  championships: ChampionshipDetail[];
}

const sessionLabel = (day: RaceDay | undefined, raceId: number | undefined) => {
  if (!day || day.sessions.length < 2) return '';
  const i = day.sessions.findIndex(s => s.id === raceId);
  return i >= 0 ? `Race ${i + 1}` : '';
};

/**
 * Home hero that cycles between the latest race and each championship's
 * standings, TV-broadcast style. Rotation pauses while the pointer or keyboard focus is inside the hero.
 */
const HeroRotator = ({ latestDay, latestRace, latestRaceId, onPickSession, raceLoading, championships }: HeroRotatorProps) => {
  const slideCount = 1 + championships.length;
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const progressRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const elapsed = useRef(0);

  const goTo = useCallback((next: number) => {
    elapsed.current = 0;
    setIndex(next);
  }, []);

  const onRaceSlide = index === 0;
  const paused = hovered || focused;

  // Drive the progress bar directly on the DOM so the hero doesn't re-render every frame
  useEffect(() => {
    progressRefs.current.forEach((el, i) => {
      if (el) el.style.width = i < index ? '100%' : i === index ? `${(elapsed.current / SLIDE_MS) * 100}%` : '0%';
    });
    if (paused || slideCount < 2) return;
    let frame: number;
    let last = performance.now();
    const tick = (now: number) => {
      if (!document.hidden) elapsed.current += now - last;
      last = now;
      const bar = progressRefs.current[index];
      if (bar) bar.style.width = `${Math.min(100, (elapsed.current / SLIDE_MS) * 100)}%`;
      if (elapsed.current >= SLIDE_MS) {
        goTo((index + 1) % slideCount);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [index, paused, slideCount, goTo]);

  const results = latestRace ? sortByFastestLap(latestRace.results) : [];
  const leaderTime = timeToSeconds(results[0]?.fastest_lap);
  const champ = onRaceSlide ? undefined : championships[index - 1];
  const champLeader = champ?.standings[0];
  const champRunnerUp = champ?.standings[1];
  const champLogo = champ ? getChampionshipLogo(champ.id) : undefined;
  const champLogoScale = champ ? getChampionshipLogoScale(champ.id) : 1;

  const slideLabels = ['Latest race', ...championships.map(c => c.name)];

  return (
    <section
      className="relative -mx-4 md:mx-0 md:panel overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={e => !e.currentTarget.contains(e.relatedTarget) && setFocused(false)}
      aria-roledescription="carousel"
      aria-label="Highlights"
    >
      {onRaceSlide && (
        // Race artwork sweeping in from the right behind the classification
        <div className="absolute right-0 bottom-0 h-[55%] md:inset-y-0 md:h-full opacity-60 pointer-events-none" aria-hidden>
          <img
            src="/brand/last-race.webp"
            alt=""
            className="h-full w-auto max-w-none select-none animate-art-in"
            draggable={false}
          />
        </div>
      )}
      <div className="relative grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] px-4 pt-6 md:px-10 md:pt-10">
        {/* Left: headline for the current slide */}
        <div className="flex flex-col min-h-[240px] md:min-h-[340px]">
          {onRaceSlide ? (
            <div key="race" className="flex flex-col flex-1 animate-hero-in">
              <p className="text-sm text-muted-foreground">
                Latest race{latestDay && `, ${formatRaceDate(latestDay.date, 'EEEE d MMMM yyyy')}`}
              </p>
              <h1 className="display uppercase text-6xl md:text-7xl xl:text-8xl mt-2 break-words">
                {latestDay?.circuitName ?? 'Speed Champion'}
              </h1>
              {results[0] && (
                <div className="mt-8 flex items-center gap-4">
                  <DriverPlate name={results[0].driver_name} size="lg" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Winner{sessionLabel(latestDay, latestRaceId) && `, ${sessionLabel(latestDay, latestRaceId)}`}
                    </p>
                    <p className="text-2xl font-bold leading-tight">
                      {results[0].driver_name}{' '}
                      <span className="lap-time t-purple">{shortLap(results[0].fastest_lap)}</span>
                    </p>
                  </div>
                </div>
              )}
              <div className="mt-8 md:mt-auto md:pt-8 flex flex-wrap gap-3">
                {latestRaceId !== undefined && (
                  <Button asChild>
                    <Link to={`/races/${latestRaceId}`}>
                      <Flag />
                      Full results
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            champ && (
              <div key={`champ-${champ.id}`} className="flex flex-col flex-1 animate-hero-in">
                <p className="text-sm text-muted-foreground">
                  Championship standings after {champ.races.length} races
                </p>
                <h2 className="display uppercase text-6xl md:text-7xl xl:text-8xl mt-2 break-words">{champ.name}</h2>
                {champLeader && (
                  <div className="mt-8 flex items-center gap-4">
                    <DriverPlate name={champLeader.driver_name} size="lg" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Leader
                        {champRunnerUp && `, ${champLeader.total_points - champRunnerUp.total_points} pts ahead`}
                      </p>
                      <p className="text-2xl font-bold leading-tight">
                        {champLeader.driver_name}{' '}
                        <span className="lap-time text-primary">{champLeader.total_points} pts</span>
                      </p>
                    </div>
                  </div>
                )}
                <div className="mt-8 md:mt-auto md:pt-8">
                  <Button asChild>
                    <Link to={`/championships/${champ.id}`}>
                      <Trophy />
                      Full standings
                    </Link>
                  </Button>
                </div>
              </div>
            )
          )}
        </div>

        {/* Right: timing tower for the current slide */}
        <div className="relative min-h-[280px]">
          {champLogo && (
            // Competition crest tilted behind the standings, like a TV football graphic
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
              <img
                key={`logo-${champ?.id}`}
                src={champLogo}
                alt=""
                className="select-none opacity-25 animate-logo-in"
                style={{ width: `${72 * champLogoScale}%`, maxWidth: 380 * champLogoScale }}
              />
            </div>
          )}
          {onRaceSlide ? (
            raceLoading && !latestRace ? (
              <div className="flex justify-center items-center h-full py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : results.length === 0 ? (
              <div className="panel h-full flex flex-col items-center justify-center text-center p-8">
                <Flag className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No races yet. Upload a timing sheet to start the season.</p>
              </div>
            ) : (
              <TimingTower
                className="relative bg-card/60 animate-hero-in"
                header={
                  <div className="panel-head text-xs text-muted-foreground">
                    {latestDay && latestDay.sessions.length > 1 ? (
                      <div className="flex gap-1" role="tablist" aria-label="Session">
                        {latestDay.sessions.map((session, i) => (
                          <button
                            key={session.id}
                            role="tab"
                            aria-selected={session.id === latestRaceId}
                            onClick={() => onPickSession(session.id)}
                            className={cn(
                              'h-7 px-3 rounded-sm',
                              session.id === latestRaceId
                                ? 'bg-primary text-primary-foreground font-semibold'
                                : 'bg-secondary text-muted-foreground hover:text-foreground'
                            )}
                          >
                            Race {i + 1}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span>Classification</span>
                    )}
                    <span>Fastest lap</span>
                  </div>
                }
              >
                {results.map((r, i) => (
                  <TowerRow
                    key={`${latestRaceId}-${r.driver_name}`}
                    position={i + 1}
                    name={r.driver_name}
                    value={shortLap(r.fastest_lap)}
                    valueClassName={i === 0 ? 't-purple' : undefined}
                    gap={formatGap(timeToSeconds(r.fastest_lap), leaderTime)}
                    meta={`Avg ${shortLap(r.average_lap)} over ${r.laps.length} laps`}
                    animateIndex={i}
                  />
                ))}
              </TimingTower>
            )
          ) : (
            champ && (
              <TimingTower
                key={`tower-${champ.id}`}
                className="relative bg-card/60"
                header={
                  <div className="panel-head text-xs text-muted-foreground">
                    <span>Standings</span>
                    <span>Gap / Points</span>
                  </div>
                }
              >
                {champ.standings.slice(0, 6).map((s, i) => (
                  <TowerRow
                    key={`${champ.id}-${s.driver_id}`}
                    position={s.position}
                    name={s.driver_name}
                    href={`/drivers/${s.driver_id}`}
                    meta={`${s.races_participated} races`}
                    gap={champLeader && s.position > 1 ? `−${champLeader.total_points - s.total_points}` : ''}
                    value={<span className={cn('display text-2xl', s.position === 1 && 'text-primary')}>{s.total_points}</span>}
                    animateIndex={i}
                  />
                ))}
              </TimingTower>
            )
          )}
        </div>
      </div>

      {/* Slide indicators double as progress bars */}
      <div
        className="relative grid gap-2 md:gap-3 px-4 md:px-10 pt-8 pb-5 md:pb-6"
        style={{ gridTemplateColumns: `repeat(${slideCount}, minmax(0, 1fr))` }}
      >
        {slideLabels.map((label, i) => (
          <button
            key={label}
            onClick={() => goTo(i)}
            aria-label={`Show ${label}`}
            aria-current={i === index}
            className="group text-left min-w-0"
          >
            <span className="block h-1 bg-secondary overflow-hidden -skew-x-12">
              <span
                ref={el => (progressRefs.current[i] = el)}
                className="block h-full bg-primary"
                style={{ width: i < index ? '100%' : '0%' }}
              />
            </span>
            <span
              className={cn(
                'block mt-2 text-xs truncate transition-colors',
                i === index ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
              )}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default HeroRotator;
