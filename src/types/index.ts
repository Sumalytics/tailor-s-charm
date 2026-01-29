export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';

export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type GarmentType = 'SHIRT' | 'TROUSERS' | 'SUIT' | 'DRESS' | 'SKIRT' | 'BLOUSE' | 'JACKET';

export type MeasurementUnit = 'CM' | 'INCHES';

export type FitType = 'SLIM' | 'REGULAR' | 'LOOSE';

export type Currency = 'GHS' | 'USD' | 'EUR' | 'GBP';

export type BillingPlanType = 'FREE' | 'PROFESSIONAL' | 'ENTERPRISE';

export type BillingCycle = 'DAILY' | 'MONTHLY' | 'YEARLY';

export interface BillingPlan {
  id: string;
  name: string;
  type: BillingPlanType;
  price: number;
  currency: Currency;
  billingCycle: BillingCycle;
  features: string[];
  limits: {
    customers: number;
    orders: number;
    teamMembers: number;
    storage: number; // in MB
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  shopId: string;
  planId: string;
  plan: BillingPlan;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'TRIAL';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  billingCycle: BillingCycle;
  cancelledAt?: Date;
  trialEndsAt?: Date;
  trialReminderSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  shopId: string;
  emailNotifications: {
    newOrders: boolean;
    payments: boolean;
    orderReminders: boolean;
    lowInventory: boolean;
    customerMessages: boolean;
    marketing: boolean;
  };
  pushNotifications: {
    newOrders: boolean;
    payments: boolean;
    orderReminders: boolean;
    lowInventory: boolean;
    customerMessages: boolean;
  };
  updatedAt: Date;
}

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
  logoUrl?: string;
  ownerId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  currency: Currency;
  subscription?: {
    planId: string;
    status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
    currentPeriodEnd: Date;
    billingCycle: 'MONTHLY' | 'YEARLY';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  shopId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface Measurement {
  id: string;
  customerId: string;
  customerName: string;
  shopId: string;
  name: string;
  garmentType: GarmentType;
  unit: MeasurementUnit;
  fit: FitType;
  measurements: Record<string, number>;
  notes?: string;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  usageCount?: number;
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
  description: string;
  amount: number;
  paidAmount?: number;
  status: OrderStatus;
  dueDate?: Date;
  currency: Currency;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
}

export interface Payment {
  id: string;
  shopId: string;
  customerId: string;
  orderId?: string;
  amount: number;
  currency: Currency;
  type: 'ORDER_PAYMENT' | 'ADVANCE' | 'REFUND';
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: Date;
  createdBy: string;
}

export interface Debt {
  id: string;
  shopId: string;
  customerId: string;
  customerName: string;
  orderId: string;
  orderDescription: string;
  originalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: Currency;
  dueDate?: Date;
  status: 'ACTIVE' | 'PARTIALLY_PAID' | 'PAID' | 'WRITTEN_OFF';
  orderCompletedDate: Date;
  createdAt: Date;
  updatedAt?: Date;
  notes?: string;
}

export interface Receipt {
  id: string;
  shopId: string;
  orderId: string;
  paymentId: string;
  receiptNumber: string;
  customerName: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  balance: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  printedAt?: Date;
  createdAt: Date;
  createdBy: string;
}

export interface ReceiptItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  shopId: string;
  orderId: string;
  invoiceNumber: string;
  customerName: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  balance: number;
  currency: Currency;
  dueDate: Date;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

export interface InvoiceItem {
  description: string;
  garmentType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface DashboardStats {
  totalCustomers: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  pendingPayments: number;
}
