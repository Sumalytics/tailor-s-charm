import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Eye,
} from 'lucide-react';
import { GarmentType, FitType, Measurement } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getCollection } from '@/firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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

export default function Measurements() {
  const navigate = useNavigate();
  const { shopId } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shopId) {
      loadMeasurements();
    }
  }, [shopId]);

  const loadMeasurements = async () => {
    if (!shopId) return;

    setLoading(true);
    try {
      console.log('Loading measurements for shopId:', shopId);
      const measurementsData = await getCollection<Measurement>('measurements', [
        { field: 'shopId', operator: '==', value: shopId }
      ]);
      
      console.log('Raw measurements data from Firestore:', measurementsData);
      
      // Sort by creation date (newest first)
      const sortedMeasurements = measurementsData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      console.log('Sorted measurements:', sortedMeasurements);
      setMeasurements(sortedMeasurements);
    } catch (error) {
      console.error('Error loading measurements:', error);
      toast({
        title: 'Error loading measurements',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMeasurements = measurements.filter(
    (measurement) =>
      measurement.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      measurement.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleQuickView = (measurement: Measurement) => {
    // Show key measurements in a toast for quick implementation
    const keyMeasurements = Object.entries(measurement.measurements)
      .slice(0, 5) // Show first 5 measurements
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    toast({
      title: `${measurement.name} - Quick View`,
      description: `${measurement.garmentType} • ${measurement.fit}\n${keyMeasurements}`,
      duration: 5000,
    });
  };

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
          <Button className="gap-2" onClick={() => navigate('/measurements/new')}>
            <Plus className="h-4 w-4" />
            Add Measurement
          </Button>
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
                      {measurement.usageCount ? `Used ${measurement.usageCount} time${measurement.usageCount > 1 ? 's' : ''}` : 'Not used yet'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(measurement.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickView(measurement)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Quick View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/measurements/${measurement.id}`)}
                    >
                      View Details
                    </Button>
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
