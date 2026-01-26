import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, updateDocument } from '@/firebase/firestore';
import { Order, Customer, OrderStatus, Currency } from '@/types';
import { ArrowLeft, Save, Edit, Calendar, DollarSign } from 'lucide-react';

export default function EditOrder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shopId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    currency: 'GHS' as Currency,
    status: 'PENDING' as OrderStatus,
    dueDate: '',
    notes: '',
  });

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

      setOrder(orderData);
      setFormData({
        description: orderData.description || '',
        amount: orderData.amount.toString(),
        currency: orderData.currency || 'GHS',
        status: orderData.status || 'PENDING',
        dueDate: orderData.dueDate ? new Date(orderData.dueDate).toISOString().split('T')[0] : '',
        notes: orderData.notes || '',
      });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setSaving(true);

    try {
      const updateData = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount) || 0,
        currency: formData.currency,
        status: formData.status,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
        notes: formData.notes.trim(),
        updatedAt: new Date(),
      };

      await updateDocument('orders', order.id, updateData);

      toast({
        title: 'Order updated successfully',
        description: `Order has been updated.`,
      });

      navigate(`/orders/${order.id}`);
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error updating order',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  if (!order) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          <p>Order not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/orders/${order.id}`)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Order</span>
          </Button>
          <div className="flex items-center space-x-2">
            <Edit className="h-6 w-6" />
            <h1 className="text-2xl lg:text-3xl font-bold">Edit Order</h1>
          </div>
        </div>

        {/* Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
            <CardDescription>
              Update order details and status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Status</h3>
                <div className="space-y-2">
                  <Label htmlFor="status">Order Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: OrderStatus) => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
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
                  onClick={() => navigate(`/orders/${order.id}`)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !formData.description.trim() || !formData.amount}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
