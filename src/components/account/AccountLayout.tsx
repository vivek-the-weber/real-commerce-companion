import { ReactNode } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { cn } from '@/lib/utils';
import { User, Package, MapPin, Heart, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AccountLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/account', label: 'Profile', icon: User },
  { href: '/account/orders', label: 'Orders', icon: Package },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
];

const AccountLayout = ({ children }: AccountLayoutProps) => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <StoreLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </StoreLayout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <StoreLayout>
      <div className="container-store py-8">
        <h1 className="font-display text-3xl mb-8">My Account</h1>
        
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-secondary'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
              
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-4 py-3 h-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={signOut}
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {children}
          </main>
        </div>
      </div>
    </StoreLayout>
  );
};

export default AccountLayout;
