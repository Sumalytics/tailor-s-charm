import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Store, 
  Users, 
  Search, 
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Activity,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { getCollection } from '@/firebase/firestore';
import { Shop, Subscription, BillingPlan } from '@/types';

interface ShopWithDetails extends Omit<Shop, 'subscription'> {
  subscription?: Subscription;
  plan?: BillingPlan;
  customerCount?: number;
  orderCount?: number;
  revenue?: number;
}

export default function ShopsManagement() {
  const [shops, setShops] = useState<ShopWithDetails[]>([]);
  const [filteredShops, setFilteredShops] = useState<ShopWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  useEffect(() => {
    loadShopsData();
  }, []);

  useEffect(() => {
    filterShops();
  }, [shops, searchTerm, statusFilter, planFilter]);

  const loadShopsData = async () => {
    setLoading(true);
    try {
      // Fetch all required data
      const [shopsData, subscriptions, billingPlans] = await Promise.all([
        getCollection('shops'),
        getCollection('subscriptions'),
        getCollection('plans')
      ]);

      // Enrich shops with subscription and plan details
      const enrichedShops = await Promise.all(shopsData.map(async (shop: Shop) => {
        const subscription = (subscriptions as Subscription[]).find((sub: Subscription) => sub.shopId === shop.id);
        const plan = subscription ? (billingPlans as BillingPlan[]).find((p: BillingPlan) => p.id === subscription.planId) : null;
        
        // Get real customer and order counts for each shop
        let customerCount = 0;
        let orderCount = 0;
        
        try {
          // Get customers for this shop
          const customers = await getCollection('customers', [
            { field: 'shopId', operator: '==', value: shop.id }
          ]);
          customerCount = customers.length;
          
          // Get orders for this shop
          const orders = await getCollection('orders', [
            { field: 'shopId', operator: '==', value: shop.id }
          ]);
          orderCount = orders.length;
        } catch (error) {
          console.error(`Error loading stats for shop ${shop.id}:`, error);
          // Keep counts as 0 if there's an error
        }
        
        return {
          ...shop,
          subscription,
          plan,
          customerCount,
          orderCount,
          revenue: subscription && plan ? plan.price : 0
        } as ShopWithDetails;
      }));

      setShops(enrichedShops);
    } catch (error) {
      console.error('Error loading shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterShops = () => {
    let filtered = shops;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(shop =>
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(shop => {
        if (statusFilter === 'active') return shop.status === 'ACTIVE';
        if (statusFilter === 'inactive') return shop.status === 'INACTIVE';
        if (statusFilter === 'trial') return shop.subscription?.status === 'TRIAL';
        return true;
      });
    }

    // Plan filter
    if (planFilter !== 'all') {
      filtered = filtered.filter(shop => shop.plan?.name === planFilter);
    }

    setFilteredShops(filtered);
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

  const formatDate = (date: Date | string) => {
    const validDate = safeDate(date);
    return validDate.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (shop: ShopWithDetails) => {
    if (shop.status === 'ACTIVE') {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    } else if (shop.status === 'INACTIVE') {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  const getSubscriptionBadge = (subscription?: Subscription) => {
    if (!subscription) {
      return <Badge variant="outline">No Plan</Badge>;
    }
    
    if (subscription.status === 'ACTIVE') {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    } else if (subscription.status === 'TRIAL') {
      return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
    } else if (subscription.status === 'PAST_DUE') {
      return <Badge className="bg-red-100 text-red-800">Past Due</Badge>;
    } else if (subscription.status === 'CANCELLED') {
      return <Badge variant="secondary">Cancelled</Badge>;
    }
    return <Badge variant="outline">{subscription.status}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Shops Management</h2>
            <p className="text-muted-foreground">Manage all shops on the platform</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
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
          <h2 className="text-2xl font-bold">Shops Management</h2>
          <p className="text-muted-foreground">
            Manage all {shops.length} shops on the platform
          </p>
        </div>
        <Button>
          <Store className="h-4 w-4 mr-2" />
          Add Shop
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shops</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shops.length}</div>
            <p className="text-xs text-muted-foreground">
              {shops.filter(s => s.status === 'ACTIVE').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {shops.filter(s => s.subscription?.status === 'ACTIVE').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {shops.filter(s => s.subscription?.status === 'TRIAL').length} trials
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(shops.reduce((sum, shop) => sum + (shop.revenue || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              From active shops
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(shops.reduce((sum, shop) => sum + (shop.customerCount || 0), 0) / shops.length)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per shop
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search shops..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="Free Trial">Free Trial</SelectItem>
                <SelectItem value="Standard Plan">Standard Plan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Shops List */}
      <div className="space-y-4">
        {filteredShops.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No shops found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || planFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No shops have been created yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredShops.map((shop) => (
            <Card key={shop.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{shop.name}</h3>
                      {getStatusBadge(shop)}
                      {getSubscriptionBadge(shop.subscription)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {shop.email}
                      </div>
                      {shop.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {shop.phone}
                        </div>
                      )}
                      {shop.address && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {shop.address}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Joined {formatDate(shop.createdAt)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-semibold">{shop.customerCount || 0}</div>
                        <div className="text-xs text-muted-foreground">Customers</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-semibold">{shop.orderCount || 0}</div>
                        <div className="text-xs text-muted-foreground">Orders</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-semibold">{formatCurrency(shop.revenue || 0)}</div>
                        <div className="text-xs text-muted-foreground">Revenue</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-semibold">{shop.plan?.name || 'No Plan'}</div>
                        <div className="text-xs text-muted-foreground">Plan</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
