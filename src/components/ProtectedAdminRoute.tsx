import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== 'SUPER_ADMIN') {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          <div className="text-center">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">You need Super Admin privileges to access this page.</p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Current Role:</h3>
              <p className="text-gray-600">{userRole || 'No role assigned'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Contact your system administrator if you believe this is an error.</p>
              <button
                onClick={() => window.history.back()}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return <>{children}</>;
}
