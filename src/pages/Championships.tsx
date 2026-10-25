import { useQueries, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Users, Flag, Plus, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/racing/PageHeader';
import { getChampionshipLogo } from '@/lib/championshipLogos';
import { TowerRow } from '@/components/racing/TimingTower';

const ChampionshipsPage = () => {
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', driver_ids: [] as number[], race_ids: [] as number[] });

  const { data: championships, isLoading } = useQuery({
    queryKey: ['championships'],
    queryFn: () => api.getChampionships(),
  });

  const details = useQueries({
    queries: (championships ?? []).map(c => ({
      queryKey: ['championship', String(c.id)],
      queryFn: () => api.getChampionship(c.id),
    })),
  });

  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => api.getDrivers(),
    enabled: createOpen,
  });

  const { data: races } = useQuery({
    queryKey: ['races'],
    queryFn: () => api.getRaces(),
    enabled: createOpen,
  });

  const createMutation = useMutation({
    mutationFn: api.createChampionship,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['championships'] });
      setCreateOpen(false);
      setForm({ name: '', driver_ids: [], race_ids: [] });
      navigate(`/championships/${data.id}`);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create championship.', variant: 'destructive' });
    },
  });

  const toggleId = (list: number[], id: number): number[] =>
    list.includes(id) ? list.filter(x => x !== id) : [...list, id];

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Championships"
        subtitle="Points tables across a season of races"
        actions={
          isLoggedIn && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus />
              New championship
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : championships && championships.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {championships.map((c, i) => {
            const detail = details[i]?.data;
            const logo = getChampionshipLogo(c.id);
            return (
              <Link
                key={c.id}
                to={`/championships/${c.id}`}
                className="panel group overflow-hidden hover:border-primary/60 transition-colors"
              >
                <div className="p-5 md:p-6 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="display uppercase text-3xl md:text-4xl group-hover:text-primary transition-colors">
                      {c.name}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2 flex gap-4">
                      <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{c.driver_count} drivers</span>
                      <span className="flex items-center gap-1.5"><Flag className="w-4 h-4" />{c.race_count} races</span>
                    </p>
                  </div>
                  {logo ? (
                    <img
                      src={logo}
                      alt={`${c.name} logo`}
                      className="w-24 h-24 md:w-28 md:h-28 object-contain shrink-0 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3"
                    />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0" />
                  )}
                </div>
                {detail && detail.standings.length > 0 && (
                  <div className="border-t border-border">
                    {detail.standings.slice(0, 3).map(s => (
                      <TowerRow
                        key={s.driver_id}
                        compact
                        position={s.position}
                        name={s.driver_name}
                        value={<>{s.total_points}<span className="text-xs text-muted-foreground ml-1">pts</span></>}
                      />
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="panel text-center py-16">
          <Trophy className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No championships yet.</p>
          {isLoggedIn && (
            <Button variant="outline" className="mt-4" onClick={() => setCreateOpen(true)}>
              Create the first championship
            </Button>
          )}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="display text-2xl uppercase">New championship</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="space-y-2">
              <Label htmlFor="champ-name">Name</Label>
              <Input
                id="champ-name"
                placeholder="Campeonato 2025"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <Label>
                Drivers <span className="text-destructive">*</span>
              </Label>
              {!drivers ? (
                <LoadingSpinner />
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-border p-3">
                  {drivers.map((d) => (
                    <div key={d.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`driver-${d.id}`}
                        checked={form.driver_ids.includes(d.id)}
                        onCheckedChange={() => setForm(f => ({ ...f, driver_ids: toggleId(f.driver_ids, d.id) }))}
                      />
                      <label htmlFor={`driver-${d.id}`} className="text-sm cursor-pointer">{d.name}</label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>Races</Label>
              {!races ? (
                <LoadingSpinner />
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-border p-3">
                  {races.map((r) => (
                    <div key={r.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`race-${r.id}`}
                        checked={form.race_ids.includes(r.id)}
                        onCheckedChange={() => setForm(f => ({ ...f, race_ids: toggleId(f.race_ids, r.id) }))}
                      />
                      <label htmlFor={`race-${r.id}`} className="text-sm cursor-pointer">
                        #{r.id} — {r.date}{r.circuit_name ? ` · ${r.circuit_name}` : ''}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name.trim() || form.driver_ids.length === 0 || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating…' : 'Create championship'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChampionshipsPage;
