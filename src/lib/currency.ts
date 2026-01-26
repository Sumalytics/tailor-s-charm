import { Currency } from '@/types';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GHS: '₵',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  GHS: 'Ghana Cedis',
  USD: 'US Dollars',
  EUR: 'Euros',
  GBP: 'British Pounds',
};

export const formatCurrency = (
  amount: number,
  currency: Currency = 'GHS',
  locale: string = 'en-GH'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback formatting
    const symbol = CURRENCY_SYMBOLS[currency];
    return `${symbol}${amount.toFixed(2)}`;
  }
};

export const formatCurrencyCompact = (
  amount: number,
  currency: Currency = 'GHS'
): string => {
  const symbol = CURRENCY_SYMBOLS[currency];
  
  if (amount >= 1000000) {
    return `${symbol}${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(1)}K`;
  } else {
    return `${symbol}${amount.toFixed(2)}`;
  }
};

export const parseCurrency = (value: string): number => {
  // Remove currency symbols and commas, then parse as float
  const cleanValue = value.replace(/[₵$€£,]/g, '');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

export const getCurrencySymbol = (currency: Currency): string => {
  return CURRENCY_SYMBOLS[currency];
};

export const getCurrencyName = (currency: Currency): string => {
  return CURRENCY_NAMES[currency];
};
