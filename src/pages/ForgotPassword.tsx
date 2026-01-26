import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { resetPassword } from '@/firebase/auth';
import logo from '@/assets/logo.png';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword(email.trim());

      if (result.success) {
        setIsSubmitted(true);
        toast({
          title: 'Password reset email sent!',
          description: 'Check your inbox for password reset instructions.',
        });
      } else {
        toast({
          title: 'Reset failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Reset failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden">
                <img 
                  src={logo} 
                  alt="TailorFlow Logo" 
                  className="h-10 w-10 object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-foreground">TailorFlow</h1>
            </div>
          </div>

          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Check Your Email
                </h2>
                <p className="text-muted-foreground mb-6">
                  We've sent password reset instructions to:<br />
                  <span className="font-medium text-foreground">{email}</span>
                </p>
                
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
                    <p className="font-medium mb-2">Next steps:</p>
                    <ol className="text-left space-y-1">
                      <li>1. Check your email inbox</li>
                      <li>2. Click the password reset link</li>
                      <li>3. Create a new password</li>
                      <li>4. Sign in with your new password</li>
                    </ol>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsSubmitted(false);
                        setEmail('');
                      }}
                      className="flex-1"
                    >
                      Try Different Email
                    </Button>
                    <Button
                      onClick={() => navigate('/login')}
                      className="flex-1"
                    >
                      Back to Login
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email?{' '}
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
                className="text-primary hover:underline"
              >
                Try again
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/login')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden">
              <img 
                src={logo} 
                alt="TailorFlow Logo" 
                className="h-10 w-10 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-foreground">TailorFlow</h1>
          </div>
          <p className="text-muted-foreground">Reset your password</p>
        </div>

        <Card className="shadow-soft">
          <CardHeader className="text-center">
            <CardTitle>Forgot Password?</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                    Sending Reset Link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <Link to="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
