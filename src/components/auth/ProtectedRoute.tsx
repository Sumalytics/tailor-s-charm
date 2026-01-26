import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import AccountLocked from '@/components/billing/AccountLocked';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isLocked, loading, status } = useSubscription();
  const { userRole } = useAuth();

  // Super Admins should never be locked out
  const isAdminLocked = userRole === 'SUPER_ADMIN' ? false : isLocked;

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAdminLocked) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <AccountLocked status={status} />;
  }

  return <>{children}</>;
}
