import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Users, ShoppingBag, Clock, DollarSign } from 'lucide-react';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="animate-slide-up">
          <h1 className="text-2xl lg:text-3xl font-bold">Welcome back, John! 👋</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your shop today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCard
            title="Total Customers"
            value="1,248"
            icon={Users}
            variant="primary"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Active Orders"
            value="42"
            icon={ShoppingBag}
            variant="info"
            description="8 due this week"
          />
          <StatCard
            title="Pending Payments"
            value="$3,420"
            icon={Clock}
            variant="warning"
            description="From 15 orders"
          />
          <StatCard
            title="Monthly Revenue"
            value="$24,680"
            icon={DollarSign}
            variant="success"
            trend={{ value: 8, isPositive: true }}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentOrders />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
