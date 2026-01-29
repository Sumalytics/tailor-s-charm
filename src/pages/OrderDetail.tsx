import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, getCollection, updateDocument, createDebtRecord, getMeasurementsByCustomer } from '@/firebase/firestore';
import { Order, Customer, Payment, Measurement } from '@/types';
import type { GarmentType, FitType } from '@/types';
import {
  ArrowLeft,
  Edit,
  FileText,
  MessageCircle,
  Calendar,
  User,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Ruler,
  Plus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const garmentLabels: Record<GarmentType, string> = {
  SHIRT: 'Shirt',
  TROUSERS: 'Trousers',
  SUIT: 'Suit',
  DRESS: 'Dress',
  SKIRT: 'Skirt',
  BLOUSE: 'Blouse',
  JACKET: 'Jacket',
};

const fitLabels: Record<FitType, string> = {
  SLIM: 'Slim',
  REGULAR: 'Regular',
  LOOSE: 'Loose',
};

const safeDate = (date: any): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date === 'object' && date.toDate) return date.toDate();
  return new Date(date);
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shopId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrderData();
    }
  }, [id]);

  const loadOrderData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      // Load order
      const orderData = await getDocument<Order>('orders', id);
      if (!orderData || orderData.shopId !== shopId) {
        toast({
          title: 'Order not found',
          description: 'The order you are looking for does not exist.',
          variant: 'destructive',
        });
        navigate('/orders');
        return;
      }

      // Load customer
      const customerData = await getDocument<Customer>('customers', orderData.customerId);
      
      // Load payments
      const paymentsList = await getCollection<Payment>('payments', [
        { field: 'orderId', operator: '==', value: id }
      ]);

      setOrder(orderData);
      setCustomer(customerData);
      setPayments(paymentsList.sort((a, b) => 
        safeDate(b.createdAt).getTime() - safeDate(a.createdAt).getTime()
      ));

      // Load customer measurements
      setLoadingMeasurements(true);
      try {
        const measurementsList = await getMeasurementsByCustomer(orderData.customerId);
        setMeasurements(measurementsList.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      } catch (e) {
        console.warn('Failed to load customer measurements', e);
        setMeasurements([]);
      } finally {
        setLoadingMeasurements(false);
      }

    } catch (error) {
      console.error('Error loading order:', error);
      toast({
        title: 'Error loading order',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'IN_PROGRESS':
        return <AlertCircle className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTotalPaid = () => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const getRemainingBalance = () => {
    if (!order) return 0;
    const totalPaid = getTotalPaid();
    return order.amount - totalPaid;
  };

  const isOverdue = () => {
    if (!order || !order.dueDate) return false;
    const remaining = getRemainingBalance();
    return remaining > 0 && safeDate(order.dueDate) < new Date();
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;

    try {
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date(),
      };

      // If marking as complete, check for outstanding balance
      if (newStatus === 'COMPLETED') {
        const totalPaid = getTotalPaid();
        const remaining = getRemainingBalance();
        
        if (remaining > 0) {
          // Create debt record for outstanding balance
          await createDebtRecord(order, remaining);
          toast({
            title: 'Order completed with outstanding balance',
            description: `Debt record created for ${order.currency} ${remaining.toFixed(2)}`,
          });
        } else {
          toast({
            title: 'Order completed',
            description: 'Order has been fully paid and completed.',
          });
        }
      }

      await updateDocument('orders', order.id, updateData);
      setOrder({ ...order, status: newStatus as any });
      
      if (newStatus !== 'COMPLETED') {
        toast({
          title: 'Status updated',
          description: `Order status changed to ${newStatus.replace('_', ' ')}`,
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error updating status',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateInvoice = () => {
    navigate(`/orders/${order?.id}/invoice`);
  };

  const handleWhatsAppShare = () => {
    if (!order || !customer) return;

    const totalPaid = getTotalPaid();
    const remaining = getRemainingBalance();
    const message = `Hello ${customer.name}! 👋\n\nYour order details:\n📋 Order: ${order.description}\n💰 Total: ${order.currency} ${order.amount.toFixed(2)}\n💳 Paid: ${order.currency} ${totalPaid.toFixed(2)}\n💵 Remaining: ${order.currency} ${remaining.toFixed(2)}\n📅 Due: ${order.dueDate ? safeDate(order.dueDate).toLocaleDateString() : 'Not set'}\n📊 Status: ${order.status}\n\nView your invoice: ${window.location.origin}/invoice/${order.id}\n\nThank you for your business! 🧵`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

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

  if (!order || !customer) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          <p>Order not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const totalPaid = getTotalPaid();
  const remaining = getRemainingBalance();
  const overdue = isOverdue();

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/orders')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Orders</span>
            </Button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Order Details</h1>
              <p className="text-muted-foreground">
                Order #{order.id.slice(-6)} • {safeDate(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2">
                  {getStatusIcon(order.status)}
                  <span>{order.status.replace('_', ' ')}</span>
                  <AlertCircle className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Change Order Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleStatusUpdate('PENDING')}
                  disabled={order.status === 'PENDING'}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Pending
                  {order.status === 'PENDING' && <span className="ml-auto text-xs">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleStatusUpdate('IN_PROGRESS')}
                  disabled={order.status === 'IN_PROGRESS'}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  In Progress
                  {order.status === 'IN_PROGRESS' && <span className="ml-auto text-xs">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleStatusUpdate('COMPLETED')}
                  disabled={order.status === 'COMPLETED'}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completed
                  {order.status === 'COMPLETED' && <span className="ml-auto text-xs">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleStatusUpdate('CANCELLED')}
                  disabled={order.status === 'CANCELLED'}
                  className="text-red-600 focus:text-red-600"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Cancelled
                  {order.status === 'CANCELLED' && <span className="ml-auto text-xs">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Quick status change buttons */}
            {order.status !== 'COMPLETED' && (
              <Button 
                onClick={() => handleStatusUpdate('COMPLETED')}
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            )}
            {order.status === 'PENDING' && (
              <Button 
                onClick={() => handleStatusUpdate('IN_PROGRESS')}
                variant="default"
                size="sm"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Start Work
              </Button>
            )}
            <Button onClick={() => navigate(`/orders/${order.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-lg">{order.description}</h3>
                  <Badge 
                    className={cn("mt-2", getStatusColor(order.status))}
                  >
                    {getStatusIcon(order.status)}
                    {order.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                {order.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-muted-foreground">{order.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p className="font-medium">{safeDate(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className={cn("font-medium", overdue && "text-red-600")}>
                      {order.dueDate ? safeDate(order.dueDate).toLocaleDateString() : 'Not set'}
                      {overdue && <span className="text-xs block">Overdue</span>}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-medium text-primary">
                      {customer.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">{customer.name}</h3>
                    <p className="text-sm text-muted-foreground">Customer</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customer.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center space-x-2 md:col-span-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Customer measurements */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Ruler className="h-5 w-5" />
                    Customer measurements
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/measurements/new?customerId=${order.customerId}`)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <CardDescription>
                  Measurement records for {customer.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingMeasurements ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : measurements.length === 0 ? (
                  <div className="text-center py-6">
                    <Ruler className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No measurements recorded</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => navigate(`/measurements/new?customerId=${order.customerId}`)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add measurement
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {measurements.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/measurements/${m.id}`)}
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">{m.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {garmentLabels[m.garmentType] ?? m.garmentType} · {fitLabels[m.fit] ?? m.fit}
                            {m.usageCount != null && m.usageCount > 0 && (
                              <span> · Used {m.usageCount} time{m.usageCount === 1 ? '' : 's'}</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {Object.entries(m.measurements).length > 0 && (
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                              {Object.entries(m.measurements).length} values
                            </span>
                          )}
                          <span className="text-xs text-primary font-medium">View</span>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(`/measurements/new?customerId=${order.customerId}`)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add measurement
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  Track all payments for this order
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No payments recorded yet</p>
                    <Button 
                      onClick={() => navigate(`/payments/new?orderId=${order.id}`)}
                      className="mt-4"
                      variant="outline"
                    >
                      Record Payment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments?.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{payment.method || 'Unknown Method'}</p>
                          <p className="text-sm text-muted-foreground">
                            {safeDate(payment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{payment.currency} {payment.amount.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.type ? payment.type.replace('_', ' ') : 'Payment'}
                          </p>
                        </div>
                      </div>
                    ))}
                    <Button 
                      onClick={() => navigate(`/payments/new?orderId=${order.id}`)}
                      className="w-full"
                    >
                      Record Additional Payment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">{order.currency} {order.amount.toFixed(2)}</p>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-xl font-semibold text-green-600">
                    {order.currency} {totalPaid.toFixed(2)}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm text-muted-foreground">Remaining Balance</p>
                  <p className={cn(
                    "text-xl font-semibold",
                    remaining === 0 ? "text-green-600" : overdue ? "text-red-600" : "text-yellow-600"
                  )}>
                    {order.currency} {remaining.toFixed(2)}
                  </p>
                </div>

                <div className="pt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${(totalPaid / order.amount) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {Math.round((totalPaid / order.amount) * 100)}% Paid
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={() => navigate(`/orders/${order.id}/edit`)} className="w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Order
                </Button>
                <Button onClick={handleGenerateInvoice} variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Invoice
                </Button>
                <Button onClick={handleWhatsAppShare} variant="outline" className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send via WhatsApp
                </Button>
                <Button 
                  onClick={() => navigate(`/payments/new?orderId=${order.id}`)}
                  variant="outline" 
                  className="w-full"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
