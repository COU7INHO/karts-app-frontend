import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Upload, 
  Flag, 
  Trophy, 
  Users, 
  MapPin, 
  GitCompare,
  Menu,
  X,
  LogIn,
  LogOut,
  User
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/upload', label: 'Upload Race', icon: Upload, protected: true },
  { path: '/races', label: 'Races', icon: Flag },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/drivers', label: 'Drivers', icon: Users },
  { path: '/circuits', label: 'Circuits', icon: MapPin },
  { path: '/compare', label: 'Compare', icon: GitCompare },
];

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoggedIn, username, isLoading, logout } = useAuth();

  const handleNavClick = (item: typeof navItems[0], e: React.MouseEvent) => {
    if (item.protected && !isLoggedIn) {
      e.preventDefault();
      navigate('/login', { state: { message: 'You need to login first to upload a new race' } });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={(e) => handleNavClick(item, e)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Auth Section - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              {isLoading ? (
                <div className="h-9 w-20 bg-secondary animate-pulse rounded-lg" />
              ) : isLoggedIn ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>{username}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => navigate('/login')}
                  className="gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-secondary"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border bg-background animate-slide-in">
            <div className="container mx-auto px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={(e) => {
                      handleNavClick(item, e);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
              
              {/* Mobile Auth Section */}
              <div className="pt-4 border-t border-border mt-4">
                {isLoading ? (
                  <div className="h-10 bg-secondary animate-pulse rounded-lg" />
                ) : isLoggedIn ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-4 text-sm text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>Logged in as <strong>{username}</strong></span>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="default" 
                    className="w-full gap-2"
                    onClick={() => {
                      navigate('/login');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </Button>
                )}
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
