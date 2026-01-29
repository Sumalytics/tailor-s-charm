import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, AlertTriangle, CreditCard, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AccountLockedProps {
  status: string;
  onUpgrade?: () => void;
}

export default function AccountLocked({ status, onUpgrade }: AccountLockedProps) {
  const navigate = useNavigate();

  const getStatusMessage = () => {
    switch (status) {
      case 'TRIAL_EXPIRED':
        return {
          title: 'Trial Period Expired',
          description: 'Your 30-day free trial has ended. Upgrade to continue using TailorFlow.',
          icon: <AlertTriangle className="h-12 w-12 text-orange-500" />,
          badge: 'Trial Expired',
          badgeVariant: 'secondary' as const
        };
      case 'EXPIRED':
      case 'PAST_DUE':
        return {
          title: 'Subscription Expired',
          description: 'Your subscription has expired. Please renew to access your account.',
          icon: <Lock className="h-12 w-12 text-red-500" />,
          badge: 'Expired',
          badgeVariant: 'destructive' as const
        };
      case 'CANCELLED':
        return {
          title: 'Subscription Cancelled',
          description: 'Your subscription has been cancelled. Upgrade to reactivate your account.',
          icon: <Lock className="h-12 w-12 text-gray-500" />,
          badge: 'Cancelled',
          badgeVariant: 'secondary' as const
        };
      case 'NO_SHOP':
        return {
          title: 'Set Up Your Shop',
          description: 'Create your shop to start your 30-day free trial and get full access.',
          icon: <CreditCard className="h-12 w-12 text-primary" />,
          badge: 'Setup required',
          badgeVariant: 'secondary' as const
        };
      default:
        return {
          title: 'Account Locked',
          description: 'Your account is currently locked. Please upgrade to continue.',
          icon: <Lock className="h-12 w-12 text-red-500" />,
          badge: 'Locked',
          badgeVariant: 'destructive' as const
        };
    }
  };

  const statusInfo = getStatusMessage();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else if (status === 'NO_SHOP') {
      // No shop yet: send to shop setup to create shop and start 30-day trial
      window.location.href = '/shop-setup';
    } else {
      window.location.href = '/settings?tab=billing';
    }
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {statusInfo.icon}
          </div>
          <CardTitle className="text-xl">{statusInfo.title}</CardTitle>
          <CardDescription className="text-base">
            {statusInfo.description}
          </CardDescription>
          <div className="flex justify-center mt-2">
            <Badge variant={statusInfo.badgeVariant}>
              {statusInfo.badge}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              What happens next?
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Your data is safely stored</li>
              <li>• You can log in but cannot use features</li>
              <li>• Upgrade anytime to restore access</li>
            </ul>
          </div>
          
          <Button 
            onClick={handleUpgrade}
            className="w-full"
            size="lg"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {status === 'NO_SHOP' ? 'Set Up Shop' : 'Upgrade Now'}
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            Need help? Contact our support team for assistance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
