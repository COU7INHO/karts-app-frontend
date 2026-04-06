import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Trophy, Users, Flag, Calendar, MapPin,
  Pencil, Trash2, Star, Zap, Gift,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import PositionBadge from '@/components/PositionBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const ChampionshipDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: '', driver_ids: [] as number[], race_ids: [] as number[] });

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
        <p className="text-muted-foreground">Championship not found</p>
        <Link to="/championships">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Championships
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/championships">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="page-title">{championship.name.toUpperCase()}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {championship.drivers.length} drivers · {championship.races.length} races
            </p>
          </div>
        </div>
        {isLoggedIn && (
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={openEdit} className="gap-2">
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete championship?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{championship.name}". This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Standings */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl tracking-wider">STANDINGS</h2>
        </div>

        {championship.standings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {championship.drivers.length === 0
              ? 'No standings yet — add drivers to the championship.'
              : championship.races.length === 0
              ? 'No standings yet — add races to the championship.'
              : 'No standings yet.'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="racing-table">
                <thead>
                  <tr>
                    <th className="w-16">Pos</th>
                    <th>Driver</th>
                    <th>Total Pts</th>
                    <th className="hidden sm:table-cell">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" /> Fastest
                      </span>
                    </th>
                    <th className="hidden sm:table-cell">
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" /> Average
                      </span>
                    </th>
                    <th className="hidden md:table-cell">
                      <span className="flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5" /> Bonus
                      </span>
                    </th>
                    <th className="hidden md:table-cell">Races</th>
                  </tr>
                </thead>
                <tbody>
                  {championship.standings.map((s) => {
                    const medal = MEDALS[s.position];
                    const isLeader = s.position === 1;
                    return (
                      <tr key={s.driver_id} className={cn(isLeader && 'bg-primary/5')}>
                        <td>
                          {medal ? (
                            <span className="text-lg">{medal}</span>
                          ) : (
                            <PositionBadge position={s.position} />
                          )}
                        </td>
                        <td className="font-medium">
                          <Link
                            to={`/drivers/${s.driver_id}`}
                            className="hover:text-primary transition-colors"
                          >
                            {s.driver_name}
                          </Link>
                        </td>
                        <td className={cn(
                          'font-bold text-lg tabular-nums',
                          isLeader && 'text-primary'
                        )}>
                          {s.total_points}
                        </td>
                        <td className="text-muted-foreground tabular-nums hidden sm:table-cell">
                          {s.fastest_lap_points}
                        </td>
                        <td className="text-muted-foreground tabular-nums hidden sm:table-cell">
                          {s.average_lap_points}
                        </td>
                        <td className="hidden md:table-cell">
                          {s.bonus_points > 0 ? (
                            <span className="text-amber-500 font-medium">+{s.bonus_points}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="text-muted-foreground hidden md:table-cell">
                          {s.races_participated}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Points legend */}
            <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground flex flex-wrap gap-4">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Fastest lap: 10/6/4/3/2 pts</span>
              <span className="flex items-center gap-1"><Star className="w-3 h-3" /> Best average: 9/5/3/2/1 pts</span>
              <span className="flex items-center gap-1"><Gift className="w-3 h-3" /> Double win bonus: +2 pts</span>
            </div>
          </>
        )}
      </div>

      {/* Drivers & Races side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Drivers */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg tracking-wider">DRIVERS</h2>
          </div>
          {championship.drivers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No drivers added</p>
          ) : (
            <ul className="divide-y divide-border">
              {championship.drivers.map((d) => {
                const standing = championship.standings.find(s => s.driver_id === d.id);
                return (
                  <li key={d.id} className="flex items-center justify-between px-4 py-3">
                    <Link to={`/drivers/${d.id}`} className="font-medium hover:text-primary transition-colors">
                      {d.name}
                    </Link>
                    {standing && (
                      <span className="text-sm text-muted-foreground">
                        {standing.total_points} pts
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Races */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <Flag className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg tracking-wider">RACES</h2>
          </div>
          {championship.races.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No races added</p>
          ) : (
            <ul className="divide-y divide-border">
              {championship.races.map((r) => (
                <li key={r.id} className="flex items-center justify-between px-4 py-3">
                  <Link to={`/races/${r.id}`} className="hover:text-primary transition-colors">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{r.date}</span>
                    </div>
                    {r.circuit_name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {r.circuit_name}
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">EDIT CHAMPIONSHIP</DialogTitle>
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
              {updateMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChampionshipDetailPage;
