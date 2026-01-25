import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Ruler,
  Search,
  Plus,
  User,
  Shirt,
} from 'lucide-react';
import { GarmentType, FitType } from '@/types';
import { cn } from '@/lib/utils';

interface MeasurementRecord {
  id: string;
  customerName: string;
  name: string;
  garmentType: GarmentType;
  fit: FitType;
  usageCount: number;
  lastUsed: string;
  createdAt: string;
}

const mockMeasurements: MeasurementRecord[] = [
  { id: '1', customerName: 'James Wilson', name: 'Business Suit', garmentType: 'SUIT', fit: 'REGULAR', usageCount: 4, lastUsed: '2024-01-20', createdAt: '2023-06-15' },
  { id: '2', customerName: 'James Wilson', name: 'Casual Shirt', garmentType: 'SHIRT', fit: 'SLIM', usageCount: 3, lastUsed: '2024-01-18', createdAt: '2023-08-22' },
  { id: '3', customerName: 'Sarah Johnson', name: 'Evening Dress', garmentType: 'DRESS', fit: 'REGULAR', usageCount: 2, lastUsed: '2024-01-16', createdAt: '2023-10-10' },
  { id: '4', customerName: 'Michael Brown', name: 'Wedding Suit', garmentType: 'SUIT', fit: 'SLIM', usageCount: 1, lastUsed: '2024-01-22', createdAt: '2024-01-05' },
  { id: '5', customerName: 'Emily Davis', name: 'Office Blouse', garmentType: 'BLOUSE', fit: 'REGULAR', usageCount: 5, lastUsed: '2024-01-19', createdAt: '2023-04-20' },
  { id: '6', customerName: 'David Miller', name: 'Dress Trousers', garmentType: 'TROUSERS', fit: 'LOOSE', usageCount: 6, lastUsed: '2024-01-21', createdAt: '2023-03-15' },
];

const garmentLabels: Record<GarmentType, string> = {
  SHIRT: 'Shirt',
  TROUSERS: 'Trousers',
  SUIT: 'Suit',
  DRESS: 'Dress',
  SKIRT: 'Skirt',
  BLOUSE: 'Blouse',
  JACKET: 'Jacket',
};

const fitLabels: Record<FitType, { label: string; className: string }> = {
  SLIM: { label: 'Slim', className: 'bg-info/10 text-info border-info/20' },
  REGULAR: { label: 'Regular', className: 'bg-primary/10 text-primary border-primary/20' },
  LOOSE: { label: 'Loose', className: 'bg-warning/10 text-warning border-warning/20' },
};

const measurementTemplates = [
  { type: 'SHIRT', label: "Men's Shirt", icon: Shirt, fields: 8 },
  { type: 'TROUSERS', label: "Men's Trousers", icon: Ruler, fields: 8 },
  { type: 'SUIT', label: "Men's Suit", icon: User, fields: 10 },
  { type: 'DRESS', label: "Women's Dress", icon: Shirt, fields: 8 },
];

export default function Measurements() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMeasurements = mockMeasurements.filter(
    (m) =>
      m.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Measurements</h1>
            <p className="text-muted-foreground mt-1">
              Manage customer measurement records and templates
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Measurement
          </Button>
        </div>

        {/* Templates Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Templates</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {measurementTemplates.map((template) => (
              <Card
                key={template.type}
                className="shadow-soft cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
              >
                <CardContent className="p-4 text-center">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <template.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-sm">{template.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{template.fields} measurements</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Measurements */}
        <Card className="shadow-soft">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg font-semibold">Recent Measurements</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search measurements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {filteredMeasurements.map((measurement) => (
                <div
                  key={measurement.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-secondary/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Ruler className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{measurement.name}</h3>
                        <Badge variant="outline" className={cn('text-xs', fitLabels[measurement.fit].className)}>
                          {fitLabels[measurement.fit].label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {measurement.customerName}
                        </span>
                        <span>•</span>
                        <span>{garmentLabels[measurement.garmentType]}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium">
                      Used {measurement.usageCount} time{measurement.usageCount > 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last: {measurement.lastUsed}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
