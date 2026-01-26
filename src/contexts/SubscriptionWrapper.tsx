import React from 'react';
import { useAuth } from './AuthContext';
import { SubscriptionProvider } from './SubscriptionContext';

interface SubscriptionWrapperProps {
  children: React.ReactNode;
}

export const SubscriptionWrapper: React.FC<SubscriptionWrapperProps> = ({ children }) => {
  const { shopId } = useAuth();
  
  return (
    <SubscriptionProvider shopId={shopId}>
      {children}
    </SubscriptionProvider>
  );
};
