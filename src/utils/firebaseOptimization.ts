import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  endBefore, 
  getDocs, 
  doc, 
  getDoc,
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/firebase/config';

// Pagination utilities
export interface PaginationOptions {
  pageSize?: number;
  startAfter?: any;
  endBefore?: any;
}

export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  hasPrevious: boolean;
  lastVisible?: any;
  firstVisible?: any;
}

// Generic paginated query function
export async function getPaginatedCollection<T>(
  collectionName: string,
  options: PaginationOptions & {
    where?: { field: string; operator: '==' | '!=' | '>' | '>=' | '<' | '<='; value: any }[];
    orderBy?: { field: string; direction: 'asc' | 'desc' };
  } = {}
): Promise<PaginatedResult<T>> {
  const {
    pageSize = 20,
    startAfter: startAfterDoc,
    endBefore: endBeforeDoc,
    where: whereClauses = [],
    orderBy: orderByClause
  } = options;

  let q = collection(db, collectionName);

  // Apply where clauses
  whereClauses.forEach(clause => {
    q = query(q, where(clause.field, clause.operator, clause.value));
  });

  // Apply ordering
  if (orderByClause) {
    q = query(q, orderBy(orderByClause.field, orderByClause.direction));
  }

  // Apply pagination
  if (startAfterDoc) {
    q = query(q, startAfter(startAfterDoc));
  } else if (endBeforeDoc) {
    q = query(q, endBefore(endBeforeDoc), limit(pageSize));
  } else {
    q = query(q, limit(pageSize + 1)); // Get one extra to check if there's more
  }

  const snapshot = await getDocs(q);
  const docs = snapshot.docs;

  const hasMore = docs.length > pageSize;
  const hasPrevious = !!endBeforeDoc;

  // Remove the extra document if it exists
  const data = hasMore ? docs.slice(0, -1) : docs;

  return {
    data: data.map(doc => ({ id: doc.id, ...doc.data() } as T)),
    hasMore,
    hasPrevious,
    lastVisible: docs.length > 0 ? docs[docs.length - 1] : undefined,
    firstVisible: docs.length > 0 ? docs[0] : undefined,
  };
}

// Optimized customer queries with pagination
export async function getPaginatedCustomers(
  shopId: string,
  options: PaginationOptions & {
    search?: string;
    status?: 'active' | 'inactive';
  } = {}
): Promise<PaginatedResult<any>> {
  const { search, status, ...paginationOptions } = options;

  let whereClauses = [{ field: 'shopId', operator: '==' as const, value: shopId }];

  if (status) {
    whereClauses.push({ 
      field: 'isActive', 
      operator: '==' as const, 
      value: status === 'active' 
    });
  }

  // Note: For search, we might need to implement client-side filtering
  // or use Algolia/ElasticSearch for better performance

  return getPaginatedCollection('customers', {
    ...paginationOptions,
    where: whereClauses,
    orderBy: { field: 'createdAt', direction: 'desc' }
  });
}

// Optimized order queries with pagination
export async function getPaginatedOrders(
  shopId: string,
  options: PaginationOptions & {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<PaginatedResult<any>> {
  const { status, startDate, endDate, ...paginationOptions } = options;

  let whereClauses = [{ field: 'shopId', operator: '==' as const, value: shopId }];

  if (status) {
    whereClauses.push({ field: 'status', operator: '==' as const, value: status });
  }

  if (startDate) {
    whereClauses.push({ 
      field: 'createdAt', 
      operator: '>=' as const, 
      value: Timestamp.fromDate(startDate) 
    });
  }

  if (endDate) {
    whereClauses.push({ 
      field: 'createdAt', 
      operator: '<=' as const, 
      value: Timestamp.fromDate(endDate) 
    });
  }

  return getPaginatedCollection('orders', {
    ...paginationOptions,
    where: whereClauses,
    orderBy: { field: 'createdAt', direction: 'desc' }
  });
}

// Batch operations for efficiency
export class BatchOperations {
  private batch: any;
  private operations: any[] = [];

  constructor() {
    this.batch = writeBatch(db);
  }

  add(collectionName: string, data: any) {
    const docRef = doc(collection(db, collectionName));
    this.batch.set(docRef, data);
    this.operations.push({ type: 'add', ref: docRef, data });
    return docRef.id;
  }

  update(collectionName: string, docId: string, data: any) {
    const docRef = doc(db, collectionName, docId);
    this.batch.update(docRef, data);
    this.operations.push({ type: 'update', ref: docRef, data });
  }

  delete(collectionName: string, docId: string) {
    const docRef = doc(db, collectionName, docId);
    this.batch.delete(docRef);
    this.operations.push({ type: 'delete', ref: docRef });
  }

  async commit() {
    try {
      await this.batch.commit();
      const result = {
        success: true,
        operations: this.operations.length
      };
      this.operations = [];
      this.batch = writeBatch(db);
      return result;
    } catch (error) {
      console.error('Batch operation failed:', error);
      throw error;
    }
  }

  getOperationsCount() {
    return this.operations.length;
  }
}

// Optimized dashboard stats with caching
export async function getOptimizedDashboardStats(shopId: string) {
  const statsRef = doc(db, 'shops', shopId, 'stats', 'current');
  const statsDoc = await getDoc(statsRef);

  if (statsDoc.exists()) {
    const stats = statsDoc.data();
    const lastUpdated = stats.lastUpdated?.toDate();
    const now = new Date();

    // If stats are less than 5 minutes old, return cached data
    if (lastUpdated && (now.getTime() - lastUpdated.getTime()) < 5 * 60 * 1000) {
      return stats;
    }
  }

  // Calculate fresh stats
  const [
    customersSnapshot,
    ordersSnapshot,
    paymentsSnapshot
  ] = await Promise.all([
    getDocs(query(collection(db, 'customers'), where('shopId', '==', shopId))),
    getDocs(query(collection(db, 'orders'), where('shopId', '==', shopId))),
    getDocs(query(collection(db, 'payments'), where('shopId', '==', shopId)))
  ]);

  const stats = {
    totalCustomers: customersSnapshot.size,
    totalOrders: ordersSnapshot.size,
    completedOrders: ordersSnapshot.docs.filter(doc => doc.data().status === 'completed').length,
    pendingOrders: ordersSnapshot.docs.filter(doc => doc.data().status === 'pending').length,
    totalRevenue: paymentsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0),
    pendingPayments: paymentsSnapshot.docs.filter(doc => doc.data().status === 'pending').length,
    lastUpdated: new Date(),
  };

  // Cache the stats
  await statsRef.set(stats);

  return stats;
}

// Real-time listener utilities
export function createRealtimeListener<T>(
  collectionName: string,
  constraints: {
    where?: { field: string; operator: '==' | '!=' | '>' | '>=' | '<' | '<='; value: any }[];
    orderBy?: { field: string; direction: 'asc' | 'desc' };
    limit?: number;
  },
  callback: (data: T[]) => void,
  errorCallback?: (error: Error) => void
) {
  const { where: whereClauses = [], orderBy: orderByClause, limit: limitCount } = constraints;

  let q = collection(db, collectionName);

  // Apply constraints
  whereClauses.forEach(clause => {
    q = query(q, where(clause.field, clause.operator, clause.value));
  });

  if (orderByClause) {
    q = query(q, orderBy(orderByClause.field, orderByClause.direction));
  }

  if (limitCount) {
    q = query(q, limit(limitCount));
  }

  // Note: In a real implementation, you would use onSnapshot here
  // For now, this is a placeholder that would need the actual onSnapshot import
  console.log('Real-time listener setup for:', collectionName, constraints);
  
  // Return unsubscribe function
  return () => {
    console.log('Unsubscribing from:', collectionName);
  };
}

// Index optimization suggestions
export const FIRESTORE_INDEXES = [
  {
    collection: 'customers',
    fields: ['shopId', 'isActive', 'createdAt'],
    queryScope: 'Collection'
  },
  {
    collection: 'orders', 
    fields: ['shopId', 'status', 'createdAt'],
    queryScope: 'Collection'
  },
  {
    collection: 'payments',
    fields: ['shopId', 'status', 'createdAt'],
    queryScope: 'Collection'
  },
  {
    collection: 'subscriptions',
    fields: ['shopId', 'status', 'currentPeriodEnd'],
    queryScope: 'Collection'
  }
];

// Function to generate index creation URLs
export function generateIndexUrl(index: typeof FIRESTORE_INDEXES[0]) {
  const baseUrl = 'https://console.firebase.google.com/project';
  // This would need to be adapted based on your Firebase project ID
  return `${baseUrl}/database/firestore/indexes`;
}

// Cache management utilities
export class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  size() {
    return this.cache.size;
  }
}

export const cacheManager = new CacheManager();
