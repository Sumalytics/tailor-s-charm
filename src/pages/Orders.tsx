import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingBag,
  Search,
  MoreHorizontal,
  Calendar,
  Filter,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OrderStatus } from '@/types';
import { cn } from '@/lib/utils';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  items: string[];
  status: OrderStatus;
  totalAmount: number;
  amountPaid: number;
  dueDate: string;
  createdAt: string;
}

const mockOrders: Order[] = [
  { id: '1', orderNumber: 'ORD-2024-001', customerName: 'James Wilson', items: ['Suit (2pc)', 'Shirt'], status: 'IN_PROGRESS', totalAmount: 450, amountPaid: 225, dueDate: '2024-01-28', createdAt: '2024-01-15' },
  { id: '2', orderNumber: 'ORD-2024-002', customerName: 'Sarah Johnson', items: ['Evening Dress'], status: 'PENDING', totalAmount: 280, amountPaid: 100, dueDate: '2024-01-30', createdAt: '2024-01-16' },
  { id: '3', orderNumber: 'ORD-2024-003', customerName: 'Michael Brown', items: ['Suit (3pc)', 'Trousers (2)'], status: 'COMPLETED', totalAmount: 620, amountPaid: 620, dueDate: '2024-01-25', createdAt: '2024-01-10' },
  { id: '4', orderNumber: 'ORD-2024-004', customerName: 'Emily Davis', items: ['Blouse', 'Skirt'], status: 'IN_PROGRESS', totalAmount: 180, amountPaid: 90, dueDate: '2024-02-01', createdAt: '2024-01-18' },
  { id: '5', orderNumber: 'ORD-2024-005', customerName: 'David Miller', items: ['Wedding Suit'], status: 'PENDING', totalAmount: 890, amountPaid: 445, dueDate: '2024-02-15', createdAt: '2024-01-20' },
  { id: '6', orderNumber: 'ORD-2024-006', customerName: 'Jennifer Garcia', items: ['Dress Alteration'], status: 'COMPLETED', totalAmount: 75, amountPaid: 75, dueDate: '2024-01-22', createdAt: '2024-01-19' },
  { id: '7', orderNumber: 'ORD-2024-007', customerName: 'Robert Martinez', items: ['Jacket', 'Trousers'], status: 'CANCELLED', totalAmount: 320, amountPaid: 0, dueDate: '2024-01-27', createdAt: '2024-01-14' },
];

const statusStyles: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-warning/10 text-warning border-warning/20' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-info/10 text-info border-info/20' },
  COMPLETED: { label: 'Completed', className: 'bg-success/10 text-success border-success/20' },
  CANCELLED: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPaymentStatus = (order: Order) => {
    if (order.amountPaid === 0) return { label: 'Unpaid', className: 'text-destructive' };
    if (order.amountPaid < order.totalAmount) return { label: 'Partial', className: 'text-warning' };
    return { label: 'Paid', className: 'text-success' };
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Orders</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage all your orders
            </p>
          </div>
          <Button className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            New Order
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Orders</div>
              <div className="text-2xl font-bold mt-1">248</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-l-4 border-l-warning">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Pending</div>
              <div className="text-2xl font-bold mt-1 text-warning">18</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-l-4 border-l-info">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">In Progress</div>
              <div className="text-2xl font-bold mt-1 text-info">24</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-l-4 border-l-success">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Completed</div>
              <div className="text-2xl font-bold mt-1 text-success">206</div>
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
                  placeholder="Search by order number or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="hidden sm:table-cell">Due Date</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const paymentStatus = getPaymentStatus(order);
                    return (
                      <TableRow key={order.id} className="cursor-pointer hover:bg-secondary/50">
                        <TableCell>
                          <div className="font-medium">{order.orderNumber}</div>
                          <div className="text-sm text-muted-foreground sm:hidden">
                            Due: {order.dueDate}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">
                                {order.customerName.split(' ').map((n) => n[0]).join('')}
                              </span>
                            </div>
                            <span className="font-medium">{order.customerName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {order.items.slice(0, 2).map((item, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                            {order.items.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{order.items.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('font-medium', statusStyles[order.status].className)}>
                            {statusStyles[order.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-medium">${order.totalAmount}</div>
                          <div className={cn('text-sm', paymentStatus.className)}>
                            {paymentStatus.label}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {order.dueDate}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Edit Order</DropdownMenuItem>
                              <DropdownMenuItem>Record Payment</DropdownMenuItem>
                              <DropdownMenuItem>Update Status</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">Cancel Order</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
