import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock } from 'lucide-react';
import { Subscription } from '@/types';
import { getTrialStatus } from '@/services/billingService';

interface TrialCountdownProps {
  subscription: Subscription | null;
  onUpgrade?: () => void;
}

export default function TrialCountdown({ subscription, onUpgrade }: TrialCountdownProps) {
  const trialInfo = getTrialStatus(subscription);

  if (!trialInfo.isTrial) return null;

  const trialEndDate = subscription?.trialEndsAt
    ? new Date(subscription.trialEndsAt)
    : subscription?.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd)
      : null;

  const countdownLabel = trialInfo.isExpired
    ? 'Trial expired — upgrade to regain full access'
    : `${trialInfo.daysLeft} day${trialInfo.daysLeft === 1 ? '' : 's'} ${trialInfo.hoursLeft} hour${trialInfo.hoursLeft === 1 ? '' : 's'} left`;

  return (
    <div className="border border-orange-200 bg-orange-50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-orange-800">
          <Clock className="h-4 w-4" />
          {countdownLabel}
        </div>
        <Badge variant={trialInfo.isExpired ? 'destructive' : 'secondary'}>
          {!trialInfo.isExpired ? 'Trial running' : 'Expired'}
        </Badge>
      </div>

      {trialEndDate && (
        <div className="flex items-center gap-2 text-xs text-orange-600">
          <Calendar className="h-4 w-4" />
          <span>Trial locks on {trialEndDate.toLocaleString()}</span>
        </div>
      )}

      <div className="text-sm text-orange-700">
        {!trialInfo.isExpired
          ? 'Upgrade now to keep working without interruption. All trial data is preserved.'
          : 'Your trial has expired. Upgrade to unlock all features again.'
        }
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onUpgrade}
        >
          {trialInfo.isExpired ? 'Upgrade now' : 'Upgrade before trial ends'}
        </Button>
      </div>
    </div>
  );
}
