import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  checkLocalTrialStatus,
  getLocalTrialSubscription,
} from '@/services/localTrialService';
import { getShopSubscription as getFirestoreShopSubscription } from '@/firebase/firestore';
import type { Subscription } from '@/types';

export type AccountStatusDisplay = 'Trial' | 'Active' | 'Trial expired' | 'No subscription' | 'No shop';

interface SubscriptionContextType {
  subscription: Subscription | null;
  isActive: boolean;
  isLocked: boolean;
  status: string;
  daysUntilExpiry?: number;
  /** Display label for profile "Account status" (Trial, Active, etc.). */
  accountStatusDisplay: AccountStatusDisplay;
  /** True when on trial and ≤7 days until expiry (show countdown banner). */
  notifyExpiry?: boolean;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
  shopId: string | null;
}

function statusToDisplay(s: string): AccountStatusDisplay {
  if (s === 'TRIAL') return 'Trial';
  if (s === 'ACTIVE') return 'Active';
  if (s === 'TRIAL_EXPIRED' || s === 'EXPIRED') return 'Trial expired';
  if (s === 'NO_SHOP') return 'No shop';
  return 'No subscription';
}

export const SubscriptionProvider = ({ children, shopId }: SubscriptionProviderProps) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [status, setStatus] = useState('NO_SUBSCRIPTION');
  const [daysUntilExpiry, setDaysUntilExpiry] = useState<number | undefined>();
  const [notifyExpiry, setNotifyExpiry] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshSubscription = async () => {
    if (!shopId) return;

    setLoading(true);
    try {
      // Prefer Firestore: if user has ACTIVE subscription and not expired, allow access (fixes "has plan but locked")
      let firestoreSub: Subscription | null = null;
      try {
        const subs = await getFirestoreShopSubscription(shopId);
        firestoreSub = subs;
      } catch (e) {
        console.warn('SubscriptionContext: Firestore subscription fetch failed', e);
      }

      const periodEnd = firestoreSub?.currentPeriodEnd;
      const periodEndMs = periodEnd ? new Date(periodEnd).getTime() : 0;
      const firestoreActive = !!(
        firestoreSub &&
        firestoreSub.status === 'ACTIVE' &&
        periodEndMs > Date.now()
      );

      if (firestoreActive && firestoreSub) {
        setSubscription(firestoreSub);
        setIsActive(true);
        setIsLocked(false);
        setStatus('ACTIVE');
        const days = Math.ceil((periodEndMs - Date.now()) / (1000 * 60 * 60 * 24));
        setDaysUntilExpiry(Math.max(0, days));
        setNotifyExpiry(false);
        return;
      }

      const currentSubscription = getLocalTrialSubscription(shopId);
      const subscriptionStatus = checkLocalTrialStatus(shopId);

      setSubscription(currentSubscription);
      setIsActive(subscriptionStatus.isActive);
      setIsLocked(subscriptionStatus.isLocked);
      setStatus(subscriptionStatus.status);
      setDaysUntilExpiry(subscriptionStatus.daysUntilExpiry);
      setNotifyExpiry(subscriptionStatus.notifyExpiry ?? false);
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      setIsActive(false);
      setIsLocked(true);
      setStatus('ERROR');
      setNotifyExpiry(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shopId) {
      refreshSubscription();
    } else {
      setSubscription(null);
      setIsActive(true);
      setIsLocked(false);
      setStatus('NO_SHOP');
      setDaysUntilExpiry(undefined);
      setNotifyExpiry(false);
      setLoading(false);
    }
  }, [shopId]);

  const value: SubscriptionContextType = {
    subscription,
    isActive,
    isLocked,
    status,
    daysUntilExpiry,
    accountStatusDisplay: statusToDisplay(status),
    notifyExpiry,
    loading,
    refreshSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
