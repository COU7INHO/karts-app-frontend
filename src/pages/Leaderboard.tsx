import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { api, LeaderboardEntry } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/LoadingSpinner';
import PositionBadge from '@/components/PositionBadge';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const LeaderboardTable = ({ entries, type }: { entries: LeaderboardEntry[]; type: 'fastest' | 'average' }) => (
  <div className="bg-card rounded-lg border border-border overflow-hidden">
    <div className="overflow-x-auto">
    <table className="racing-table">
      <thead>
        <tr>
          <th className="w-16">Pos</th>
          <th>Driver</th>
          <th>{type === 'fastest' ? 'Fastest Lap' : 'Average Lap'}</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry, index) => (
          <tr key={entry.driver_id}>
            <td>
              <PositionBadge position={index + 1} />
            </td>
            <td>
              <Link
                to={`/drivers/${entry.driver_id}`}
                className="font-medium hover:text-primary transition-colors"
              >
                {entry.driver_name}
              </Link>
            </td>
            <td className="lap-time text-primary">
              {type === 'fastest' ? entry.fastest_lap : entry.average_lap}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  </div>
);

const LeaderboardPage = () => {
  const [period, setPeriod] = useState<'overall' | 'last_year'>('overall');
  const [circuitFilter, setCircuitFilter] = useState<string>('all');

  const { data: circuits } = useQuery({
    queryKey: ['circuits'],
    queryFn: () => api.getCircuits(),
  });

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', circuitFilter],
    queryFn: () => api.getLeaderboard(circuitFilter === 'all' ? undefined : parseInt(circuitFilter)),
  });

  const selectedCircuit = circuits?.find(c => c.id.toString() === circuitFilter);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const currentData = period === 'overall' ? leaderboard?.overall : leaderboard?.last_year;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="page-header flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg racing-gradient flex items-center justify-center">
            <Trophy className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="page-title">LEADERBOARD</h1>
            <p className="page-subtitle">
              {selectedCircuit 
                ? `Top performers at ${selectedCircuit.name}`
                : 'Top performers across all races'
              }
            </p>
          </div>
        </div>

        <Select value={circuitFilter} onValueChange={setCircuitFilter}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Filter by circuit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Circuits</SelectItem>
            {circuits?.map((circuit) => (
              <SelectItem key={circuit.id} value={circuit.id.toString()}>
                {circuit.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Period Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setPeriod('overall')}
          className={cn(
            'px-6 py-2 rounded-lg font-medium transition-colors',
            period === 'overall'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          )}
        >
          Overall
        </button>
        <button
          onClick={() => setPeriod('last_year')}
          className={cn(
            'px-6 py-2 rounded-lg font-medium transition-colors',
            period === 'last_year'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          )}
        >
          Last Year
        </button>
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="fastest" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="fastest">Fastest Lap</TabsTrigger>
          <TabsTrigger value="average">Best Average Lap</TabsTrigger>
        </TabsList>

        <TabsContent value="fastest" className="animate-fade-in">
          {currentData?.fastest_lap && currentData.fastest_lap.length > 0 ? (
            <LeaderboardTable entries={currentData.fastest_lap} type="fastest" />
          ) : (
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <p className="text-muted-foreground">No data available</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="average" className="animate-fade-in">
          {currentData?.best_average_lap && currentData.best_average_lap.length > 0 ? (
            <LeaderboardTable entries={currentData.best_average_lap} type="average" />
          ) : (
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <p className="text-muted-foreground">No data available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeaderboardPage;
