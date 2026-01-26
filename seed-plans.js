// Simple seeding script that can be run in the browser console
// Copy and paste this into the browser console when logged in as super admin

const seedBillingPlans = async () => {
  console.log('🌱 Starting to seed billing plans...');
  
  try {
    // Import Firebase functions (they should be available in the app context)
    const { addDocument, getCollection } = window.firebase || {};
    
    if (!addDocument || !getCollection) {
      console.error('❌ Firebase functions not available. Make sure you\'re logged in and the app is loaded.');
      return;
    }

    // Check if plans already exist
    const existingPlans = await getCollection('billingPlans');
    
    if (existingPlans.length > 0) {
      console.log(`📋 Found ${existingPlans.length} existing plans. Skipping seeding.`);
      console.log('Existing plans:', existingPlans.map(p => p.name));
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
        teamMembers: 3,
        storage: 500, // 500MB
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
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
        teamMembers: 5,
        storage: 2000, // 2GB
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add plans to database
    const freeTrialId = await addDocument('billingPlans', freeTrialPlan);
    console.log('✅ Free Trial plan created successfully with ID:', freeTrialId);

    const standardId = await addDocument('billingPlans', standardPlan);
    console.log('✅ Standard plan created successfully with ID:', standardId);

    console.log('🎉 Billing plans seeded successfully!');
    console.log('\n📋 Seeded Plans:');
    console.log('1. Free Trial - 0 GHS/day (3 days recommended)');
    console.log('2. Standard Plan - 43 GHS/month');
    
    // Refresh the plans list
    window.location.reload();

  } catch (error) {
    console.error('❌ Error seeding billing plans:', error);
    console.log('💡 Make sure you are logged in as a super admin and have proper permissions');
  }
};

// Auto-run the function
seedBillingPlans();

console.log('📝 Seeding script loaded. You can also run seedBillingPlans() manually.');
