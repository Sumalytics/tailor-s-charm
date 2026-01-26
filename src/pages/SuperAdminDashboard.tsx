import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  Users, 
  DollarSign, 
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Settings,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCollection } from '@/firebase/firestore';
import { Shop, Subscription, BillingPlan } from '@/types';

interface QuickStats {
  totalShops: number;
  activeShops: number;
  totalMRR: number;
  monthlyGrowth: number;
  newSubscriptions: number;
  churnRate: number;
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole !== 'SUPER_ADMIN') {
      navigate('/dashboard');
      return;
    }
    loadQuickStats();
  }, [userRole, navigate]);

  const loadQuickStats = async () => {
    setLoading(true);
    try {
      const [shops, subscriptions, billingPlans] = await Promise.all([
        getCollection('shops'),
        getCollection('subscriptions'),
        getCollection('plans')
      ]);

      // Calculate quick stats
      const totalShops = shops.length;
      const activeShops = shops.filter((shop: any) => shop.status === 'ACTIVE').length;
      const activeSubscriptions = subscriptions.filter((sub: any) => sub.status === 'ACTIVE');
      
      const totalMRR = activeSubscriptions.reduce((sum: number, sub: any) => {
        const plan = billingPlans.find((p: any) => p.id === sub.planId);
        if (!plan) return sum;
        
        if (sub.billingCycle === 'MONTHLY') {
          return sum + plan.price;
        } else if (sub.billingCycle === 'YEARLY') {
          return sum + (plan.price / 12);
        } else if (sub.billingCycle === 'DAILY') {
          return sum + (plan.price * 30);
        }
        return sum;
      }, 0);

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const newSubscriptions = subscriptions.filter((sub: any) => 
        new Date(sub.createdAt) >= thirtyDaysAgo && sub.status === 'ACTIVE'
      ).length;

      const cancelledThisMonth = subscriptions.filter((sub: any) => 
        sub.status === 'CANCELLED' && 
        sub.cancelledAt && 
        new Date(sub.cancelledAt) >= thirtyDaysAgo
      ).length;
      
      const totalActiveLastMonth = activeSubscriptions.length + cancelledThisMonth;
      const churnRate = totalActiveLastMonth > 0 ? (cancelledThisMonth / totalActiveLastMonth) * 100 : 0;

      // Mock monthly growth - replace with actual calculation
      const monthlyGrowth = 12.5;

      setStats({
        totalShops,
        activeShops,
        totalMRR,
        monthlyGrowth,
        newSubscriptions,
        churnRate
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (userRole !== 'SUPER_ADMIN') {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Platform overview and key metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/settings?tab=admin')}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Plans
          </Button>
          <Button onClick={() => navigate('/settings?tab=analytics')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shops</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalShops || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeShops || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalMRR || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.monthlyGrowth && stats.monthlyGrowth > 0 ? (
                <span className="text-green-600 flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +{formatPercentage(stats.monthlyGrowth)}
                </span>
              ) : (
                <span className="text-red-600 flex items-center">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  {formatPercentage(Math.abs(stats?.monthlyGrowth || 0))}
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.newSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(stats?.churnRate || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/settings?tab=shops')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Manage Shops
            </CardTitle>
            <CardDescription>
              View and manage all registered shops
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {stats?.totalShops || 0} total shops
              </span>
              <Button size="sm" variant="outline">
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/settings?tab=analytics')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              View Analytics
            </CardTitle>
            <CardDescription>
              Detailed platform metrics and insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                MRR: {formatCurrency(stats?.totalMRR || 0)}
              </span>
              <Button size="sm" variant="outline">
                <BarChart3 className="h-4 w-4 mr-1" />
                Analytics
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/settings?tab=admin')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Billing Plans
            </CardTitle>
            <CardDescription>
              Manage billing plans and pricing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Configure plans
              </span>
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4 mr-1" />
                Manage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Overview</CardTitle>
          <CardDescription>
            Key performance indicators and platform health
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {((stats?.activeShops || 0) / (stats?.totalShops || 1) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Active Rate</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency((stats?.totalMRR || 0) / (stats?.activeShops || 1))}
              </div>
              <div className="text-sm text-muted-foreground">Avg Revenue/Shop</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats?.newSubscriptions || 0}
              </div>
              <div className="text-sm text-muted-foreground">New This Month</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {formatPercentage(stats?.churnRate || 0)}
              </div>
              <div className="text-sm text-muted-foreground">Churn Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
