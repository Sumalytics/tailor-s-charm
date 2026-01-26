import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getDebtsByShop, updateDebtPayment } from '@/firebase/firestore';
import { Debt } from '@/types';
import { formatCurrency } from '@/lib/currency';
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
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Safe date conversion utility
const safeDate = (date: any): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date === 'object' && date.toDate) return date.toDate();
  return new Date(date);
};

export default function Debts() {
  const { shopId } = useAuth();
  const { toast } = useToast();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (shopId) {
      loadDebts();
    }
  }, [shopId]);

  const loadDebts = async () => {
    if (!shopId) return;

    setLoading(true);
    try {
      const debtsData = await getDebtsByShop(shopId);
      setDebts(debtsData.sort((a, b) => 
        safeDate(b.createdAt).getTime() - safeDate(a.createdAt).getTime()
      ));
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
  };

  const filteredDebts = debts.filter(debt =>
    debt.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    debt.orderDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const totalOutstanding = debts.reduce((sum, debt) => sum + debt.remainingAmount, 0);
  const activeDebts = debts.filter(debt => debt.status === 'ACTIVE').length;
  const partiallyPaidDebts = debts.filter(debt => debt.status === 'PARTIALLY_PAID').length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Customer Debts</h1>
            <p className="text-muted-foreground">
              Track and manage outstanding customer balances
            </p>
          </div>
          <Button onClick={loadDebts} variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalOutstanding, debts[0]?.currency || 'GHS')}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Debts</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeDebts}</div>
              <p className="text-xs text-muted-foreground">
                No payments made yet
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partially Paid</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{partiallyPaidDebts}</div>
              <p className="text-xs text-muted-foreground">
                Some payments received
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer name or order description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Debts List */}
        <Card>
          <CardHeader>
            <CardTitle>Outstanding Debts</CardTitle>
            <CardDescription>
              {filteredDebts.length} debt record{filteredDebts.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDebts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No outstanding debts found</p>
                <p className="text-sm">All customers have paid their balances</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDebts.map((debt) => (
                  <div
                    key={debt.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{debt.customerName}</span>
                        <Badge
                          variant="outline"
                          className={cn("border-current/20 font-medium", getStatusColor(debt.status))}
                        >
                          {getStatusIcon(debt.status)}
                          {debt.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {debt.orderDescription}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Order: #{debt.orderId.slice(-6)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Completed: {safeDate(debt.orderCompletedDate).toLocaleDateString()}</span>
                        </div>
                        {debt.dueDate && (
                          <div className="flex items-center space-x-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>Due: {safeDate(debt.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="space-y-1">
                        <p className="font-semibold text-lg text-red-600">
                          {formatCurrency(debt.remainingAmount, debt.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Original: {formatCurrency(debt.originalAmount, debt.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Paid: {formatCurrency(debt.paidAmount, debt.currency)}
                        </p>
                      </div>
                      <div className="flex space-x-2 mt-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm">
                          <CreditCard className="h-3 w-3 mr-1" />
                          Record Payment
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
