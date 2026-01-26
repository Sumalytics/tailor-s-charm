import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Users, ShoppingBag, Clock, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats, useRecentOrders } from '@/hooks/useOptimizedQueries';
import { DashboardStats, Order } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { Skeleton } from '@/components/ui/skeleton';

export default function OptimizedDashboard() {
  const { currentUser, shopId } = useAuth();
  
  // Use React Query for optimized data fetching
  const { 
    data: stats, 
    isLoading: statsLoading, 
    error: statsError,
    refetch: refetchStats 
  } = useDashboardStats(shopId!);
  
  const { 
    data: recentOrders, 
    isLoading: ordersLoading, 
    error: ordersError,
    refetch: refetchOrders 
  } = useRecentOrders(shopId!);

  const isLoading = statsLoading || ordersLoading;
  const hasError = statsError || ordersError;

  const handleRetry = () => {
    refetchStats();
    refetchOrders();
  };

  if (hasError) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600 mb-4">
              {statsError?.message || ordersError?.message || 'Failed to load dashboard data'}
            </p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {currentUser?.displayName || 'User'}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your shop today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))
          ) : (
            <>
              <StatCard
                title="Total Customers"
                value={stats?.totalCustomers || 0}
                description="+12% from last month"
                icon={Users}
                trend={{ value: 12, isPositive: true }}
              />
              <StatCard
                title="Total Orders"
                value={stats?.totalOrders || 0}
                description="+8% from last month"
                icon={ShoppingBag}
                trend={{ value: 8, isPositive: true }}
              />
              <StatCard
                title="Pending Orders"
                value={stats?.pendingOrders || 0}
                description="Needs attention"
                icon={Clock}
                variant="warning"
              />
              <StatCard
                title="Total Revenue"
                value={formatCurrency(stats?.totalRevenue || 0)}
                description="+23% from last month"
                icon={DollarSign}
                trend={{ value: 23, isPositive: true }}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <RecentOrders 
              orders={recentOrders || []} 
              loading={ordersLoading}
              onRefresh={refetchOrders}
            />
          </div>

          {/* Quick Actions */}
          <div>
            <QuickActions />
          </div>
        </div>

        {/* Additional Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders?.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <ShoppingBag className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{order.customerName}</p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(order.total)} • {order.status}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">New Customers (30 days)</span>
                    <span className="text-sm font-medium">{stats?.newCustomersThisMonth || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completed Orders</span>
                    <span className="text-sm font-medium">{stats?.completedOrders || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Order Value</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(stats?.averageOrderValue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Conversion Rate</span>
                    <span className="text-sm font-medium">{stats?.conversionRate || 0}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
