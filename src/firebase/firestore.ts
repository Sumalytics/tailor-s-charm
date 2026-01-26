import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  increment,
  Query,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './config';
import type {
  User,
  Customer,
  Order,
  Payment,
  Measurement,
  Debt,
  BillingPlan,
  Subscription,
  NotificationSettings,
  UserRole,
  Shop,
  DashboardStats,
} from '@/types';

// Query interface for Firestore queries
export interface FirestoreQuery {
  field: string;
  operator: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'array-contains' | 'array-contains-any' | 'in' | 'not-in';
  value: any;
}

// Utility function to convert Firestore timestamps to Dates
const convertTimestamps = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (obj instanceof Timestamp) {
    return obj.toDate();
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertTimestamps(value);
    }
    return converted;
  }
  
  return obj;
};

// Generic CRUD operations with offline handling
export const getCollection = async <T>(collectionName: string, queries: FirestoreQuery[] = []): Promise<T[]> => {
  try {
    let q: Query = collection(db, collectionName);
    
    // Apply queries
    queries.forEach(({ field, operator, value }) => {
      q = query(q, where(field, operator, value));
    });
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as T));
  } catch (error) {
    console.error(`Error getting collection ${collectionName}:`, error);
    
    // Check if it's a network error
    if (error instanceof Error && (
      error.message.includes('network') ||
      error.message.includes('connection') ||
      error.message.includes('offline') ||
      error.message.includes('UNAVAILABLE')
    )) {
      console.warn('Network error detected - device may be offline');
      throw new Error('Network connection unavailable. Please check your internet connection.');
    }
    
    throw error;
  }
};

export const getDocument = async <T>(collectionName: string, docId: string): Promise<T | null> => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error getting document ${collectionName}/${docId}:`, error);
    
    // Check if it's a network error
    if (error instanceof Error && (
      error.message.includes('network') ||
      error.message.includes('connection') ||
      error.message.includes('offline') ||
      error.message.includes('UNAVAILABLE')
    )) {
      console.warn('Network error detected - device may be offline');
      throw new Error('Network connection unavailable. Please check your internet connection.');
    }
    
    throw error;
  }
};

// Generic add document function with offline handling
export const addDocument = async (collectionName: string, data: any): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    
    // Check if it's a network error
    if (error instanceof Error && (
      error.message.includes('network') ||
      error.message.includes('connection') ||
      error.message.includes('offline') ||
      error.message.includes('UNAVAILABLE')
    )) {
      console.warn('Network error detected - device may be offline');
      throw new Error('Unable to save data. Please check your internet connection and try again.');
    }
    
    throw error;
  }
};

// Generic update document function with offline handling
export const updateDocument = async (collectionName: string, docId: string, data: any): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error updating document ${collectionName}/${docId}:`, error);
    
    // Check if it's a network error
    if (error instanceof Error && (
      error.message.includes('network') ||
      error.message.includes('connection') ||
      error.message.includes('offline') ||
      error.message.includes('UNAVAILABLE')
    )) {
      console.warn('Network error detected - device may be offline');
      throw new Error('Unable to update data. Please check your internet connection and try again.');
    }
    
    throw error;
  }
};

// Generic delete document function with offline handling
export const deleteDocument = async (collectionName: string, docId: string): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document ${collectionName}/${docId}:`, error);
    
    // Check if it's a network error
    if (error instanceof Error && (
      error.message.includes('network') ||
      error.message.includes('connection') ||
      error.message.includes('offline') ||
      error.message.includes('UNAVAILABLE')
    )) {
      console.warn('Network error detected - device may be offline');
      throw new Error('Unable to delete data. Please check your internet connection and try again.');
    }
    
    throw error;
  }
};

// Shop specific operations
export const getShopByOwnerId = async (ownerId: string) => {
  const shops = await getCollection('shops', [
    { field: 'ownerId', operator: '==', value: ownerId }
  ]);
  return shops.length > 0 ? shops[0] : null;
};

// Customer specific operations
export const getCustomersByShop = async (shopId: string): Promise<Customer[]> => {
  return await getCollection<Customer>('customers', [
    { field: 'shopId', operator: '==', value: shopId }
  ]);
};

export const searchCustomers = async (shopId: string, searchTerm: string): Promise<Customer[]> => {
  // Search by name, phone, or email
  const customers = await getCustomersByShop(shopId);
  return customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchTerm)) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );
};

// Order specific operations
export const getOrdersByShop = async (shopId: string): Promise<Order[]> => {
  return await getCollection<Order>('orders', [
    { field: 'shopId', operator: '==', value: shopId }
  ]);
};

export const getOrdersByCustomer = async (customerId: string): Promise<Order[]> => {
  return await getCollection<Order>('orders', [
    { field: 'customerId', operator: '==', value: customerId }
  ]);
};

export const generateOrderNumber = async (shopId: string): Promise<string> => {
  const orders = await getCollection<Order>('orders', [
    { field: 'shopId', operator: '==', value: shopId }
  ], undefined, undefined, 1);
  
  const lastOrder = orders[0];
  const lastNumber = lastOrder ? parseInt(lastOrder.id.slice(-6)) : 0;
  const newNumber = lastNumber + 1;
  
  return `ORD-${newNumber.toString().padStart(6, '0')}`;
};

// Payment specific operations
export const getPaymentsByShop = async (shopId: string): Promise<Payment[]> => {
  return await getCollection<Payment>('payments', [
    { field: 'shopId', operator: '==', value: shopId }
  ]);
};

export const getPaymentsByOrder = async (orderId: string): Promise<Payment[]> => {
  return await getCollection<Payment>('payments', [
    { field: 'orderId', operator: '==', value: orderId }
  ]);
};

export const getTotalPaidForOrder = async (orderId: string): Promise<number> => {
  const payments = await getPaymentsByOrder(orderId);
  return payments
    .filter(payment => payment.status === 'COMPLETED' && payment.type !== 'REFUND')
    .reduce((total, payment) => total + payment.amount, 0);
};

// Measurement specific operations
export const getMeasurementsByCustomer = async (customerId: string): Promise<Measurement[]> => {
  return await getCollection<Measurement>('measurements', [
    { field: 'customerId', operator: '==', value: customerId }
  ]);
};

export const incrementMeasurementUsage = async (measurementId: string) => {
  const measurementRef = doc(db, 'measurements', measurementId);
  await updateDoc(measurementRef, {
    usageCount: increment(1)
  });
};

// File upload operations
export const uploadFile = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

export const deleteFile = async (path: string): Promise<void> => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};

// Debt tracking functions
export const createDebtRecord = async (order: Order, remainingAmount: number): Promise<string> => {
  const debtData: Omit<Debt, 'id'> = {
    shopId: order.shopId,
    customerId: order.customerId,
    customerName: order.customerName,
    orderId: order.id,
    orderDescription: order.description,
    originalAmount: order.amount,
    paidAmount: order.paidAmount || 0,
    remainingAmount,
    currency: order.currency,
    dueDate: order.dueDate,
    status: remainingAmount > 0 ? 'ACTIVE' : 'PAID',
    orderCompletedDate: new Date(),
    createdAt: new Date(),
    notes: `Debt from completed order: ${order.description}`,
  };

  const docRef = doc(collection(db, 'debts'));
  await setDoc(docRef, debtData);
  return docRef.id;
};

export const getCustomerDebts = async (shopId: string, customerId?: string): Promise<Debt[]> => {
  const constraints = [
    { field: 'shopId', operator: '==', value: shopId }
  ];
  
  if (customerId) {
    constraints.push({ field: 'customerId', operator: '==', value: customerId });
  }

  return await getCollection<Debt>('debts', constraints);
};

export const updateDebtPayment = async (debtId: string, paymentAmount: number): Promise<void> => {
  const debtRef = doc(db, 'debts', debtId);
  const debtDoc = await getDoc(debtRef);
  
  if (!debtDoc.exists()) {
    throw new Error('Debt record not found');
  }

  const debt = debtDoc.data() as Debt;
  const newPaidAmount = debt.paidAmount + paymentAmount;
  const newRemainingAmount = debt.remainingAmount - paymentAmount;
  
  await updateDoc(debtRef, {
    paidAmount: newPaidAmount,
    remainingAmount: newRemainingAmount,
    status: newRemainingAmount <= 0 ? 'PAID' : 'PARTIALLY_PAID',
    updatedAt: new Date(),
  });
};

export const getDebtsByShop = async (shopId: string): Promise<Debt[]> => {
  return await getCollection<Debt>('debts', [
    { field: 'shopId', operator: '==', value: shopId },
    { field: 'status', operator: 'in', value: ['ACTIVE', 'PARTIALLY_PAID'] }
  ]);
};

// Dashboard statistics
export const getDashboardStats = async (shopId: string) => {
  const customers = await getCustomersByShop(shopId);
  const orders = await getOrdersByShop(shopId);
  const payments = await getPaymentsByShop(shopId);
  
  const pendingOrders = orders.filter(order => order.status === 'PENDING').length;
  const completedOrders = orders.filter(order => order.status === 'COMPLETED').length;
  const totalRevenue = payments
    .filter(payment => {
      // Handle payments with undefined status (legacy data) - assume they are completed
      const isCompleted = payment.status === 'COMPLETED' || 
                         payment.status === undefined || 
                         payment.status === null;
      const isNotRefund = payment.type !== 'REFUND';
      return isCompleted && isNotRefund;
    })
    .reduce((total, payment) => total + payment.amount, 0);
  const pendingPayments = payments
    .filter(payment => payment.status === 'PENDING')
    .reduce((total, payment) => total + payment.amount, 0);

  return {
    totalCustomers: customers.length,
    totalOrders: orders.length,
    pendingOrders,
    completedOrders,
    totalRevenue,
    pendingPayments,
  };
};

// Billing Plans Management
export const getBillingPlans = async () => {
  console.log('Fetching billing plans from Firestore...');
  try {
    const plans = await getCollection<BillingPlan>('plans');
    console.log('Billing plans fetched successfully:', plans);
    return plans;
  } catch (error) {
    console.error('Error in getBillingPlans:', error);
    throw error;
  }
};

export const getBillingPlan = async (planId: string) => {
  return await getDocument<BillingPlan>('plans', planId);
};

export const createBillingPlan = async (planData: Omit<BillingPlan, 'id'>) => {
  return await addDocument<BillingPlan>('plans', planData);
};

export const updateBillingPlan = async (planId: string, updates: Partial<BillingPlan>) => {
  return await updateDocument('plans', planId, updates);
};

export const deleteBillingPlan = async (planId: string) => {
  return await deleteDocument('plans', planId);
};

// Subscription Management
export const getShopSubscription = async (shopId: string) => {
  const subscriptions = await getCollection<Subscription>('subscriptions', [
    { field: 'shopId', operator: '==', value: shopId }
  ]);
  return subscriptions[0] || null;
};

export const createSubscription = async (subscriptionData: Omit<Subscription, 'id'>) => {
  return await addDocument<Subscription>('subscriptions', subscriptionData);
};

export const updateSubscription = async (subscriptionId: string, updates: Partial<Subscription>) => {
  return await updateDocument('subscriptions', subscriptionId, updates);
};

export const cancelSubscription = async (subscriptionId: string) => {
  return await updateSubscription(subscriptionId, {
    status: 'CANCELLED',
    cancelledAt: new Date()
  });
};

// Notification Settings
export const getNotificationSettings = async (userId: string, shopId: string) => {
  const settings = await getCollection<NotificationSettings>('notificationSettings', [
    { field: 'userId', operator: '==', value: userId },
    { field: 'shopId', operator: '==', value: shopId }
  ]);
  return settings[0] || null;
};

export const updateNotificationSettings = async (settingsId: string, updates: Partial<NotificationSettings>) => {
  return await updateDocument('notificationSettings', settingsId, {
    ...updates,
    updatedAt: new Date()
  });
};

export const createNotificationSettings = async (settingsData: Omit<NotificationSettings, 'id'>) => {
  return await addDocument<NotificationSettings>('notificationSettings', settingsData);
};

// Team Management
export const getTeamMembers = async (shopId: string) => {
  const members = await getCollection<User>('users', [
    { field: 'shopId', operator: '==', value: shopId },
    { field: 'isActive', operator: '==', value: true }
  ]);
  return members;
};

export const updateTeamMemberRole = async (userId: string, role: UserRole) => {
  return await updateDocument('users', userId, { role });
};

export const removeTeamMember = async (userId: string) => {
  return await updateDocument('users', userId, { 
    shopId: null, 
    isActive: false 
  });
};

// Admin Dashboard Statistics
export const getPlatformStats = async () => {
  try {
    // Get all shops
    const shopsSnapshot = await getCollection<any>('shops', []);
    const totalShops = shopsSnapshot.length;

    // Get all users
    const usersSnapshot = await getCollection<any>('users', []);
    const totalUsers = usersSnapshot.length;

    // Get all billing plans
    const billingPlansSnapshot = await getCollection<any>('billingPlans', []);
    const activePlans = billingPlansSnapshot.filter((plan: any) => plan.isActive).length;

    // Calculate total revenue (sum of all subscription payments)
    const paymentsSnapshot = await getCollection<any>('payments', []);
    const totalRevenue = paymentsSnapshot.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);

    return {
      totalShops,
      totalUsers,
      totalRevenue,
      activePlans
    };
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return {
      totalShops: 0,
      totalUsers: 0,
      totalRevenue: 0,
      activePlans: 0
    };
  }
};

// Get all shops with their details
export const getAllShops = async () => {
  try {
    const shops = await getCollection<any>('shops', []);
    
    // Get additional details for each shop
    const shopsWithDetails = await Promise.all(
      shops.map(async (shop: any) => {
        // Get users for this shop
        const shopUsers = await getCollection<any>('users', [
          { field: 'shopId', operator: '==', value: shop.id }
        ]);
        
        // Get orders for this shop
        const shopOrders = await getCollection<any>('orders', [
          { field: 'shopId', operator: '==', value: shop.id }
        ]);
        
        // Get subscription for this shop
        const subscription = await getDocument<any>('subscriptions', shop.id);
        
        return {
          ...shop,
          userCount: shopUsers.length,
          orderCount: shopOrders.length,
          subscription: subscription,
          createdAt: shop.createdAt,
          isActive: shop.isActive !== false
        };
      })
    );
    
    return shopsWithDetails;
  } catch (error) {
    console.error('Error fetching all shops:', error);
    return [];
  }
};

// Get all users with their roles and shop details
export const getAllUsers = async () => {
  try {
    const users = await getCollection<any>('users', []);
    
    // Get shop details for each user
    const usersWithShopDetails = await Promise.all(
      users.map(async (user: any) => {
        let shopDetails = null;
        
        if (user.shopId) {
          shopDetails = await getDocument<any>('shops', user.shopId);
        }
        
        return {
          ...user,
          shop: shopDetails,
          hasShop: !!user.shopId
        };
      })
    );
    
    return usersWithShopDetails;
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
};

export { serverTimestamp, Timestamp };
