import { 
  getDocument, 
  getCollection, 
  addDocument, 
  updateDocument 
} from '@/firebase/firestore';
import { BillingPlan, Subscription } from '@/types';

// Create a trial subscription for a new shop
export async function createTrialSubscription(shopId: string): Promise<string> {
  try {
    // Get the free trial plan
    const trialPlans = await getCollection<BillingPlan>('plans', [
      { field: 'type', operator: '==', value: 'FREE' },
      { field: 'isActive', operator: '==', value: true }
    ]);

    if (trialPlans.length === 0) {
      throw new Error('No trial plan found');
    }

    const trialPlan = trialPlans[0];
    const trialEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

    const subscriptionData: Omit<Subscription, 'id'> = {
      shopId,
      planId: trialPlan.id,
      plan: trialPlan,
      status: 'TRIAL',
      billingCycle: trialPlan.billingCycle,
      currentPeriodStart: new Date(),
      currentPeriodEnd: trialEndsAt,
      trialEndsAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const subscriptionId = await addDocument('subscriptions', subscriptionData);
    console.log('Trial subscription created:', subscriptionId);
    return subscriptionId;
  } catch (error) {
    console.error('Error creating trial subscription:', error);
    throw error;
  }
}

// Get current subscription for a shop
export async function getShopSubscription(shopId: string): Promise<Subscription | null> {
  try {
    const subscriptions = await getCollection<Subscription>('subscriptions', [
      { field: 'shopId', operator: '==', value: shopId }
    ]);

    if (subscriptions.length === 0) {
      return null;
    }

    // Return the most recent subscription
    return subscriptions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  } catch (error) {
    console.error('Error getting shop subscription:', error);
    throw error;
  }
}

// Check if subscription is expired or trial ended
export async function checkSubscriptionStatus(shopId: string): Promise<{
  isActive: boolean;
  isLocked: boolean;
  status: string;
  daysUntilExpiry?: number;
}> {
  try {
    const subscription = await getShopSubscription(shopId);
    
    console.log('BillingService - Subscription found:', subscription);
    
    if (!subscription) {
      console.log('BillingService - No subscription found, locking user');
      return { isActive: false, isLocked: true, status: 'NO_SUBSCRIPTION' };
    }

    const now = new Date();
    const endDate = new Date(subscription.currentPeriodEnd);
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log('BillingService - Subscription details:', {
      status: subscription.status,
      currentPeriodEnd: endDate,
      now: now,
      daysUntilExpiry,
      isExpired: now > endDate
    });

    // Check if trial has ended
    if (subscription.status === 'TRIAL' && now > endDate) {
      console.log('BillingService - Trial expired, locking user');
      // Update subscription status to expired
      await updateDocument('subscriptions', subscription.id, {
        status: 'CANCELLED',
        updatedAt: new Date()
      });
      return { isActive: false, isLocked: true, status: 'TRIAL_EXPIRED' };
    }

    // Check if paid subscription has expired
    if (subscription.status === 'ACTIVE' && now > endDate) {
      console.log('BillingService - Active subscription expired, locking user');
      await updateDocument('subscriptions', subscription.id, {
        status: 'PAST_DUE',
        updatedAt: new Date()
      });
      return { isActive: false, isLocked: true, status: 'EXPIRED' };
    }

    // Check if already past due or cancelled
    if (subscription.status === 'PAST_DUE' || subscription.status === 'CANCELLED') {
      console.log('BillingService - Subscription is past due or cancelled, locking user');
      return { isActive: false, isLocked: true, status: subscription.status };
    }

    console.log('BillingService - Subscription is active, unlocking user');
    return { 
      isActive: true, 
      isLocked: false, 
      status: subscription.status,
      daysUntilExpiry
    };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return { isActive: false, isLocked: true, status: 'ERROR' };
  }
}

// Get available plans for upgrade (only monthly plan for trial users)
export async function getAvailablePlans(currentSubscription?: Subscription | null): Promise<BillingPlan[]> {
  try {
    const plans = await getCollection<BillingPlan>('plans', [
      { field: 'isActive', operator: '==', value: true }
    ]);

    console.log('All active plans from database:', plans);

    // If no plans found, return empty array
    if (plans.length === 0) {
      console.warn('No active billing plans found in database');
      return [];
    }

    // If user is on trial, only show the monthly professional plan
    if (currentSubscription?.status === 'TRIAL') {
      const filteredPlans = plans.filter(plan => 
        plan.type === 'PROFESSIONAL' && 
        plan.billingCycle === 'MONTHLY'
      );
      console.log('Filtered plans for trial user:', filteredPlans);
      return filteredPlans;
    }

    // For other users, show all plans except free
    const filteredPlans = plans.filter(plan => plan.type !== 'FREE');
    console.log('Filtered plans for regular user:', filteredPlans);
    return filteredPlans;
  } catch (error) {
    console.error('Error getting available plans:', error);
    throw error;
  }
}

// Upgrade subscription
export async function upgradeSubscription(
  shopId: string, 
  planId: string, 
  paymentReference: string
): Promise<string> {
  try {
    const plan = await getDocument<BillingPlan>('plans', planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    const subscriptionData: Omit<Subscription, 'id'> = {
      shopId,
      planId,
      plan,
      status: 'ACTIVE',
      billingCycle: plan.billingCycle,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(
        Date.now() + (plan.billingCycle === 'MONTHLY' ? 30 : 365) * 24 * 60 * 60 * 1000
      ),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const subscriptionId = await addDocument('subscriptions', subscriptionData);
    
    console.log('Subscription upgraded:', subscriptionId);
    return subscriptionId;
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    throw error;
  }
}

// Get trial status information
export function getTrialStatus(subscription: Subscription | null): {
  isTrial: boolean;
  daysLeft: number;
  hoursLeft: number;
  isExpired: boolean;
} {
  if (!subscription || subscription.status !== 'TRIAL') {
    return { isTrial: false, daysLeft: 0, hoursLeft: 0, isExpired: false };
  }

  const now = new Date();
  const trialEnd = subscription.trialEndsAt ? new Date(subscription.trialEndsAt) : new Date(subscription.currentPeriodEnd);
  const timeLeft = trialEnd.getTime() - now.getTime();
  
  const daysLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60 * 24)));
  const hoursLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  const isExpired = timeLeft <= 0;

  return { isTrial: true, daysLeft, hoursLeft, isExpired };
}
