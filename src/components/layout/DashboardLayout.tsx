import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { logout } from '@/firebase/auth';
import { useToast } from '@/hooks/use-toast';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
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
      <main className="flex-1 lg:ml-0 md:ml-0">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
