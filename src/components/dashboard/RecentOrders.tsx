import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderStatus, Order } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

// Safe date conversion utility
const safeDate = (date: any): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date === 'object' && date.toDate) return date.toDate();
  return new Date(date);
};

interface RecentOrdersProps {
  orders?: Order[];
  onRefresh?: () => Promise<void>;
}

const statusStyles: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-warning/10 text-warning border-warning/20' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-info/10 text-info border-info/20' },
  COMPLETED: { label: 'Completed', className: 'bg-success/10 text-success border-success/20' },
  CANCELLED: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export function RecentOrders({ orders = [], onRefresh }: RecentOrdersProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent orders</p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="p-3 rounded-lg border bg-card/50 transition-colors hover:bg-card"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* Customer Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium text-sm sm:text-base">{order.customerName}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">#{order.id.slice(-6)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Order Details */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="text-right sm:text-left">
                      <p className="font-medium text-sm sm:text-base">{formatCurrency(order.amount, order.currency)}</p>
                      <p className="text-xs text-muted-foreground">
                        Due: {order.dueDate ? safeDate(order.dueDate).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'border-current/20 font-medium text-xs sm:text-sm',
                        statusStyles[order.status].className
                      )}
                    >
                      {statusStyles[order.status].label}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
