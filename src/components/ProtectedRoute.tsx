import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requireShop?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  requireShop = false 
}) => {
  const { currentUser, loading, userRole, shopId } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requireShop && !shopId) {
    return <Navigate to="/shop-setup" replace />;
  }

  return <>{children}</>;
};
