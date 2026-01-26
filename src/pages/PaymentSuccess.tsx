import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, Settings, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { paystackService } from '@/services/paystackService';
import { upgradeSubscription } from '@/services/billingService';
import { getDocument } from '@/firebase/firestore';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [subscriptionCreated, setSubscriptionCreated] = useState(false);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const reference = searchParams.get('reference');
      const trxref = searchParams.get('trxref');

      if (!reference) {
        toast({
          title: 'Error',
          description: 'No payment reference found',
          variant: 'destructive',
        });
        navigate('/settings?tab=billing');
        return;
      }

      try {
        setIsProcessing(true);
        
        // Step 1: Verify the payment with Paystack
        console.log('Verifying payment with reference:', reference);
        const verification = await paystackService.verifyTransaction(reference);
        console.log('Payment verification response:', verification);

        if (verification.status && verification.data.status === 'success') {
          // Step 2: Get payment metadata to find plan and user details
          const metadata = verification.data.metadata;
          if (!metadata || !metadata.planId || !metadata.shopId) {
            throw new Error('Payment metadata is missing required information');
          }

          // Step 3: Get the plan details
          const plan = await getDocument<any>('plans', metadata.planId);
          if (!plan) {
            throw new Error('Plan not found');
          }

          // Step 4: Create the subscription
          console.log('Creating subscription for plan:', plan.name);
          const subscriptionData = {
            shopId: metadata.shopId,
            planId: metadata.planId,
            plan: plan,
            status: 'ACTIVE' as const,
            billingCycle: plan.billingCycle,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + (plan.billingCycle === 'MONTHLY' ? 30 : 365) * 24 * 60 * 60 * 1000),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await upgradeSubscription(metadata.shopId, metadata.planId, reference);
          
          setSubscriptionCreated(true);
          setPaymentDetails({
            reference,
            trxref,
            amount: verification.data.amount || 0,
            currency: verification.data.currency || 'GHS',
            paidAt: verification.data.paid_at || new Date().toISOString(),
            planName: plan.name,
            planAmount: plan.amount,
            status: 'success',
            message: 'Payment completed and subscription activated'
          });

          toast({
            title: 'Payment Successful!',
            description: `Your subscription to ${plan.name} has been activated.`,
          });
        } else {
          throw new Error('Payment verification failed');
        }
      } catch (error) {
        console.error('Error processing payment success:', error);
        toast({
          title: 'Payment Processing Error',
          description: error instanceof Error ? error.message : 'Failed to process payment. Please contact support.',
          variant: 'destructive',
        });
        
        setPaymentDetails({
          reference,
          trxref,
          status: 'error',
          message: error instanceof Error ? error.message : 'Payment processing failed'
        });
      } finally {
        setIsProcessing(false);
      }
    };

    handlePaymentSuccess();
  }, [searchParams, navigate, toast]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p>Processing your payment and activating subscription...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentDetails?.status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-600">Payment Processing Error</CardTitle>
            <CardDescription>
              There was an issue processing your payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-800">{paymentDetails.message}</p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate('/settings?tab=billing')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Back to Billing
              </Button>
              <Button 
                className="flex-1"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
          <CardDescription>
            Your subscription has been activated successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentDetails && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Payment Details:</p>
              <div className="text-xs space-y-1">
                <div><strong>Reference:</strong> {paymentDetails.reference}</div>
                <div><strong>Transaction Ref:</strong> {paymentDetails.trxref}</div>
                <div><strong>Plan:</strong> {paymentDetails.planName}</div>
                <div><strong>Amount:</strong> {paymentDetails.planAmount} GHS</div>
                <div><strong>Status:</strong> <span className="text-green-600">Success</span></div>
                {subscriptionCreated && (
                  <div><strong>Subscription:</strong> <span className="text-green-600">Activated</span></div>
                )}
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600 text-center">
            You will be redirected to your settings page in a few seconds...
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate('/settings?tab=billing')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Billing Settings
            </Button>
            <Button 
              className="flex-1"
              onClick={() => navigate('/dashboard')}
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
