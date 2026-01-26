import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Create a client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time in milliseconds that data remains fresh
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Time in milliseconds that inactive queries will remain in cache
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      // Number of times to retry failed requests
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('404')) return false;
        if (error instanceof Error && error.message.includes('403')) return false;
        if (error instanceof Error && error.message.includes('401')) return false;
        
        // Retry network errors up to 3 times
        return failureCount < 3;
      },
      // Delay between retries (exponential backoff)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus (disabled for mobile performance)
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Enable background refetching
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations
      retry: 1,
      // Don't retry mutations on certain errors
      retryDelay: 1000,
    },
  },
});

interface ReactQueryProviderProps {
  children: ReactNode;
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Query keys for consistent cache management
export const queryKeys = {
  // Shop related
  shops: ['shops'] as const,
  shop: (id: string) => ['shops', id] as const,
  shopStats: (id: string) => ['shops', id, 'stats'] as const,
  
  // Customer related
  customers: (shopId: string) => ['customers', shopId] as const,
  customer: (id: string) => ['customers', id] as const,
  
  // Order related
  orders: (shopId: string) => ['orders', shopId] as const,
  order: (id: string) => ['orders', id] as const,
  recentOrders: (shopId: string) => ['orders', shopId, 'recent'] as const,
  
  // Measurement related
  measurements: (shopId: string) => ['measurements', shopId] as const,
  measurement: (id: string) => ['measurements', id] as const,
  customerMeasurements: (customerId: string) => ['measurements', customerId] as const,
  
  // Payment related
  payments: (shopId: string) => ['payments', shopId] as const,
  payment: (id: string) => ['payments', id] as const,
  
  // Billing related
  billingPlans: ['billingPlans'] as const,
  subscription: (shopId: string) => ['subscription', shopId] as const,
  subscriptionStatus: (shopId: string) => ['subscription', shopId, 'status'] as const,
  
  // User related
  user: (id: string) => ['users', id] as const,
  userProfile: (id: string) => ['users', id, 'profile'] as const,
  
  // Dashboard related
  dashboardStats: (shopId: string) => ['dashboard', shopId, 'stats'] as const,
  
  // Admin related
  adminStats: ['admin', 'stats'] as const,
  adminShops: ['admin', 'shops'] as const,
  adminSubscriptions: ['admin', 'subscriptions'] as const,
} as const;

// Utility functions for cache management
export const cacheUtils = {
  // Invalidate related queries
  invalidateShop: (shopId: string) => {
    return queryClient.invalidateQueries({
      queryKey: ['shops', shopId],
    });
  },
  
  invalidateCustomers: (shopId: string) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.customers(shopId),
    });
  },
  
  invalidateOrders: (shopId: string) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.orders(shopId),
    });
  },
  
  invalidateMeasurements: (shopId: string) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.measurements(shopId),
    });
  },
  
  invalidatePayments: (shopId: string) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.payments(shopId),
    });
  },
  
  invalidateSubscription: (shopId: string) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.subscription(shopId),
    });
  },
  
  invalidateDashboard: (shopId: string) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.dashboardStats(shopId),
    });
  },
  
  // Prefetch data for better UX
  prefetchShopData: async (shopId: string) => {
    // This would be implemented with actual query functions
    // await queryClient.prefetchQuery({
    //   queryKey: queryKeys.shopStats(shopId),
    //   queryFn: () => getShopStats(shopId),
    // });
  },
  
  // Clear all cache (useful for logout)
  clearCache: () => {
    queryClient.clear();
  },
};
