import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Crown, 
  Users, 
  ShoppingBag, 
  CreditCard, 
  Settings as SettingsIcon,
  TrendingUp,
  Building,
  Shield,
  Database,
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  getBillingPlans, 
  createBillingPlan, 
  updateBillingPlan, 
  deleteBillingPlan,
  getPlatformStats,
  getAllShops,
  getAllUsers
} from '@/firebase/firestore';
import { BillingPlan } from '@/types';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [billingPlans, setBillingPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalShops: 0,
    totalUsers: 0,
    totalRevenue: 0,
    activePlans: 0
  });
  const [shops, setShops] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [platformStats, plans, allShops, allUsers] = await Promise.all([
        getPlatformStats(),
        getBillingPlans(),
        getAllShops(),
        getAllUsers()
      ]);

      setStats(platformStats);
      setBillingPlans(plans);
      setShops(allShops);
      setUsers(allUsers);

      console.log('Platform Stats:', platformStats);
      console.log('All Shops:', allShops);
      console.log('All Users:', allUsers);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: 'Error loading admin data',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBillingPlan = async (planData: Omit<BillingPlan, 'id'>) => {
    try {
      await createBillingPlan(planData);
      await loadAdminData();
      toast({
        title: 'Billing plan created',
        description: 'New billing plan has been created successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error creating billing plan',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateBillingPlan = async (planId: string, updates: Partial<BillingPlan>) => {
    try {
      await updateBillingPlan(planId, updates);
      await loadAdminData();
      toast({
        title: 'Billing plan updated',
        description: 'Billing plan has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error updating billing plan',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBillingPlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this billing plan?')) return;

    try {
      await deleteBillingPlan(planId);
      await loadAdminData();
      toast({
        title: 'Billing plan deleted',
        description: 'Billing plan has been deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error deleting billing plan',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Crown className="h-8 w-8 text-yellow-500" />
            <h1 className="text-2xl lg:text-3xl font-bold">System Administration</h1>
            <Badge className="bg-yellow-100 text-yellow-800">
              Super Admin
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Manage the entire TailorFlow platform
          </p>
        </div>

        {/* Platform Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shops</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalShops}</div>
              <p className="text-xs text-muted-foreground">
                Active shops on platform
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue}</div>
              <p className="text-xs text-muted-foreground">
                Total platform revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePlans}</div>
              <p className="text-xs text-muted-foreground">
                Active billing plans
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Management Tabs */}
        <Tabs defaultValue="billing" className="space-y-6">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Billing Plans
            </TabsTrigger>
            <TabsTrigger value="shops" className="gap-2">
              <Building className="h-4 w-4" />
              Shops
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <SettingsIcon className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Billing Plans Management */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5" />
                      Billing Plans Management
                    </CardTitle>
                    <CardDescription>Manage billing plans for all shops</CardDescription>
                  </div>
                  <Button>
                    <Shield className="h-4 w-4 mr-2" />
                    Create Plan
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {billingPlans.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">No billing plans created yet</p>
                    <Button className="mt-2">
                      <Shield className="h-4 w-4 mr-2" />
                      Create First Plan
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {billingPlans.map((plan) => (
                      <div key={plan.id} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold">{plan.name}</h3>
                              <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                                {plan.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              <Badge variant="outline">{plan.type}</Badge>
                            </div>
                            <p className="text-muted-foreground mt-1">
                              ${plan.price}/{plan.billingCycle.toLowerCase()} • {plan.currency}
                            </p>
                            <div className="mt-2 text-sm">
                              <span className="font-medium">Limits:</span> {plan.limits.customers} customers, {plan.limits.orders} orders, {plan.limits.teamMembers} team members
                            </div>
                            <ul className="mt-2 space-y-1 text-sm text-gray-600">
                              {plan.features.slice(0, 3).map((feature, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <div className="h-1 w-1 rounded-full bg-gray-400" />
                                  {feature}
                                </li>
                              ))}
                              {plan.features.length > 3 && (
                                <li className="text-gray-400">+{plan.features.length - 3} more features</li>
                              )}
                            </ul>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button size="sm" variant="outline">
                              <SettingsIcon className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteBillingPlan(plan.id)}
                            >
                              <Shield className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shops Management */}
          <TabsContent value="shops" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Shop Management ({shops.length})
                </CardTitle>
                <CardDescription>View and manage all shops on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                {shops.length === 0 ? (
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">No shops found on the platform</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {shops.map((shop) => (
                      <div key={shop.id} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold">{shop.name || 'Unnamed Shop'}</h3>
                              <Badge variant={shop.isActive ? 'default' : 'secondary'}>
                                {shop.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mt-1">
                              {shop.email || 'No email'}
                            </p>
                            <div className="mt-2 text-sm">
                              <span className="font-medium">Shop ID:</span> {shop.id}
                            </div>
                            <div className="mt-1 grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Users:</span> {shop.userCount || 0}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Orders:</span> {shop.orderCount || 0}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Created:</span> {shop.createdAt ? new Date(shop.createdAt).toLocaleDateString() : 'Unknown'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button size="sm" variant="outline">
                              <Building className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management ({users.length})
                </CardTitle>
                <CardDescription>Manage all users and their roles</CardDescription>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">No users found on the platform</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold">{user.displayName || user.email || 'Unknown User'}</h3>
                              <Badge variant={
                                user.role === 'SUPER_ADMIN' ? 'destructive' :
                                user.role === 'ADMIN' ? 'default' : 'secondary'
                              }>
                                {user.role || 'STAFF'}
                              </Badge>
                              <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mt-1">
                              {user.email}
                            </p>
                            <div className="mt-2 text-sm">
                              <span className="font-medium">User ID:</span> {user.id}
                            </div>
                            <div className="mt-1 text-sm">
                              <span className="font-medium">Shop:</span> {user.shop ? user.shop.name : (user.hasShop ? 'Assigned' : 'No Shop')}
                            </div>
                            <div className="mt-1 text-sm">
                              <span className="font-medium">Created:</span> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button size="sm" variant="outline">
                              <Users className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  System Configuration
                </CardTitle>
                <CardDescription>Global system settings and configurations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">System Status</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Database</p>
                      <p className="text-2xl font-bold text-green-600">Healthy</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Storage</p>
                      <p className="text-2xl font-bold text-green-600">Active</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Authentication</p>
                      <p className="text-2xl font-bold text-green-600">Online</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">API</p>
                      <p className="text-2xl font-bold text-green-600">Running</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">Quick Actions</h4>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Database className="h-4 w-4 mr-2" />
                      Backup Database
                    </Button>
                    <Button size="sm" variant="outline">
                      <Activity className="h-4 w-4 mr-2" />
                      View Logs
                    </Button>
                    <Button size="sm" variant="outline">
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      System Maintenance
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
