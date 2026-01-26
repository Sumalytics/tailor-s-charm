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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

// Loading component for modals
const ModalLoading = () => (
  <div className="p-6 space-y-4">
    <Skeleton className="h-6 w-32" />
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i}>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
    <div className="flex justify-end space-x-2">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

// Lazy loaded components with proper loading states
export const LazyDashboard = lazy(() => import('@/pages/Dashboard').then(module => ({
  default: module.default
})));

export const LazyCustomers = lazy(() => import('@/pages/Customers').then(module => ({
  default: module.default
})));

export const LazyOrders = lazy(() => import('@/pages/Orders').then(module => ({
  default: module.default
})));

export const LazyMeasurements = lazy(() => import('@/pages/Measurements').then(module => ({
  default: module.default
})));

export const LazySettings = lazy(() => import('@/pages/Settings').then(module => ({
  default: module.default
})));

export const LazyPayments = lazy(() => import('@/pages/Payments').then(module => ({
  default: module.default
})));

export const LazyDebts = lazy(() => import('@/pages/Debts').then(module => ({
  default: module.default
})));

// Lazy loaded modal components
export const LazyNewCustomer = lazy(() => import('@/pages/NewCustomer').then(module => ({
  default: module.default
})));

export const LazyEditCustomer = lazy(() => import('@/pages/EditCustomer').then(module => ({
  default: module.default
})));

export const LazyCustomerDetail = lazy(() => import('@/pages/CustomerDetail').then(module => ({
  default: module.default
})));

export const LazyNewOrder = lazy(() => import('@/pages/NewOrder').then(module => ({
  default: module.default
})));

export const LazyOrderDetail = lazy(() => import('@/pages/OrderDetail').then(module => ({
  default: module.default
})));

export const LazyEditOrder = lazy(() => import('@/pages/EditOrder').then(module => ({
  default: module.default
})));

export const LazyNewMeasurement = lazy(() => import('@/pages/NewMeasurement').then(module => ({
  default: module.default
})));

export const LazyMeasurementDetail = lazy(() => import('@/pages/MeasurementDetail').then(module => ({
  default: module.default
})));

export const LazyNewPayment = lazy(() => import('@/pages/NewPayment').then(module => ({
  default: module.default
})));

export const LazyInvoiceGenerator = lazy(() => import('@/pages/InvoiceGenerator').then(module => ({
  default: module.default
})));

// Lazy loaded admin components
export const LazySuperAdminDashboard = lazy(() => import('@/pages/SuperAdminDashboard').then(module => ({
  default: module.default
})));

export const LazyShopsManagement = lazy(() => import('@/components/admin/ShopsManagement').then(module => ({
  default: module.default
})));

export const LazyAdminAnalytics = lazy(() => import('@/components/admin/AdminAnalytics').then(module => ({
  default: module.default
})));

// HOC for lazy loading with suspense
export const withLazyLoading = (Component: React.ComponentType, loadingComponent?: React.ComponentType) => {
  return (props: any) => (
    <Suspense fallback={loadingComponent || <RouteLoading />}>
      <Component {...props} />
    </Suspense>
  );
};

// HOC for modal lazy loading
export const withModalLazyLoading = (Component: React.ComponentType) => {
  return (props: any) => (
    <Suspense fallback={<ModalLoading />}>
      <Component {...props} />
    </Suspense>
  );
};

// Preload function for critical routes
export const preloadCriticalRoutes = () => {
  // Preload dashboard
  import('@/pages/Dashboard');
  
  // Preload common components
  import('@/components/dashboard/StatCard');
  import('@/components/dashboard/RecentOrders');
  import('@/components/dashboard/QuickActions');
};

// Intersection Observer for lazy loading images
export const useLazyImage = (src: string, options?: IntersectionObserverInit) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let observer: IntersectionObserver;

    if (imageRef && imageSrc !== src) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(imageRef);
          }
        },
        options
      );

      observer.observe(imageRef);
    }

    return () => {
      if (observer && observer.current) {
        observer.current.disconnect();
      }
    };
  }, [imageRef, imageSrc, src, options]);

  return [imageRef, imageSrc] as const;
};
