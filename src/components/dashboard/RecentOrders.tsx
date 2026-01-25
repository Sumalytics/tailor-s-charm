import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderStatus } from '@/types';
import { cn } from '@/lib/utils';

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  amount: number;
  dueDate: string;
}

const mockOrders: RecentOrder[] = [
  { id: '1', orderNumber: 'ORD-001', customerName: 'James Wilson', status: 'IN_PROGRESS', amount: 250, dueDate: '2024-01-28' },
  { id: '2', orderNumber: 'ORD-002', customerName: 'Sarah Johnson', status: 'PENDING', amount: 180, dueDate: '2024-01-30' },
  { id: '3', orderNumber: 'ORD-003', customerName: 'Michael Brown', status: 'COMPLETED', amount: 420, dueDate: '2024-01-25' },
  { id: '4', orderNumber: 'ORD-004', customerName: 'Emily Davis', status: 'IN_PROGRESS', amount: 350, dueDate: '2024-02-01' },
  { id: '5', orderNumber: 'ORD-005', customerName: 'David Miller', status: 'PENDING', amount: 290, dueDate: '2024-02-03' },
];

const statusStyles: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-warning/10 text-warning border-warning/20' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-info/10 text-info border-info/20' },
  COMPLETED: { label: 'Completed', className: 'bg-success/10 text-success border-success/20' },
  CANCELLED: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export function RecentOrders() {
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {order.customerName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">{order.orderNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className={cn('font-medium', statusStyles[order.status].className)}>
                  {statusStyles[order.status].label}
                </Badge>
                <div className="text-right">
                  <p className="font-semibold text-sm">${order.amount}</p>
                  <p className="text-xs text-muted-foreground">Due: {order.dueDate}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
