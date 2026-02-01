import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, addDocument } from '@/firebase/firestore';
import { ExpenseCategory, Currency } from '@/types';
import { ArrowLeft, Save } from 'lucide-react';

const categoryLabels: Record<ExpenseCategory, string> = {
  MATERIALS: 'Materials (fabric, thread, buttons)',
  UTILITIES: 'Utilities (electricity, water)',
  RENT: 'Rent',
  SALARIES: 'Salaries',
  EQUIPMENT: 'Equipment & maintenance',
  TRANSPORT: 'Transport',
  OTHER: 'Other',
};

export default function NewExpense() {
  const navigate = useNavigate();
  const { currentUser, shopId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState<Currency>('GHS');

  const [formData, setFormData] = useState({
    amount: '',
    category: 'OTHER' as ExpenseCategory,
    description: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (shopId) {
      getDocument<{ currency?: Currency }>('shops', shopId).then((shop) => {
        if (shop?.currency) setCurrency(shop.currency);
      });
    }
  }, [shopId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !shopId) return;

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: 'Description required',
        description: 'Please enter a description for this expense.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const expenseData: Record<string, unknown> = {
        shopId,
        amount,
        currency,
        category: formData.category,
        description: formData.description.trim(),
        date: new Date(formData.date),
        createdAt: new Date(),
        createdBy: currentUser.uid,
      };
      const notes = formData.notes.trim();
      if (notes) expenseData.notes = notes;

      await addDocument('expenses', expenseData);

      toast({
        title: 'Expense recorded',
        description: 'Your expense has been saved.',
      });
      navigate('/expenses');
    } catch (error) {
      console.error('Error saving expense:', error);
      toast({
        title: 'Error',
        description: 'Could not save expense. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/expenses')}
          className="mb-4 gap-2"
          aria-label="Back to Expenses"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Expenses
        </Button>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Add Expense</CardTitle>
            <CardDescription>Record a shop expense to track your spending</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  placeholder="e.g. Fabric for wedding dress"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, date: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, category: v as ExpenseCategory }))
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(categoryLabels) as ExpenseCategory[]).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {categoryLabels[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional details..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/expenses')}
                  className="sm:min-w-[100px]"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="gap-2 flex-1 sm:flex-initial">
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Expense'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
