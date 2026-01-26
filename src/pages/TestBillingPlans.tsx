import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getBillingPlans } from '@/firebase/firestore';

export default function TestBillingPlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const testFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Starting fetch test...');
      const plansData = await getBillingPlans();
      console.log('Fetch successful:', plansData);
      setPlans(plansData);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testFetch();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Billing Plans Test</CardTitle>
          <CardDescription>
            Test page to debug billing plans loading
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={testFetch} disabled={loading}>
              {loading ? 'Loading...' : 'Test Fetch'}
            </Button>
            <span className="text-sm text-gray-600">
              Check browser console for detailed logs
            </span>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <h4 className="font-medium text-red-800">Error:</h4>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-medium">Results:</h4>
            <div className="text-sm">
              <p>Plans found: {plans.length}</p>
              <p>Loading: {loading ? 'Yes' : 'No'}</p>
              <p>Error: {error || 'None'}</p>
            </div>
          </div>

          {plans.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Plan Details:</h4>
              <div className="space-y-2">
                {plans.map((plan, index) => (
                  <div key={plan.id || index} className="p-3 bg-gray-50 rounded-md">
                    <div className="text-sm font-medium">{plan.name}</div>
                    <div className="text-xs text-gray-600">
                      Type: {plan.type} | Price: {plan.currency} {plan.price}/{plan.billingCycle?.toLowerCase()}
                    </div>
                    <div className="text-xs text-gray-600">
                      Limits: {plan.limits?.customers} customers, {plan.limits?.orders} orders
                    </div>
                    <div className="text-xs text-gray-600">
                      Active: {plan.isActive ? 'Yes' : 'No'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
