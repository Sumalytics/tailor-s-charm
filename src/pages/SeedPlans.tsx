import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getCollection, addDocument } from '@/firebase/firestore';
import { BillingPlan, BillingPlanType, BillingCycle, Currency } from '@/types';

export default function SeedPlans() {
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [existingPlans, setExistingPlans] = useState<any[]>([]);

  useEffect(() => {
    checkExistingPlans();
  }, []);

  const checkExistingPlans = async () => {
    try {
      const plans = await getCollection('plans');
      setExistingPlans(plans);
    } catch (error) {
      console.error('Error checking existing plans:', error);
    }
  };

  const seedBillingPlans = async () => {
    setIsSeeding(true);
    
    try {
      // Check if plans already exist
      if (existingPlans.length > 0) {
        toast({
          title: 'Plans Already Exist',
          description: `Found ${existingPlans.length} existing plans. Delete them first if you want to reseed.`,
        });
        return;
      }

      // Free Trial Plan
      const freeTrialPlan: Omit<BillingPlan, 'id'> = {
        name: 'Free Trial',
        type: 'FREE',
        price: 0,
        currency: 'GHS',
        billingCycle: 'DAILY',
        features: [
          'Full access to all features',
          'Customer management',
          'Order tracking',
          'Measurement management',
          'Payment tracking',
          'Inventory management',
          'Mobile app access',
          'Basic support'
        ],
        limits: {
          customers: 50,
          orders: 100,
          teamMembers: 3,
          storage: 500, // 500MB
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Standard Plan
      const standardPlan: Omit<BillingPlan, 'id'> = {
        name: 'Standard Plan',
        type: 'PROFESSIONAL',
        price: 43,
        currency: 'GHS',
        billingCycle: 'MONTHLY',
        features: [
          'Full access to all features',
          'Customer management',
          'Order tracking',
          'Measurement management',
          'Payment tracking',
          'Inventory management',
          'Mobile app access',
          'Priority support',
          'Advanced reporting',
          'Data export',
          'Custom branding'
        ],
        limits: {
          customers: 200,
          orders: 500,
          teamMembers: 5,
          storage: 2000, // 2GB
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add plans to database
      await addDocument('plans', freeTrialPlan);
      await addDocument('plans', standardPlan);

      toast({
        title: 'Success!',
        description: 'Billing plans have been seeded successfully.',
      });

      // Refresh the plans list
      await checkExistingPlans();

    } catch (error) {
      console.error('Error seeding billing plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to seed billing plans. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Seed Billing Plans</CardTitle>
          <CardDescription>
            Add default billing plans to the database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {existingPlans.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="font-medium text-yellow-800 mb-2">Existing Plans:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {existingPlans.map((plan) => (
                  <li key={plan.id}>• {plan.name} - {plan.currency} {plan.price}/{plan.billingCycle.toLowerCase()}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="space-y-2">
            <h4 className="font-medium">Plans to be created:</h4>
            <div className="text-sm space-y-1 text-gray-600">
              <div>• Free Trial - 0 GHS/day (3 days recommended)</div>
              <div>• Standard Plan - 43 GHS/month</div>
            </div>
          </div>

          <Button 
            onClick={seedBillingPlans} 
            disabled={isSeeding || existingPlans.length > 0}
            className="w-full"
          >
            {isSeeding ? 'Seeding...' : 'Seed Billing Plans'}
          </Button>
          
          {existingPlans.length > 0 && (
            <p className="text-xs text-gray-500 text-center">
              Delete existing plans first if you want to reseed
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
