import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Users, ShoppingBag, Clock, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardStats, getOrdersByShop } from '@/firebase/firestore';
import { DashboardStats, Order } from '@/types';
import { formatCurrency } from '@/lib/currency';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, shopId } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shopId) {
      loadDashboardData();
    }
  }, [shopId]);

  const loadDashboardData = async () => {
    if (!shopId) return;

    setLoading(true);
    try {
      const [dashboardStats, orders] = await Promise.all([
        getDashboardStats(shopId),
        getOrdersByShop(shopId)
      ]);

      setStats(dashboardStats);
      setRecentOrders(orders.slice(0, 5)); // Get 5 most recent orders
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
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
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header — allow wrapping on small screens to avoid truncation */}
        <div className="animate-slide-up min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold break-words">
            Welcome back, {currentUser?.displayName || 'User'}! 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base break-words">
            Here&apos;s what&apos;s happening with your shop today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCard
            title="Total Customers"
            value={stats?.totalCustomers.toLocaleString() || '0'}
            icon={Users}
            variant="primary"
          />
          <StatCard
            title="Active Orders"
            value={stats?.totalOrders.toLocaleString() || '0'}
            icon={ShoppingBag}
            variant="info"
            description={`${stats?.pendingOrders || 0} pending`}
          />
          <StatCard
            title="Pending Payments"
            value={formatCurrency(stats?.pendingPayments || 0)}
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats?.totalRevenue || 0)}
            icon={DollarSign}
            variant="success"
          />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Recent Orders */}
          <div>
            <RecentOrders
              orders={recentOrders}
              onOrderClick={(id) => navigate(`/orders/${id}`)}
              onViewAll={() => navigate('/orders')}
              onCreateOrder={() => navigate('/orders/new')}
            />
          </div>

          {/* Quick Actions */}
          <div>
            <QuickActions />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
