import React, { useState, useEffect } from 'react';
import { getCollection } from '@/firebase/firestore';
import { BillingPlan } from '@/types';

export default function TestBillingPlansDebug() {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        console.log('Loading billing plans...');
        const allPlans = await getCollection<BillingPlan>('plans', [
          { field: 'isActive', operator: '==', value: true }
        ]);
        console.log('All plans:', allPlans);
        setPlans(allPlans);
      } catch (err) {
        console.error('Error loading plans:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Billing Plans Debug</h1>
      
      <div className="mb-4">
        <p>Total plans found: {plans.length}</p>
      </div>

      <div className="space-y-4">
        {plans.map((plan) => (
          <div key={plan.id} className="border p-4 rounded-lg">
            <h3 className="font-bold">{plan.name}</h3>
            <p>Type: {plan.type}</p>
            <p>Price: {plan.price} {plan.currency}</p>
            <p>Billing Cycle: {plan.billingCycle}</p>
            <p>Active: {plan.isActive ? 'Yes' : 'No'}</p>
            <div className="mt-2">
              <strong>Features:</strong>
              <ul className="list-disc list-inside">
                {plan.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
            <div className="mt-2">
              <strong>Limits:</strong>
              <ul className="list-disc list-inside">
                <li>Customers: {plan.limits.customers}</li>
                <li>Orders: {plan.limits.orders}</li>
                <li>Team Members: {plan.limits.teamMembers}</li>
                <li>Storage: {plan.limits.storage}MB</li>
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
