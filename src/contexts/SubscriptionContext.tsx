import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  checkLocalTrialStatus,
  getLocalTrialSubscription,
} from '@/services/localTrialService';
import type { Subscription } from '@/types';

interface SubscriptionContextType {
  subscription: Subscription | null;
  isActive: boolean;
  isLocked: boolean;
  status: string;
  daysUntilExpiry?: number;
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

export const SubscriptionProvider = ({ children, shopId }: SubscriptionProviderProps) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [status, setStatus] = useState('NO_SUBSCRIPTION');
  const [daysUntilExpiry, setDaysUntilExpiry] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);

  const refreshSubscription = async () => {
    if (!shopId) return;

    setLoading(true);
    try {
      // No auto-trial when record is missing (e.g. localStorage cleared).
      // Trial only starts when user creates a new shop (ShopSettings → initLocalTrial).
      const currentSubscription = getLocalTrialSubscription(shopId);
      const subscriptionStatus = checkLocalTrialStatus(shopId);

      setSubscription(currentSubscription);
      setIsActive(subscriptionStatus.isActive);
      setIsLocked(subscriptionStatus.isLocked);
      setStatus(subscriptionStatus.status);
      setDaysUntilExpiry(subscriptionStatus.daysUntilExpiry);
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      setIsActive(false);
      setIsLocked(true);
      setStatus('ERROR');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shopId) {
      refreshSubscription();
    } else {
      // No shop yet: don't lock — user needs to access shop-setup to create shop and start 3-day trial
      setSubscription(null);
      setIsActive(true);
      setIsLocked(false);
      setStatus('NO_SHOP');
      setLoading(false);
    }
  }, [shopId]);

  const value: SubscriptionContextType = {
    subscription,
    isActive,
    isLocked,
    status,
    daysUntilExpiry,
    loading,
    refreshSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
