import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, getCollection, deleteDocument, getCustomerDebts } from '@/firebase/firestore';
import { Customer, Order, Measurement, Debt } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { ArrowLeft, Edit, Trash2, ShoppingBag, Phone, Mail, MapPin, Calendar, Ruler, DollarSign, CreditCard } from 'lucide-react';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shopId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);
  const [loadingDebts, setLoadingDebts] = useState(false);

  useEffect(() => {
    if (id) {
      loadCustomer();
    }
  }, [id]);

  useEffect(() => {
    if (customer) {
      loadCustomerOrders();
      loadCustomerMeasurements();
      loadCustomerDebts();
    }
  }, [customer]);

  const loadCustomer = async () => {
    if (!id) return;

    try {
      const customerData = await getDocument<Customer>('customers', id);
      if (customerData && customerData.shopId === shopId) {
        setCustomer(customerData);
      } else {
        toast({
          title: 'Customer not found',
          description: 'The customer you are looking for does not exist.',
          variant: 'destructive',
        });
        navigate('/customers');
      }
    } catch (error) {
      console.error('Error loading customer:', error);
      toast({
        title: 'Error loading customer',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerOrders = async () => {
    if (!customer || !shopId) return;

    setLoadingOrders(true);
    try {
      const ordersData = await getCollection<Order>('orders', [
        { field: 'shopId', operator: '==', value: shopId },
        { field: 'customerId', operator: '==', value: customer.id }
      ]);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadCustomerMeasurements = async () => {
    if (!customer || !shopId) return;

    setLoadingMeasurements(true);
    try {
      const measurementsData = await getCollection<Measurement>('measurements', [
        { field: 'shopId', operator: '==', value: shopId },
        { field: 'customerId', operator: '==', value: customer.id }
      ]);
      setMeasurements(measurementsData);
    } catch (error) {
      console.error('Error loading measurements:', error);
    } finally {
      setLoadingMeasurements(false);
    }
  };

  const loadCustomerDebts = async () => {
    if (!customer || !shopId) return;

    setLoadingDebts(true);
    try {
      const list = await getCustomerDebts(shopId, customer.id);
      const outstanding = list.filter(
        (d) => d.status === 'ACTIVE' || d.status === 'PARTIALLY_PAID'
      );
      setDebts(outstanding);
    } catch (error) {
      console.error('Error loading customer debts:', error);
    } finally {
      setLoadingDebts(false);
    }
  };

  const handleDelete = async () => {
    if (!customer || !confirm(`Are you sure you want to delete ${customer.name}?`)) {
      return;
    }

    try {
      await deleteDocument('customers', customer.id);
      toast({
        title: 'Customer deleted',
        description: `${customer.name} has been removed from your customer list.`,
      });
      navigate('/customers');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Error deleting customer',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          <p>Customer not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/customers')}
              className="flex items-center space-x-2 w-full sm:w-auto justify-start"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Customers</span>
            </Button>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl lg:text-3xl font-bold truncate">{customer.name}</h1>
              <Badge variant={customer.isActive ? 'default' : 'secondary'} className="flex-shrink-0">
                {customer.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => navigate(`/customers/${customer.id}/edit`)}
              className="flex items-center space-x-2 w-full sm:w-auto justify-center"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex items-center space-x-2 w-full sm:w-auto justify-center"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customer.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{customer.address}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>Added {new Date(customer.createdAt).toLocaleDateString()}</span>
                </div>
                {customer.notes && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-sm text-gray-600">{customer.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Outstanding debt */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Outstanding debt
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingDebts ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : debts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No outstanding debt</p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-lg font-semibold text-red-600">
                      Total: {formatCurrency(debts.reduce((s, d) => s + d.remainingAmount, 0), debts[0]?.currency ?? 'GHS')}
                    </p>
                    {debts.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-muted/30"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{d.orderDescription}</p>
                          <p className="text-xs text-muted-foreground">#{d.orderId.slice(-6)} · {formatCurrency(d.remainingAmount, d.currency)}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); navigate(`/payments/new?orderId=${d.orderId}`); }}
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          Pay
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Measurements */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="flex items-center space-x-2">
                    <Ruler className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">Measurements</span>
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/measurements/new?customerId=${customer.id}`)}
                    className="w-full sm:w-auto"
                  >
                    Add Measurement
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingMeasurements ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : measurements.length === 0 ? (
                  <div className="text-center py-4">
                    <Ruler className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">No measurements recorded</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/measurements/new?customerId=${customer.id}`)}
                      className="mt-2"
                    >
                      Add First Measurement
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {measurements.map((measurement) => (
                      <div
                        key={measurement.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer gap-2"
                        onClick={() => navigate(`/measurements/${measurement.id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{measurement.name}</h4>
                          <p className="text-sm text-gray-500 truncate">
                            {measurement.garmentType} • {measurement.fit}
                          </p>
                          {measurement.usageCount && (
                            <p className="text-xs text-gray-400">
                              Used {measurement.usageCount} times
                            </p>
                          )}
                        </div>
                        <Button size="sm" variant="ghost" className="flex-shrink-0">
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() => navigate(`/orders/new?customerId=${customer.id}`)}
                  className="w-full justify-start"
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Create New Order
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/customers/${customer.id}/edit`)}
                  className="w-full justify-start"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Customer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/measurements/new?customerId=${customer.id}`)}
                  className="w-full justify-start"
                >
                  <Ruler className="h-4 w-4 mr-2" />
                  Add Measurement
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Orders */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>
                  Order history for {customer.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No orders yet</p>
                    <Button
                      onClick={() => navigate(`/orders/new?customerId=${customer.id}`)}
                      className="mt-4"
                    >
                      Create First Order
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer gap-3"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                            <h4 className="font-medium truncate">{order.description}</h4>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>{order.currency} {order.amount.toFixed(2)}</span>
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                            {order.dueDate && (
                              <span>Due: {new Date(order.dueDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
