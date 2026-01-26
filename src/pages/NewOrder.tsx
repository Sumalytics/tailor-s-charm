import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getCollection, addDocument } from '@/firebase/firestore';
import { Order, Customer, OrderStatus, Currency } from '@/types';
import { ArrowLeft, Save, ShoppingBag, User, Calendar, DollarSign } from 'lucide-react';

export default function NewOrder() {
  const navigate = useNavigate();
  const { currentUser, shopId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    description: '',
    amount: '',
    currency: 'GHS' as Currency,
    dueDate: '',
    notes: '',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    if (!shopId) return;

    try {
      const customersList = await getCollection<Customer>('customers', [
        { field: 'shopId', operator: '==', value: shopId },
        { field: 'isActive', operator: '==', value: true }
      ]);
      setCustomers(customersList);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: 'Error loading customers',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setFormData(prev => ({
      ...prev,
      customerId,
      customerName: customer?.name || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !shopId) return;

    setLoading(true);

    try {
      const orderData = {
        customerId: formData.customerId,
        customerName: formData.customerName,
        description: formData.description,
        amount: parseFloat(formData.amount) || 0,
        currency: formData.currency,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
        notes: formData.notes,
        status: 'PENDING' as OrderStatus,
        shopId: shopId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: currentUser.uid,
      };

      const orderId = await addDocument('orders', orderData);

      toast({
        title: 'Order created successfully',
        description: `Order for ${formData.customerName} has been created.`,
      });

      navigate('/orders');
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: 'Error creating order',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/orders')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Orders</span>
          </Button>
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-6 w-6" />
            <h1 className="text-2xl lg:text-3xl font-bold">New Order</h1>
          </div>
        </div>

        {/* Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
            <CardDescription>
              Create a new order for your customer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Customer</h3>
                <div className="space-y-2">
                  <Label htmlFor="customer">Select Customer *</Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={handleCustomerChange}
                    disabled={loadingCustomers}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingCustomers ? "Loading customers..." : "Select a customer"} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Order Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Order Details</h3>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the order (e.g., '2-piece suit, navy blue, size L')"
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value: Currency) => handleInputChange('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GHS">Ghana Cedis (₵)</SelectItem>
                        <SelectItem value="USD">US Dollars ($)</SelectItem>
                        <SelectItem value="EUR">Euros (€)</SelectItem>
                        <SelectItem value="GBP">British Pounds (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Schedule</h3>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
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
                    placeholder="Any special notes about this order..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/orders')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.customerId || !formData.description.trim()}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Creating...' : 'Create Order'}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
