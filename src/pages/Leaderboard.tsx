import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useState } from 'react';
import { formatGap, shortLap, timeToSeconds } from '@/lib/timing';
import PageHeader from '@/components/racing/PageHeader';
import CircuitFilter from '@/components/racing/CircuitFilter';
import SegmentedControl from '@/components/racing/SegmentedControl';
import Podium from '@/components/racing/Podium';
import TimingTower, { TowerRow } from '@/components/racing/TimingTower';

type Period = 'overall' | 'last_year';
type Category = 'fastest' | 'average';

const LeaderboardPage = () => {
  const [period, setPeriod] = useState<Period>('overall');
  const [category, setCategory] = useState<Category>('fastest');
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
  const currentData = period === 'overall' ? leaderboard?.overall : leaderboard?.last_year;
  const entries = (category === 'fastest' ? currentData?.fastest_lap : currentData?.best_average_lap) ?? [];
  const timeOf = (e: (typeof entries)[number]) => (category === 'fastest' ? e.fastest_lap : e.average_lap);
  const leaderTime = entries[0] ? timeToSeconds(timeOf(entries[0])) : null;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Leaderboard"
        subtitle={selectedCircuit ? `Quickest drivers at ${selectedCircuit.name}` : 'Quickest drivers across every circuit'}
      />

      <div className="space-y-3">
        <CircuitFilter value={circuitFilter} onChange={setCircuitFilter} />
        <div className="flex flex-col sm:flex-row gap-3">
          <SegmentedControl<Category>
            label="Ranking"
            value={category}
            onChange={setCategory}
            options={[
              { value: 'fastest', label: 'Fastest lap' },
              { value: 'average', label: 'Best average' },
            ]}
          />
          <SegmentedControl<Period>
            label="Period"
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'overall', label: 'All time' },
              { value: 'last_year', label: 'Last 12 months' },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : entries.length > 0 ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
          <div className="panel p-3 md:p-5 overflow-hidden">
            <Podium
              title={category === 'fastest' ? 'Fastest lap' : 'Best average'}
              tag={period === 'overall' ? 'All time' : 'Last 12 months'}
              highlightClassName={category === 'fastest' ? 't-purple' : 't-avg'}
              entries={entries.map(e => ({
                key: e.driver_id,
                name: e.driver_name,
                href: `/drivers/${e.driver_id}`,
                value: shortLap(timeOf(e)),
              }))}
            />
          </div>
          <TimingTower
            header={
              <div className="panel-head text-xs text-muted-foreground">
                <span>{category === 'fastest' ? 'Personal best lap' : 'Best average over a race'}</span>
                <span>Gap / Time</span>
              </div>
            }
          >
            {entries.map((entry, index) => (
              <TowerRow
                key={`${category}-${period}-${circuitFilter}-${entry.driver_id}`}
                position={index + 1}
                name={entry.driver_name}
                href={`/drivers/${entry.driver_id}`}
                gap={formatGap(timeToSeconds(timeOf(entry)), leaderTime)}
                value={shortLap(timeOf(entry))}
                valueClassName={index === 0 ? (category === 'fastest' ? 't-purple' : 't-avg') : undefined}
                animateIndex={index}
              />
            ))}
          </TimingTower>
        </div>
      ) : (
        <div className="panel text-center py-12">
          <p className="text-muted-foreground">No laps recorded for this selection.</p>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
