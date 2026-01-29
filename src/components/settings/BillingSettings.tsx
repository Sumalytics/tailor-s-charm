import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { 
  getShopSubscription, 
  getAvailablePlans, 
  upgradeSubscription 
} from '@/services/billingService';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  CreditCard, 
  Calendar,
  RefreshCw,
  Crown,
  Zap,
  Star,
  AlertCircle
} from 'lucide-react';
import PaystackPayment from '@/components/payment/PaystackPayment';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Subscription, BillingPlan } from '@/types';
import { getCollection } from '@/firebase/firestore';
import { getTrialStatus } from '@/services/billingService';
import TrialCountdown from '@/components/billing/TrialCountdown';

function getPlanFeaturesArray(plan: { features?: unknown }): string[] {
  const f = plan?.features;
  if (Array.isArray(f)) return f;
  if (f && typeof f === 'object') return Object.values(f).filter((v): v is string => typeof v === 'string');
  return [];
}

export default function BillingSettings() {
  const { currentUser, shopId } = useAuth();
  const { subscription: contextSubscription, isActive, isLocked, status, daysUntilExpiry, refreshSubscription } = useSubscription();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingPlans, setBillingPlans] = useState<BillingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [planToUpgrade, setPlanToUpgrade] = useState<BillingPlan | null>(null);

  useEffect(() => {
    loadBillingData();
  }, [shopId]);

  const loadBillingData = async () => {
    if (!shopId) {
      console.log('No shopId provided, loading all plans');
      // Load all plans even without shopId for new users
      try {
        const plans = await getCollection<BillingPlan>('plans', [
          { field: 'isActive', operator: '==', value: true }
        ]);
        console.log('All plans (no shop):', plans);
        setBillingPlans(plans);
      } catch (error) {
        console.error('Error loading plans without shop:', error);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('Loading billing data for shop:', shopId);
      
      // Load current subscription
      const currentSubscription = await getShopSubscription(shopId);
      console.log('Current subscription:', currentSubscription);
      setSubscription(currentSubscription);

      // Load available plans based on subscription status
      const plans = await getAvailablePlans(currentSubscription);
      console.log('Available plans:', plans);
      setBillingPlans(plans);

      // Set current plan details
      if (currentSubscription) {
        setSelectedPlan(currentSubscription.plan);
      }
    } catch (error) {
      console.error('Error loading billing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load billing information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePlan = (plan: BillingPlan) => {
    console.log('handleUpgradePlan called with plan:', plan);
    setPlanToUpgrade(plan);
    setUpgradeDialogOpen(true);
  };

  const handlePaymentSuccess = async (reference: string) => {
    if (!shopId || !planToUpgrade) return;

    try {
      // Create new subscription using billing service
      await upgradeSubscription(shopId, planToUpgrade.id, reference);
      await refreshSubscription();

      toast({
        title: 'Payment Successful!',
        description: `Your subscription has been upgraded to ${planToUpgrade.name}.`,
      });

      setUpgradeDialogOpen(false);
      setPlanToUpgrade(null);
      loadBillingData();
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to activate subscription. Please contact support.',
        variant: 'destructive',
      });
    }
  };

  const handlePaymentError = (error: Error) => {
    toast({
      title: 'Payment Failed',
      description: error.message || 'Payment processing failed. Please try again.',
      variant: 'destructive',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'ENTERPRISE':
        return <Crown className="h-6 w-6 text-yellow-600" />;
      case 'PROFESSIONAL':
        return <Zap className="h-6 w-6 text-blue-600" />;
      default:
        return <Star className="h-6 w-6 text-gray-600" />;
    }
  };

  const showExpiryBanner = daysUntilExpiry !== undefined && daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  const expiryMessage = showExpiryBanner 
    ? `Your subscription expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`
    : '';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Information - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="text-xs space-y-1">
              <strong>Debug Info:</strong>
              <div>Status: {status}</div>
              <div>Is Active: {isActive.toString()}</div>
              <div>Is Locked: {isLocked.toString()}</div>
              <div>Days Until Expiry: {daysUntilExpiry || 'N/A'}</div>
              <div>Subscription ID: {contextSubscription?.id || 'None'}</div>
              <div>Current Period End: {contextSubscription?.currentPeriodEnd ? new Date(contextSubscription.currentPeriodEnd).toLocaleDateString() : 'None'}</div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Expiry Banner */}
      {showExpiryBanner && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="flex items-center justify-between">
              <span className="font-medium">{expiryMessage}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setUpgradeDialogOpen(true)}
                className="ml-4 border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                Renew Now
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>
            Your subscription details and billing information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscription && selectedPlan ? (
            <div className="space-y-4">
              <div className={`flex items-center justify-between p-4 border rounded-lg ${
                subscription.status === 'TRIAL' ? 'bg-orange-50 border-orange-200' : 'bg-green-50'
              }`}>
                <div className="flex items-center space-x-3">
                  {getPlanIcon(selectedPlan.type)}
                  <div>
                    <h3 className="text-lg font-bold">{selectedPlan.name}</h3>
                    <p className="text-sm text-gray-600">
                      {subscription.status === 'TRIAL' ? 'Trial Period' : `${selectedPlan.type} plan`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(selectedPlan.price)}
                  </div>
                  <div className="text-sm text-gray-600">/{selectedPlan.billingCycle.toLowerCase()}</div>
                  <Badge 
                    variant={subscription.status === 'TRIAL' ? 'secondary' : 'default'} 
                    className="mt-1"
                  >
                    {subscription.status === 'TRIAL' ? (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        Trial
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </>
                    )}
                  </Badge>
                </div>
              </div>

              {/* Trial status information */}
              {subscription.status === 'TRIAL' && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold">{subscription.plan.name}</h3>
                        <Badge variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {subscription.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-4">
                        GHS {subscription.plan.price}/{subscription.billingCycle.toLowerCase()} • Billed {subscription.billingCycle.toLowerCase()}
                      </p>
                      
                      {/* Expiry Information */}
                      {subscription.currentPeriodEnd && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {subscription.status === 'ACTIVE' 
                              ? `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                              : `Expired on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                            }
                          </span>
                          {daysUntilExpiry !== undefined && daysUntilExpiry > 0 && (
                            <span className="text-orange-600 font-medium">
                              ({daysUntilExpiry} days left)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {getPlanIcon(subscription.plan.type)}
                  </div>
                  
                  <TrialCountdown 
                    subscription={subscription}
                    onUpgrade={() => setUpgradeDialogOpen(true)}
                  />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-600">
                    {subscription.status === 'TRIAL' ? 'Trial Ends' : 'Next Billing Date'}
                  </p>
                  <p className="font-medium">
                    {subscription.currentPeriodEnd 
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Billing Cycle</p>
                  <p className="font-medium">{selectedPlan.billingCycle}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Included Features</p>
                <div className="grid gap-1 md:grid-cols-2">
                  {getPlanFeaturesArray(selectedPlan).slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
              <p className="text-gray-500 mb-4">Choose a plan to start using all features</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>
            {subscription?.status === 'TRIAL' ? 'Upgrade Your Plan' : 'Choose a Plan'}
          </CardTitle>
          <CardDescription>
            {subscription?.status === 'TRIAL' 
              ? 'Upgrade to the Standard Plan to continue using all features after your trial'
              : 'Select the perfect plan for your business needs'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {billingPlans.length === 0 && !loading ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Plans Available</h3>
              <p className="text-gray-500 mb-4">
                {subscription?.status === 'TRIAL' 
                  ? 'No upgrade plans are currently available. Please contact support.'
                  : 'No billing plans are available at the moment. Please check back later.'
                }
              </p>
              <Button onClick={() => window.location.href = '/quick-seed'}>
                Seed Billing Plans
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/test-billing-debug'}
                className="ml-2"
              >
                Debug Plans
              </Button>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              subscription?.status === 'TRIAL' ? 'md:grid-cols-1' : 'md:grid-cols-3'
            }`}>
              {billingPlans.map((plan) => {
                const isCurrentPlan = subscription?.planId === plan.id;
                const isUpgrade = selectedPlan && plan.price > selectedPlan.price;
                const isDowngrade = selectedPlan && plan.price < selectedPlan.price;

                return (
                  <div 
                    key={plan.id} 
                    className={`relative p-6 border rounded-lg ${
                      isCurrentPlan ? 'border-green-500 bg-green-50' : 
                      subscription?.status === 'TRIAL' ? 'border-blue-200 bg-blue-50' :
                      'border-gray-200'
                    }`}
                  >
                    {isCurrentPlan && (
                      <Badge className="absolute -top-2 left-4 bg-green-600">
                        Current Plan
                      </Badge>
                    )}
                    
                    {subscription?.status === 'TRIAL' && !isCurrentPlan && (
                      <Badge className="absolute -top-2 left-4 bg-blue-600">
                        Upgrade
                      </Badge>
                    )}
                    
                    <div className="text-center mb-4">
                      {getPlanIcon(plan.type)}
                      <h3 className="text-xl font-bold mt-2">{plan.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{plan.type} plan</p>
                    </div>

                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold">
                        {formatCurrency(plan.price)}
                      </div>
                      <div className="text-sm text-gray-600">/{plan.billingCycle.toLowerCase()}</div>
                    </div>

                    <div className="space-y-2 mb-6">
                      {getPlanFeaturesArray(plan).map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="text-sm text-gray-600">
                        <strong>Limits:</strong>
                      </div>
                      <div className="text-xs space-y-1">
                        <div>• {plan.limits.customers} customers</div>
                        <div>• {plan.limits.orders} orders/month</div>
                        <div>• {plan.limits.teamMembers} team members</div>
                        <div>• {plan.limits.storage}MB storage</div>
                      </div>
                    </div>

                    <Button 
                      className="w-full"
                      variant={isCurrentPlan ? "outline" : "default"}
                      disabled={isCurrentPlan}
                      onClick={() => {
                        console.log('Button clicked for plan:', plan);
                        console.log('isCurrentPlan:', isCurrentPlan);
                        console.log('subscription:', subscription);
                        if (!isCurrentPlan) {
                          handleUpgradePlan(plan);
                        }
                      }}
                    >
                      {isCurrentPlan ? 'Current Plan' : 
                       subscription?.status === 'TRIAL' ? 'Upgrade Now' :
                       !subscription ? 'Choose Plan' : 
                       isUpgrade ? 'Upgrade' : 
                       isDowngrade ? 'Downgrade' : 'Choose Plan'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          
          {subscription?.status === 'TRIAL' && billingPlans.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Special Offer:</strong> Upgrade now and get instant access to all features. 
                Your trial data will be preserved and you'll be billed GHS 43/month.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upgrade to {planToUpgrade?.name}</DialogTitle>
            <DialogDescription>
              Complete your payment to activate your new subscription
            </DialogDescription>
          </DialogHeader>
          
          {planToUpgrade && currentUser && (
            <PaystackPayment
              email={currentUser.email || ''}
              amount={planToUpgrade.price}
              description={`Upgrade to ${planToUpgrade.name} plan`}
              metadata={{
                planId: planToUpgrade.id,
                planName: planToUpgrade.name,
                shopId,
                userId: currentUser.uid,
              }}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
