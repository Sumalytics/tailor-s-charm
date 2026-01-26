import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, Share } from 'lucide-react';
import { Receipt, ReceiptItem } from '@/types';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';

interface ReceiptPrinterProps {
  receipt: Receipt;
  shopInfo: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
  };
}

export function ReceiptPrinter({ receipt, shopInfo }: ReceiptPrinterProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!receiptRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptContent = receiptRef.current.innerHTML;
    const printStyles = `
      <style>
        @page {
          size: 80mm auto;
          margin: 2mm;
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          margin: 0;
          padding: 5px;
          width: 80mm;
        }
        .receipt-header {
          text-align: center;
          margin-bottom: 10px;
        }
        .shop-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .shop-info {
          font-size: 10px;
          margin-bottom: 2px;
        }
        .receipt-divider {
          border-top: 1px dashed #000;
          margin: 10px 0;
        }
        .item-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
          font-size: 11px;
        }
        .item-name {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .item-qty {
          width: 30px;
          text-align: center;
        }
        .item-price {
          width: 50px;
          text-align: right;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          margin-top: 5px;
        }
        .payment-info {
          margin-top: 10px;
          font-size: 11px;
        }
        .footer {
          text-align: center;
          margin-top: 15px;
          font-size: 10px;
        }
        .logo {
          max-width: 40px;
          max-height: 40px;
          margin-bottom: 5px;
        }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receipt.receiptNumber}</title>
          ${printStyles}
        </head>
        <body>
          ${receiptContent}
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

  const handleDownload = () => {
    if (!receiptRef.current) return;

    const receiptContent = receiptRef.current.innerText;
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receipt.receiptNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Receipt Preview */}
      <div className="bg-white border rounded-lg p-4 max-w-[80mm] mx-auto">
        <div ref={receiptRef} className="receipt-content">
          {/* Header */}
          <div className="receipt-header">
            {shopInfo.logoUrl && (
              <img 
                src={shopInfo.logoUrl} 
                alt="Shop Logo" 
                className="logo mx-auto"
              />
            )}
            <div className="shop-name">{shopInfo.name}</div>
            {shopInfo.address && (
              <div className="shop-info">{shopInfo.address}</div>
            )}
            {shopInfo.phone && (
              <div className="shop-info">Tel: {shopInfo.phone}</div>
            )}
            {shopInfo.email && (
              <div className="shop-info">Email: {shopInfo.email}</div>
            )}
          </div>

          <div className="receipt-divider"></div>

          {/* Receipt Info */}
          <div className="text-center mb-3">
            <div className="font-bold">RECEIPT</div>
            <div className="text-xs">No: {receipt.receiptNumber}</div>
            <div className="text-xs">
              Date: {new Date(receipt.createdAt).toLocaleDateString()}
            </div>
            <div className="text-xs">
              Time: {new Date(receipt.createdAt).toLocaleTimeString()}
            </div>
          </div>

          <div className="receipt-divider"></div>

          {/* Customer Info */}
          <div className="mb-3">
            <div className="text-xs font-bold">Customer: {receipt.customerName}</div>
          </div>

          {/* Items */}
          <div className="mb-3">
            {receipt.items.map((item, index) => (
              <div key={index} className="item-row">
                <div className="item-name">{item.description}</div>
                <div className="item-qty">{item.quantity}</div>
                <div className="item-price">
                  {formatCurrency(item.totalPrice, receipt.currency)}
                </div>
              </div>
            ))}
          </div>

          <div className="receipt-divider"></div>

          {/* Totals */}
          <div className="space-y-1">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(receipt.subtotal, receipt.currency)}</span>
            </div>
            <div className="total-row">
              <span>Tax:</span>
              <span>{formatCurrency(receipt.tax, receipt.currency)}</span>
            </div>
            <div className="total-row text-base">
              <span>TOTAL:</span>
              <span>{formatCurrency(receipt.total, receipt.currency)}</span>
            </div>
            <div className="total-row">
              <span>Paid:</span>
              <span>{formatCurrency(receipt.amountPaid, receipt.currency)}</span>
            </div>
            <div className="total-row">
              <span>Balance:</span>
              <span>{formatCurrency(receipt.balance, receipt.currency)}</span>
            </div>
          </div>

          <div className="receipt-divider"></div>

          {/* Payment Info */}
          <div className="payment-info">
            <div className="text-xs">
              Payment Method: {receipt.paymentMethod.replace('_', ' ')}
            </div>
            {receipt.printedAt && (
              <div className="text-xs">
                Printed: {new Date(receipt.printedAt).toLocaleString()}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="footer">
            <div>Thank you for your business!</div>
            <div>Please come again</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-2">
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print Receipt
        </Button>
        <Button onClick={handleDownload} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
}
