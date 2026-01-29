import type { Debt } from '@/types';
import { formatCurrency } from '@/lib/currency';

/** Normalize phone to WhatsApp intl format (digits only). Ghana: 233 + 9 digits. */
export function toWhatsAppPhone(phone: string | undefined): string | null {
  if (!phone || typeof phone !== 'string') return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9) return null;
  let normalized = digits;
  if (digits.startsWith('0')) {
    normalized = '233' + digits.slice(1);
  } else if (digits.length === 9 && !digits.startsWith('0')) {
    normalized = '233' + digits;
  } else if (digits.startsWith('233') && digits.length >= 12) {
    normalized = digits.slice(0, 12);
  } else if (!digits.startsWith('233') && digits.length >= 9) {
    normalized = '233' + digits.slice(-9);
  }
  return normalized.length >= 12 ? normalized : null;
}

/** Build debt reminder message for WhatsApp. */
export function buildDebtReminderMessage(
  shopName: string,
  customerName: string,
  debts: Debt[]
): string {
  const total = debts.reduce((s, d) => s + d.remainingAmount, 0);
  const currency = debts[0]?.currency ?? 'GHS';
  const lines: string[] = [
    `Hello ${customerName}! 👋`,
    '',
    `Reminder from *${shopName}* — you have an outstanding balance.`,
    '',
    '*Debt breakdown:*',
  ];
  for (const d of debts) {
    lines.push(`• ${d.orderDescription}`);
    lines.push(`  Order #${d.orderId.slice(-6)}: ${formatCurrency(d.originalAmount, d.currency)} total, ${formatCurrency(d.paidAmount, d.currency)} paid, *${formatCurrency(d.remainingAmount, d.currency)}* remaining.`);
  }
  lines.push('');
  lines.push(`*Total outstanding: ${formatCurrency(total, currency)}*`);
  lines.push('');
  lines.push('Please settle at your earliest convenience. Thank you! 🙏');
  return lines.join('\n');
}

/** WhatsApp wa.me URL with pre-filled message. */
export function getWhatsAppUrl(phone: string, message: string): string {
  const p = toWhatsAppPhone(phone);
  if (!p) return '';
  return `https://wa.me/${p}?text=${encodeURIComponent(message)}`;
}
