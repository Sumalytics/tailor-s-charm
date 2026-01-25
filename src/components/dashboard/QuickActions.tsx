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
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto flex-col gap-2 py-4 hover:bg-secondary/80"
              onClick={() => navigate(action.href)}
            >
              <action.icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
