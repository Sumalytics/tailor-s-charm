import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Store, 
  CreditCard,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3,
  PieChart,
  Target
} from 'lucide-react';
import { getCollection } from '@/firebase/firestore';
import { Shop, Subscription, BillingPlan } from '@/types';

interface AnalyticsData {
  totalShops: number;
  activeShops: number;
  totalMRR: number;
  totalARR: number;
  churnRate: number;
  newShopsThisMonth: number;
  totalRevenue: number;
  averageRevenuePerShop: number;
  planDistribution: Record<string, number>;
  monthlyGrowth: number;
  topPerformingShops: Shop[];
  recentSubscriptions: Subscription[];
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch all required data
      const [shops, subscriptions, billingPlans] = await Promise.all([
        getCollection('shops'),
        getCollection('subscriptions'),
        getCollection('plans')
      ]);

      // Calculate metrics
      const analytics = calculateAnalytics(
        shops as Shop[], 
        subscriptions as Subscription[], 
        billingPlans as BillingPlan[]
      );
      setData(analytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (
    shops: Shop[], 
    subscriptions: Subscription[], 
    billingPlans: BillingPlan[]
  ): AnalyticsData => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Basic counts
    const totalShops = shops.length;
    const activeShops = shops.filter(shop => shop.status === 'ACTIVE').length;
    const newShopsThisMonth = shops.filter(shop => 
      new Date(shop.createdAt) >= thirtyDaysAgo
    ).length;

    // Calculate MRR and ARR
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'ACTIVE');
    const totalMRR = activeSubscriptions.reduce((sum, sub) => {
      const plan = billingPlans.find(p => p.id === sub.planId);
      if (!plan) return sum;
      
      if (sub.billingCycle === 'MONTHLY') {
        return sum + plan.price;
      } else if (sub.billingCycle === 'YEARLY') {
        return sum + (plan.price / 12); // Convert yearly to monthly
      } else if (sub.billingCycle === 'DAILY') {
        return sum + (plan.price * 30); // Convert daily to monthly
      }
      return sum;
    }, 0);

    const totalARR = totalMRR * 12;

    // Calculate churn rate (simplified)
    const cancelledThisMonth = subscriptions.filter(sub => 
      sub.status === 'CANCELLED' && 
      sub.cancelledAt && 
      new Date(sub.cancelledAt) >= thirtyDaysAgo
    ).length;
    const totalActiveLastMonth = activeSubscriptions.length + cancelledThisMonth;
    const churnRate = totalActiveLastMonth > 0 ? (cancelledThisMonth / totalActiveLastMonth) * 100 : 0;

    // Calculate total revenue
    const totalRevenue = activeSubscriptions.reduce((sum, sub) => {
      const plan = billingPlans.find(p => p.id === sub.planId);
      return sum + (plan?.price || 0);
    }, 0);

    // Average revenue per shop
    const averageRevenuePerShop = activeShops > 0 ? totalMRR / activeShops : 0;

    // Plan distribution
    const planDistribution = activeSubscriptions.reduce((acc, sub) => {
      const plan = billingPlans.find(p => p.id === sub.planId);
      if (plan) {
        acc[plan.name] = (acc[plan.name] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Monthly growth (simplified)
    const newShopsLastMonth = shops.filter(shop => 
      new Date(shop.createdAt) >= lastMonth && 
      new Date(shop.createdAt) < thirtyDaysAgo
    ).length;
    const monthlyGrowth = newShopsLastMonth > 0 ? 
      ((newShopsThisMonth - newShopsLastMonth) / newShopsLastMonth) * 100 : 0;

    // Top performing shops (by revenue)
    const topPerformingShops = shops
      .filter(shop => shop.status === 'ACTIVE')
      .slice(0, 5);

    // Recent subscriptions
    const recentSubscriptions = subscriptions
      .filter(sub => sub.status === 'ACTIVE')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalShops,
      activeShops,
      totalMRR,
      totalARR,
      churnRate,
      newShopsThisMonth,
      totalRevenue,
      averageRevenuePerShop,
      planDistribution,
      monthlyGrowth,
      topPerformingShops,
      recentSubscriptions
    };
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

  // Safe date conversion utility
  const safeDate = (date: any): Date => {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    if (typeof date === 'object' && date.toDate) return date.toDate();
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    if (typeof date === 'number') {
      return new Date(date);
    }
    return new Date();
  };

  const formatSubscriptionDate = (date: any): string => {
    const validDate = safeDate(date);
    return validDate.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
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

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load analytics data</p>
        <Button onClick={loadAnalyticsData} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your platform performance and metrics
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shops</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalShops}</div>
            <p className="text-xs text-muted-foreground">
              {data.activeShops} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalMRR)}</div>
            <p className="text-xs text-muted-foreground">
              {data.monthlyGrowth > 0 ? (
                <span className="text-green-600 flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +{formatPercentage(data.monthlyGrowth)}
                </span>
              ) : (
                <span className="text-red-600 flex items-center">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  {formatPercentage(Math.abs(data.monthlyGrowth))}
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Recurring Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalARR)}</div>
            <p className="text-xs text-muted-foreground">
              From {data.activeShops} active shops
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(data.churnRate)}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Shops</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.newShopsThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Revenue/Shop</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.averageRevenuePerShop)}</div>
            <p className="text-xs text-muted-foreground">
              Per active shop
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage((data.activeShops / data.totalShops) * 100)}
            </div>
            <p className="text-xs text-muted-foreground">
              Of total shops
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Plan Distribution
          </CardTitle>
          <CardDescription>
            Number of active subscriptions by plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(data.planDistribution).map(([planName, count]) => (
              <div key={planName} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{planName}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Shops</CardTitle>
            <CardDescription>
              Most active shops on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topPerformingShops.map((shop) => (
                <div key={shop.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{shop.name}</p>
                    <p className="text-sm text-muted-foreground">{shop.email}</p>
                  </div>
                  <Badge variant={shop.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {shop.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Subscriptions</CardTitle>
            <CardDescription>
              Latest subscription activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentSubscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{sub.plan?.name || 'Unknown Plan'}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatSubscriptionDate(sub.createdAt)}
                    </p>
                  </div>
                  <Badge variant="outline">{sub.billingCycle}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
