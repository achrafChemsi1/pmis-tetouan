// Utility functions for PMIS frontend
import { format, parseISO } from 'date-fns';

export function formatDate(dateStr: string, pattern = 'yyyy-MM-dd'): string {
  try {
    return format(parseISO(dateStr), pattern);
  } catch {
    return '';
  }
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return amount.toLocaleString(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });
}

export function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function truncate(str: string, max = 50): string {
  return str.length > max ? str.slice(0, max - 3) + '...' : str;
}

export function buildUrlParams(params: Record<string, any>): string {
  const search = Object.entries(params)
    .filter(([_, v]) => v != null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return search ? `?${search}` : '';
}

export function saveToLocalStorage(key: string, value: any): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}
