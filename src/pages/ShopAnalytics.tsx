import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  startOfWeek,
  startOfMonth,
  subMonths,
  addWeeks,
  format,
  isWithinInterval,
} from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import {
  getOrdersByShop,
  getPaymentsByShop,
  getCustomersByShop,
  getCollection,
} from '@/firebase/firestore';
import { Order, Payment, Customer, Expense } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  RefreshCw,
  TrendingDown,
} from 'lucide-react';

const safeDate = (d: unknown): Date => {
  if (!d) return new Date();
  if (d instanceof Date) return d;
  if (typeof d === 'object' && d !== null && 'toDate' in d && typeof (d as { toDate: () => Date }).toDate === 'function')
    return (d as { toDate: () => Date }).toDate();
  return new Date(String(d));
};

type PeriodGranularity = 'week' | 'month';
type RangePreset = '3m' | '6m' | '12m';

const revenueChartConfig = {
  revenue: { label: 'Revenue', color: 'hsl(var(--chart-1))' },
  orders: { label: 'Orders', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig;

const statusChartConfig = {
  PENDING: { label: 'Pending', color: 'hsl(var(--chart-3))' },
  IN_PROGRESS: { label: 'In progress', color: 'hsl(var(--chart-2))' },
  COMPLETED: { label: 'Completed', color: 'hsl(var(--chart-1))' },
  CANCELLED: { label: 'Cancelled', color: 'hsl(var(--chart-5))' },
} satisfies ChartConfig;

export default function ShopAnalytics() {
  const navigate = useNavigate();
  const { shopId } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<PeriodGranularity>('month');
  const [range, setRange] = useState<RangePreset>('6m');

  const loadData = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const [o, p, c, exp] = await Promise.all([
        getOrdersByShop(shopId),
        getPaymentsByShop(shopId),
        getCustomersByShop(shopId),
        getCollection<Expense>('expenses', [{ field: 'shopId', operator: '==', value: shopId }]),
      ]);
      setOrders(o);
      setPayments(p);
      setCustomers(c);
      setExpenses(exp);
    } catch (e) {
      console.error('Error loading analytics data:', e);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    if (shopId) loadData();
  }, [shopId, loadData]);

  const completedPayments = useMemo(
    () =>
      payments.filter(
        (p) =>
          (p.status === 'COMPLETED' || p.status == null) &&
          p.type !== 'REFUND'
      ),
    [payments]
  );

  const { start, end } = useMemo(() => {
    const now = new Date();
    const months = range === '3m' ? 3 : range === '6m' ? 6 : 12;
    return { start: subMonths(now, months), end: now };
  }, [range]);

  const getPeriodKey = useCallback(
    (date: Date) => {
      const d = new Date(date);
      if (granularity === 'week') {
        const w = startOfWeek(d, { weekStartsOn: 1 });
        return w.getTime();
      }
      const m = startOfMonth(d);
      return m.getTime();
    },
    [granularity]
  );

  const periodLabel = useCallback(
    (ts: number) => {
      const d = new Date(ts);
      return granularity === 'week'
        ? format(d, 'MMM d')
        : format(d, 'MMM yyyy');
    },
    [granularity]
  );

  const revenueByPeriod = useMemo(() => {
    const map = new Map<number, { revenue: number; orders: number }>();
    const add = (ts: number, revenue: number, orderDelta: number) => {
      const cur = map.get(ts) ?? { revenue: 0, orders: 0 };
      cur.revenue += revenue;
      cur.orders += orderDelta;
      map.set(ts, cur);
    };

    for (const p of completedPayments) {
      const d = safeDate(p.createdAt);
      if (!isWithinInterval(d, { start, end })) continue;
      const key = getPeriodKey(d);
      add(key, p.amount, 0);
    }
    for (const o of orders) {
      const d = safeDate(o.createdAt);
      if (!isWithinInterval(d, { start, end })) continue;
      const key = getPeriodKey(d);
      add(key, 0, 1);
    }

    const sorted = Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([ts, v]) => ({
        period: ts,
        label: periodLabel(ts),
        revenue: v.revenue,
        orders: v.orders,
      }));

    if (granularity === 'month') {
      const months: { period: number; label: string; revenue: number; orders: number }[] = [];
      let cur = startOfMonth(start);
      while (cur <= end) {
        const ts = cur.getTime();
        const found = sorted.find((s) => s.period === ts);
        months.push({
          period: ts,
          label: periodLabel(ts),
          revenue: found?.revenue ?? 0,
          orders: found?.orders ?? 0,
        });
        cur = subMonths(cur, -1);
      }
      return months;
    }

    const weeks: { period: number; label: string; revenue: number; orders: number }[] = [];
    let w = startOfWeek(start, { weekStartsOn: 1 });
    const we = startOfWeek(end, { weekStartsOn: 1 });
    while (w <= we) {
      const ts = w.getTime();
      const found = sorted.find((s) => s.period === ts);
      weeks.push({
        period: ts,
        label: periodLabel(ts),
        revenue: found?.revenue ?? 0,
        orders: found?.orders ?? 0,
      });
      w = addWeeks(w, 1);
    }
    return weeks;
  }, [completedPayments, orders, start, end, getPeriodKey, periodLabel, granularity]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) {
      const s = o.status || 'PENDING';
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const topByOrders = useMemo(() => {
    const byCustomer = new Map<string, { name: string; count: number; totalAmount: number }>();
    for (const o of orders) {
      const cur = byCustomer.get(o.customerId) ?? {
        name: o.customerName,
        count: 0,
        totalAmount: 0,
      };
      cur.count += 1;
      cur.totalAmount += o.amount;
      byCustomer.set(o.customerId, cur);
    }
    return Array.from(byCustomer.entries())
      .map(([id, v]) => ({ customerId: id, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [orders]);

  const topByFulfilment = useMemo(() => {
    const byCustomer = new Map<
      string,
      { name: string; totalAmount: number; totalPaid: number; orderCount: number }
    >();
    for (const o of orders) {
      const cur = byCustomer.get(o.customerId) ?? {
        name: o.customerName,
        totalAmount: 0,
        totalPaid: 0,
        orderCount: 0,
      };
      cur.totalAmount += o.amount;
      cur.orderCount += 1;
      byCustomer.set(o.customerId, cur);
    }
    for (const p of completedPayments) {
      const cur = byCustomer.get(p.customerId);
      if (!cur) continue;
      cur.totalPaid += p.amount;
    }
    return Array.from(byCustomer.entries())
      .map(([customerId, v]) => ({
        customerId,
        ...v,
        fulfilment: v.totalAmount > 0 ? (v.totalPaid / v.totalAmount) * 100 : 100,
      }))
      .filter((x) => x.orderCount > 0)
      .sort((a, b) => b.fulfilment - a.fulfilment)
      .slice(0, 10);
  }, [orders, completedPayments]);

  const totalRevenue = completedPayments.reduce((s, p) => s + p.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;
  const currency = orders[0]?.currency ?? 'GHS';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-muted rounded" />
              ))}
            </div>
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              Revenue, orders, and top clients
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={granularity}
              onValueChange={(v) => setGranularity(v as PeriodGranularity)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">By week</SelectItem>
                <SelectItem value="month">By month</SelectItem>
              </SelectContent>
            </Select>
            <Select value={range} onValueChange={(v) => setRange(v as RangePreset)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">Last 3 months</SelectItem>
                <SelectItem value="6m">Last 6 months</SelectItem>
                <SelectItem value="12m">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={loadData} aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue, currency)}</div>
              <p className="text-xs text-muted-foreground">All time (from payments)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses, currency)}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn('text-2xl font-bold', netProfit >= 0 ? 'text-success' : 'text-destructive')}>
                {formatCurrency(netProfit, currency)}
              </div>
              <p className="text-xs text-muted-foreground">Revenue minus expenses</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
              <p className="text-xs text-muted-foreground">Total orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg order value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(avgOrderValue, currency)}</div>
              <p className="text-xs text-muted-foreground">Revenue ÷ orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
              <p className="text-xs text-muted-foreground">Total customers</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Revenue & orders over time</CardTitle>
            <CardDescription>
              {granularity === 'month' ? 'Monthly' : 'Weekly'} revenue and order count
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueChartConfig} className="min-h-[260px] w-full">
              <BarChart data={revenueByPeriod} accessibilityLayer>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis yAxisId="rev" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => `${currency} ${v}`} />
                <YAxis yAxisId="ord" orientation="right" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(Number(value), currency) : String(value),
                        name === 'revenue' ? 'Revenue' : 'Orders',
                      ]}
                    />
                  }
                />
                <Bar yAxisId="rev" dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                <Line yAxisId="ord" type="monotone" dataKey="orders" stroke="var(--color-orders)" strokeWidth={2} dot={false} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Order status</CardTitle>
              <CardDescription>Breakdown by status</CardDescription>
            </CardHeader>
            <CardContent>
              {statusCounts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No orders</p>
              ) : (
                <ChartContainer config={statusChartConfig} className="min-h-[200px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie
                      data={statusCounts}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusCounts.map((_, i) => (
                        <Cell key={i} fill={`var(--color-${statusCounts[i].name})`} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top clients by orders</CardTitle>
              <CardDescription>Most orders in your shop</CardDescription>
            </CardHeader>
            <CardContent>
              {topByOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No orders yet</p>
              ) : (
                <ul className="space-y-3">
                  {topByOrders.map((row, i) => (
                    <li
                      key={row.customerId}
                      className="flex items-center justify-between gap-4 p-2 rounded-lg border bg-muted/30 hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/customers/${row.customerId}`)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-muted-foreground font-mono w-5">{i + 1}</span>
                        <span className="font-medium truncate">{row.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-sm">
                        <span className="text-muted-foreground">{row.count} orders</span>
                        <span className="font-medium">{formatCurrency(row.totalAmount, currency)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top clients by payment fulfilment</CardTitle>
            <CardDescription>
              Highest % of order value paid (total paid ÷ total order value)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topByFulfilment.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No data</p>
            ) : (
              <>
                {/* Mobile: card list */}
                <div className="md:hidden space-y-3">
                  {topByFulfilment.map((row, i) => (
                    <div
                      key={row.customerId}
                      className="rounded-xl border bg-card p-4 shadow-sm active:scale-[0.99]"
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/customers/${row.customerId}`)}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/customers/${row.customerId}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-muted-foreground font-mono text-sm w-5">{i + 1}</span>
                          <span className="font-medium truncate">{row.name}</span>
                        </div>
                        <span className="font-medium shrink-0">
                          {row.fulfilment >= 100 ? '100%' : `${row.fulfilment.toFixed(1)}%`}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <span>{row.orderCount} orders</span>
                        <span className="text-right">Total: {formatCurrency(row.totalAmount, currency)}</span>
                        <span>Paid: {formatCurrency(row.totalPaid, currency)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop: table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">#</th>
                        <th className="text-left py-2 font-medium">Customer</th>
                        <th className="text-right py-2 font-medium">Orders</th>
                        <th className="text-right py-2 font-medium">Order total</th>
                        <th className="text-right py-2 font-medium">Paid</th>
                        <th className="text-right py-2 font-medium">Fulfilment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topByFulfilment.map((row, i) => (
                        <tr
                          key={row.customerId}
                          className="border-b hover:bg-muted/30 cursor-pointer"
                          onClick={() => navigate(`/customers/${row.customerId}`)}
                        >
                          <td className="py-2 font-mono text-muted-foreground">{i + 1}</td>
                          <td className="py-2 font-medium">{row.name}</td>
                          <td className="py-2 text-right">{row.orderCount}</td>
                          <td className="py-2 text-right">{formatCurrency(row.totalAmount, currency)}</td>
                          <td className="py-2 text-right">{formatCurrency(row.totalPaid, currency)}</td>
                          <td className="py-2 text-right font-medium">
                            {row.fulfilment >= 100 ? '100%' : `${row.fulfilment.toFixed(1)}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
