// Script to seed billing plans directly
import { getCollection, addDocument } from '../firebase/firestore.js';

const seedPlans = async () => {
  try {
    // Check if plans already exist
    const existingPlans = await getCollection('plans');
    if (existingPlans.length > 0) {
      console.log(`Found ${existingPlans.length} existing plans. Skipping seeding.`);
      return;
    }

    // Free Trial Plan
    const freeTrialPlan = {
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
    const standardPlan = {
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

    console.log('✅ Billing plans seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding billing plans:', error);
  }
};

// Run the seeding
seedPlans();
