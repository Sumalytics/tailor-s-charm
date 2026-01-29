import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderStatus, Order } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { ShoppingBag, Plus } from 'lucide-react';

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
  onOrderClick?: (orderId: string) => void;
  onViewAll?: () => void;
  onCreateOrder?: () => void;
}

const statusStyles: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-warning/10 text-warning border-warning/20' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-info/10 text-info border-info/20' },
  COMPLETED: { label: 'Completed', className: 'bg-success/10 text-success border-success/20' },
  CANCELLED: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export function RecentOrders({ orders = [], onOrderClick, onViewAll, onCreateOrder }: RecentOrdersProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
        {orders.length > 0 && onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll} className="text-primary font-medium">
            View all
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-10">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No orders yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first order to get started</p>
              {onCreateOrder && (
                <Button onClick={onCreateOrder} className="mt-4 gap-2" size="lg">
                  <Plus className="h-4 w-4" />
                  Create first order
                </Button>
              )}
            </div>
          ) : (
            orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => onOrderClick?.(order.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border bg-card/50 transition-colors hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  !onOrderClick && 'cursor-default'
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{order.customerName}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">#{order.id.slice(-6)}</p>
                  </div>
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
                        'border-current/20 font-medium text-xs sm:text-sm shrink-0',
                        statusStyles[order.status].className
                      )}
                    >
                      {statusStyles[order.status].label}
                    </Badge>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
