import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createBillingPlan, updateBillingPlan, deleteBillingPlan, getBillingPlans } from '@/firebase/firestore';
import { BillingPlan, BillingPlanType, BillingCycle, Currency } from '@/types';
import { Package, Plus, Edit, Trash2, X, Check } from 'lucide-react';

interface PlanFormData {
  name: string;
  price: number;
  currency: Currency;
  billingCycle: BillingCycle;
  type: BillingPlanType;
  features: string[];
  limits: {
    customers: number;
    orders: number;
    teamMembers: number;
    storage: number; // in MB
  };
  isActive: boolean;
}

const defaultFormData: PlanFormData = {
  name: 'Trial Plan',
  price: 0,
  currency: 'USD',
  billingCycle: 'MONTHLY',
  type: 'FREE',
  features: ['Up to 5 customers', 'Up to 20 orders', 'Basic support', 'Mobile app access'],
  limits: {
    customers: 5,
    orders: 20,
    teamMembers: 2,
    storage: 100, // 100MB
  },
  isActive: true,
};

/** Normalize plan.features to string[] (Firestore may return array or object). */
function getFeaturesArray(plan: BillingPlan): string[] {
  if (Array.isArray(plan.features)) return plan.features;
  if (plan.features && typeof plan.features === 'object')
    return Object.values(plan.features).filter((v): v is string => typeof v === 'string');
  return [];
}

export function BillingPlansManager() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BillingPlan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(defaultFormData);
  const [newFeature, setNewFeature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadBillingPlans();
  }, []);

  const loadBillingPlans = async () => {
    try {
      console.log('Loading billing plans...');
      const plansData = await getBillingPlans();
      console.log('Plans data received:', plansData);
      setPlans(plansData);
    } catch (error) {
      console.error('Error loading billing plans:', error);
      toast({
        title: 'Error loading plans',
        description: 'Failed to load billing plans. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createBillingPlan({
        ...formData,
        features: formData.features.filter(f => f.trim()),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast({
        title: 'Plan created',
        description: 'Billing plan has been created successfully.',
      });

      setShowCreateDialog(false);
      resetForm();
      await loadBillingPlans();
    } catch (error) {
      console.error('Error creating plan:', error);
      toast({
        title: 'Creation failed',
        description: 'Failed to create billing plan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan || !formData.name.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBillingPlan(editingPlan.id, {
        ...formData,
        features: formData.features.filter(f => f.trim()),
        updatedAt: new Date(),
      });

      toast({
        title: 'Plan updated',
        description: 'Billing plan has been updated successfully.',
      });

      setShowEditDialog(false);
      resetForm();
      setEditingPlan(null);
      await loadBillingPlans();
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to update billing plan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this billing plan? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteBillingPlan(planId);
      toast({
        title: 'Plan deleted',
        description: 'Billing plan has been deleted successfully.',
      });
      await loadBillingPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: 'Deletion failed',
        description: 'Failed to delete billing plan. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditPlan = (plan: BillingPlan) => {
    setFormData({
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      type: plan.type,
      features: getFeaturesArray(plan),
      limits: plan.limits,
      isActive: plan.isActive,
    });
    setEditingPlan(plan);
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setNewFeature('');
  };

  const handleCreateTrialPlan = async () => {
    setIsSubmitting(true);
    try {
      await createBillingPlan({
        ...defaultFormData,
        features: defaultFormData.features.filter(f => f.trim()),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast({
        title: 'Trial plan created',
        description: 'A 7-day trial plan has been created successfully.',
      });

      await loadBillingPlans();
    } catch (error) {
      console.error('Error creating trial plan:', error);
      toast({
        title: 'Creation failed',
        description: 'Failed to create trial plan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addFeature = useCallback(() => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  }, [newFeature]);

  const removeFeature = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  }, []);

  const PlanForm = useCallback(() => {
    const handleInputChange = (field: keyof PlanFormData, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleLimitChange = (field: keyof PlanFormData['limits'], value: number) => {
      setFormData(prev => ({
        ...prev,
        limits: { ...prev.limits, [field]: value }
      }));
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Plan Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Professional Plan"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price *</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
              placeholder="29.99"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value as Currency)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="GHS">GHS</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="billingCycle">Billing Cycle</Label>
            <select
              id="billingCycle"
              value={formData.billingCycle}
              onChange={(e) => handleInputChange('billingCycle', e.target.value as BillingCycle)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="DAILY">Daily</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Plan Type</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value as BillingPlanType)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="FREE">Free</option>
              <option value="PROFESSIONAL">Professional</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Features</Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Add a feature..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              />
              <Button type="button" onClick={addFeature} disabled={!newFeature.trim()}>
                Add
              </Button>
            </div>
            <div className="space-y-1">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                  <span className="text-sm">{feature}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFeature(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Limits</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customers">Customers</Label>
              <Input
                id="customers"
                type="number"
                value={formData.limits.customers}
                onChange={(e) => handleLimitChange('customers', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orders">Orders</Label>
              <Input
                id="orders"
                type="number"
                value={formData.limits.orders}
                onChange={(e) => handleLimitChange('orders', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamMembers">Team Members</Label>
              <Input
                id="teamMembers"
                type="number"
                value={formData.limits.teamMembers}
                onChange={(e) => handleLimitChange('teamMembers', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storage">Storage (MB)</Label>
              <Input
                id="storage"
                type="number"
                value={formData.limits.storage}
                onChange={(e) => handleLimitChange('storage', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => handleInputChange('isActive', checked)}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
      </div>
    );
  }, [formData, newFeature, addFeature, removeFeature]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Billing Plans Management
              </CardTitle>
              <CardDescription>Manage billing plans for all shops</CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {plans.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No billing plans</h3>
                  <p className="text-muted-foreground mb-4">Create your first billing plan to get started</p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Plan
                    </Button>
                    <Button variant="outline" onClick={handleCreateTrialPlan}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Trial Plan
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground mb-4">
                    Found {plans.length} billing plans
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {plans.map((plan) => {
                      const featuresList = getFeaturesArray(plan);
                      return (
                        <Card key={plan.id} className="relative">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-lg font-semibold">{plan.name}</h4>
                                  <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                                    {plan.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                  <Badge variant="outline">{plan.type}</Badge>
                                </div>
                                
                                <div className="flex items-center gap-4 mb-3">
                                  <span className="text-2xl font-bold">
                                    ${plan.price}/{plan.billingCycle?.toLowerCase() || 'monthly'}
                                  </span>
                                </div>

                                <div className="mb-3">
                                  <h5 className="font-medium mb-2">Features:</h5>
                                  <ul className="space-y-1">
                                    {featuresList.slice(0, 3).map((feature, index) => (
                                      <li key={index} className="flex items-center gap-2 text-sm">
                                        <Check className="h-3 w-3 text-green-600" />
                                        {feature}
                                      </li>
                                    ))}
                                    {featuresList.length > 3 && (
                                      <li className="text-sm text-muted-foreground">
                                        +{featuresList.length - 3} more features
                                      </li>
                                    )}
                                  </ul>
                                </div>

                                <div className="text-sm text-muted-foreground">
                                  <div className="grid grid-cols-2 gap-2">
                                    <span>Customers: {plan.limits?.customers || 'N/A'}</span>
                                    <span>Orders: {plan.limits?.orders || 'N/A'}</span>
                                    <span>Team: {plan.limits?.teamMembers || 'N/A'}</span>
                                    <span>Storage: {plan.limits?.storage || 'N/A'}MB</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 mt-4 pt-4 border-t">
                              <Button size="sm" variant="outline" onClick={() => handleEditPlan(plan)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeletePlan(plan.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Plan Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Billing Plan</DialogTitle>
            <DialogDescription>
              Create a new billing plan for your customers.
            </DialogDescription>
          </DialogHeader>
          <PlanForm />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlan} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Plan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Billing Plan</DialogTitle>
            <DialogDescription>
              Update the billing plan details.
            </DialogDescription>
          </DialogHeader>
          <PlanForm />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePlan} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Plan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
