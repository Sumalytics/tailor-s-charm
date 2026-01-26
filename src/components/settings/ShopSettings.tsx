import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, updateDocument } from '@/firebase/firestore';
import { Shop } from '@/types';
import { Store, MapPin, Phone, Mail, Globe, Clock, Camera, Save } from 'lucide-react';

export default function ShopSettings() {
  const { currentUser, shopId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shop, setShop] = useState<Shop | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    currency: 'GHS',
  });

  useEffect(() => {
    if (shopId) {
      loadShopSettings();
    }
  }, [shopId]);

  const loadShopSettings = async () => {
    if (!shopId) return;

    setLoading(true);
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
      console.error('Error loading shop settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load shop settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!shopId) return;

    setSaving(true);
    try {
      await updateDocument('shops', shopId, {
        ...formData,
        updatedAt: new Date(),
      });

      toast({
        title: 'Success',
        description: 'Shop settings updated successfully',
      });
    } catch (error) {
      console.error('Error saving shop settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save shop settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Shop Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Shop Information
          </CardTitle>
          <CardDescription>
            Manage your shop's basic information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shopName">Shop Name</Label>
              <Input
                id="shopName"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your shop name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shopEmail">Email</Label>
              <Input
                id="shopEmail"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="shop@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shopDescription">Description</Label>
            <Textarea
              id="shopDescription"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your shop and services"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shopPhone">Phone</Label>
              <Input
                id="shopPhone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+233 50 123 4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shopAddress">Address</Label>
            <Textarea
              id="shopAddress"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter your shop address"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Shop Status */}
      <Card>
        <CardHeader>
          <CardTitle>Shop Status</CardTitle>
          <CardDescription>
            Current status and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Shop Status</p>
              <p className="text-sm text-muted-foreground">
                {shop?.status === 'ACTIVE' ? 'Your shop is active and accepting orders' : 'Shop is currently inactive'}
              </p>
            </div>
            <Badge variant={shop?.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {shop?.status || 'UNKNOWN'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
