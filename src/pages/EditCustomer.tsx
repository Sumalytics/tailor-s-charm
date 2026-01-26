import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, updateDocument } from '@/firebase/firestore';
import { Customer } from '@/types';
import { ArrowLeft, Save, User, Phone, Mail, MapPin, FileText } from 'lucide-react';

export default function EditCustomer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shopId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    isActive: true,
  });

  useEffect(() => {
    if (id) {
      loadCustomer();
    }
  }, [id]);

  const loadCustomer = async () => {
    if (!id) return;

    try {
      const customerData = await getDocument<Customer>('customers', id);
      if (customerData && customerData.shopId === shopId) {
        setCustomer(customerData);
        setFormData({
          name: customerData.name || '',
          phone: customerData.phone || '',
          email: customerData.email || '',
          address: customerData.address || '',
          notes: customerData.notes || '',
          isActive: customerData.isActive ?? true,
        });
      } else {
        toast({
          title: 'Customer not found',
          description: 'The customer you are looking for does not exist.',
          variant: 'destructive',
        });
        navigate('/customers');
      }
    } catch (error) {
      console.error('Error loading customer:', error);
      toast({
        title: 'Error loading customer',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !shopId) return;

    setSaving(true);

    try {
      const updateData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        notes: formData.notes.trim(),
        isActive: formData.isActive,
        updatedAt: new Date(),
      };

      await updateDocument('customers', customer.id, updateData);

      toast({
        title: 'Customer updated successfully',
        description: `${formData.name} has been updated.`,
      });

      navigate(`/customers/${customer.id}`);
    } catch (error: any) {
      console.error('Error updating customer:', error);
      toast({
        title: 'Error updating customer',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
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

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          <p>Customer not found</p>
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
            onClick={() => navigate(`/customers/${customer.id}`)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Customer</span>
          </Button>
          <div className="flex items-center space-x-2">
            <User className="h-6 w-6" />
            <h1 className="text-2xl lg:text-3xl font-bold">Edit Customer</h1>
          </div>
        </div>

        {/* Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>
              Update customer details and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1 234-567-8900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="customer@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Address</h3>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter customer address"
                    rows={2}
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
                    placeholder="Any special notes about this customer..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Status</h3>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                  <Label htmlFor="isActive">Active Customer</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Inactive customers won't appear in customer selection lists.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/customers/${customer.id}`)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !formData.name.trim()}
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
