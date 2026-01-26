import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { paystackService } from '@/services/paystackService';
import { Loader2, CreditCard, CheckCircle } from 'lucide-react';

interface PaystackPaymentProps {
  email: string;
  amount: number; // in GHS
  description?: string;
  metadata?: Record<string, any>;
  onSuccess?: (reference: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export default function PaystackPayment({
  email,
  amount,
  description,
  metadata = {},
  onSuccess,
  onError,
  className,
}: PaystackPaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [currentPaymentReference, setCurrentPaymentReference] = useState('');
  const { toast } = useToast();
  const paymentHandledRef = useRef(false);

  // Check if Paystack script is loaded
  useEffect(() => {
    const checkPaystackLoaded = () => {
      if (!(window as any).PaystackPop) {
        console.error('PaystackPop not available. Script may not be loaded.');
      }
    };

    checkPaystackLoaded();
    const timer = setTimeout(checkPaystackLoaded, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Manual payment verification fallback
  const verifyPaymentManually = async (reference: string) => {
    if (paymentHandledRef.current || isVerifyingPayment) {
      return;
    }
    
    setIsVerifyingPayment(true);
    
    try {
      const verification = await paystackService.verifyTransaction(reference);
      
      if (verification.status && verification.data.status === 'success') {
        paymentHandledRef.current = true;
        setIsVerifyingPayment(false);
        
        toast({
          title: 'Payment Successful!',
          description: 'Your payment has been processed successfully.',
        });
        onSuccess?.(reference);
      } else {
        // Only retry if payment is still pending
        if (verification.data?.status === 'pending' || verification.data?.status === 'processing') {
          setIsVerifyingPayment(false);
          // Try again after 5 seconds
          setTimeout(() => verifyPaymentManually(reference), 5000);
        } else {
          setIsVerifyingPayment(false);
          toast({
            title: 'Payment Failed',
            description: 'Payment could not be completed.',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      setIsVerifyingPayment(false);
      console.error('Payment verification failed:', error);
      toast({
        title: 'Verification Error',
        description: 'Payment verification failed. Please contact support.',
        variant: 'destructive',
      });
    }
  };

  const handlePayment = async () => {
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please provide an email address for payment.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    paymentHandledRef.current = false;

    try {
      // Generate unique reference for this payment
      const paymentReference = paystackService.generateReference('PAYMENT');
      setCurrentPaymentReference(paymentReference);

      // Initialize payment with Paystack
      const response = await paystackService.initializePayment({
        email,
        amount,
        reference: paymentReference,
        callback_url: `${window.location.origin}/payment/success`,
        metadata: {
          ...metadata,
          description,
          amount,
          timestamp: new Date().toISOString(),
        },
      });

      console.log('PaystackPayment - Initialization response:', response);

      // Check if PaystackPop is available
      if (!(window as any).PaystackPop) {
        throw new Error('Paystack library not loaded. Please refresh the page.');
      }

      // Open Paystack checkout page directly using authorization_url
      setIsProcessing(true);
      
      // Open in new window/tab
      const popupWindow = window.open(
        response.data.authorization_url,
        'paystack-checkout',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Start manual verification as fallback after 10 seconds
      setTimeout(() => {
        if (!paymentHandledRef.current) {
          verifyPaymentManually(paymentReference);
        }
      }, 10000);

      // Listen for popup close
      const checkClosed = setInterval(() => {
        if (popupWindow?.closed) {
          clearInterval(checkClosed);
          setIsProcessing(false);
          setIsLoading(false);
          
          if (!paymentHandledRef.current) {
            toast({
              title: 'Payment Cancelled',
              description: 'You have cancelled the payment.',
            });
          }
        }
      }, 1000);

      // Listen for messages from popup (if popup sends them)
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== 'https://checkout.paystack.co') return;
        
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        
        if (event.data.status === 'success' && !paymentHandledRef.current) {
          paymentHandledRef.current = true;
          setIsProcessing(false);
          setIsLoading(false);
          toast({
            title: 'Payment Successful!',
            description: 'Your payment has been processed successfully.',
          });
          onSuccess?.(event.data.reference);
          popupWindow?.close();
        }
      };

      window.addEventListener('message', handleMessage);

    } catch (error) {
      console.error('PaystackPayment - Payment error:', error);
      setIsLoading(false);
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'Failed to initialize payment',
        variant: 'destructive',
      });
      onError?.(error);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Paystack Payment
        </CardTitle>
        <CardDescription>
          Secure payment via Paystack (Cards & Mobile Money)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Amount</p>
            <p className="text-2xl font-bold">GHS {amount.toFixed(2)}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            Secure Payment
          </Badge>
        </div>

        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}

        <Button
          onClick={handlePayment}
          disabled={isLoading || isProcessing}
          className="w-full"
          size="lg"
        >
          {isLoading || isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isVerifyingPayment ? 'Verifying...' : 'Processing...'}
            </>
          ) : (
            <>Pay GHS {amount.toFixed(2)}</>
          )}
        </Button>

        <div className="text-xs text-gray-500 text-center">
          <p>Payment methods: Cards, Mobile Money</p>
          <p>Secured by Paystack</p>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span>SSL Secured</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span>PCI Compliant</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span>Instant Confirmation</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
