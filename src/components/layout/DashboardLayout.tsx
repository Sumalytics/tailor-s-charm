import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { logout } from '@/firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import TrialCountdown from '@/components/billing/TrialCountdown';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const { subscription } = useSubscription();
  // Temporarily disable banner context to isolate the issue
  // const { bannerHeight } = useBanner();

  const handleLogout = async () => {
    const result = await logout();
    
    if (result.success) {
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
      navigate('/login');
    } else {
      toast({
        title: 'Logout failed',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar onLogout={handleLogout} />
      <BottomNav />
      <main className="flex-1 min-w-0 overflow-x-hidden lg:ml-0 md:ml-0">
        {/* pt-14 on mobile to clear header; pb-20 to clear bottom nav */}
        <div className="min-h-screen space-y-6 pt-14 pb-20 md:pt-0 md:pb-0 overflow-x-hidden">
          <div className="px-4 md:px-8 pt-6">
            <TrialCountdown
              subscription={subscription}
              onUpgrade={() => window.location.assign('/settings?tab=billing')}
            />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
