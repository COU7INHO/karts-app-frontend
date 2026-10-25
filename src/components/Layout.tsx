import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Upload,
  Flag,
  Trophy,
  Users,
  MapPin,
  LogIn,
  LogOut,
  User,
  Medal,
  MoreHorizontal,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import BrandMark from '@/components/BrandMark';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: typeof Home;
  protected?: boolean;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/races', label: 'Races', icon: Flag },
  { path: '/championships', label: 'Championships', icon: Medal },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/drivers', label: 'Drivers', icon: Users },
  { path: '/circuits', label: 'Circuits', icon: MapPin },
  { path: '/upload', label: 'Upload race', icon: Upload, protected: true },
];

// Mobile tab bar shows the four most used sections; the rest live under "More"
const tabPaths = ['/', '/races', '/championships', '/leaderboard'];
const tabLabels: Record<string, string> = { '/championships': 'Champs', '/leaderboard': 'Ranking' };

const isActivePath = (pathname: string, path: string) =>
  path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`);

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const { isLoggedIn, username, isLoading, logout } = useAuth();

  const visibleNavItems = navItems.filter(item => !item.protected || isLoggedIn);
  const tabItems = navItems.filter(item => tabPaths.includes(item.path));
  const moreItems = visibleNavItems.filter(item => !tabPaths.includes(item.path));
  const moreActive = moreItems.some(item => isActivePath(location.pathname, item.path));

  useEffect(() => {
    setMoreOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="container mx-auto">
          <div className="flex items-center justify-between gap-4 h-14 md:h-16">
            <BrandMark />

            <nav className="hidden lg:flex items-center gap-1" aria-label="Main">
              {visibleNavItems.map(item => {
                const isActive = isActivePath(location.pathname, item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'relative px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute left-3 right-3 -bottom-[11px] h-[3px] bg-primary -skew-x-12" />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {isLoading ? (
                <div className="h-9 w-20 bg-secondary animate-pulse rounded-sm" />
              ) : isLoggedIn ? (
                <>
                  <span className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    {username}
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden lg:inline-flex">
                    <LogOut />
                    Log out
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                  <LogIn />
                  Log in
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="pt-[57px] md:pt-[65px] pb-24 lg:pb-12">
        <div className="container mx-auto py-6 md:py-10">{children}</div>
      </main>

      {/* Mobile / tablet tab bar */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur-md border-t border-border pb-safe"
        aria-label="Main"
      >
        <div className="grid grid-cols-5">
          {tabItems.map(item => {
            const Icon = item.icon;
            const isActive = isActivePath(location.pathname, item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 h-16 text-[11px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {isActive && <span className="absolute top-0 inset-x-4 h-[3px] bg-primary -skew-x-12" />}
                <Icon className="w-5 h-5" />
                {tabLabels[item.path] ?? item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1 h-16 text-[11px] font-medium',
              moreActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {moreActive && <span className="absolute top-0 inset-x-4 h-[3px] bg-primary -skew-x-12" />}
            <MoreHorizontal className="w-5 h-5" />
            More
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-md border-border pb-safe">
          <SheetHeader>
            <SheetTitle className="display text-2xl uppercase text-left">More</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {moreItems.map(item => {
              const Icon = item.icon;
              const isActive = isActivePath(location.pathname, item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 h-14 rounded-sm border text-sm font-medium',
                    isActive ? 'border-primary text-primary' : 'border-border bg-secondary/50'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            {isLoggedIn ? (
              <Button variant="outline" className="w-full" onClick={handleLogout}>
                <LogOut />
                Log out {username}
              </Button>
            ) : (
              <Button className="w-full" onClick={() => navigate('/login')}>
                <LogIn />
                Log in to upload races
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Layout;
