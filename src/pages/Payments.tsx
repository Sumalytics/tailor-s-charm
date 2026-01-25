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
  CreditCard,
  Search,
  MoreHorizontal,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PaymentMethod, PaymentStatus } from '@/types';
import { cn } from '@/lib/utils';

interface Payment {
  id: string;
  customerName: string;
  orderNumber: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  type: 'ORDER_PAYMENT' | 'ADVANCE' | 'REFUND';
  date: string;
}

const mockPayments: Payment[] = [
  { id: '1', customerName: 'James Wilson', orderNumber: 'ORD-2024-001', amount: 225, method: 'CARD', status: 'COMPLETED', type: 'ORDER_PAYMENT', date: '2024-01-20' },
  { id: '2', customerName: 'Sarah Johnson', orderNumber: 'ORD-2024-002', amount: 100, method: 'CASH', status: 'COMPLETED', type: 'ADVANCE', date: '2024-01-18' },
  { id: '3', customerName: 'Michael Brown', orderNumber: 'ORD-2024-003', amount: 620, method: 'BANK_TRANSFER', status: 'COMPLETED', type: 'ORDER_PAYMENT', date: '2024-01-22' },
  { id: '4', customerName: 'Emily Davis', orderNumber: 'ORD-2024-004', amount: 90, method: 'MOBILE_MONEY', status: 'COMPLETED', type: 'ORDER_PAYMENT', date: '2024-01-19' },
  { id: '5', customerName: 'David Miller', orderNumber: 'ORD-2024-005', amount: 445, method: 'CARD', status: 'PENDING', type: 'ADVANCE', date: '2024-01-21' },
  { id: '6', customerName: 'Jennifer Garcia', orderNumber: 'ORD-2024-006', amount: 75, method: 'CASH', status: 'COMPLETED', type: 'ORDER_PAYMENT', date: '2024-01-20' },
  { id: '7', customerName: 'Robert Martinez', orderNumber: 'ORD-2024-007', amount: 50, method: 'CASH', status: 'REFUNDED', type: 'REFUND', date: '2024-01-15' },
];

const methodLabels: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  MOBILE_MONEY: 'Mobile Money',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank Transfer',
  OTHER: 'Other',
};

const statusStyles: Record<PaymentStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-warning/10 text-warning border-warning/20' },
  COMPLETED: { label: 'Completed', className: 'bg-success/10 text-success border-success/20' },
  FAILED: { label: 'Failed', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  REFUNDED: { label: 'Refunded', className: 'bg-muted text-muted-foreground border-muted' },
};

export default function Payments() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPayments = mockPayments.filter(
    (payment) =>
      payment.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalReceived = mockPayments
    .filter((p) => p.status === 'COMPLETED' && p.type !== 'REFUND')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = mockPayments
    .filter((p) => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRefunded = mockPayments
    .filter((p) => p.type === 'REFUND')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Payments</h1>
            <p className="text-muted-foreground mt-1">
              Track all payments and transactions
            </p>
          </div>
          <Button className="gap-2">
            <CreditCard className="h-4 w-4" />
            Record Payment
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Total Received</div>
                  <div className="text-2xl font-bold mt-1 text-success">${totalReceived.toLocaleString()}</div>
                </div>
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                  <div className="text-2xl font-bold mt-1 text-warning">${totalPending.toLocaleString()}</div>
                </div>
                <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Refunded</div>
                  <div className="text-2xl font-bold mt-1 text-muted-foreground">${totalRefunded.toLocaleString()}</div>
                </div>
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <ArrowDownRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card className="shadow-soft">
          <CardHeader className="pb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer or order..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="hidden sm:table-cell">Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-secondary/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {payment.customerName.split(' ').map((n) => n[0]).join('')}
                            </span>
                          </div>
                          <span className="font-medium">{payment.customerName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{payment.orderNumber}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">{methodLabels[payment.method]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('font-medium', statusStyles[payment.status].className)}>
                          {statusStyles[payment.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          'font-semibold',
                          payment.type === 'REFUND' ? 'text-destructive' : ''
                        )}>
                          {payment.type === 'REFUND' ? '-' : ''}${payment.amount}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {payment.date}
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
                            <DropdownMenuItem>Print Receipt</DropdownMenuItem>
                            <DropdownMenuItem>View Order</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Refund</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
