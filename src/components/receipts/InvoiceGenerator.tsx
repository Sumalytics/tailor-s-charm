import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, Download, Send, FileText, Save } from 'lucide-react';
import { Invoice, InvoiceItem, Order, Customer, Currency } from '@/types';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';

interface InvoiceGeneratorProps {
  order: Order;
  customer: Customer;
  shopInfo: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
  };
  onSave?: (invoice: Invoice) => void;
}

export function InvoiceGenerator({ order, customer, shopInfo, onSave }: InvoiceGeneratorProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [taxRate, setTaxRate] = useState(0.15); // 15% tax default
  const [dueDays, setDueDays] = useState(7);
  const [notes, setNotes] = useState('');

  const subtotal = order.totalAmount;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  const balance = total - order.amountPaid;

  const invoiceNumber = `INV-${Date.now()}`;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueDays);

  const invoiceItems: InvoiceItem[] = order.items.map(item => ({
    description: item.description,
    garmentType: item.garmentType,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
  }));

  const handleSaveInvoice = () => {
    const invoice: Invoice = {
      id: '', // Will be set by Firestore
      shopId: order.shopId,
      orderId: order.id,
      invoiceNumber,
      customerName: customer.fullName,
      customerAddress: customer.address,
      items: invoiceItems,
      subtotal,
      tax,
      total,
      amountPaid: order.amountPaid,
      balance,
      currency: order.currency as Currency,
      dueDate,
      status: balance > 0 ? 'SENT' : 'PAID',
      notes: notes || undefined,
      createdAt: new Date(),
      createdBy: '', // Will be set by current user
    };

    onSave?.(invoice);
  };

  const handlePrint = () => {
    if (!invoiceRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const invoiceContent = invoiceRef.current.innerHTML;
    const printStyles = `
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          margin: 0;
          padding: 0;
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          border-bottom: 2px solid #000;
          padding-bottom: 20px;
        }
        .shop-info {
          flex: 1;
        }
        .shop-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .invoice-details {
          text-align: right;
        }
        .invoice-number {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .invoice-info {
          margin-bottom: 5px;
        }
        .billing-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .bill-to, .ship-to {
          flex: 1;
        }
        .section-title {
          font-weight: bold;
          margin-bottom: 10px;
          text-transform: uppercase;
          font-size: 11px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .items-table th {
          background-color: #f5f5f5;
          padding: 10px;
          text-align: left;
          border-bottom: 2px solid #000;
          font-weight: bold;
        }
        .items-table td {
          padding: 10px;
          border-bottom: 1px solid #ddd;
        }
        .items-table .text-right {
          text-align: right;
        }
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 30px;
        }
        .totals-table {
          width: 300px;
        }
        .totals-table td {
          padding: 5px 10px;
        }
        .totals-table .total-row {
          font-weight: bold;
          font-size: 14px;
          border-top: 2px solid #000;
        }
        .notes-section {
          margin-bottom: 20px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 11px;
          color: #666;
        }
        .logo {
          max-width: 100px;
          max-height: 100px;
          margin-bottom: 10px;
        }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoiceNumber}</title>
          ${printStyles}
        </head>
        <body>
          ${invoiceContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="space-y-6">
      {/* Invoice Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Invoice Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                value={taxRate * 100}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) / 100)}
                min="0"
                max="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDays">Due Days</Label>
              <Input
                id="dueDays"
                type="number"
                value={dueDays}
                onChange={(e) => setDueDays(parseInt(e.target.value))}
                min="0"
                max="365"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select defaultValue={balance > 0 ? 'SENT' : 'PAID'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              className="w-full p-2 border rounded-md"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or payment terms..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoice Preview */}
      <div className="bg-white border rounded-lg p-8">
        <div ref={invoiceRef} className="invoice-content">
          {/* Header */}
          <div className="invoice-header">
            <div className="shop-info">
              {shopInfo.logoUrl && (
                <img src={shopInfo.logoUrl} alt="Shop Logo" className="logo" />
              )}
              <div className="shop-name">{shopInfo.name}</div>
              {shopInfo.address && <div>{shopInfo.address}</div>}
              {shopInfo.phone && <div>Tel: {shopInfo.phone}</div>}
              {shopInfo.email && <div>Email: {shopInfo.email}</div>}
            </div>
            <div className="invoice-details">
              <div className="invoice-number">INVOICE</div>
              <div className="invoice-number">{invoiceNumber}</div>
              <div className="invoice-info">
                Date: {new Date().toLocaleDateString()}
              </div>
              <div className="invoice-info">
                Due: {dueDate.toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Billing Information */}
          <div className="billing-section">
            <div className="bill-to">
              <div className="section-title">Bill To</div>
              <div className="font-bold">{customer.fullName}</div>
              {customer.address && <div>{customer.address}</div>}
              {customer.phoneNumber && <div>Tel: {customer.phoneNumber}</div>}
              {customer.email && <div>Email: {customer.email}</div>}
            </div>
            <div className="ship-to">
              <div className="section-title">Order Information</div>
              <div>Order #: {order.orderNumber}</div>
              <div>Order Date: {new Date(order.startDate).toLocaleDateString()}</div>
              <div>Due Date: {new Date(order.dueDate).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Items Table */}
          <table className="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Garment Type</th>
                <th className="text-right">Quantity</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems.map((item, index) => (
                <tr key={index}>
                  <td>{item.description}</td>
                  <td>{item.garmentType}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">
                    {formatCurrency(item.unitPrice, order.currency as Currency)}
                  </td>
                  <td className="text-right">
                    {formatCurrency(item.totalPrice, order.currency as Currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="totals-section">
            <table className="totals-table">
              <tbody>
                <tr>
                  <td>Subtotal:</td>
                  <td className="text-right">
                    {formatCurrency(subtotal, order.currency as Currency)}
                  </td>
                </tr>
                <tr>
                  <td>Tax ({(taxRate * 100).toFixed(1)}%):</td>
                  <td className="text-right">
                    {formatCurrency(tax, order.currency as Currency)}
                  </td>
                </tr>
                <tr className="total-row">
                  <td>Total:</td>
                  <td className="text-right">
                    {formatCurrency(total, order.currency as Currency)}
                  </td>
                </tr>
                <tr>
                  <td>Paid:</td>
                  <td className="text-right">
                    {formatCurrency(order.amountPaid, order.currency as Currency)}
                  </td>
                </tr>
                <tr className="total-row">
                  <td>Balance Due:</td>
                  <td className="text-right">
                    {formatCurrency(balance, order.currency as Currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {notes && (
            <div className="notes-section">
              <div className="section-title">Notes</div>
              <div>{notes}</div>
            </div>
          )}

          {/* Footer */}
          <div className="footer">
            <div>Thank you for your business!</div>
            <div>Payment terms: Net {dueDays} days</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-2">
        <Button onClick={handlePrint} variant="outline">
          <Printer className="h-4 w-4 mr-2" />
          Print Invoice
        </Button>
        <Button onClick={handleSaveInvoice}>
          <Save className="h-4 w-4 mr-2" />
          Save Invoice
        </Button>
      </div>
    </div>
  );
}
