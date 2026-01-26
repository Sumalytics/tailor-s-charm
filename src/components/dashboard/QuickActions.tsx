import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, ShoppingBag, Ruler, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const actions = [
  { label: 'New Customer', icon: UserPlus, href: '/customers/new', color: 'primary' },
  { label: 'New Order', icon: ShoppingBag, href: '/orders/new', color: 'info' },
  { label: 'Add Measurement', icon: Ruler, href: '/measurements/new', color: 'success' },
  { label: 'Record Payment', icon: CreditCard, href: '/payments/new', color: 'warning' },
] as const;

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto flex-col gap-2 py-3 sm:py-4 px-2 sm:px-3 hover:bg-secondary/80 min-h-[80px] sm:min-h-[100px]"
              onClick={() => navigate(action.href)}
            >
              <action.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-center leading-tight">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
