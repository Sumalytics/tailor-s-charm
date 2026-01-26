import { lazy } from 'react';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Loading component for lazy loaded routes
const RouteLoading = () => (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

// Lazy loaded components with proper loading states
export const LazyDashboard = lazy(() => import('@/pages/Dashboard'));
export const LazyCustomers = lazy(() => import('@/pages/Customers'));
export const LazyOrders = lazy(() => import('@/pages/Orders'));
export const LazyMeasurements = lazy(() => import('@/pages/Measurements'));
export const LazySettings = lazy(() => import('@/pages/Settings'));
export const LazyPayments = lazy(() => import('@/pages/Payments'));
export const LazyDebts = lazy(() => import('@/pages/Debts'));

// Lazy loaded modal components
export const LazyNewCustomer = lazy(() => import('@/pages/NewCustomer'));
export const LazyEditCustomer = lazy(() => import('@/pages/EditCustomer'));
export const LazyCustomerDetail = lazy(() => import('@/pages/CustomerDetail'));
export const LazyNewOrder = lazy(() => import('@/pages/NewOrder'));
export const LazyOrderDetail = lazy(() => import('@/pages/OrderDetail'));
export const LazyEditOrder = lazy(() => import('@/pages/EditOrder'));
export const LazyNewMeasurement = lazy(() => import('@/pages/NewMeasurement'));
export const LazyMeasurementDetail = lazy(() => import('@/pages/MeasurementDetail'));
export const LazyNewPayment = lazy(() => import('@/pages/NewPayment'));
export const LazyInvoiceGenerator = lazy(() => import('@/pages/InvoiceGenerator'));

// Lazy loaded admin components
export const LazySuperAdminDashboard = lazy(() => import('@/pages/SuperAdminDashboard'));
export const LazyShopsManagement = lazy(() => import('@/components/admin/ShopsManagement'));
export const LazyAdminAnalytics = lazy(() => import('@/components/admin/AdminAnalytics'));

// HOC for lazy loading with suspense
export const withLazyLoading = (Component: React.ComponentType<any>) => {
  return (props: any) => (
    <Suspense fallback={<RouteLoading />}>
      <Component {...props} />
    </Suspense>
  );
};

// Preload function for critical routes
export const preloadCriticalRoutes = () => {
  import('@/pages/Dashboard');
  import('@/components/dashboard/StatCard');
  import('@/components/dashboard/RecentOrders');
  import('@/components/dashboard/QuickActions');
};
