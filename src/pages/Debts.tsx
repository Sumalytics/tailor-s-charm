import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getDebtsByShop, getCustomersByShop, getDocument, ensureDebtRecordsForCompletedOrders } from '@/firebase/firestore';
import { Debt, Customer, Shop } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { buildDebtReminderMessage, getWhatsAppUrl, toWhatsAppPhone } from '@/lib/whatsapp';
import {
  Search,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  CreditCard,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const safeDate = (date: unknown): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date === 'object' && date !== null && 'toDate' in date && typeof (date as { toDate: () => Date }).toDate === 'function') return (date as { toDate: () => Date }).toDate();
  return new Date(String(date));
};

type Debtor = {
  customerId: string;
  customerName: string;
  phone: string | undefined;
  debts: Debt[];
};

export default function Debts() {
  const navigate = useNavigate();
  const { shopId } = useAuth();
  const { toast } = useToast();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      await ensureDebtRecordsForCompletedOrders(shopId);
      const [debtsData, customersData, shopData] = await Promise.all([
        getDebtsByShop(shopId),
        getCustomersByShop(shopId),
        getDocument<Shop>('shops', shopId),
      ]);
      setDebts(debtsData.sort((a, b) => safeDate(b.createdAt).getTime() - safeDate(a.createdAt).getTime()));
      setCustomers(customersData);
      setShop(shopData ?? null);
    } catch (error) {
      console.error('Error loading debts:', error);
      toast({
        title: 'Error loading debts',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [shopId, toast]);

  useEffect(() => {
    if (shopId) loadData();
  }, [shopId, loadData]);

  const debtors: Debtor[] = useMemo(() => {
    const byCustomer = new Map<string, Debt[]>();
    for (const d of debts) {
      const list = byCustomer.get(d.customerId) ?? [];
      list.push(d);
      byCustomer.set(d.customerId, list);
    }
    const custMap = new Map(customers.map((c) => [c.id, c]));
    return Array.from(byCustomer.entries()).map(([customerId, list]) => {
      const c = custMap.get(customerId);
      return {
        customerId,
        customerName: list[0]?.customerName ?? c?.name ?? 'Unknown',
        phone: c?.phone,
        debts: list,
      };
    });
  }, [debts, customers]);

  const filteredDebtors = useMemo(
    () =>
      debtors.filter((d) =>
        d.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [debtors, searchTerm]
  );

  const totalOutstanding = debts.reduce((s, d) => s + d.remainingAmount, 0);
  const activeDebts = debts.filter((d) => d.status === 'ACTIVE').length;
  const partiallyPaidDebts = debts.filter((d) => d.status === 'PARTIALLY_PAID').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PARTIALLY_PAID':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PAID':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'WRITTEN_OFF':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <AlertCircle className="h-4 w-4" />;
      case 'PARTIALLY_PAID':
        return <Clock className="h-4 w-4" />;
      case 'PAID':
        return <CheckCircle className="h-4 w-4" />;
      case 'WRITTEN_OFF':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleSendWhatsApp = (debtor: Debtor) => {
    if (!toWhatsAppPhone(debtor.phone)) {
      toast({
        title: 'No phone number',
        description: `Add a phone number for ${debtor.customerName} to send WhatsApp reminders.`,
        variant: 'destructive',
      });
      return;
    }
    const shopName = shop?.name ?? 'Your tailor';
    const message = buildDebtReminderMessage(shopName, debtor.customerName, debtor.debts);
    const url = getWhatsAppUrl(debtor.phone!, message);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded" />
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Debtors</h1>
            <p className="text-muted-foreground">
              Customers with outstanding balances. Send WhatsApp reminders with a debt breakdown.
            </p>
          </div>
          <Button onClick={loadData} variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalOutstanding, debts[0]?.currency ?? 'GHS')}
              </div>
              <p className="text-xs text-muted-foreground">Across all customers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Debts</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeDebts}</div>
              <p className="text-xs text-muted-foreground">No payments made yet</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partially Paid</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{partiallyPaidDebts}</div>
              <p className="text-xs text-muted-foreground">Some payments received</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Outstanding Debts</CardTitle>
            <CardDescription>
              {filteredDebtors.length} debtor{filteredDebtors.length !== 1 ? 's' : ''} · {debts.length} debt record{debts.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDebtors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No outstanding debts found</p>
                <p className="text-sm">All customers have paid their balances</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredDebtors.map((debtor) => {
                  const total = debtor.debts.reduce((s, d) => s + d.remainingAmount, 0);
                  const currency = debtor.debts[0]?.currency ?? 'GHS';
                  const hasPhone = !!toWhatsAppPhone(debtor.phone);
                  return (
                    <div
                      key={debtor.customerId}
                      className="rounded-lg border p-4 space-y-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-semibold">{debtor.customerName}</p>
                            {debtor.phone && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {debtor.phone}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-bold text-red-600">
                            {formatCurrency(total, currency)}
                          </span>
                          <Button
                            size="sm"
                            variant={hasPhone ? 'default' : 'outline'}
                            disabled={!hasPhone}
                            onClick={() => handleSendWhatsApp(debtor)}
                            className="gap-1"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Send WhatsApp
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/customers/${debtor.customerId}`)}
                          >
                            View customer
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {debtor.debts.map((debt) => (
                          <div
                            key={debt.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background p-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{debt.orderDescription}</p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                                <span>#{debt.orderId.slice(-6)}</span>
                                <span>Completed: {safeDate(debt.orderCompletedDate).toLocaleDateString()}</span>
                                {debt.dueDate && <span>Due: {safeDate(debt.dueDate).toLocaleDateString()}</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant="outline"
                                  className={cn('text-xs', getStatusColor(debt.status))}
                                >
                                  {getStatusIcon(debt.status)}
                                  <span className="ml-1">{debt.status.replace('_', ' ')}</span>
                                </Badge>
                                <span className="text-xs">
                                  Original {formatCurrency(debt.originalAmount, debt.currency)} · Paid {formatCurrency(debt.paidAmount, debt.currency)} · Remaining {formatCurrency(debt.remainingAmount, debt.currency)}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/orders/${debt.orderId}`)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View order
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => navigate(`/payments/new?orderId=${debt.orderId}`)}
                              >
                                <CreditCard className="h-3 w-3 mr-1" />
                                Record payment
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
