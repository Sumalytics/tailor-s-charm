import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { 
  getCollection, 
  getDocument, 
  addDocument, 
  updateDocument, 
  deleteDocument,
  getDashboardStats,
  getOrdersByShop,
  getCustomersByShop
} from '@/firebase/firestore';
import { queryKeys, cacheUtils } from '@/lib/react-query';
import { toast } from '@/hooks/use-toast';

// Generic hooks for CRUD operations
export function useCollection<T>(collectionName: string, queries: any[] = []) {
  return useQuery({
    queryKey: [collectionName, ...queries.map(q => `${q.field}-${q.value}`)],
    queryFn: () => getCollection<T>(collectionName, queries),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useDocument<T>(collectionName: string, docId: string) {
  return useQuery({
    queryKey: [collectionName, docId],
    queryFn: () => getDocument<T>(collectionName, docId),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!docId, // Only run if docId exists
  });
}

// Mutation hooks with optimistic updates
export function useAddDocument(collectionName: string, onSuccess?: () => void) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => addDocument(collectionName, data),
    onSuccess: () => {
      // Invalidate the collection query
      queryClient.invalidateQueries({ queryKey: [collectionName] });
      if (onSuccess) onSuccess();
      toast({
        title: 'Success',
        description: 'Item added successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add item',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateDocument(collectionName: string, docId: string, onSuccess?: () => void) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => updateDocument(collectionName, docId, data),
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [collectionName, docId] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData([collectionName, docId]);
      
      // Optimistically update to the new value
      queryClient.setQueryData([collectionName, docId], (old: any) => ({
        ...old,
        ...newData,
      }));
      
      return { previousData };
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData([collectionName, docId], context.previousData);
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to update item',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: [collectionName, docId] });
    },
    onSuccess: () => {
      if (onSuccess) onSuccess();
      toast({
        title: 'Success',
        description: 'Item updated successfully',
      });
    },
  });
}

export function useDeleteDocument(collectionName: string, onSuccess?: () => void) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (docId: string) => deleteDocument(collectionName, docId),
    onSuccess: () => {
      // Invalidate the collection query
      queryClient.invalidateQueries({ queryKey: [collectionName] });
      if (onSuccess) onSuccess();
      toast({
        title: 'Success',
        description: 'Item deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete item',
        variant: 'destructive',
      });
    },
  });
}

// Specific hooks for different entities
export function useDashboardStats(shopId: string) {
  return useQuery({
    queryKey: queryKeys.dashboardStats(shopId),
    queryFn: () => getDashboardStats(shopId),
    staleTime: 2 * 60 * 1000, // 2 minutes for dashboard stats
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!shopId,
  });
}

export function useRecentOrders(shopId: string, limit: number = 5) {
  return useQuery({
    queryKey: [...queryKeys.recentOrders(shopId), limit],
    queryFn: async () => {
      const orders = await getOrdersByShop(shopId);
      return orders.slice(0, limit);
    },
    staleTime: 1 * 60 * 1000, // 1 minute for recent orders
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!shopId,
  });
}

export function useCustomers(shopId: string) {
  return useQuery({
    queryKey: queryKeys.customers(shopId),
    queryFn: () => getCustomersByShop(shopId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!shopId,
  });
}

export function useOrders(shopId: string) {
  return useQuery({
    queryKey: queryKeys.orders(shopId),
    queryFn: () => getOrdersByShop(shopId),
    staleTime: 3 * 60 * 1000, // 3 minutes for orders
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!shopId,
  });
}

// Hook for batch operations
export function useBatchOperations() {
  const queryClient = useQueryClient();
  
  const invalidateMultiple = useCallback((shopId: string) => {
    return Promise.all([
      cacheUtils.invalidateCustomers(shopId),
      cacheUtils.invalidateOrders(shopId),
      cacheUtils.invalidateDashboard(shopId),
    ]);
  }, [queryClient]);
  
  return { invalidateMultiple };
}

// Hook for prefetching data
export function usePrefetchData() {
  const queryClient = useQueryClient();
  
  const prefetchShopData = useCallback((shopId: string) => {
    // Prefetch dashboard stats
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboardStats(shopId),
      queryFn: () => getDashboardStats(shopId),
      staleTime: 2 * 60 * 1000,
    });
    
    // Prefetch recent orders
    queryClient.prefetchQuery({
      queryKey: queryKeys.recentOrders(shopId),
      queryFn: async () => {
        const orders = await getOrdersByShop(shopId);
        return orders.slice(0, 5);
      },
      staleTime: 1 * 60 * 1000,
    });
  }, [queryClient]);
  
  return { prefetchShopData };
}
