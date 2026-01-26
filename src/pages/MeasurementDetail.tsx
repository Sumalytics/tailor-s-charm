import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument } from '@/firebase/firestore';
import { Measurement } from '@/types';
import { ArrowLeft, Edit, Trash2, Ruler, User, Calendar } from 'lucide-react';

export default function MeasurementDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shopId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [measurement, setMeasurement] = useState<Measurement | null>(null);

  useEffect(() => {
    if (id) {
      loadMeasurement();
    }
  }, [id]);

  const loadMeasurement = async () => {
    if (!id) return;

    try {
      const measurementData = await getDocument<Measurement>('measurements', id);
      if (measurementData && measurementData.shopId === shopId) {
        setMeasurement(measurementData);
      } else {
        toast({
          title: 'Measurement not found',
          description: 'The measurement you are looking for does not exist.',
          variant: 'destructive',
        });
        navigate('/measurements');
      }
    } catch (error) {
      console.error('Error loading measurement:', error);
      toast({
        title: 'Error loading measurement',
        description: 'Please try again.',
        variant: 'destructive',
      });
      navigate('/measurements');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/measurements/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!measurement || !confirm(`Are you sure you want to delete ${measurement.name}?`)) {
      return;
    }

    try {
      // TODO: Implement delete functionality
      toast({
        title: 'Delete functionality coming soon',
        description: 'Measurement deletion will be implemented in a future update.',
      });
    } catch (error) {
      toast({
        title: 'Error deleting measurement',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!measurement) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          <p>Measurement not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/measurements')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Measurements</span>
            </Button>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl lg:text-3xl font-bold">{measurement.name}</h1>
              <Badge variant="outline">{measurement.garmentType}</Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Measurement Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Ruler className="h-5 w-5" />
                  <span>Measurement Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{measurement.customerName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>Created {new Date(measurement.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Garment Type:</span>
                  <Badge variant="secondary">{measurement.garmentType}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Fit:</span>
                  <Badge variant="outline">{measurement.fit}</Badge>
                </div>
                {measurement.usageCount && (
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Usage:</span>
                    <span>{measurement.usageCount} time{measurement.usageCount > 1 ? 's' : ''}</span>
                  </div>
                )}
                {measurement.notes && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-sm text-gray-600">{measurement.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Measurements Grid */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Measurements</CardTitle>
                <CardDescription>
                  Detailed measurements for {measurement.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(measurement.measurements).map(([key, value]) => (
                    <div key={key} className="p-4 border rounded-lg">
                      <div className="text-sm font-medium text-gray-500 capitalize">
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="text-lg font-semibold">
                        {value} {measurement.unit}
                      </div>
                    </div>
                  ))}
                </div>
                {Object.keys(measurement.measurements).length === 0 && (
                  <div className="text-center py-8">
                    <Ruler className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">No measurements recorded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
