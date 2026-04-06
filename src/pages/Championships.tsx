import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Users, Flag, Plus, ChevronRight, Trash2 } from 'lucide-react';
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title">CHAMPIONSHIPS</h1>
          <p className="page-subtitle">Season standings and point tables</p>
        </div>
        {isLoggedIn && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Championship
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : championships && championships.length > 0 ? (
        <div className="space-y-3">
          {championships.map((c) => (
            <Link
              key={c.id}
              to={`/championships/${c.id}`}
              className="flex items-center justify-between p-5 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-display tracking-wider text-lg">{c.name}</p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {c.driver_count} drivers
                    </span>
                    <span className="flex items-center gap-1">
                      <Flag className="w-3.5 h-3.5" />
                      {c.race_count} races
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-lg border border-border">
          <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No championships yet</p>
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
            <DialogTitle className="font-display tracking-wider">NEW CHAMPIONSHIP</DialogTitle>
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
              {createMutation.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChampionshipsPage;
