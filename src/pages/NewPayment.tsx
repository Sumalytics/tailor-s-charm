import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getCollection, addDocument, updateDocument, getDebtsByShop, updateDebtPayment } from '@/firebase/firestore';
import { Order, Payment, PaymentMethod, Currency, Debt } from '@/types';
import { ArrowLeft, Save, CreditCard, DollarSign, Calendar, Info } from 'lucide-react';

export default function NewPayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderIdFromUrl = searchParams.get('orderId');
  const { currentUser, shopId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [formData, setFormData] = useState({
    orderId: '',
    amount: '',
    currency: 'GHS' as Currency,
    method: 'CASH' as PaymentMethod,
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    loadOrders();
  }, [shopId]);

  const loadOrders = async () => {
    if (!shopId) return;

    try {
      // Load active orders (PENDING, IN_PROGRESS)
      const activeOrders = await getCollection<Order>('orders', [
        { field: 'shopId', operator: '==', value: shopId },
        { field: 'status', operator: 'in', value: ['PENDING', 'IN_PROGRESS'] }
      ]);

      // Load all completed orders, then keep only those with outstanding balance
      // (completed orders can still receive payments — Ghana: tailors accept debt payments on finished orders)
      const allCompletedOrders = await getCollection<Order>('orders', [
        { field: 'shopId', operator: '==', value: shopId },
        { field: 'status', operator: '==', value: 'COMPLETED' }
      ]);

      const completedWithBalance = allCompletedOrders.filter(
        (order) => (order.amount - (order.paidAmount || 0)) > 0
      );

      // Active orders + completed orders with balance; dedupe by id
      const byId = new Map<string, Order>();
      for (const o of [...activeOrders, ...completedWithBalance]) {
        byId.set(o.id, o);
      }
      const allOrders = Array.from(byId.values());
      allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setOrders(allOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: 'Error loading orders',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  const preselectDone = useRef(false);
  useEffect(() => {
    if (loadingOrders || !orderIdFromUrl || orders.length === 0 || preselectDone.current) return;
    const order = orders.find(o => o.id === orderIdFromUrl);
    if (order) {
      setSelectedOrder(order);
      setFormData(prev => ({
        ...prev,
        orderId: orderIdFromUrl,
        amount: (order.amount - (order.paidAmount || 0)).toString(),
        currency: order.currency || 'GHS',
      }));
      preselectDone.current = true;
    }
  }, [loadingOrders, orderIdFromUrl, orders]);

  const handleOrderChange = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    setSelectedOrder(order || null);
    setFormData(prev => ({
      ...prev,
      orderId,
      amount: order ? (order.amount - (order.paidAmount || 0)).toString() : '',
      currency: order?.currency || 'GHS'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !shopId || !selectedOrder) return;

    setLoading(true);

    try {
      const paymentAmount = parseFloat(formData.amount) || 0;
      
      // Create payment record
      const paymentData = {
        orderId: formData.orderId,
        customerId: selectedOrder.customerId,
        customerName: selectedOrder.customerName,
        amount: paymentAmount,
        currency: formData.currency,
        method: formData.method,
        type: 'ORDER_PAYMENT' as const,
        status: 'COMPLETED' as const,
        paymentDate: new Date(formData.paymentDate),
        notes: formData.notes,
        shopId: shopId,
        createdAt: new Date(),
        createdBy: currentUser.uid,
      };

      const paymentId = await addDocument('payments', paymentData);

      // Update order with payment information (part payments always allowed)
      const newPaidAmount = (selectedOrder.paidAmount || 0) + paymentAmount;
      const isFullyPaid = newPaidAmount >= selectedOrder.amount;
      const wasCompleted = selectedOrder.status === 'COMPLETED';

      const orderUpdates: Record<string, unknown> = {
        paidAmount: newPaidAmount,
        updatedAt: new Date(),
      };
      // Never downgrade COMPLETED → IN_PROGRESS (Ghana: tailors keep accepting payments on finished orders for debt)
      if (!wasCompleted) {
        orderUpdates.status = isFullyPaid ? 'COMPLETED' : 'IN_PROGRESS';
      }

      await updateDocument('orders', formData.orderId, orderUpdates);

      // Update debt record if this order has an outstanding debt
      const debts = await getDebtsByShop(shopId);
      const existingDebt = debts.find(debt => debt.orderId === formData.orderId);
      
      if (existingDebt) {
        await updateDebtPayment(existingDebt.id, paymentAmount);
        
        const remainingDebt = existingDebt.remainingAmount - paymentAmount;
        if (remainingDebt <= 0) {
          toast({
            title: 'Payment recorded - Debt fully paid!',
            description: `Payment of ${formData.currency} ${paymentAmount.toFixed(2)} has been recorded. The customer's debt has been fully settled.`,
          });
        } else {
          toast({
            title: 'Payment recorded - Debt updated',
            description: `Payment of ${formData.currency} ${paymentAmount.toFixed(2)} has been recorded. Remaining debt: ${formData.currency} ${remainingDebt.toFixed(2)}.`,
          });
        }
      } else {
        toast({
          title: 'Payment recorded successfully',
          description: `Payment of ${formData.currency} ${paymentAmount.toFixed(2)} has been recorded.`,
        });
      }

      // Reset form and navigate
      setFormData({
        orderId: '',
        amount: '',
        currency: 'GHS' as Currency,
        method: 'CASH' as PaymentMethod,
        paymentDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setSelectedOrder(null);

      // Navigate back to payments after a short delay
      setTimeout(() => {
        navigate('/payments');
      }, 2000);

    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: 'Error recording payment',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const remainingBalance = selectedOrder 
    ? selectedOrder.amount - (selectedOrder.paidAmount || 0)
    : 0;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/payments')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Payments</span>
          </Button>
          <div className="flex items-center space-x-2">
            <CreditCard className="h-6 w-6" />
            <h1 className="text-2xl lg:text-3xl font-bold">New Payment</h1>
          </div>
        </div>

        {/* Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>
              Record a payment for an existing order. Part payments are accepted. You can keep accepting payments even after an order is finished—customers often settle debt over time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Part payments allowed. Completed orders with outstanding balance remain open for payments until fully settled.
              </AlertDescription>
            </Alert>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Order Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Order</h3>
                <div className="space-y-2">
                  <Label htmlFor="order">Select Order *</Label>
                  <Select
                    value={formData.orderId}
                    onValueChange={handleOrderChange}
                    disabled={loadingOrders}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingOrders ? "Loading orders..." : "Select an order"} />
                    </SelectTrigger>
                    <SelectContent>
                      {orders.map((order) => {
                        const outstandingBalance = order.amount - (order.paidAmount || 0);
                        return (
                          <SelectItem key={order.id} value={order.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{order.customerName}</span>
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <span>#{order.id.slice(-6)}</span>
                                <span>•</span>
                                <span>{order.status.replace('_', ' ')}</span>
                                <span>•</span>
                                <span>{order.currency} {order.amount.toFixed(2)}</span>
                                {outstandingBalance > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-red-600 font-medium">
                                      Owes: {order.currency} {outstandingBalance.toFixed(2)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedOrder && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Total Amount:</span>
                      <span>{selectedOrder.currency} {selectedOrder.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Already Paid:</span>
                      <span>{selectedOrder.currency} {(selectedOrder.paidAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-blue-600">
                      <span>Remaining Balance:</span>
                      <span>{selectedOrder.currency} {remainingBalance.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Payment Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      max={remainingBalance}
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                    {selectedOrder && parseFloat(formData.amount) > remainingBalance && (
                      <p className="text-sm text-red-600">
                        Amount exceeds remaining balance
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="method">Payment Method *</Label>
                    <Select
                      value={formData.method}
                      onValueChange={(value: PaymentMethod) => handleInputChange('method', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="CARD">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Payment Date *</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Additional Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any notes about this payment..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/payments')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    loading || 
                    !formData.orderId || 
                    !formData.amount || 
                    parseFloat(formData.amount) <= 0 ||
                    (selectedOrder && parseFloat(formData.amount) > remainingBalance)
                  }
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Recording...' : 'Record Payment'}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
