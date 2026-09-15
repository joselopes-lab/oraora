import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hasValidValue(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') {
    return value.trim() !== '';
  }
  if (typeof value === 'object') {
    // If it's a DocumentReference or non-empty object
    return true;
  }
  return Boolean(value);
}

export function isPropertyLinkedToProject(d: any): boolean {
  if (!d) return false;

  // Verify real identifiers in canonical order:
  // 1. builderInfo?.projectId
  if (d.builderInfo && hasValidValue(d.builderInfo.projectId)) {
    return true;
  }

  // 2. projectId
  if (hasValidValue(d.projectId)) {
    return true;
  }

  // 3. empreendimentoId
  if (hasValidValue(d.empreendimentoId)) {
    return true;
  }

  // 4. projectRef
  if (hasValidValue(d.projectRef)) {
    return true;
  }

  // 5. project (legacy real field)
  if (hasValidValue(d.project)) {
    return true;
  }

  // NOTE: builderInfo.projectName alone is NOT a valid real project identifier.

  return false;
}

export type PropertyType = 'empreendimento' | 'avulso';

export function classificarProperty(d: any): PropertyType {
  return isPropertyLinkedToProject(d) ? 'empreendimento' : 'avulso';
}

export function serializeFirestoreData(data: any): any {
  if (data === null || typeof data !== 'object') return data;
  
  if (data.toDate && typeof data.toDate === 'function') {
    return data.toDate().toISOString();
  }

  // Handle plain object Timestamp-like structures (e.g. from previous JSON serialization)
  if (data._seconds !== undefined && data._nanoseconds !== undefined) {
    return new Date(data._seconds * 1000 + data._nanoseconds / 1000000).toISOString();
  }
  
  if (Array.isArray(data)) {
    return data.map(serializeFirestoreData);
  }
  
  const serialized: any = {};
  for (const key in data) {
    serialized[key] = serializeFirestoreData(data[key]);
  }
  return serialized;
}

export function parseSmartCurrency(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  const str = String(value).trim();
  if (!str) return 0;

  // Remove "R$" and spaces
  let cleaned = str.replace(/[R$\s]/g, '');
  
  // Check if it has comma (Brazilian decimal separator)
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    const intPart = parts[0].replace(/\./g, '').replace(/\D/g, '');
    const decPart = (parts[1] || '').replace(/\D/g, '').padEnd(2, '0').slice(0, 2);
    return Number(`${intPart}.${decPart}`);
  } else {
    const digitsOnly = cleaned.replace(/\D/g, '');
    if (!digitsOnly) return 0;
    return Number(digitsOnly);
  }
}

export function formatCurrencyDisplay(value: number | string | undefined): string {
  const num = parseSmartCurrency(value);
  if (isNaN(num) || num === 0) return '';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatCepDisplay(value: string | undefined): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 5) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return digits;
}

export function normalizeCep(value: string | undefined): string {
  if (!value) return '';
  return value.replace(/\D/g, '').slice(0, 8);
}

export function formatPhoneMask(value: string | undefined): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length > 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  } else if (digits.length > 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  } else if (digits.length > 2) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  } else if (digits.length > 0) {
    return `(${digits}`;
  }
  return '';
}

export function normalizePhone(value: string | undefined): string {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

export function formatArea(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return '';
  const num = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (isNaN(num)) {
    const str = String(value).trim();
    if (!str || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'não informado') return '';
    if (str.endsWith('m²')) return str;
    return `${str} m²`;
  }
  if (num === 0) return '';
  const formatted = num.toLocaleString('pt-BR', {
    minimumFractionDigits: num % 1 !== 0 ? 1 : 0,
    maximumFractionDigits: 2,
  });
  return `${formatted} m²`;
}

export function normalizeDate(value: unknown): Date | undefined {
  if (!value) return undefined;

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    try {
      const date = (value as { toDate: () => Date }).toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date : undefined;
    } catch {
      return undefined;
    }
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toMillis' in value &&
    typeof (value as { toMillis?: unknown }).toMillis === 'function'
  ) {
    try {
      const millis = (value as { toMillis: () => number }).toMillis();
      const date = new Date(millis);
      return !Number.isNaN(date.getTime()) ? date : undefined;
    } catch {
      return undefined;
    }
  }

  if (value instanceof Date) {
    return !Number.isNaN(value.getTime()) ? value : undefined;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    typeof (value as { seconds?: unknown }).seconds === 'number'
  ) {
    const date = new Date((value as { seconds: number }).seconds * 1000);
    return !Number.isNaN(date.getTime()) ? date : undefined;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    '_seconds' in value &&
    typeof (value as { _seconds?: unknown })._seconds === 'number'
  ) {
    const date = new Date((value as { _seconds: number })._seconds * 1000);
    return !Number.isNaN(date.getTime()) ? date : undefined;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) ? date : undefined;
  }

  return undefined;
}

