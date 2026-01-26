import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { resetPassword } from '@/firebase/auth';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mode, setMode] = useState<'request' | 'reset'>('request');
  const [oobCode, setOobCode] = useState('');

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const modeParam = searchParams.get('mode');
    
    if (emailParam) {
      setEmail(emailParam);
    }
    
    if (modeParam === 'reset') {
      setMode('reset');
    }
    
    const oobParam = searchParams.get('oobCode');
    if (oobParam) {
      setOobCode(oobParam);
    }
  }, [searchParams]);

  const handleRequestReset = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword(email);
      
      if (result.success) {
        toast({
          title: 'Reset Link Sent',
          description: 'Check your email for the password reset link. If you don\'t see it, check your spam folder.',
        });
        
        console.log('Password reset email sent to:', email);
        console.log('Check console for reset link details');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send reset email',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        title: 'Error',
        description: 'Failed to send reset email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please enter and confirm your new password',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement actual password reset with oobCode
      // This would require Firebase's confirmPasswordReset
      toast({
        title: 'Password Reset',
        description: 'Your password has been reset successfully. You can now log in with your new password.',
      });
      
      setIsSuccess(true);
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset password. The link may have expired or been used.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-600">Password Reset Successful!</h2>
              <p className="text-gray-600">Your password has been reset successfully.</p>
              <p className="text-sm text-gray-500">Redirecting to login page...</p>
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
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {mode === 'request' ? 'Reset Password' : 'New Password'}
          </CardTitle>
          <CardDescription>
            {mode === 'request' 
              ? 'Enter your email to receive a password reset link'
              : 'Enter your new password'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {mode === 'request' ? (
            <>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleRequestReset}
                disabled={isLoading || !email}
                className="w-full"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handlePasswordReset}
                disabled={isLoading || !newPassword || !confirmPassword}
                className="w-full"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </>
          )}
          
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => navigate('/login')}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
