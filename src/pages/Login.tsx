import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signIn, resetPassword } from '@/firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, shopId, refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    console.log('Login useEffect - currentUser:', currentUser);
    console.log('Login useEffect - shopId:', shopId);
    console.log('Login useEffect - userRole:', currentUser?.role);
    
    if (currentUser) {
      // Check for SUPER_ADMIN first - they don't need a shop
      if (currentUser.role === 'SUPER_ADMIN') {
        console.log('Redirecting SUPER_ADMIN to admin dashboard...');
        navigate('/admin');
        return;
      }
      
      if (shopId) {
        // User has a shop, go to dashboard
        console.log('Redirecting to dashboard...');
        navigate('/dashboard');
      } else {
        // User doesn't have a shop, check role
        if (currentUser.role === 'ADMIN') {
          // Admin users need to set up their shop first
          console.log('Redirecting ADMIN to shop setup...');
          navigate('/shop-setup');
        } else {
          // Staff users without shop need to wait for admin assignment
          console.log('Redirecting staff to unauthorized...');
          navigate('/unauthorized');
        }
      }
    }
  }, [currentUser, shopId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn(email, password);
      
      if (result.success) {
        toast({
          title: 'Welcome back!',
          description: 'You have successfully signed in.',
        });
        await refreshUser();
      } else {
        toast({
          title: 'Sign in failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Sign in failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address to reset password.',
        variant: 'destructive',
      });
      return;
    }

    const result = await resetPassword(email);
    
    if (result.success) {
      toast({
        title: 'Password reset email sent',
        description: 'Check your email for password reset instructions.',
      });
    } else {
      toast({
        title: 'Password reset failed',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar items-center justify-center p-12">
        <div className="max-w-md text-center animate-fade-in">
          <div className="flex justify-center mb-8">
            <div className="h-20 w-20 rounded-2xl bg-sidebar-primary flex items-center justify-center shadow-glow overflow-hidden">
              <img 
                src={logo} 
                alt="TailorFlow Logo" 
                className="h-16 w-16 object-contain"
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-sidebar-foreground mb-4">TailorFlow</h1>
          <p className="text-lg text-sidebar-foreground/70 mb-8">
            The complete solution for managing your tailoring business. Track customers, orders, measurements, and payments all in one place.
          </p>
          <div className="grid grid-cols-2 gap-4 text-left">
            {[
              'Customer Management',
              'Order Tracking',
              'Measurement Records',
              'Payment Processing',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sidebar-foreground/80">
                <div className="h-2 w-2 rounded-full bg-sidebar-primary" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="flex lg:hidden justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center overflow-hidden">
                <img 
                  src={logo} 
                  alt="TailorFlow Logo" 
                  className="h-10 w-10 object-contain"
                />
              </div>
              <span className="text-2xl font-bold">TailorFlow</span>
            </div>
          </div>

          <Card className="border-0 shadow-soft lg:shadow-none">
            <CardHeader className="space-y-1 text-center lg:text-left">
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription>
                Sign in to manage customers, orders, and payments in one place.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-4">
                <Link to="/forgot-password" className="text-primary hover:underline">
                  Forgot your password?
                </Link>
              </p>

              <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-primary font-medium hover:underline">
                    Sign up
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
