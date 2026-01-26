import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { checkSubscriptionStatus, getShopSubscription } from '@/services/billingService';
import { Subscription } from '@/types';

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
      console.log('SubscriptionContext - Refreshing subscription for shopId:', shopId);
      const subscriptionStatus = await checkSubscriptionStatus(shopId);
      const currentSubscription = await getShopSubscription(shopId);

      console.log('SubscriptionContext - Subscription status result:', subscriptionStatus);
      console.log('SubscriptionContext - Current subscription:', currentSubscription);

      setSubscription(currentSubscription);
      setIsActive(subscriptionStatus.isActive);
      setIsLocked(subscriptionStatus.isLocked);
      setStatus(subscriptionStatus.status);
      setDaysUntilExpiry(subscriptionStatus.daysUntilExpiry);
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      // Default to locked on error
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
      // No shop ID means no subscription
      setSubscription(null);
      setIsActive(false);
      setIsLocked(true);
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
