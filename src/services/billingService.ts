import { getDocument, getCollection } from '@/firebase/firestore';
import { BillingPlan, Subscription } from '@/types';
import {
  initLocalTrial,
  activateLocalSubscription,
  getLocalTrialSubscription,
} from '@/services/localTrialService';

/** Start 3-day local trial for a new shop (no Firebase). */
export async function createTrialSubscription(shopId: string): Promise<string> {
  initLocalTrial(shopId);
  return 'local';
}

/** Get current subscription for a shop (local trial only). */
export async function getShopSubscription(shopId: string): Promise<Subscription | null> {
  return getLocalTrialSubscription(shopId);
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

// Upgrade subscription (local only — activates app access)
export async function upgradeSubscription(
  shopId: string,
  planId: string,
  _paymentReference: string
): Promise<string> {
  const plan = await getDocument<BillingPlan>('plans', planId);
  if (!plan) {
    throw new Error('Plan not found');
  }
  const periodEndMs =
    Date.now() +
    (plan.billingCycle === 'MONTHLY' ? 30 : 365) * 24 * 60 * 60 * 1000;
  activateLocalSubscription(shopId, periodEndMs, planId);
  return 'local';
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
