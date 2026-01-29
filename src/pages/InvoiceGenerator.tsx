import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getDocument, getCollection } from '@/firebase/firestore';
import { Order, Customer, Payment, Shop } from '@/types';
import { Download, ArrowLeft, FileText, Printer } from 'lucide-react';

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

  const RECEIPT_MM = 80;

  const generatePDF = () => {
    if (!order || !customer) return;

    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remaining = order.amount - totalPaid;

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice #${order.id.slice(-6)}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; margin: 0; padding: 4mm; font-size: 11px; width: ${RECEIPT_MM}mm; max-width: 100%; }
            .r { width: ${RECEIPT_MM}mm; max-width: 100%; margin: 0 auto; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .mt1 { margin-top: 2mm; }
            .mt2 { margin-top: 4mm; }
            .mb1 { margin-bottom: 2mm; }
            hr { border: none; border-top: 1px dashed #333; margin: 3mm 0; }
            .row { display: flex; justify-content: space-between; gap: 4mm; }
            .pay { font-size: 10px; margin-top: 1mm; }
            @media print { body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="r">
            <div class="center bold mb1">${(shop?.name || 'Tailor Shop').replace(/</g, '&lt;')}</div>
            ${shop?.phone ? `<div class="center" style="font-size:10px">${String(shop.phone).replace(/</g, '&lt;')}</div>` : ''}
            ${shop?.address ? `<div class="center" style="font-size:10px">${String(shop.address).replace(/</g, '&lt;')}</div>` : ''}
            <hr class="mt1" />
            <div class="center bold mt1">INVOICE</div>
            <div class="center" style="font-size:10px">#${order.id.slice(-6)} &bull; ${new Date(order.createdAt).toLocaleDateString()}</div>
            <hr class="mt1" />
            <div class="bold mt2">Customer</div>
            <div>${String(customer.name).replace(/</g, '&lt;')}</div>
            ${customer.phone ? `<div style="font-size:10px">${String(customer.phone).replace(/</g, '&lt;')}</div>` : ''}
            ${customer.address ? `<div style="font-size:10px">${String(customer.address).replace(/</g, '&lt;')}</div>` : ''}
            <hr class="mt1" />
            <div class="bold">Order</div>
            <div>${String(order.description).replace(/</g, '&lt;')}</div>
            <div class="row mt1"><span>Status</span><span>${order.status.replace('_', ' ')}</span></div>
            ${order.dueDate ? `<div class="row"><span>Due</span><span>${new Date(order.dueDate).toLocaleDateString()}</span></div>` : ''}
            <hr class="mt1" />
            ${payments.length > 0 ? payments.map(p => `<div class="row pay"><span>${new Date(p.createdAt).toLocaleDateString()} ${(p.method || '').replace('_',' ')}</span><span>${p.currency} ${p.amount.toFixed(2)}</span></div>`).join('') + '<hr class="mt1" />' : ''}
            <div class="row bold"><span>Total</span><span>${order.currency} ${order.amount.toFixed(2)}</span></div>
            <div class="row"><span>Paid</span><span>${order.currency} ${totalPaid.toFixed(2)}</span></div>
            <div class="row bold"><span>Balance</span><span>${order.currency} ${remaining.toFixed(2)}</span></div>
            <hr class="mt2" />
            <div class="center mt1" style="font-size:10px">Thank you</div>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([invoiceHTML], { type: 'text/html;charset=utf-8' });
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
      description: '80mm receipt-style invoice saved. Open and print for terminal printer.',
    });
  };

  const handlePrint = () => {
    window.print();
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
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff; }
          .invoice-receipt {
            width: 80mm !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 4mm !important;
            box-shadow: none !important;
            border: none !important;
            background: #fff !important;
          }
        }
      `}</style>
      <div className="no-print flex flex-wrap items-center justify-between gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate(`/orders/${order.id}`)} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Order
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            Print (80mm)
          </Button>
          <Button onClick={generatePDF} className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
      <div
        id="receipt"
        className="invoice-receipt w-[80mm] max-w-full mx-auto bg-white border border-gray-200 rounded shadow-sm p-3 font-mono text-xs print:shadow-none print:border-0"
        style={{ minHeight: '1px' }}
      >
        <div className="text-center font-bold text-sm mb-1">{shop?.name || 'Tailor Shop'}</div>
        {(shop?.phone || shop?.address) && (
          <div className="text-center text-[10px] text-gray-600 mb-1">
            {[shop?.phone, shop?.address].filter(Boolean).join(' · ')}
          </div>
        )}
        <div className="border-t border-dashed border-gray-400 my-2" />
        <div className="text-center font-bold">INVOICE</div>
        <div className="text-center text-[10px] text-gray-600">#{order.id.slice(-6)} · {new Date(order.createdAt).toLocaleDateString()}</div>
        <div className="border-t border-dashed border-gray-400 my-2" />
        <div className="font-bold mb-0.5">Customer</div>
        <div>{customer.name}</div>
        {customer.phone && <div className="text-[10px]">{customer.phone}</div>}
        {customer.address && <div className="text-[10px]">{customer.address}</div>}
        <div className="border-t border-dashed border-gray-400 my-2" />
        <div className="font-bold mb-0.5">Order</div>
        <div className="break-words">{order.description}</div>
        <div className="flex justify-between mt-1">
          <span>Status</span>
          <span>{order.status.replace('_', ' ')}</span>
        </div>
        {order.dueDate && (
          <div className="flex justify-between">
            <span>Due</span>
            <span>{new Date(order.dueDate).toLocaleDateString()}</span>
          </div>
        )}
        <div className="border-t border-dashed border-gray-400 my-2" />
        {payments.length > 0 && (
          <>
            {payments.map((p) => (
              <div key={p.id} className="flex justify-between text-[10px]">
                <span>{new Date(p.createdAt).toLocaleDateString()} {(p.method || '').replace('_', ' ')}</span>
                <span>{p.currency} {p.amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-dashed border-gray-400 my-2" />
          </>
        )}
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>{order.currency} {order.amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Paid</span>
          <span>{order.currency} {totalPaid.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Balance</span>
          <span>{order.currency} {remaining.toFixed(2)}</span>
        </div>
        <div className="border-t border-dashed border-gray-400 mt-2 mb-1" />
        <div className="text-center text-[10px]">Thank you</div>
      </div>
      <p className="no-print text-center text-xs text-muted-foreground mt-4">80mm · Fit for terminal/receipt printer</p>
    </div>
  );
}
