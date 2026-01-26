import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Access Restricted
          </CardTitle>
          <CardDescription>
            {currentUser?.role === 'STAFF' 
              ? "Your account hasn't been assigned to a shop yet. Please contact your administrator."
              : "You don't have permission to access this page."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentUser?.role === 'STAFF' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Next steps:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Contact your shop administrator</li>
                <li>• Ask them to assign you to a shop</li>
                <li>• Try logging in again after assignment</li>
              </ul>
            </div>
          )}
          
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={() => navigate('/login')} 
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
            
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="w-full"
            >
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
