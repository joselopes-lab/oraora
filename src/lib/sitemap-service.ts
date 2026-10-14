import { adminDb } from '@/firebase/index.server';
import { FieldPath } from 'firebase-admin/firestore';
import { generateSemanticSlug } from '@/lib/slug';

export const SITEMAP_PAGE_SIZE = 1000;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora de cache em memória para cursores e contagens

export function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export function extractDate(data: any): Date {
  const ts = data.updatedAt || data.seo?.lastModifiedAt || data.createdAt;
  if (!ts) return new Date();
  if (typeof ts.toDate === 'function') {
    try {
      return ts.toDate();
    } catch {
      // fallback
    }
  }
  if (ts instanceof Date) return ts;
  if (typeof ts === 'string' || typeof ts === 'number') {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

interface SegmentCache {
  timestamp: number;
  totalCount: number;
  boundaries: string[]; // boundary[0] = id do último doc da pág 1 (cursor para pág 2), etc.
}

let propertiesCache: SegmentCache | null = null;
let projectsCache: SegmentCache | null = null;

/**
 * Obtém informações de segmentação para Properties (imóveis do portal).
 * Utiliza projeção leve (.select()) para mapear os cursores de boundary uma única vez por hora,
 * evitando offset() custoso e permitindo consultas diretas com .startAfter().
 */
export async function getPropertiesSegmentInfo(): Promise<{ totalPages: number; totalCount: number }> {
  const now = Date.now();
  if (propertiesCache && now - propertiesCache.timestamp < CACHE_TTL_MS) {
    return {
      totalPages: Math.ceil(propertiesCache.totalCount / SITEMAP_PAGE_SIZE),
      totalCount: propertiesCache.totalCount,
    };
  }

  try {
    // Projeção leve apenas de IDs ordenados estavelmente por documentId()
    const idSnap = await adminDb
      .collection('properties')
      .where('isVisibleOnSite', '==', true)
      .select()
      .orderBy(FieldPath.documentId(), 'asc')
      .get();

    const totalCount = idSnap.docs.length;
    const boundaries: string[] = [];

    // O último elemento de cada fatia de SITEMAP_PAGE_SIZE vira o cursor da próxima página
    for (let i = SITEMAP_PAGE_SIZE - 1; i < totalCount; i += SITEMAP_PAGE_SIZE) {
      boundaries.push(idSnap.docs[i].id);
    }

    propertiesCache = {
      timestamp: now,
      totalCount,
      boundaries,
    };

    return {
      totalPages: Math.ceil(totalCount / SITEMAP_PAGE_SIZE),
      totalCount,
    };
  } catch (error) {
    console.error('Erro ao calcular segmentos de imóveis:', error);
    // Fallback de contagem via agregação count() caso a projeção falhe
    try {
      const countSnap = await adminDb
        .collection('properties')
        .where('isVisibleOnSite', '==', true)
        .count()
        .get();
      const count = countSnap.data().count;
      return { totalPages: Math.ceil(count / SITEMAP_PAGE_SIZE), totalCount: count };
    } catch {
      return { totalPages: 1, totalCount: 0 };
    }
  }
}

/**
 * Obtém informações de segmentação para Projects (empreendimentos).
 */
export async function getProjectsSegmentInfo(): Promise<{ totalPages: number; totalCount: number }> {
  const now = Date.now();
  if (projectsCache && now - projectsCache.timestamp < CACHE_TTL_MS) {
    return {
      totalPages: Math.ceil(projectsCache.totalCount / SITEMAP_PAGE_SIZE),
      totalCount: projectsCache.totalCount,
    };
  }

  try {
    const idSnap = await adminDb
      .collection('projects')
      .where('isPublished', '==', true)
      .select()
      .orderBy(FieldPath.documentId(), 'asc')
      .get();

    const totalCount = idSnap.docs.length;
    const boundaries: string[] = [];

    for (let i = SITEMAP_PAGE_SIZE - 1; i < totalCount; i += SITEMAP_PAGE_SIZE) {
      boundaries.push(idSnap.docs[i].id);
    }

    projectsCache = {
      timestamp: now,
      totalCount,
      boundaries,
    };

    return {
      totalPages: Math.ceil(totalCount / SITEMAP_PAGE_SIZE),
      totalCount,
    };
  } catch (error) {
    console.error('Erro ao calcular segmentos de empreendimentos:', error);
    try {
      const countSnap = await adminDb
        .collection('projects')
        .where('isPublished', '==', true)
        .count()
        .get();
      const count = countSnap.data().count;
      return { totalPages: Math.ceil(count / SITEMAP_PAGE_SIZE), totalCount: count };
    } catch {
      return { totalPages: 1, totalCount: 0 };
    }
  }
}

/**
 * Busca uma página específica de imóveis com cursor estável garantido (SEM offset()).
 */
export async function getPropertiesPageDocs(pageNum: number) {
  if (pageNum < 1) return [];

  // Garante que o cache de boundaries esteja inicializado
  await getPropertiesSegmentInfo();

  let query = adminDb
    .collection('properties')
    .where('isVisibleOnSite', '==', true)
    .orderBy(FieldPath.documentId(), 'asc');

  if (pageNum > 1 && propertiesCache && propertiesCache.boundaries.length >= pageNum - 1) {
    const cursorId = propertiesCache.boundaries[pageNum - 2];
    query = query.startAfter(cursorId) as any;
  } else if (pageNum > 1) {
    // Caso de contingência sem cursor no cache
    return [];
  }

  const snap = await query.limit(SITEMAP_PAGE_SIZE).get();
  return snap.docs;
}

/**
 * Busca uma página específica de empreendimentos com cursor estável (SEM offset()).
 */
export async function getProjectsPageDocs(pageNum: number) {
  if (pageNum < 1) return [];

  await getProjectsSegmentInfo();

  let query = adminDb
    .collection('projects')
    .where('isPublished', '==', true)
    .orderBy(FieldPath.documentId(), 'asc');

  if (pageNum > 1 && projectsCache && projectsCache.boundaries.length >= pageNum - 1) {
    const cursorId = projectsCache.boundaries[pageNum - 2];
    query = query.startAfter(cursorId) as any;
  } else if (pageNum > 1) {
    return [];
  }

  const snap = await query.limit(SITEMAP_PAGE_SIZE).get();
  return snap.docs;
}
