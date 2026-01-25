export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';

export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type GarmentType = 'SHIRT' | 'TROUSERS' | 'SUIT' | 'DRESS' | 'SKIRT' | 'BLOUSE' | 'JACKET';

export type MeasurementUnit = 'INCHES' | 'CENTIMETERS';

export type FitType = 'REGULAR' | 'SLIM' | 'LOOSE';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  shopId?: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface Shop {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  ownerId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  shopId: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  createdBy: string;
  lastUpdatedAt: Date;
  lastUpdatedBy: string;
}

export interface Measurement {
  id: string;
  customerId: string;
  shopId: string;
  name: string;
  values: Record<string, number>;
  garmentType: GarmentType;
  unit: MeasurementUnit;
  fit: FitType;
  notes?: string;
  createdAt: Date;
  createdBy: string;
  usageCount: number;
}

export interface OrderItem {
  id: string;
  garmentType: string;
  description: string;
  measurements?: string;
  specifications: Record<string, unknown>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  shopId: string;
  customerId: string;
  customerName: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: OrderStatus;
  startDate: Date;
  dueDate: Date;
  completedDate?: Date;
  notes?: string;
  createdAt: Date;
  createdBy: string;
  lastUpdatedAt: Date;
  lastUpdatedBy: string;
}

export interface Payment {
  id: string;
  shopId: string;
  customerId: string;
  orderId?: string;
  amount: number;
  currency: string;
  type: 'ORDER_PAYMENT' | 'ADVANCE' | 'REFUND';
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

export interface DashboardStats {
  totalCustomers: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  pendingPayments: number;
}
