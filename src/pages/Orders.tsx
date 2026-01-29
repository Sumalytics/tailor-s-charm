import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getCollection } from '@/firebase/firestore';
import { Order, Customer, Payment } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingBag,
  Search,
  MoreHorizontal,
  Calendar,
  Filter,
  Plus,
  Eye,
  Edit,
  FileText,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OrderStatus } from '@/types';
import { cn } from '@/lib/utils';

// Safe date conversion utility
const safeDate = (date: any): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date === 'object' && date.toDate) return date.toDate();
  return new Date(date);
};

export default function Orders() {
  const navigate = useNavigate();
  const { shopId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');

  useEffect(() => {
    loadData();
  }, [shopId]);

  const loadData = async () => {
    if (!shopId) return;

    try {
      setLoading(true);
      
      // Load orders
      const ordersList = await getCollection<Order>('orders', [
        { field: 'shopId', operator: '==', value: shopId }
      ]);
      
      // Load customers for customer names
      const customersList = await getCollection<Customer>('customers', [
        { field: 'shopId', operator: '==', value: shopId }
      ]);

      // Load payments for payment tracking
      const paymentsList = await getCollection<Payment>('payments', [
        { field: 'shopId', operator: '==', value: shopId }
      ]);

      setOrders(ordersList.sort((a, b) => 
        safeDate(b.createdAt).getTime() - safeDate(a.createdAt).getTime()
      ));
      setCustomers(customersList);
      setPayments(paymentsList);

    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: 'Error loading orders',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown Customer';
  };

  const getOrderPayments = (orderId: string) => {
    return payments.filter(p => p.orderId === orderId);
  };

  const getTotalPaid = (orderId: string) => {
    const orderPayments = getOrderPayments(orderId);
    return orderPayments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const getRemainingBalance = (order: Order) => {
    const totalPaid = getTotalPaid(order.id);
    return order.amount - totalPaid;
  };

  const isOverdue = (order: Order) => {
    if (!order.dueDate) return false;
    const totalPaid = getTotalPaid(order.id);
    const remaining = order.amount - totalPaid;
    return remaining > 0 && safeDate(order.dueDate) < new Date();
  };

  const filteredOrders = orders.filter(order => {
    const customerName = getCustomerName(order.customerId).toLowerCase();
    const matchesSearch = customerName.includes(searchQuery.toLowerCase()) ||
                         order.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: OrderStatus) => {
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

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-3 w-3" />;
      case 'IN_PROGRESS':
        return <AlertCircle className="h-3 w-3" />;
      case 'COMPLETED':
        return <CheckCircle className="h-3 w-3" />;
      case 'CANCELLED':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  const handleEditOrder = (orderId: string) => {
    navigate(`/orders/${orderId}/edit`);
  };

  const handleGenerateInvoice = (orderId: string) => {
    navigate(`/orders/${orderId}/invoice`);
  };

  const handleWhatsAppShare = (order: Order) => {
    const customerName = getCustomerName(order.customerId);
    const totalPaid = getTotalPaid(order.id);
    const remaining = getRemainingBalance(order);
    const message = `Hello ${customerName}! 👋\n\nYour order details:\n📋 Order: ${order.description}\n💰 Total: ${order.currency} ${order.amount.toFixed(2)}\n💳 Paid: ${order.currency} ${totalPaid.toFixed(2)}\n💵 Remaining: ${order.currency} ${remaining.toFixed(2)}\n📅 Due: ${order.dueDate ? safeDate(order.dueDate).toLocaleDateString() : 'Not set'}\n📊 Status: ${order.status}\n\nView your invoice: ${window.location.origin}/invoice/${order.id}\n\nThank you for your business! 🧵`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const calculateStats = () => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
    const inProgressOrders = orders.filter(o => o.status === 'IN_PROGRESS').length;
    const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
    const totalPaid = orders.reduce((sum, order) => sum + getTotalPaid(order.id), 0);
    const outstandingBalance = totalRevenue - totalPaid;
    
    const overdueOrders = orders.filter(order => isOverdue(order)).length;

    return {
      totalOrders,
      pendingOrders,
      inProgressOrders,
      completedOrders,
      totalRevenue,
      totalPaid,
      outstandingBalance,
      overdueOrders,
    };
  };

  const stats = calculateStats();

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Orders</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage all your orders
            </p>
          </div>
          <Button onClick={() => navigate('/orders/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            New Order
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Total Orders</div>
                  <div className="text-2xl font-bold mt-1">{stats.totalOrders}</div>
                </div>
                <ShoppingBag className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                  <div className="text-2xl font-bold mt-1 text-yellow-600">{stats.pendingOrders}</div>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                  <div className="text-2xl font-bold mt-1 text-blue-600">{stats.inProgressOrders}</div>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                  <div className="text-2xl font-bold mt-1 text-green-600">{stats.completedOrders}</div>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                  <div className="text-2xl font-bold mt-1">
                    {orders.length > 0 ? orders[0]?.currency || 'GHS' : 'GHS'} {stats.totalRevenue.toFixed(2)}
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Total Paid</div>
                  <div className="text-2xl font-bold mt-1">
                    {orders.length > 0 ? orders[0]?.currency || 'GHS' : 'GHS'} {stats.totalPaid.toFixed(2)}
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Outstanding</div>
                  <div className="text-2xl font-bold mt-1 text-red-600">
                    {orders.length > 0 ? orders[0]?.currency || 'GHS' : 'GHS'} {stats.outstandingBalance.toFixed(2)}
                  </div>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-soft">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer name or order description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value as OrderStatus | 'ALL')}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Order Details</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="hidden lg:table-cell">Due Date</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    // Loading skeleton
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mx-auto"></div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse ml-auto"></div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse ml-auto"></div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse ml-auto"></div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10">
                        <div className="flex flex-col items-center space-y-3">
                          <ShoppingBag className="h-12 w-12 text-muted-foreground/60" />
                          <div>
                            <p className="font-medium text-foreground">
                              {searchQuery || statusFilter !== 'ALL'
                                ? 'No orders match your filters'
                                : 'No orders yet'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {searchQuery || statusFilter !== 'ALL'
                                ? 'Try changing your search or filters.'
                                : 'Create your first order to start tracking.'}
                            </p>
                          </div>
                          {!searchQuery && statusFilter === 'ALL' && (
                            <Button onClick={() => navigate('/orders/new')} size="lg" className="gap-2">
                              <Plus className="h-4 w-4" />
                              Create first order
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => {
                      const totalPaid = getTotalPaid(order.id);
                      const remaining = getRemainingBalance(order);
                      const overdue = isOverdue(order);
                      const customerName = getCustomerName(order.customerId);
                      
                      return (
                        <TableRow 
                          key={order.id} 
                          className="cursor-pointer hover:bg-secondary/50"
                          onClick={() => handleViewOrder(order.id)}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium">{customerName}</div>
                              <div className="text-sm text-muted-foreground">
                                {safeDate(order.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div>
                              <div className="font-medium">{order.description}</div>
                              <div className="text-sm text-muted-foreground">
                                Order #{order.id.slice(-6)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "flex items-center gap-1 w-fit mx-auto",
                                getStatusColor(order.status)
                              )}
                            >
                              {getStatusIcon(order.status)}
                              {order.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {order.currency} {order.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {order.currency} {totalPaid.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              "font-medium",
                              overdue ? "text-red-600" : remaining > 0 ? "text-yellow-600" : "text-green-600"
                            )}>
                              {order.currency} {remaining.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className={cn(
                              "text-sm",
                              overdue ? "text-red-600 font-medium" : ""
                            )}>
                              {order.dueDate ? safeDate(order.dueDate).toLocaleDateString() : 'Not set'}
                              {overdue && <div className="text-xs">Overdue</div>}
                            </div>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewOrder(order.id)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditOrder(order.id)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Order
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleGenerateInvoice(order.id)}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Generate Invoice
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleWhatsAppShare(order)}>
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Send via WhatsApp
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
