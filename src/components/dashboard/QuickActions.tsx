import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, ShoppingBag, Ruler, CreditCard, ReceiptText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const actions = [
  { label: 'New Customer', icon: UserPlus, href: '/customers/new', color: 'primary' },
  { label: 'New Order', icon: ShoppingBag, href: '/orders/new', color: 'info' },
  { label: 'Add Measurement', icon: Ruler, href: '/measurements/new', color: 'success' },
  { label: 'Record Payment', icon: CreditCard, href: '/payments/new', color: 'warning' },
  { label: 'Add Expense', icon: ReceiptText, href: '/expenses/new', color: 'default' },
] as const;

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto flex-col gap-2 py-4 sm:py-5 px-3 sm:px-4 hover:bg-secondary/80 min-h-[88px] sm:min-h-[100px] touch-manipulation"
              onClick={() => navigate(action.href)}
              aria-label={action.label}
            >
              <action.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" aria-hidden />
              <span className="text-xs sm:text-sm font-medium text-center leading-tight">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
