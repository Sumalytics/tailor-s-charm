import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCheck() {
  const { currentUser } = useAuth();
  const [userDetails, setUserDetails] = useState<any>(null);

  useEffect(() => {
    if (currentUser) {
      console.log('Current user:', currentUser);
      console.log('User token claims:', currentUser.stsTokenManager);
      
      // Get user details from Firebase Auth
      currentUser.getIdTokenResult().then((idTokenResult) => {
        console.log('ID Token Result:', idTokenResult);
        console.log('Claims:', idTokenResult.claims);
        setUserDetails({
          uid: currentUser.uid,
          email: currentUser.email,
          isAdmin: idTokenResult.claims.admin,
          allClaims: idTokenResult.claims
        });
      }).catch((error) => {
        console.error('Error getting token result:', error);
      });
    }
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Authentication Check</CardTitle>
          <CardDescription>
            Check your authentication status and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">User Status:</h4>
            <div className="text-sm">
              <p>Logged In: {currentUser ? 'Yes' : 'No'}</p>
              {currentUser && (
                <>
                  <p>Email: {currentUser.email}</p>
                  <p>UID: {currentUser.uid}</p>
                </>
              )}
            </div>
          </div>

          {userDetails && (
            <div className="space-y-2">
              <h4 className="font-medium">Permissions:</h4>
              <div className="text-sm">
                <p>Is Admin: {userDetails.isAdmin ? 'Yes ✅' : 'No ❌'}</p>
                <p>All Claims: {JSON.stringify(userDetails.allClaims, null, 2)}</p>
              </div>
            </div>
          )}

          {!currentUser && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800">You are not logged in. Please log in first.</p>
            </div>
          )}

          {currentUser && !userDetails?.isAdmin && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">
                You are logged in but not a super admin. Billing plans require super admin permissions.
              </p>
            </div>
          )}

          {currentUser && userDetails?.isAdmin && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">
                ✅ You are authenticated as a super admin! You should be able to access billing plans.
              </p>
            </div>
          )}

          <div className="text-xs text-gray-600">
            <p>Check browser console for detailed authentication logs.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
