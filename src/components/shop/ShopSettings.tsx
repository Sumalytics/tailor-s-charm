import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, updateDocument, addDocument } from '@/firebase/firestore';
import { Shop, Currency } from '@/types';
import { initLocalTrial } from '@/services/localTrialService';
import { Save, Building2, Phone, Mail, MapPin } from 'lucide-react';

export function ShopSettings() {
  const { currentUser, shopId, refreshUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [shop, setShop] = useState<Shop | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    currency: 'GHS' as Currency,
  });

  useEffect(() => {
    if (shopId) {
      loadShop();
    }
  }, [shopId]);

  const loadShop = async () => {
    if (!shopId) return;
    
    try {
      const shopData = await getDocument<Shop>('shops', shopId);
      if (shopData) {
        setShop(shopData);
        setFormData({
          name: shopData.name || '',
          description: shopData.description || '',
          address: shopData.address || '',
          phone: shopData.phone || '',
          email: shopData.email || '',
          currency: shopData.currency || 'GHS',
        });
      }
    } catch (error) {
      console.error('Error loading shop:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);

    try {
      const shopData = {
        ...formData,
        ownerId: currentUser.uid,
        status: 'ACTIVE' as const,
        updatedAt: new Date(),
      };

      let savedShopId: string;

      if (shop && shopId) {
        // Update existing shop
        console.log('Updating shop:', shopId, shopData);
        await updateDocument('shops', shopId, shopData);
        savedShopId = shopId;
      } else {
        // Create new shop (include trialStartedAt so trial works across browsers)
        const newShopData = {
          ...shopData,
          createdAt: new Date(),
          trialStartedAt: Date.now(),
        };
        console.log('Creating new shop:', newShopData);
        savedShopId = await addDocument('shops', newShopData);
        
        // Update user with shopId
        console.log('Updating user with shopId:', savedShopId);
        await updateDocument('users', currentUser.uid, { shopId: savedShopId });
        await refreshUser();
        
        // Start 30-day local trial for new shop (no Firebase)
        initLocalTrial(savedShopId);
        
        toast({
          title: 'Shop created successfully!',
          description: 'Your shop has been created with a 30-day free trial.',
        });
      }

      // Reload shop data
      if (!shop) {
        setShop({ ...shopData, id: savedShopId, createdAt: new Date() } as Shop);
      } else {
        toast({
          title: 'Shop updated successfully',
          description: 'Your shop information has been updated.',
        });
      }

    } catch (error: any) {
      console.error('Error saving shop:', error);
      
      // More specific error messages
      let errorMessage = 'Failed to save shop. Please try again.';
      
      if (error.code === 'unavailable' || error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. You may not have the right permissions to save shop data.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast({
        title: 'Error saving shop',
        description: errorMessage,
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
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Building2 className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Shop Settings</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Basic information about your tailoring shop.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Shop Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your shop name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency *</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value: Currency) => handleInputChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
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
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your tailoring services..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              How customers can reach your shop.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>Phone Number</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+233 24 000 0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Email Address</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="shop@example.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Physical Address</span>
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123 Main Street, Accra, Ghana"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="min-w-[120px]">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>Save Shop</span>
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
