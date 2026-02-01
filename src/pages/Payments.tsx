import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CreditCard,
  Search,
  MoreHorizontal,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PaymentMethod, PaymentStatus, Payment, Customer, Shop, Order } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getCollection, getDocument } from '@/firebase/firestore';
import { printPaymentReceipt } from '@/lib/receiptPrint';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Safe date conversion utility
const safeDate = (date: any): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date === 'object' && date.toDate) return date.toDate();
  return new Date(date);
};

const methodLabels: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  MOBILE_MONEY: 'Mobile Money',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank Transfer',
  OTHER: 'Other',
};

const statusStyles: Record<PaymentStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-warning/10 text-warning border-warning/20' },
  COMPLETED: { label: 'Completed', className: 'bg-success/10 text-success border-success/20' },
  FAILED: { label: 'Failed', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  REFUNDED: { label: 'Refunded', className: 'bg-muted text-muted-foreground border-muted' },
};

export default function Payments() {
  const navigate = useNavigate();
  const { shopId } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shopId) {
      loadData();
    }
  }, [shopId]);

  const loadData = async () => {
    if (!shopId) return;

    setLoading(true);
    try {
      const [paymentsData, customersData, shopData] = await Promise.all([
        getCollection<Payment>('payments', [
          { field: 'shopId', operator: '==', value: shopId }
        ]),
        getCollection<Customer>('customers', [
          { field: 'shopId', operator: '==', value: shopId }
        ]),
        getDocument<Shop>('shops', shopId),
      ]);
      
      // Sort payments by creation date (newest first)
      const sortedPayments = paymentsData.sort((a, b) => 
        safeDate(b.createdAt).getTime() - safeDate(a.createdAt).getTime()
      );
      
      setPayments(sortedPayments);
      setCustomers(customersData);
      setShop(shopData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error loading payments',
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

  const filteredPayments = payments.filter(
    (payment) =>
      getCustomerName(payment.customerId).toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.orderId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalReceived = payments
    .filter((p) => {
      // Handle payments with undefined status (legacy data) - assume they are completed
      const isCompleted = p.status === 'COMPLETED' || 
                         p.status === undefined || 
                         p.status === null;
      const isNotRefund = p.type !== 'REFUND';
      return isCompleted && isNotRefund;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = payments
    .filter((p) => {
      // Handle payments with undefined status - assume they are completed, not pending
      const isPending = p.status === 'PENDING';
      return isPending;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRefunded = payments
    .filter((p) => p.type === 'REFUND')
    .reduce((sum, p) => sum + p.amount, 0);

  const handleRecordPayment = () => {
    navigate('/payments/new');
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  const handleViewDetails = (payment: Payment) => {
    toast({
      title: 'Payment Details',
      description: `Payment of ${formatCurrency(payment.amount, payment.currency)} via ${payment.method}`,
    });
  };

  const handlePrintReceipt = async (payment: Payment) => {
    try {
      const customerName = getCustomerName(payment.customerId);
      let orderDescription: string | undefined;
      if (payment.orderId) {
        const order = await getDocument<Order>('orders', payment.orderId);
        orderDescription = order?.description;
      }
      printPaymentReceipt(payment, customerName, shop, orderDescription);
      toast({
        title: 'Print receipt',
        description: 'Select your 80mm USB/Bluetooth thermal printer in the print dialog.',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to print';
      toast({
        title: 'Print failed',
        description: msg,
        variant: 'destructive',
      });
    }
  };

  const handleRefund = (payment: Payment) => {
    toast({
      title: 'Refund Payment',
      description: 'Refund functionality coming soon',
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Payments</h1>
            <p className="text-muted-foreground mt-1">
              Track all payments and transactions
            </p>
          </div>
          <Button className="gap-2" onClick={handleRecordPayment}>
            <CreditCard className="h-4 w-4" />
            Record Payment
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Total Received</div>
                  <div className="text-2xl font-bold mt-1 text-success">
                    {formatCurrency(totalReceived, payments[0]?.currency || 'GHS')}
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                  <div className="text-2xl font-bold mt-1 text-warning">
                    {formatCurrency(totalPending, payments[0]?.currency || 'GHS')}
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Refunded</div>
                  <div className="text-2xl font-bold mt-1 text-muted-foreground">
                    {formatCurrency(totalRefunded, payments[0]?.currency || 'GHS')}
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <ArrowDownRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card className="shadow-soft">
          <CardHeader className="pb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer or order..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No payments found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'Try adjusting your search terms' : 'Get started by recording your first payment'}
                </p>
                {!searchQuery && (
                  <Button onClick={handleRecordPayment}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Record First Payment
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile: card list */}
                <div className="md:hidden space-y-3 px-4 pb-4">
                  {filteredPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-xl border bg-card p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-primary">
                              {getCustomerName(payment.customerId).split(' ').map((n) => n[0]).join('') || '?'}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{getCustomerName(payment.customerId)}</p>
                            <p className="text-sm text-muted-foreground">
                              Order #{payment.orderId?.slice(-6) || 'N/A'} · {methodLabels[payment.method] || payment.method}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(payment)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrintReceipt(payment)}>Print Receipt</DropdownMenuItem>
                            {payment.orderId && (
                              <DropdownMenuItem onClick={() => handleViewOrder(payment.orderId)}>View Order</DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleRefund(payment)} className="text-destructive">Refund</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <Badge variant="outline" className={cn('font-medium', statusStyles[payment.status]?.className || 'bg-gray-100 text-gray-800')}>
                          {statusStyles[payment.status]?.label || payment.status}
                        </Badge>
                        <span className={cn('font-semibold', payment.type === 'REFUND' ? 'text-destructive' : '')}>
                          {payment.type === 'REFUND' ? '-' : ''}{formatCurrency(payment.amount, payment.currency)}
                        </span>
                        <span className="text-muted-foreground">{safeDate(payment.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop: table */}
                <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead className="hidden sm:table-cell">Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="hidden md:table-cell">Date</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-secondary/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">
                                {getCustomerName(payment.customerId).split(' ').map((n) => n[0]).join('')}
                              </span>
                            </div>
                            <span className="font-medium">{getCustomerName(payment.customerId)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            #{payment.orderId?.slice(-6) || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary">{methodLabels[payment.method] || payment.method || 'Unknown'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('font-medium', statusStyles[payment.status]?.className || 'bg-gray-100 text-gray-800')}>
                            {statusStyles[payment.status]?.label || payment.status || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            'font-semibold',
                            payment.type === 'REFUND' ? 'text-destructive' : ''
                          )}>
                            {payment.type === 'REFUND' ? '-' : ''}{formatCurrency(payment.amount, payment.currency)}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {safeDate(payment.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(payment)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePrintReceipt(payment)}>
                                Print Receipt
                              </DropdownMenuItem>
                              {payment.orderId && (
                                <DropdownMenuItem onClick={() => handleViewOrder(payment.orderId)}>
                                  View Order
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleRefund(payment)}
                                className="text-destructive"
                              >
                                Refund
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
