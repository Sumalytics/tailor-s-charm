import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { addDocument } from '@/firebase/firestore';
import { Customer } from '@/types';
import { ArrowLeft, Save, User, Phone, Mail, MapPin } from 'lucide-react';

export default function NewCustomer() {
  const navigate = useNavigate();
  const { currentUser, shopId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !shopId) return;

    setLoading(true);

    try {
      const customerData = {
        ...formData,
        shopId: shopId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      const customerId = await addDocument('customers', customerData);

      toast({
        title: 'Customer created successfully',
        description: `${formData.name} has been added to your customer list.`,
      });

      navigate('/customers');
    } catch (error: any) {
      console.error('Error creating customer:', error);
      toast({
        title: 'Error creating customer',
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
            onClick={() => navigate('/customers')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Customers</span>
          </Button>
          <div className="flex items-center space-x-2">
            <User className="h-6 w-6" />
            <h1 className="text-2xl lg:text-3xl font-bold">New Customer</h1>
          </div>
        </div>

        {/* Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>
              Add a new customer to your tailoring business.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter customer's full name"
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
                      placeholder="+233 XX XXX XXXX"
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
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter customer's address"
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

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/customers')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.name.trim()}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Creating...' : 'Create Customer'}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
