import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SuperAdminDashboard from '@/pages/SuperAdminDashboard';
import Dashboard from '@/pages/Dashboard';

export default function DashboardRouter() {
  const navigate = useNavigate();
  const { userRole, shopId } = useAuth();

  useEffect(() => {
    // Redirect super admins to settings if they try to access regular dashboard
    if (userRole === 'SUPER_ADMIN') {
      navigate('/settings?tab=analytics', { replace: true });
    }
    // Redirect regular users to dashboard if they don't have a shop
    else if (!shopId) {
      navigate('/shop-setup', { replace: true });
    }
  }, [userRole, shopId, navigate]);

  // Show appropriate dashboard based on user role
  if (userRole === 'SUPER_ADMIN') {
    return <SuperAdminDashboard />;
  }

  return <Dashboard />;
}
