import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getCollection } from '@/firebase/firestore';
import { Customer, Order } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  UserPlus,
  Search,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Users,
  TrendingUp,
  Activity,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Customers() {
  const navigate = useNavigate();
  const { shopId } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    newThisMonth: 0,
    activeCustomers: 0,
  });

  useEffect(() => {
    loadData();
  }, [shopId]);

  const loadData = async () => {
    if (!shopId) return;

    try {
      setLoading(true);
      
      // Load customers
      const customersList = await getCollection<Customer>('customers', [
        { field: 'shopId', operator: '==', value: shopId }
      ]);
      
      // Load orders for statistics
      const ordersList = await getCollection<Order>('orders', [
        { field: 'shopId', operator: '==', value: shopId }
      ]);

      setCustomers(customersList);
      setOrders(ordersList);

      // Calculate statistics
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const newThisMonth = customersList.filter(customer => 
        new Date(customer.createdAt) >= firstDayOfMonth
      ).length;

      const activeCustomers = customersList.filter(customer => 
        customer.isActive !== false
      ).length;

      const activeCustomerIds = new Set(
        ordersList
          .filter(order => new Date(order.createdAt) >= firstDayOfMonth)
          .map(order => order.customerId)
      );

      setStats({
        totalCustomers: customersList.length,
        newThisMonth,
        activeCustomers: activeCustomerIds.size,
      });

    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: 'Error loading customers',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCustomerStats = (customerId: string) => {
    const customerOrders = orders.filter(order => order.customerId === customerId);
    const ordersCount = customerOrders.length;
    const totalSpent = customerOrders.reduce((sum, order) => sum + order.amount, 0);
    const lastOrder = customerOrders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    
    return {
      ordersCount,
      totalSpent,
      lastVisit: lastOrder ? lastOrder.createdAt : null,
    };
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchQuery)) ||
      (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCustomerClick = (customerId: string) => {
    navigate(`/customers/${customerId}`);
  };

  const handleAddCustomer = () => {
    navigate('/customers/new');
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Customers</h1>
            <p className="text-muted-foreground mt-1">
              Manage your customer database and records
            </p>
          </div>
          <Button onClick={handleAddCustomer} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Total Customers</div>
                  <div className="text-2xl font-bold mt-1">{stats.totalCustomers}</div>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">New This Month</div>
                  <div className="text-2xl font-bold mt-1 text-primary">+{stats.newThisMonth}</div>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Active Customers</div>
                  <div className="text-2xl font-bold mt-1">{stats.activeCustomers}</div>
                </div>
                <Activity className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-soft">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                    <TableHead className="hidden lg:table-cell">Address</TableHead>
                    <TableHead className="text-center">Orders</TableHead>
                    <TableHead className="text-right">Total Spent</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    // Loading skeleton
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
                            <div>
                              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="space-y-2">
                            <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-3 w-28 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="h-3 w-36 bg-gray-200 rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="h-6 w-8 bg-gray-200 rounded animate-pulse mx-auto"></div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse ml-auto"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <Users className="h-12 w-12 text-gray-400" />
                          <p className="text-gray-600">
                            {searchQuery ? 'No customers found matching your search.' : 'No customers yet.'}
                          </p>
                          {!searchQuery && (
                            <Button onClick={handleAddCustomer} variant="outline">
                              Add your first customer
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => {
                      const customerStats = getCustomerStats(customer.id);
                      return (
                        <TableRow 
                          key={customer.id} 
                          className="cursor-pointer hover:bg-secondary/50"
                          onClick={() => handleCustomerClick(customer.id)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {customer.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="font-medium">{customer.name}</div>
                                  <Badge variant={customer.isActive !== false ? 'default' : 'secondary'}>
                                    {customer.isActive !== false ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground md:hidden">
                                  {customer.phone}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="space-y-1">
                              {customer.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  {customer.phone}
                                </div>
                              )}
                              {customer.email && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  {customer.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {customer.address && (
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                {customer.address}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{customerStats.ordersCount}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {customerStats.totalSpent > 0 ? (
                              `${customerStats.totalSpent.toLocaleString()}`
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleCustomerClick(customer.id)}>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/orders/new?customerId=${customer.id}`)}>
                                  Create Order
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/measurements/new?customerId=${customer.id}`)}>
                                  Add Measurement
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
