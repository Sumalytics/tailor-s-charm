import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function AuthTest() {
  const { currentUser, firebaseUser, loading, userRole, shopId } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Authentication Test Page</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Auth State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
            <div><strong>Current User:</strong> {currentUser ? JSON.stringify(currentUser, null, 2) : 'None'}</div>
            <div><strong>Firebase User:</strong> {firebaseUser ? firebaseUser.email : 'None'}</div>
            <div><strong>User Role:</strong> {userRole || 'None'}</div>
            <div><strong>Shop ID:</strong> {shopId || 'None'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Navigation Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
            <Button onClick={() => navigate('/shop-setup')} className="w-full">
              Go to Shop Setup
            </Button>
            <Button onClick={() => navigate('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expected Behavior</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>If logged in with shop: Should redirect to dashboard</li>
              <li>If logged in without shop: Should redirect to shop setup</li>
              <li>If not logged in: Should show login page</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
