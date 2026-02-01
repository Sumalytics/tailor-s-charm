import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Receipt,
  Search,
  Plus,
  TrendingDown,
  Calendar,
  Tag,
} from 'lucide-react';
import { Expense, ExpenseCategory } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getCollection } from '@/firebase/firestore';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const safeDate = (date: unknown): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date === 'object' && date !== null && 'toDate' in date) {
    const d = date as { toDate: () => Date };
    return typeof d.toDate === 'function' ? d.toDate() : new Date(String(date));
  }
  return new Date(String(date));
};

const categoryLabels: Record<ExpenseCategory, string> = {
  MATERIALS: 'Materials',
  UTILITIES: 'Utilities',
  RENT: 'Rent',
  SALARIES: 'Salaries',
  EQUIPMENT: 'Equipment',
  TRANSPORT: 'Transport',
  OTHER: 'Other',
};

export default function Expenses() {
  const navigate = useNavigate();
  const { shopId } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shopId) loadData();
  }, [shopId]);

  const loadData = async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const data = await getCollection<Expense>('expenses', [
        { field: 'shopId', operator: '==', value: shopId },
      ]);
      setExpenses(
        data.sort((a, b) => safeDate(b.date).getTime() - safeDate(a.date).getTime())
      );
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast({
        title: 'Error loading expenses',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses.filter(
    (e) =>
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      categoryLabels[e.category].toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Expenses</h1>
            <p className="text-muted-foreground mt-1">Track shop costs and spending</p>
          </div>
          <Button className="gap-2" onClick={() => navigate('/expenses/new')}>
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </div>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total Expenses</div>
                <div className="text-2xl font-bold mt-1 text-destructive">
                  {formatCurrency(totalExpenses, expenses[0]?.currency || 'GHS')}
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="pb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by description or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No expenses yet</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'Try adjusting your search' : 'Start tracking your shop expenses'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => navigate('/expenses/new')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add First Expense
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile: card list */}
                <div className="md:hidden space-y-3 px-4 pb-4">
                  {filteredExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="rounded-xl border bg-card p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{expense.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {categoryLabels[expense.category]}
                          </p>
                        </div>
                        <span className="font-semibold text-destructive shrink-0">
                          {formatCurrency(expense.amount, expense.currency)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {safeDate(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
                {/* Desktop: table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{expense.description}</p>
                              {expense.notes && (
                                <p className="text-sm text-muted-foreground truncate max-w-xs">
                                  {expense.notes}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {categoryLabels[expense.category]}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium text-destructive">
                            {formatCurrency(expense.amount, expense.currency)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {safeDate(expense.date).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
