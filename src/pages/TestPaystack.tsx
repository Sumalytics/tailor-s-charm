import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { paystackService } from '@/services/paystackService';
import { useAuth } from '@/contexts/AuthContext';

export default function TestPaystack() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const testPaystackConfig = () => {
    console.log('Testing Paystack Configuration...');
    console.log('Environment Variables:');
    console.log('VITE_PAYSTACK_SECRET_KEY:', import.meta.env.VITE_PAYSTACK_SECRET_KEY ? 'EXISTS' : 'MISSING');
    console.log('VITE_PAYSTACK_PUBLIC_KEY:', import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ? 'EXISTS' : 'MISSING');
    
    const secretKey = import.meta.env.VITE_PAYSTACK_SECRET_KEY;
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    
    console.log('Secret Key Length:', secretKey?.length || 0);
    console.log('Public Key Length:', publicKey?.length || 0);
    console.log('Secret Key starts with sk_:', secretKey?.startsWith('sk_') || false);
    console.log('Public Key starts with pk_:', publicKey?.startsWith('pk_') || false);
  };

  const testPaymentInitialization = async () => {
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'Please login first',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await paystackService.initializePayment({
        email: currentUser.email || 'test@example.com',
        amount: 1000, // 10 GHS in kobo
        reference: paystackService.generateReference('TEST'),
        metadata: {
          test: true,
          userId: currentUser.uid,
        },
      });

      console.log('Payment initialization successful:', result);
      toast({
        title: 'Success',
        description: 'Payment initialization successful!',
      });
    } catch (error: any) {
      console.error('Payment initialization failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Payment initialization failed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Paystack Configuration Test</CardTitle>
          <CardDescription>
            Test Paystack integration and configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Environment Variables:</h3>
            <div className="p-3 bg-gray-100 rounded text-sm font-mono">
              <div>VITE_PAYSTACK_SECRET_KEY: {import.meta.env.VITE_PAYSTACK_SECRET_KEY ? '✅ EXISTS' : '❌ MISSING'}</div>
              <div>VITE_PAYSTACK_PUBLIC_KEY: {import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ? '✅ EXISTS' : '❌ MISSING'}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Service Configuration:</h3>
            <div className="p-3 bg-gray-100 rounded text-sm">
              <div>Secret Key Length: {import.meta.env.VITE_PAYSTACK_SECRET_KEY?.length || 0}</div>
              <div>Public Key Length: {import.meta.env.VITE_PAYSTACK_PUBLIC_KEY?.length || 0}</div>
              <div>Valid Secret Key: {import.meta.env.VITE_PAYSTACK_SECRET_KEY?.startsWith('sk_') ? '✅' : '❌'}</div>
              <div>Valid Public Key: {import.meta.env.VITE_PAYSTACK_PUBLIC_KEY?.startsWith('pk_') ? '✅' : '❌'}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={testPaystackConfig} variant="outline">
              Test Configuration
            </Button>
            <Button 
              onClick={testPaymentInitialization} 
              disabled={loading || !currentUser}
            >
              {loading ? 'Testing...' : 'Test Payment'}
            </Button>
          </div>

          {!currentUser && (
            <p className="text-sm text-gray-500">
              Please login to test payment initialization
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
