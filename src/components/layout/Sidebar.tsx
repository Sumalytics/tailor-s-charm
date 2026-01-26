import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  CreditCard,
  Ruler,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

// Regular shop owner navigation
const regularNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Orders', href: '/orders', icon: ShoppingBag },
  { label: 'Measurements', href: '/measurements', icon: Ruler },
  { label: 'Payments', href: '/payments', icon: CreditCard },
  { label: 'Settings', href: '/settings', icon: Settings },
];

// Super admin navigation
const superAdminNavItems: NavItem[] = [
  { label: 'Analytics', href: '/settings?tab=analytics', icon: BarChart3 },
  { label: 'Shops', href: '/settings?tab=shops', icon: Store },
  { label: 'Billing Plans', href: '/settings?tab=admin', icon: PieChart },
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  onLogout?: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { currentUser, userRole } = useAuth();

  // Determine which navigation items to show
  const navItems = userRole === 'SUPER_ADMIN' ? superAdminNavItems : regularNavItems;

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary overflow-hidden">
          <img 
            src={logo} 
            alt="TailorFlow Logo" 
            className="h-8 w-8 object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-sidebar-foreground truncate">TailorFlow</h1>
          <p className="text-xs text-sidebar-foreground/60 truncate">Shop Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3 min-w-0">
          {currentUser?.photoURL ? (
            <img 
              src={currentUser.photoURL} 
              alt="Profile" 
              className="h-9 w-9 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-sidebar-foreground">
                {currentUser?.displayName?.split(' ').map((n) => n[0]).join('') || 'U'}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {currentUser?.displayName || 'User'}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {currentUser?.role || 'Staff'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate">Sign out</span>
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar flex flex-col transition-transform duration-300 md:relative md:translate-x-0 md:flex-shrink-0',
          'md:w-56',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
