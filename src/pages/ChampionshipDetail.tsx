import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Star, Zap, Gift } from 'lucide-react';
import { api, RaceDetail } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartAxis, formatRaceDate, getDriverColor, timeToSeconds as parseLap } from '@/lib/timing';
import { groupRaceDays } from '@/lib/race';
import PageHeader from '@/components/racing/PageHeader';
import Podium from '@/components/racing/Podium';
import TimingTower, { TowerRow } from '@/components/racing/TimingTower';
import RaceDayCard from '@/components/racing/RaceDayCard';
import { getChampionshipLogo } from '@/lib/championshipLogos';

const FASTEST_LAP_PTS = [10, 6, 4, 3, 2];
const AVERAGE_LAP_PTS = [9, 5, 3, 2, 1];

const timeToSeconds = (time: string | null): number => parseLap(time) ?? Infinity;

const calcRacePoints = (
  results: RaceDetail['results'],
  driverNames: Set<string>,
): Record<string, number> => {
  const filtered = results.filter(r => driverNames.has(r.driver_name));

  const byFastest = [...filtered]
    .filter(r => r.fastest_lap)
    .sort((a, b) => timeToSeconds(a.fastest_lap) - timeToSeconds(b.fastest_lap));

  const byAverage = [...filtered]
    .filter(r => r.average_lap)
    .sort((a, b) => timeToSeconds(a.average_lap) - timeToSeconds(b.average_lap));

  const pts: Record<string, number> = {};

  byFastest.slice(0, 5).forEach((r, i) => {
    pts[r.driver_name] = (pts[r.driver_name] ?? 0) + FASTEST_LAP_PTS[i];
  });

  byAverage.slice(0, 5).forEach((r, i) => {
    pts[r.driver_name] = (pts[r.driver_name] ?? 0) + AVERAGE_LAP_PTS[i];
  });

  if (byFastest[0] && byAverage[0] && byFastest[0].driver_name === byAverage[0].driver_name) {
    pts[byFastest[0].driver_name] = (pts[byFastest[0].driver_name] ?? 0) + 2;
  }

  return pts;
};

const ChampionshipDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: '', driver_ids: [] as number[], race_ids: [] as number[] });
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set());

  const { data: championship, isLoading, error } = useQuery({
    queryKey: ['championship', id],
    queryFn: () => api.getChampionship(parseInt(id!)),
    enabled: !!id,
  });

  const { data: allDrivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => api.getDrivers(),
    enabled: editOpen,
  });

  const { data: allRaces } = useQuery({
    queryKey: ['races'],
    queryFn: () => api.getRaces(),
    enabled: editOpen,
  });

  // Fetch all race details in parallel to build the points-over-time chart
  const raceQueries = useQueries({
    queries: (championship?.races ?? []).map(race => ({
      queryKey: ['race', race.id],
      queryFn: () => api.getRace(race.id),
      enabled: !!championship,
    })),
  });

  const raceResultsLoading = raceQueries.some(q => q.isLoading);
  const raceResults = useMemo(() => {
    const map: Record<number, RaceDetail> = {};
    raceQueries.forEach(q => { if (q.data) map[q.data.id] = q.data; });
    return map;
  }, [raceQueries]);

  // Build cumulative points chart data, sorted by race date
  const chartData = useMemo(() => {
    if (!championship || raceResultsLoading) return [];

    const driverNames = championship.drivers.map(d => d.name);
    const driverNamesSet = new Set(driverNames);

    const sortedRaces = [...championship.races].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const running: Record<string, number> = {};
    driverNames.forEach(name => { running[name] = 0; });

    return sortedRaces.map((race, i) => {
      const detail = raceResults[race.id];
      if (detail) {
        const pts = calcRacePoints(detail.results, driverNamesSet);
        driverNames.forEach(name => {
          running[name] = (running[name] ?? 0) + (pts[name] ?? 0);
        });
      }
      return {
        index: i + 1,
        label: race.circuit_name ? `${race.circuit_name}\n${race.date}` : race.date,
        shortLabel: race.circuit_name ?? race.date,
        fullLabel: `Race ${i + 1}, ${formatRaceDate(race.date)}${race.circuit_name ? ` at ${race.circuit_name}` : ''}`,
        ...Object.fromEntries(driverNames.map(name => [name, running[name]])),
      };
    });
  }, [championship, raceResults, raceResultsLoading]);

  const driverNames = championship?.drivers.map(d => d.name) ?? [];

  // Initialise selected drivers once championship loads
  if (championship && selectedDrivers.size === 0 && driverNames.length > 0) {
    setSelectedDrivers(new Set(driverNames));
  }

  const toggleDriver = (name: string) => {
    setSelectedDrivers(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        if (next.size > 1) next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.updateChampionship>[1]) =>
      api.updateChampionship(parseInt(id!), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['championship', id] });
      queryClient.invalidateQueries({ queryKey: ['championships'] });
      setEditOpen(false);
      toast({ title: 'Championship updated' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update championship.', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteChampionship(parseInt(id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['championships'] });
      navigate('/championships');
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete championship.', variant: 'destructive' });
    },
  });

  const openEdit = () => {
    if (!championship) return;
    setForm({
      name: championship.name,
      driver_ids: championship.drivers.map(d => d.id),
      race_ids: championship.races.map(r => r.id),
    });
    setEditOpen(true);
  };

  const toggleId = (list: number[], id: number): number[] =>
    list.includes(id) ? list.filter(x => x !== id) : [...list, id];

  const handleUpdate = () => {
    if (!form.name.trim()) return;
    updateMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !championship) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">This championship doesn't exist.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/championships">
            <ArrowLeft />
            Back to championships
          </Link>
        </Button>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const entry = chartData.find(d => d.index === label);
      return (
        <div className="panel p-3 shadow-xl">
          <p className="font-semibold mb-2 text-sm">{entry?.fullLabel ?? label}</p>
          {payload
            .slice()
            .sort((a: any, b: any) => b.value - a.value)
            .map((p: any) => (
              <p key={p.name} className="text-sm flex justify-between gap-6" style={{ color: p.color }}>
                <span>{p.name}</span>
                <span className="lap-time">{p.value} pts</span>
              </p>
            ))}
        </div>
      );
    }
    return null;
  };

  const raceDays = groupRaceDays(
    championship.races.map(r => ({ id: r.id, date: r.date, circuit_name: r.circuit_name }))
  );

  const leader = championship.standings[0];
  const logo = getChampionshipLogo(championship.id);

  return (
    <div className="space-y-8 md:space-y-10 animate-fade-in">
      <PageHeader
        back={{ to: '/championships', label: 'Championships' }}
        leading={
          logo && <img src={logo} alt={`${championship.name} logo`} className="w-20 h-20 md:w-32 md:h-32 object-contain shrink-0" />
        }
        title={championship.name}
        subtitle={`${championship.drivers.length} drivers, ${championship.races.length} races`}
        actions={
          isLoggedIn && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={openEdit}>
                <Pencil />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete championship?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{championship.name}". The races themselves are kept.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete championship
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )
        }
      />

      {/* Standings */}
      {championship.standings.length === 0 ? (
        <div className="panel text-center py-12 text-muted-foreground">
          {championship.drivers.length === 0
            ? 'No standings yet. Add drivers to the championship.'
            : championship.races.length === 0
            ? 'No standings yet. Add races to the championship.'
            : 'No standings yet.'}
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
          <div className="space-y-3">
            <div className="panel p-3 md:p-5 overflow-hidden">
              <Podium
                title="Standings"
                tag={`${championship.races.length} races`}
                highlightClassName="text-primary"
                entries={championship.standings.map(s => ({
                  key: s.driver_id,
                  name: s.driver_name,
                  href: `/drivers/${s.driver_id}`,
                  value: `${s.total_points} pts`,
                }))}
              />
            </div>
            <div className="panel p-4 text-xs text-muted-foreground space-y-1.5">
              <p className="font-medium text-foreground text-sm mb-2">Points per race</p>
              <p className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 t-purple" /> Fastest lap: 10, 6, 4, 3, 2</p>
              <p className="flex items-center gap-2"><Star className="w-3.5 h-3.5 t-avg" /> Best average: 9, 5, 3, 2, 1</p>
              <p className="flex items-center gap-2"><Gift className="w-3.5 h-3.5 text-primary" /> Both in the same race: +2 bonus</p>
            </div>
          </div>

          <TimingTower
            header={
              <div className="panel-head text-xs text-muted-foreground">
                <span>Standings</span>
                <span>Gap / Points</span>
              </div>
            }
          >
            {championship.standings.map(s => (
              <TowerRow
                key={s.driver_id}
                position={s.position}
                name={s.driver_name}
                href={`/drivers/${s.driver_id}`}
                meta={
                  <span className="flex gap-3">
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 t-purple" />{s.fastest_lap_points}</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 t-avg" />{s.average_lap_points}</span>
                    {s.bonus_points > 0 && (
                      <span className="flex items-center gap-1"><Gift className="w-3 h-3 text-primary" />{s.bonus_points}</span>
                    )}
                    <span className="hidden sm:inline">{s.races_participated} races</span>
                  </span>
                }
                gap={leader && s.position > 1 ? `−${leader.total_points - s.total_points}` : ''}
                value={
                  <span className={cn('display text-2xl', s.position === 1 && 'text-primary')}>{s.total_points}</span>
                }
              />
            ))}
          </TimingTower>
        </div>
      )}

      {/* Points Over Time Chart */}
      {championship.drivers.length > 0 && championship.races.length > 0 && (
        <section className="panel p-4 md:p-6">
          <h2 className="section-title">Title fight</h2>
          <p className="text-sm text-muted-foreground mt-1">Points after each race</p>

          {raceResultsLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mt-4 mb-6">
                {driverNames.map((name, index) => {
                  const isSelected = selectedDrivers.has(name);
                  const color = getDriverColor(index);
                  const isLast = isSelected && selectedDrivers.size === 1;
                  return (
                    <button
                      key={name}
                      onClick={() => toggleDriver(name)}
                      disabled={isLast}
                      aria-pressed={isSelected}
                      className={cn(
                        'inline-flex items-center gap-2 h-8 px-3 rounded-sm text-sm font-medium border transition-colors',
                        isSelected ? 'bg-secondary border-border' : 'border-dashed border-border text-muted-foreground',
                        isLast && 'cursor-not-allowed'
                      )}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: isSelected ? color : 'transparent', boxShadow: `inset 0 0 0 1.5px ${color}` }}
                      />
                      {name}
                    </button>
                  );
                })}
              </div>

              <div className="h-72 md:h-96 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
                    <XAxis
                      dataKey="index"
                      {...chartAxis}
                      tickFormatter={v => `R${v}`}
                      interval="preserveStartEnd"
                    />
                    <YAxis {...chartAxis} width={40} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '3 3' }} />
                    {driverNames
                      .filter(name => selectedDrivers.has(name))
                      .map(name => {
                        const originalIndex = driverNames.indexOf(name);
                        return (
                          <Line
                            key={name}
                            type="monotone"
                            dataKey={name}
                            stroke={getDriverColor(originalIndex)}
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 5 }}
                            connectNulls
                          />
                        );
                      })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </section>
      )}

      {/* Races */}
      <section className="space-y-4">
        <h2 className="section-title">Race calendar</h2>
        {raceDays.length === 0 ? (
          <div className="panel text-center text-muted-foreground py-8 text-sm">No races in this championship yet.</div>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {raceDays.map(day => (
              <RaceDayCard key={day.key} day={day} />
            ))}
          </div>
        )}
      </section>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="display text-2xl uppercase">Edit championship</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <Label>Drivers</Label>
              {!allDrivers ? (
                <LoadingSpinner />
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-border p-3">
                  {allDrivers.map((d) => (
                    <div key={d.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`edit-driver-${d.id}`}
                        checked={form.driver_ids.includes(d.id)}
                        onCheckedChange={() => setForm(f => ({ ...f, driver_ids: toggleId(f.driver_ids, d.id) }))}
                      />
                      <label htmlFor={`edit-driver-${d.id}`} className="text-sm cursor-pointer">{d.name}</label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>Races</Label>
              {!allRaces ? (
                <LoadingSpinner />
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-border p-3">
                  {allRaces.map((r) => (
                    <div key={r.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`edit-race-${r.id}`}
                        checked={form.race_ids.includes(r.id)}
                        onCheckedChange={() => setForm(f => ({ ...f, race_ids: toggleId(f.race_ids, r.id) }))}
                      />
                      <label htmlFor={`edit-race-${r.id}`} className="text-sm cursor-pointer">
                        #{r.id} — {r.date}{r.circuit_name ? ` · ${r.circuit_name}` : ''}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              onClick={handleUpdate}
              disabled={!form.name.trim() || updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChampionshipDetailPage;
