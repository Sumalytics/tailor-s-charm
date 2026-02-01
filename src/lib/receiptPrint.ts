import type { Payment, Shop } from '@/types';
import { formatCurrency } from '@/lib/currency';

const RECEIPT_MM = 80;
const methodLabels: Record<string, string> = {
  CASH: 'Cash',
  MOBILE_MONEY: 'Mobile Money',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank Transfer',
  OTHER: 'Other',
};

/**
 * Open a print window with an 80mm receipt for payment.
 * User selects their USB or Bluetooth thermal printer in the system print dialog.
 */
export function printPaymentReceipt(
  payment: Payment,
  customerName: string,
  shop: Shop | null,
  orderDescription?: string
): void {
  const date = payment.createdAt
    ? new Date(payment.createdAt).toLocaleString()
    : new Date().toLocaleString();
  const method = methodLabels[payment.method] || payment.method || 'Other';
  const isRefund = payment.type === 'REFUND';
  const amountStr = formatCurrency(payment.amount, payment.currency);
  const esc = (s: string) => String(s ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt #${esc(payment.id.slice(-6))}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      margin: 0;
      padding: 4mm;
      font-size: 11px;
      width: ${RECEIPT_MM}mm;
      max-width: 100%;
      background: #fff;
    }
    .r { width: ${RECEIPT_MM}mm; max-width: 100%; margin: 0 auto; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .mt1 { margin-top: 2mm; }
    .mt2 { margin-top: 4mm; }
    .mb1 { margin-bottom: 2mm; }
    hr { border: none; border-top: 1px dashed #333; margin: 3mm 0; }
    .row { display: flex; justify-content: space-between; gap: 4mm; }
    @media print {
      body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: ${RECEIPT_MM}mm auto; margin: 2mm; }
    }
  </style>
</head>
<body>
  <div class="r">
    <div class="center bold mb1">${esc(shop?.name || 'Tailor Shop')}</div>
    ${shop?.phone ? `<div class="center" style="font-size:10px">${esc(String(shop.phone))}</div>` : ''}
    ${shop?.address ? `<div class="center" style="font-size:10px">${esc(String(shop.address))}</div>` : ''}
    <hr class="mt1" />
    <div class="center bold mt1">${isRefund ? 'REFUND RECEIPT' : 'PAYMENT RECEIPT'}</div>
    <div class="center" style="font-size:10px">#${esc(payment.id.slice(-6))}</div>
    <div class="center" style="font-size:10px">${esc(date)}</div>
    <hr class="mt1" />
    <div class="bold mt2">Customer</div>
    <div>${esc(customerName)}</div>
    <hr class="mt1" />
    ${payment.orderId ? `
    <div class="bold">Order</div>
    <div style="font-size:10px">#${esc(payment.orderId.slice(-6))}</div>
    ${orderDescription ? `<div style="font-size:10px">${esc(orderDescription)}</div>` : ''}
    <hr class="mt1" />
    ` : ''}
    <div class="row"><span>Method</span><span>${esc(method)}</span></div>
    <div class="row mt1 bold"><span>Amount</span><span>${isRefund ? '-' : ''}${esc(amountStr)}</span></div>
    <hr class="mt2" />
    <div class="center mt2" style="font-size:10px">Thank you for your business!</div>
  </div>
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=300,height=400');
  if (!w) {
    throw new Error('Popup blocked. Please allow popups for this site to print receipts.');
  }
  w.document.write(html);
  w.document.close();
}
