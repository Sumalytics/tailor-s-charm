import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDocument, getCollection } from '@/firebase/firestore';
import { auth } from '@/firebase/config';
import { Order, Customer, Payment, Shop } from '@/types';
import { FileText, Download, Calendar, User, Phone, Mail, MessageCircle } from 'lucide-react';

export default function PublicInvoice() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadInvoiceData();
    }
  }, [id]);

  const loadInvoiceData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // Load order (public get allowed for shareable invoice links)
      const orderData = await getDocument<Order>('orders', id);
      if (!orderData) {
        setError('Invoice not found');
        return;
      }

      // Load customer and shop (public get allowed for invoice display)
      const [customerData, shopData] = await Promise.all([
        getDocument<Customer>('customers', orderData.customerId),
        getDocument<Shop>('shops', orderData.shopId),
      ]);

      setOrder(orderData);
      setCustomer(customerData);
      setShop(shopData);

      // Payments require auth; for public link use order.paidAmount
      const isLoggedIn = !!auth.currentUser;
      if (isLoggedIn) {
        try {
          const paymentsList = await getCollection<Payment>('payments', [
            { field: 'shopId', operator: '==', value: orderData.shopId },
            { field: 'orderId', operator: '==', value: id },
          ]);
          setPayments(
            paymentsList.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          );
        } catch {
          setPayments([]);
        }
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.error('Error loading invoice:', err);
      setError('Unable to load invoice. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getTotals = () => {
    if (!order) return { totalPaid: 0, remaining: 0 };
    const paid =
      payments.length > 0
        ? payments.reduce((s, p) => s + p.amount, 0)
        : (order.paidAmount ?? 0);
    return { totalPaid: paid, remaining: order.amount - paid };
  };

  const generatePDF = () => {
    if (!order || !customer) return;
    const { totalPaid, remaining } = getTotals();

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
  };

  const shareViaWhatsApp = () => {
    if (!order || !customer) return;
    const { totalPaid, remaining } = getTotals();
    const message = `Hello ${customer.name}!\n\nYour order details:\nOrder: ${order.description}\nTotal: ${order.currency} ${order.amount.toFixed(2)}\nPaid: ${order.currency} ${totalPaid.toFixed(2)}\nRemaining: ${order.currency} ${remaining.toFixed(2)}\nDue: ${order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'Not set'}\nStatus: ${order.status}\n\nView your invoice: ${window.location.href}\n\nThank you for your business!`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invoice Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
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
        </div>
      </div>
    );
  }

  const { totalPaid, remaining } = getTotals();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left">
              <div className="text-xl font-bold text-blue-600 mb-2">
                {shop?.name || 'Tailor Shop'}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {shop?.phone && <span>📞 {shop.phone}</span>}
                {shop?.phone && shop?.address && <span> • </span>}
                {shop?.address && <span>📍 {shop.address}</span>}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">INVOICE</h1>
              <p className="text-gray-600">
                Order #{order.id.slice(-6)} • {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-2 mt-4 md:mt-0">
              <Button onClick={generatePDF} className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </Button>
              <Button onClick={shareViaWhatsApp} variant="outline" className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Invoice */}
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Customer Information */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-900">Customer Information</h3>
              <div className="space-y-2">
                <p className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{customer.name}</span>
                </p>
                {customer.phone && (
                  <p className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{customer.phone}</span>
                  </p>
                )}
                {customer.email && (
                  <p className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{customer.email}</span>
                  </p>
                )}
                {customer.address && (
                  <p className="flex items-center space-x-2">
                    <span className="h-4 w-4 text-gray-500">📍</span>
                    <span className="text-gray-700">{customer.address}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Order Details */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-900">Order Details</h3>
              <div className="space-y-2">
                <p className="text-gray-700"><strong>Description:</strong> {order.description}</p>
                <p className="text-gray-700"><strong>Status:</strong> 
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {order.status.replace('_', ' ')}
                  </span>
                </p>
                {order.dueDate && (
                  <p className="flex items-center space-x-2 text-gray-700">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span><strong>Due Date:</strong> {new Date(order.dueDate).toLocaleDateString()}</span>
                  </p>
                )}
                {order.notes && <p className="text-gray-700"><strong>Notes:</strong> {order.notes}</p>}
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-900">Order Summary</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4">Description</th>
                      <th className="text-right py-3 px-4">Amount</th>
                      <th className="text-center py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="py-3 px-4">{order.description}</td>
                      <td className="text-right py-3 px-4 font-medium">{order.currency} {order.amount.toFixed(2)}</td>
                      <td className="text-center py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment History */}
            {payments.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-gray-900">Payment History</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Method</th>
                        <th className="text-right py-3 px-4">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id} className="border-t">
                          <td className="py-3 px-4">{new Date(payment.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-4">{payment.method}</td>
                          <td className="text-right py-3 px-4 font-medium">{payment.currency} {payment.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="border-t pt-6">
              <div className="space-y-2 text-right">
                <p className="text-lg text-gray-700"><strong>Total Amount:</strong> {order.currency} {order.amount.toFixed(2)}</p>
                <p className="text-lg text-gray-700"><strong>Total Paid:</strong> {order.currency} {totalPaid.toFixed(2)}</p>
                <p className="text-xl font-bold text-blue-600"><strong>Remaining Balance:</strong> {order.currency} {remaining.toFixed(2)}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-6 border-t">
              <p className="text-gray-600 font-medium">Thank you for your business!</p>
              <p className="text-sm text-gray-500">This is a computer-generated invoice.</p>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-center space-x-4">
            <Button onClick={generatePDF} className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              Download Invoice
            </Button>
            <Button onClick={shareViaWhatsApp} variant="outline" className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              Share via WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
