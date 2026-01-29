import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import AccountLocked from '@/components/billing/AccountLocked';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const location = useLocation();
  const { isLocked, loading, status } = useSubscription();
  const { userRole } = useAuth();

  // Super Admins should never be locked out
  const isAdminLocked = userRole === 'SUPER_ADMIN' ? false : isLocked;

  // Allow access to /settings when locked so user can open Billing tab and complete upgrade
  const isSettingsPage = location.pathname === '/settings';

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAdminLocked && !isSettingsPage) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <AccountLocked status={status} />;
  }

  return <>{children}</>;
}
