import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getCollection, addDocument } from '@/firebase/firestore';
import { BillingPlan, BillingPlanType, BillingCycle, Currency } from '@/types';

export default function QuickSeedPlans() {
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
          description: `Found ${existingPlans.length} existing plans.`,
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
          storage: 500,
          teamMembers: 3
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
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
          storage: 2000,
          teamMembers: 5
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
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
      console.error('Error seeding plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to seed billing plans.',
        variant: 'destructive',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Quick Seed Billing Plans</CardTitle>
            <CardDescription>
              Seed the database with billing plans for testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Current Status:</p>
              <p className="text-2xl font-bold">{existingPlans.length} plans found</p>
            </div>

            {existingPlans.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Existing Plans:</p>
                {existingPlans.map((plan) => (
                  <div key={plan.id} className="p-2 border rounded text-sm">
                    <strong>{plan.name}</strong> - {plan.currency} {plan.price}/{plan.billingCycle}
                  </div>
                ))}
              </div>
            )}

            <Button 
              onClick={seedBillingPlans}
              disabled={isSeeding || existingPlans.length > 0}
              className="w-full"
            >
              {isSeeding ? 'Seeding...' : 'Seed Billing Plans'}
            </Button>

            <div className="text-center">
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/settings?tab=billing'}
              >
                Go to Billing Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
