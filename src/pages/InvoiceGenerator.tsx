import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getDocument, getCollection } from '@/firebase/firestore';
import { Order, Customer, Payment, Shop } from '@/types';
import { Download, ArrowLeft, FileText, Calendar, User, Phone, Mail, DollarSign } from 'lucide-react';

export default function InvoiceGenerator() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);

  useEffect(() => {
    if (id) {
      loadInvoiceData();
    }
  }, [id]);

  const loadInvoiceData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      // Load order
      const orderData = await getDocument<Order>('orders', id);
      if (!orderData) {
        toast({
          title: 'Order not found',
          description: 'The order you are looking for does not exist.',
          variant: 'destructive',
        });
        navigate('/orders');
        return;
      }

      // Load customer
      const customerData = await getDocument<Customer>('customers', orderData.customerId);
      
      // Load shop
      const shopData = await getDocument<Shop>('shops', orderData.shopId);
      
      // Load payments
      const paymentsList = await getCollection<Payment>('payments', [
        { field: 'orderId', operator: '==', value: id }
      ]);

      setOrder(orderData);
      setCustomer(customerData);
      setShop(shopData);
      setPayments(paymentsList.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));

    } catch (error) {
      console.error('Error loading invoice data:', error);
      toast({
        title: 'Error loading invoice',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!order || !customer) return;

    // Create a simple HTML invoice
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remaining = order.amount - totalPaid;

    const invoiceHTML = `
      <html>
        <head>
          <title>Invoice - Order #${order.id.slice(-6)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #333; margin: 0; }
            .header p { color: #666; margin: 5px 0; }
            .shop-name { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
            .shop-contact { font-size: 14px; color: #666; margin-bottom: 15px; }
            .shop-contact p { margin: 3px 0; }
            .info { margin-bottom: 20px; }
            .info h3 { color: #333; margin-bottom: 10px; }
            .info p { margin: 5px 0; color: #666; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .table th { background-color: #f5f5f5; }
            .total { text-align: right; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="shop-name">${shop?.name || 'Tailor Shop'}</div>
            <div class="shop-contact">
              ${shop?.phone ? `<p><strong>Phone:</strong> ${shop.phone}</p>` : ''}
              ${shop?.address ? `<p><strong>Location:</strong> ${shop.address}</p>` : ''}
            </div>
            <h1>INVOICE</h1>
            <p>Order #${order.id.slice(-6)}</p>
            <p>${new Date(order.createdAt).toLocaleDateString()}</p>
          </div>

          <div class="info">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${customer.name}</p>
            ${customer.phone ? `<p><strong>Phone:</strong> ${customer.phone}</p>` : ''}
            ${customer.email ? `<p><strong>Email:</strong> ${customer.email}</p>` : ''}
            ${customer.address ? `<p><strong>Address:</strong> ${customer.address}</p>` : ''}
          </div>

          <div class="info">
            <h3>Order Details</h3>
            <p><strong>Description:</strong> ${order.description}</p>
            <p><strong>Status:</strong> ${order.status.replace('_', ' ')}</p>
            ${order.dueDate ? `<p><strong>Due Date:</strong> ${new Date(order.dueDate).toLocaleDateString()}</p>` : ''}
            ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${order.description}</td>
                <td>${order.currency} ${order.amount.toFixed(2)}</td>
                <td>${order.status.replace('_', ' ')}</td>
              </tr>
            </tbody>
          </table>

          ${payments.length > 0 ? `
            <h3>Payment History</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${payments.map(payment => `
                  <tr>
                    <td>${new Date(payment.createdAt).toLocaleDateString()}</td>
                    <td>${payment.method}</td>
                    <td>${payment.currency} ${payment.amount.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          <div class="total">
            <p><strong>Total Amount:</strong> ${order.currency} ${order.amount.toFixed(2)}</p>
            <p><strong>Total Paid:</strong> ${order.currency} ${totalPaid.toFixed(2)}</p>
            <p><strong>Remaining Balance:</strong> ${order.currency} ${remaining.toFixed(2)}</p>
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>This is a computer-generated invoice.</p>
          </div>
        </body>
      </html>
    `;

    // Create a blob and download
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${order.id.slice(-6)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Invoice downloaded',
      description: 'Invoice has been downloaded successfully.',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!order || !customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Invoice not found</p>
          <Button onClick={() => navigate('/orders')} className="mt-4">
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = order.amount - totalPaid;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/orders/${order.id}`)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Order</span>
          </Button>
          <Button onClick={generatePDF} className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Download Invoice</span>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="text-center space-y-2">
              <div className="text-xl font-bold text-blue-600">
                {shop?.name || 'Tailor Shop'}
              </div>
              <div className="text-sm text-gray-600">
                {shop?.phone && <span>📞 {shop.phone}</span>}
                {shop?.phone && shop?.address && <span> • </span>}
                {shop?.address && <span>📍 {shop.address}</span>}
              </div>
              <CardTitle className="text-center">INVOICE</CardTitle>
              <p className="text-center text-muted-foreground">
                Order #{order.id.slice(-6)} • {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer Information */}
            <div>
              <h3 className="font-semibold mb-3">Customer Information</h3>
              <div className="space-y-1">
                <p className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{customer.name}</span>
                </p>
                {customer.phone && (
                  <p className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{customer.phone}</span>
                  </p>
                )}
                {customer.email && (
                  <p className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{customer.email}</span>
                  </p>
                )}
                {customer.address && (
                  <p className="flex items-center space-x-2">
                    <span className="h-4 w-4 text-gray-500">📍</span>
                    <span>{customer.address}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Order Details */}
            <div>
              <h3 className="font-semibold mb-3">Order Details</h3>
              <div className="space-y-1">
                <p><strong>Description:</strong> {order.description}</p>
                <p><strong>Status:</strong> {order.status.replace('_', ' ')}</p>
                {order.dueDate && (
                  <p className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span><strong>Due Date:</strong> {new Date(order.dueDate).toLocaleDateString()}</span>
                  </p>
                )}
                {order.notes && <p><strong>Notes:</strong> {order.notes}</p>}
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <h3 className="font-semibold mb-3">Order Summary</h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Amount</th>
                    <th className="text-center py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">{order.description}</td>
                    <td className="text-right py-2">{order.currency} {order.amount.toFixed(2)}</td>
                    <td className="text-center py-2">{order.status.replace('_', ' ')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment History */}
            {payments.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Payment History</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Method</th>
                      <th className="text-right py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b">
                        <td className="py-2">{new Date(payment.createdAt).toLocaleDateString()}</td>
                        <td className="py-2">{payment.method}</td>
                        <td className="text-right py-2">{payment.currency} {payment.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Total */}
            <div className="border-t pt-4">
              <div className="space-y-2 text-right">
                <p className="text-lg"><strong>Total Amount:</strong> {order.currency} {order.amount.toFixed(2)}</p>
                <p className="text-lg"><strong>Total Paid:</strong> {order.currency} {totalPaid.toFixed(2)}</p>
                <p className="text-xl font-bold text-blue-600"><strong>Remaining Balance:</strong> {order.currency} {remaining.toFixed(2)}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-6 border-t">
              <p className="text-gray-600">Thank you for your business!</p>
              <p className="text-sm text-gray-500">This is a computer-generated invoice.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
