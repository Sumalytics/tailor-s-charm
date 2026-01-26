import React from 'react';
import AccountLocked from '@/components/billing/AccountLocked';

export default function TestUpgradeButton() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-8">Test Upgrade Button</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Trial Expired Status</h2>
          <AccountLocked status="TRIAL_EXPIRED" />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-4">Expired Status</h2>
          <AccountLocked status="EXPIRED" />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-4">Cancelled Status</h2>
          <AccountLocked status="CANCELLED" />
        </div>
      </div>
    </div>
  );
}
