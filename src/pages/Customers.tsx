import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  UserPlus,
  Search,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Customer {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  ordersCount: number;
  totalSpent: number;
  lastVisit: string;
}

const mockCustomers: Customer[] = [
  { id: '1', fullName: 'James Wilson', phoneNumber: '+1 234-567-8901', email: 'james@email.com', address: '123 Main St, New York', ordersCount: 12, totalSpent: 2450, lastVisit: '2024-01-20' },
  { id: '2', fullName: 'Sarah Johnson', phoneNumber: '+1 234-567-8902', email: 'sarah@email.com', address: '456 Oak Ave, Boston', ordersCount: 8, totalSpent: 1890, lastVisit: '2024-01-18' },
  { id: '3', fullName: 'Michael Brown', phoneNumber: '+1 234-567-8903', email: 'michael@email.com', address: '789 Pine Rd, Chicago', ordersCount: 15, totalSpent: 3200, lastVisit: '2024-01-22' },
  { id: '4', fullName: 'Emily Davis', phoneNumber: '+1 234-567-8904', email: 'emily@email.com', address: '321 Elm St, Miami', ordersCount: 6, totalSpent: 980, lastVisit: '2024-01-15' },
  { id: '5', fullName: 'David Miller', phoneNumber: '+1 234-567-8905', email: 'david@email.com', address: '654 Maple Dr, Seattle', ordersCount: 10, totalSpent: 2100, lastVisit: '2024-01-19' },
  { id: '6', fullName: 'Jennifer Garcia', phoneNumber: '+1 234-567-8906', email: 'jennifer@email.com', address: '987 Cedar Ln, Denver', ordersCount: 4, totalSpent: 750, lastVisit: '2024-01-10' },
];

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = mockCustomers.filter(
    (customer) =>
      customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phoneNumber.includes(searchQuery) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Customers</h1>
            <p className="text-muted-foreground mt-1">
              Manage your customer database and records
            </p>
          </div>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Customers</div>
              <div className="text-2xl font-bold mt-1">1,248</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">New This Month</div>
              <div className="text-2xl font-bold mt-1 text-primary">+32</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Active Customers</div>
              <div className="text-2xl font-bold mt-1">892</div>
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
                  placeholder="Search by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                    <TableHead className="hidden lg:table-cell">Address</TableHead>
                    <TableHead className="text-center">Orders</TableHead>
                    <TableHead className="text-right">Total Spent</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="cursor-pointer hover:bg-secondary/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {customer.fullName.split(' ').map((n) => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{customer.fullName}</div>
                            <div className="text-sm text-muted-foreground md:hidden">
                              {customer.phoneNumber}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {customer.phoneNumber}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {customer.address}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{customer.ordersCount}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${customer.totalSpent.toLocaleString()}
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
                            <DropdownMenuItem>Edit Customer</DropdownMenuItem>
                            <DropdownMenuItem>View Orders</DropdownMenuItem>
                            <DropdownMenuItem>Add Measurement</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
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
