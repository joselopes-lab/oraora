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
