import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Flag, Users, MapPin, Upload, Calendar, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { isLoggedIn } = useAuth();
  const { data: races, isLoading: racesLoading } = useQuery({
    queryKey: ['races'],
    queryFn: () => api.getRaces(),
  });

  const { data: drivers, isLoading: driversLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => api.getDrivers(),
  });

  const { data: circuits, isLoading: circuitsLoading } = useQuery({
    queryKey: ['circuits'],
    queryFn: () => api.getCircuits(),
  });

  const isLoading = racesLoading || driversLoading || circuitsLoading;

  const recentRaces = races?.slice(0, 5) || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-background to-background border border-border p-8 md:p-12">
        <div className="checkered-pattern absolute inset-0 opacity-5" />
        <div className="relative z-10">
          <h1 className="text-5xl md:text-7xl font-display tracking-wider">
            SPEED <span className="text-primary">CHAMPION</span>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl text-lg">
            Track your karting performance, analyze lap times, and compete with friends on the leaderboard.
          </p>
          {isLoggedIn && (
            <Link to="/upload">
              <Button className="mt-6 gap-2 racing-gradient hover:opacity-90">
                <Upload className="w-4 h-4" />
                Upload New Race Results
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Races"
            value={races?.length || 0}
            icon={Flag}
            subtitle="Race sessions recorded"
          />
          <StatCard
            title="Total Drivers"
            value={drivers?.length || 0}
            icon={Users}
            subtitle="Registered racers"
          />
          <StatCard
            title="Total Circuits"
            value={circuits?.length || 0}
            icon={MapPin}
            subtitle="Tracks available"
          />
        </div>
      )}

      {/* Recent Races */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display tracking-wider">RECENT RACES</h2>
          <Link to="/races" className="text-primary hover:underline text-sm flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : recentRaces.length > 0 ? (
          <div className="space-y-2">
            {recentRaces.map((race) => (
              <Link
                key={race.id}
                to={`/races/${race.id}`}
                className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Flag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Race #{race.id}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {race.date}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <Flag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No races recorded yet</p>
            {isLoggedIn && (
              <Link to="/upload">
                <Button variant="outline" className="mt-4">
                  Upload your first race
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
