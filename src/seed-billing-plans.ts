import dotenv from 'dotenv';
import { getCollection, addDocument } from '@/firebase/firestore';
import { BillingPlan, BillingPlanType, BillingCycle, Currency } from '@/types';

// Load environment variables
dotenv.config({ path: '.env.local' });

const seedBillingPlans = async () => {
  console.log('Starting to seed billing plans...');

  try {
    // Check if plans already exist
    const existingPlans = await getCollection('billingPlans');
    
    if (existingPlans.length > 0) {
      console.log(`Found ${existingPlans.length} existing plans. Skipping seeding.`);
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
    await addDocument('billingPlans', freeTrialPlan);
    console.log('✅ Free Trial plan created successfully');

    await addDocument('billingPlans', standardPlan);
    console.log('✅ Standard plan created successfully');

    console.log('🎉 Billing plans seeded successfully!');
    console.log('\nSeeded Plans:');
    console.log('1. Free Trial - 0 GHS/day (3 days recommended)');
    console.log('2. Standard Plan - 43 GHS/month');

  } catch (error) {
    console.error('❌ Error seeding billing plans:', error);
    throw error;
  }
};

// Export for use in other files
export { seedBillingPlans };

// Auto-run if this file is executed directly
if (typeof window === 'undefined') {
  seedBillingPlans()
    .then(() => {
      console.log('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
