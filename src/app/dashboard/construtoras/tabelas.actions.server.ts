'use server';

import { adminAuth, adminDb, adminStorage } from '@/firebase/index.server';
import { firebaseConfig } from '@/firebase/config';
import { cookies, headers } from 'next/headers';
import { priceTableRepository, PriceTableItem } from '@/repositories/price-table.repository';
import { revalidatePath } from 'next/cache';

// Utilitário de serialização
function serializeFirestoreData(data: any): any {
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

export async function getAuthenticatedUserContext(idToken?: string) {
  let requesterUid: string | null = null;

  if (idToken) {
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      requesterUid = decoded.uid;
    } catch (e: any) {
      throw new Error(`Token inválido ou expirado: ${e.message}`);
    }
  }

  if (!requesterUid) {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        requesterUid = decoded.uid;
      } catch {}
    }
  }

  if (!requesterUid) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value || cookieStore.get('firebase-auth-token')?.value;
    if (sessionCookie) {
      try {
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        requesterUid = decoded.uid;
      } catch {
        try {
          const decoded = await adminAuth.verifyIdToken(sessionCookie);
          requesterUid = decoded.uid;
        } catch {}
      }
    }
  }

  if (!requesterUid) {
    throw new Error('Usuário não autenticado no servidor.');
  }

  const userDoc = await adminDb.collection('users').doc(requesterUid).get();
  if (!userDoc.exists) {
    throw new Error('Perfil de usuário não encontrado.');
  }

  const userData = userDoc.data();
  return {
    uid: requesterUid,
    userType: userData?.userType, // 'admin' | 'constructor' | 'broker'
    tenantId: userData?.tenantId,
    role: userData?.role,
  };
}

export async function createPriceTableServer(data: {
  idToken: string;
  tenantId?: string;
  constructorId?: string;
  targetType: 'project' | 'property';
  projectId?: string;
  propertyId?: string;
  name: string;
  file?: {
    name: string;
    type: string;
    size: number;
    base64: string;
  };
}) {
  const ctx = await getAuthenticatedUserContext(data.idToken);

  if (ctx.userType !== 'admin' && ctx.userType !== 'constructor') {
    throw new Error('Permissão negada. Apenas administradores ou construtoras podem criar tabelas.');
  }

  const tenantId = ctx.userType === 'admin' && data.tenantId ? data.tenantId : ctx.tenantId;
  const constructorId = ctx.userType === 'admin' && data.constructorId ? data.constructorId : ctx.tenantId;

  if (!tenantId) {
    throw new Error('Construtora não identificada.');
  }

  const targetType = data.targetType || (data.propertyId ? 'property' : 'project');

  if (targetType === 'project') {
    if (!data.projectId) {
      throw new Error('Empreendimento obrigatório.');
    }
    if (data.propertyId) {
      throw new Error('Não é permitido vincular imóvel quando o tipo for empreendimento.');
    }
    const projDoc = await adminDb.collection('projects').doc(data.projectId).get();
    if (!projDoc.exists) {
      throw new Error('Empreendimento não encontrado.');
    }
    const projData = projDoc.data();
    if (projData?.builderId && projData.builderId !== tenantId && projData?.tenantId && projData.tenantId !== tenantId) {
      throw new Error('O empreendimento selecionado pertence a outro tenant.');
    }
  } else if (targetType === 'property') {
    if (!data.propertyId) {
      throw new Error('Imóvel obrigatório.');
    }
    if (data.projectId) {
      throw new Error('Não é permitido vincular empreendimento diretamente quando o tipo for imóvel.');
    }
    const propDoc = await adminDb.collection('properties').doc(data.propertyId).get();
    if (!propDoc.exists) {
      throw new Error('Imóvel não encontrado.');
    }
    const propData = propDoc.data();
    if (propData?.tenantId && propData.tenantId !== tenantId && propData?.builderId && propData.builderId !== tenantId) {
      throw new Error('O imóvel selecionado pertence a outro tenant.');
    }
  } else {
    throw new Error('Tipo de vínculo inválido.');
  }

  const tableRef = adminDb.collection('priceTables').doc();
  const tableId = tableRef.id;

  let sourceFile: any = undefined;
  if (data.file) {
    const ext = data.file.name.split('.').pop()?.toLowerCase();
    const validExts = ['pdf', 'xls', 'xlsx'];
    if (!ext || !validExts.includes(ext)) {
      throw new Error('Formato de arquivo inválido. Apenas PDF, XLS e XLSX são permitidos.');
    }
    const maxBytes = 15 * 1024 * 1024; // 15MB
    if (data.file.size > maxBytes) {
      throw new Error('O arquivo excede o limite máximo de 15MB.');
    }

    const uniqueName = `${Date.now()}_${data.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = `priceTables/${tenantId}/${tableId}/${uniqueName}`;

    try {
      const buffer = Buffer.from(data.file.base64, 'base64');
      const bucket = adminStorage.bucket(firebaseConfig.storageBucket);
      const fileRef = bucket.file(storagePath);
      await fileRef.save(buffer, {
        metadata: {
          contentType: data.file.type || 'application/octet-stream',
        },
      });

      sourceFile = {
        fileName: data.file.name,
        storagePath,
        mimeType: data.file.type || 'application/octet-stream',
        size: data.file.size,
      };
    } catch (err: any) {
      throw new Error(`Erro ao fazer upload do arquivo: ${err.message}`);
    }
  }

  try {
    await priceTableRepository.createTable({
      tenantId: tenantId,
      constructorId: constructorId,
      targetType,
      projectId: targetType === 'project' ? data.projectId : undefined,
      propertyId: targetType === 'property' ? data.propertyId : undefined,
      name: data.name,
      createdBy: ctx.uid,
      sourceFile,
    });

    revalidatePath('/dashboard/construtoras');
    revalidatePath('/dashboard/admin/tabelas');
    return { success: true, tableId };
  } catch (err) {
    if (sourceFile?.storagePath) {
      try {
        const bucket = adminStorage.bucket(firebaseConfig.storageBucket);
        await bucket.file(sourceFile.storagePath).delete();
      } catch {}
    }
    throw err;
  }
}

export async function getConstructorTableFormDataServer(idToken?: string) {
  const ctx = await getAuthenticatedUserContext(idToken);
  if (ctx.userType !== 'constructor') {
    throw new Error('Acesso negado. Apenas construtoras podem acessar esta área.');
  }
  const constructorId = ctx.tenantId;
  if (!constructorId) throw new Error('Construtora não identificada.');

  let projects: any[] = [];
  let properties: any[] = [];
  let priceTables: any[] = [];

  // 1. PROJECTS
  try {
    const projectsSnap = await adminDb.collection('projects').where('builderId', '==', constructorId).get();
    projects = serializeFirestoreData(projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    console.log('[CONSTRUCTOR TABLES DEBUG] PROJECTS QUERY:', {
      constructorId,
      collection: 'projects',
      fieldUsed: 'builderId',
      quantidade: projects.length,
      projetos: projects.map(p => ({
        id: p.id,
        nome: p.nome || p.name || 'Sem nome',
        builderId: p.builderId
      }))
    });
  } catch (err: any) {
    console.error('[CONSTRUCTOR TABLES DEBUG] PROJECTS QUERY ERRO:', {
      constructorId,
      collection: 'projects',
      fieldUsed: 'builderId',
      error: err.message,
      code: err.code,
      fullError: err.toString()
    });
  }

  // 2. PROPERTIES
  try {
    const propsSnap = await adminDb.collection('properties').where('builderId', '==', constructorId).get();
    properties = serializeFirestoreData(propsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    console.log('[CONSTRUCTOR TABLES DEBUG] PROPERTIES QUERY:', {
      constructorId,
      collection: 'properties',
      where: 'builderId == ' + constructorId,
      quantidade: properties.length,
      status: 'SUCESSO'
    });
  } catch (err: any) {
    console.error('[CONSTRUCTOR TABLES DEBUG] PROPERTIES QUERY ERRO:', {
      constructorId,
      collection: 'properties',
      where: 'builderId == ' + constructorId,
      error: err.message,
      code: err.code,
      fullError: err.toString()
    });
  }

  // 3. PRICE TABLES
  try {
    const tablesSnap = await adminDb.collection('priceTables').where('tenantId', '==', constructorId).orderBy('createdAt', 'desc').get();
    priceTables = serializeFirestoreData(tablesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    console.log('[CONSTRUCTOR TABLES DEBUG] PRICE TABLES QUERY:', {
      constructorId,
      collection: 'priceTables',
      where: 'tenantId == ' + constructorId,
      orderBy: 'createdAt desc',
      quantidade: priceTables.length,
      status: 'SUCESSO'
    });
  } catch (err: any) {
    console.error('[CONSTRUCTOR TABLES DEBUG] PRICE TABLES QUERY ERRO:', {
      constructorId,
      collection: 'priceTables',
      where: 'tenantId == ' + constructorId,
      orderBy: 'createdAt desc',
      error: err.message,
      code: err.code,
      fullError: err.toString()
    });
  }

  return {
    priceTables,
    projects,
    properties
  };
}

export async function publishPriceTableVersionServer(data: {
  priceTableId: string;
  validFrom: string;
  items: Array<{
    propertyId: string;
    unidade?: string;
    numero?: string;
    torre?: string;
    bloco?: string;
    andar?: string;
    area?: number;
    price: number;
    status?: string;
  }>;
}) {
  const ctx = await getAuthenticatedUserContext();

  const table = await priceTableRepository.getTable(data.priceTableId);
  if (!table) {
    throw new Error('Tabela de preços não encontrada.');
  }

  if (ctx.userType !== 'admin' && ctx.userType !== 'constructor') {
    throw new Error('Permissão negada.');
  }

  if (ctx.userType === 'constructor') {
    if (!ctx.tenantId || ctx.tenantId !== table.tenantId) {
      throw new Error('Permissão negada para este tenant.');
    }
    const constDoc = await adminDb.collection('constructors').doc(table.constructorId).get();
    const constData = constDoc.data();
    const members = constData?.members || [];
    const member = members.find((m: any) => m.uid === ctx.uid);
    if (!member || (member.role !== 'admin' && member.role !== 'gerente')) {
      throw new Error('Permissão negada. Apenas admin ou gerente podem publicar versões.');
    }
  }

  // Get existing versions to determine versionNumber and previousMinPrice
  const existingVersions = await priceTableRepository.listVersions(data.priceTableId);
  const versionNumber = existingVersions.length > 0 ? existingVersions[0].versionNumber + 1 : 1;
  const previousVersion = existingVersions.length > 0 ? existingVersions[0] : null;
  const previousMinPrice = previousVersion ? previousVersion.minPrice : null;

  // Process items: calculate pricePerSquareMeter, validate prices
  let minPrice = Infinity;
  let minPricePropertyId = '';
  let maxPrice = -Infinity;
  let totalPrice = 0;
  let validPriceCount = 0;
  let totalPricePerSqM = 0;
  let validSqMCount = 0;

  const processedItems: PriceTableItem[] = data.items.map(item => {
    const price = Number(item.price) || 0;
    const area = Number(item.area) || 0;
    let pricePerSquareMeter: number | undefined = undefined;

    if (price > 0 && area > 0) {
      pricePerSquareMeter = Number((price / area).toFixed(2));
      totalPricePerSqM += pricePerSquareMeter;
      validSqMCount++;
    }

    if (price > 0) {
      if (price < minPrice) {
        minPrice = price;
        minPricePropertyId = item.propertyId;
      }
      if (price > maxPrice) {
        maxPrice = price;
      }
      totalPrice += price;
      validPriceCount++;
    }

    return {
      propertyId: item.propertyId,
      unidade: item.unidade,
      numero: item.numero,
      torre: item.torre,
      bloco: item.bloco,
      andar: item.andar,
      area: item.area || undefined,
      price,
      pricePerSquareMeter,
      status: item.status || 'Disponível',
    };
  });

  if (minPrice === Infinity) {
    minPrice = 0;
    minPricePropertyId = data.items[0]?.propertyId || '';
  }
  if (maxPrice === -Infinity) maxPrice = 0;

  const avgPrice = validPriceCount > 0 ? Number((totalPrice / validPriceCount).toFixed(2)) : 0;
  const avgPricePerSquareMeter = validSqMCount > 0 ? Number((totalPricePerSqM / validSqMCount).toFixed(2)) : 0;

  let variationAmount: number | null = null;
  let variationPercent: number | null = null;

  if (previousMinPrice !== null && previousMinPrice > 0 && minPrice > 0) {
    variationAmount = Number((minPrice - previousMinPrice).toFixed(2));
    variationPercent = Number((((minPrice - previousMinPrice) / previousMinPrice) * 100).toFixed(2));
  }

  const newVersionId = await priceTableRepository.createVersion(data.priceTableId, {
    priceTableId: data.priceTableId,
    versionNumber,
    validFrom: data.validFrom || new Date().toISOString(),
    minPrice,
    minPricePropertyId,
    maxPrice,
    avgPrice,
    avgPricePerSquareMeter,
    previousMinPrice,
    variationAmount,
    variationPercent,
    createdBy: ctx.uid,
    items: processedItems,
  });

  revalidatePath('/dashboard/construtoras');
  revalidatePath('/dashboard/admin/tabelas');
  return { success: true, versionId: newVersionId, versionNumber };
}

function serializePriceTable(doc: any) {
  const d = doc.data ? doc.data() : doc;
  const id = doc.id ? doc.id : d.id;
  
  let serializedSourceFile = null;
  if (d.sourceFile) {
    const sf = d.sourceFile;
    serializedSourceFile = {
      fileName: sf.fileName || '',
      storagePath: sf.storagePath || '',
      mimeType: sf.mimeType || '',
      size: sf.size ?? null,
      uploadedAt: sf.uploadedAt?.toDate ? sf.uploadedAt.toDate().toISOString() : (sf.uploadedAt || null),
    };
  }

  return {
    id: id,
    tenantId: d.tenantId || '',
    constructorId: d.constructorId || '',
    propertyId: d.propertyId || '',
    name: d.name || '',
    status: d.status || 'active',
    currentVersionId: d.currentVersionId || '',
    minPrice: d.minPrice ?? null,
    minPricePropertyId: d.minPricePropertyId || '',
    createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (d.createdAt || null),
    updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : (d.updatedAt || null),
    createdBy: d.createdBy || '',
    sourceFile: serializedSourceFile,
  };
}

export async function getBrokerPriceTablesAction(data?: { idToken?: string }) {
  const ctx = await getAuthenticatedUserContext(data?.idToken);
  if (!ctx.uid) {
    throw new Error('Usuário não autenticado.');
  }

  const brokerId = ctx.uid;
  const propertyIdsSet = new Set<string>();

  // 1. brokerProperties where brokerId == brokerId and inPortfolio == true
  const bpSnap = await adminDb.collection('brokerProperties')
    .where('brokerId', '==', brokerId)
    .where('inPortfolio', '==', true)
    .get();
  bpSnap.forEach(doc => {
    propertyIdsSet.add(doc.id);
  });

  // 2. portfolios/{brokerId}
  const portfolioDoc = await adminDb.collection('portfolios').doc(brokerId).get();
  if (portfolioDoc.exists) {
    const pData = portfolioDoc.data();
    const pIds = pData?.propertyIds || [];
    pIds.forEach((id: string) => propertyIdsSet.add(id));
  }

  const propertyIds = Array.from(propertyIdsSet);
  console.log('[PRICE TABLE BROKER DEBUG] AUTHORIZED PROPERTY IDS', {
    brokerId: ctx.uid,
    propertyIdsCount: propertyIds.length,
    propertyIds
  });
  if (propertyIds.length === 0) {
    console.log('[PRICE TABLE BROKER DEBUG] NO AUTHORIZED PROPERTY IDS FOUND');
    return { tables: [] };
  }

  const tables = await priceTableRepository.getTablesByPropertyIds(propertyIds);
  console.log('[PRICE TABLE BROKER DEBUG] TABLES FOUND IN COLLECTION', {
    count: tables.length,
    tables: tables.map(t => ({
      tableId: t.id,
      propertyId: t.propertyId,
      tenantId: t.tenantId,
      hasSourceFile: !!t.sourceFile,
      hasStoragePath: !!t.sourceFile?.storagePath
    }))
  });

  const enhancedTables = [];

  for (const table of tables) {
    if (table.status === 'archived') {
       console.log('[PRICE TABLE BROKER DEBUG] TABLE_SKIPPED', { tableId: table.id, reason: 'ARCHIVED' });
       continue;
    }
    
    // Validate Authorization again for the specific propertyId
    if (!propertyIds.includes(table.propertyId)) {
        console.log('[PRICE TABLE BROKER DEBUG] TABLE_SKIPPED', { tableId: table.id, propertyId: table.propertyId, reason: 'PROPERTY_NOT_AUTHORIZED' });
        continue;
    }

    if (!table.sourceFile?.storagePath) {
        console.log('[PRICE TABLE BROKER DEBUG] TABLE_SKIPPED', { tableId: table.id, reason: 'NO_STORAGE_PATH' });
        continue;
    }

    const currentVersion = table.currentVersionId ? await priceTableRepository.getCurrentVersion(table.id, table.currentVersionId) : null;
    
    // Serializar a tabela
    const serializedTable = serializePriceTable(table);

    let constructorName = 'Construtora Parceira';
    if (table.constructorId) {
      const constDoc = await adminDb.collection('constructors').doc(table.constructorId).get();
      if (constDoc.exists) {
        constructorName = constDoc.data()?.name || constructorName;
      }
    }

    let propertyName = 'Imóvel / Empreendimento';
    if (table.propertyId) {
      const propDoc = await adminDb.collection('properties').doc(table.propertyId).get();
      if (propDoc.exists) {
        const propData = propDoc.data();
        propertyName = propData?.informacoesbasicas?.nome || propData?.basicInfo?.name || propertyName;
      }
    }

    enhancedTables.push({
      table: serializedTable,
      currentVersion,
      constructorName,
      propertyName,
    });
  }

  return { tables: enhancedTables };
}

export async function getPriceTablesAdminServer(data?: { idToken?: string }) {
  console.log('[PRICE TABLES ADMIN] AUTH_SUCCESS');
  console.log('[PRICE TABLES ADMIN] FETCH_START');
  try {
    const ctx = await getAuthenticatedUserContext(data?.idToken);

    if (ctx.userType !== 'admin') {
      throw new Error('Permissão negada. Apenas administradores podem listar todas as tabelas de preços.');
    }

    const snap = await adminDb.collection('priceTables').get();
    const tables = snap.docs.map(doc => serializePriceTable(doc));

    console.log('[PRICE TABLES ADMIN] FETCH_SUCCESS', { count: tables.length });
    return { tables };
  } catch (err: any) {
    console.error('[PRICE TABLES ADMIN] FETCH_ERROR', err);
    throw err;
  }
}

export async function getPriceTableVersionsAdminServer(data?: { tableId?: string; idToken?: string }) {
  console.log('[PRICE TABLE VERSIONS ADMIN] FETCH_START', { tableId: data?.tableId });
  try {
    const ctx = await getAuthenticatedUserContext(data?.idToken);

    if (ctx.userType !== 'admin') {
      return { success: false, versions: [], error: 'Permissão negada. Apenas administradores podem listar versões de tabelas.' };
    }

    if (!data?.tableId) {
      return { success: false, versions: [], error: 'ID da tabela não informado.' };
    }

    const tableRef = adminDb.collection('priceTables').doc(data.tableId);
    const tableDoc = await tableRef.get();
    if (!tableDoc.exists) {
      return { success: false, versions: [], error: 'Tabela não encontrada' };
    }

    const versionsSnap = await tableRef.collection('versions').get();
    const versions = versionsSnap.docs.map(doc => {
      const d = doc.data();
      let serializedSourceFile = null;
      if (d.sourceFile) {
        const sf = d.sourceFile;
        serializedSourceFile = {
          fileName: sf.fileName || '',
          storagePath: sf.storagePath || '',
          mimeType: sf.mimeType || '',
          size: sf.size ?? null,
          uploadedAt: sf.uploadedAt?.toDate ? sf.uploadedAt.toDate().toISOString() : (sf.uploadedAt || null),
        };
      }

      return {
        id: doc.id,
        versionNumber: d.versionNumber ?? 1,
        validFrom: d.validFrom?.toDate ? d.validFrom.toDate().toISOString() : (d.validFrom || null),
        minPrice: d.minPrice ?? null,
        maxPrice: d.maxPrice ?? null,
        avgPrice: d.avgPrice ?? null,
        variationAmount: d.variationAmount ?? null,
        variationPercent: d.variationPercent ?? null,
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (d.createdAt || null),
        updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : (d.updatedAt || null),
        createdBy: d.createdBy || '',
        sourceFile: serializedSourceFile,
        items: Array.isArray(d.items) ? d.items : [],
      };
    });

    // Ordenar por versionNumber crescente
    versions.sort((a, b) => (a.versionNumber || 0) - (b.versionNumber || 0));

    console.log('[PRICE TABLE VERSIONS ADMIN] FETCH_SUCCESS', { tableId: data.tableId, count: versions.length });
    return { success: true, versions };
  } catch (err: any) {
    console.error('[PRICE TABLE VERSIONS ADMIN] FETCH_ERROR', err);
    return { success: false, versions: [], error: err?.message || 'Erro ao buscar versões' };
  }
}

export async function getPriceTablePdfUrlServer(data?: { priceTableId?: string; idToken?: string }) {
  console.log('[PDF SERVER ACTION START]', {
    receivedData: data,
    tableIdProvided: !!data?.priceTableId,
    tableIdValue: data?.priceTableId
  });
  try {
    const ctx = await getAuthenticatedUserContext(data?.idToken);

    if (!data?.priceTableId) {
      console.log('[PRICE TABLE PDF DEBUG] ERROR: No priceTableId provided');
      return { success: false, url: null, error: 'ID da tabela não informado.' };
    }

    const tableRef = adminDb.collection('priceTables').doc(data.priceTableId);
    const tableDoc = await tableRef.get();
    if (!tableDoc.exists) {
      console.log('[PRICE TABLE PDF DEBUG] ERROR: Table not found', { tableId: data.priceTableId });
      return { success: false, url: null, error: 'Tabela não encontrada.' };
    }

    const tableData = tableDoc.data();
    const sourceFile = tableData?.sourceFile;

    if (!sourceFile || !sourceFile.storagePath) {
      return { success: false, url: null, error: 'Esta tabela não possui um arquivo associado.' };
    }

    const mimeType = (sourceFile.mimeType || '').toLowerCase();
    const fileName = (sourceFile.fileName || '').toLowerCase();
    const storagePath = (sourceFile.storagePath || '').toLowerCase();
    const isPdf = mimeType.includes('pdf') || fileName.endsWith('.pdf') || storagePath.endsWith('.pdf') || true;

    if (!isPdf) {
      return { success: false, url: null, error: 'Esta tabela não possui um arquivo PDF disponível.' };
    }

    // Authorization check
    if (ctx.userType !== 'admin') {
      const propertyId = tableData?.propertyId;
      if (!propertyId) {
        return { success: false, url: null, error: 'Você não possui acesso a esta tabela.' };
      }

      let isAuthorized = false;

      // Check brokerProperties where brokerId == ctx.uid and propertyId == propertyId and inPortfolio == true
      const bpSnap = await adminDb.collection('brokerProperties')
        .where('brokerId', '==', ctx.uid)
        .where('propertyId', '==', propertyId)
        .where('inPortfolio', '==', true)
        .limit(1)
        .get();

      if (!bpSnap.empty) {
        isAuthorized = true;
      } else {
        // Check portfolios/{ctx.uid} propertyIds array
        const portfolioDoc = await adminDb.collection('portfolios').doc(ctx.uid).get();
        if (portfolioDoc.exists) {
          const pData = portfolioDoc.data();
          const propertyIds = pData?.propertyIds || [];
          if (Array.isArray(propertyIds) && propertyIds.includes(propertyId)) {
            isAuthorized = true;
          }
        }
      }

      if (!isAuthorized) {
        // Constructor check: allows if the constructor is the owner of the table
        if (ctx.userType === 'constructor' && tableData?.tenantId === ctx.tenantId) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        return { success: false, url: null, error: 'Você não possui acesso a esta tabela.' };
      }
    }

    // Generate signed URL via adminStorage bucket
    const bucket = adminStorage.bucket();
    const file = bucket.file(sourceFile.storagePath);
    
    const [exists] = await file.exists();
    if (!exists) {
      return { success: false, url: null, error: 'Arquivo PDF não encontrado no Storage.' };
    }

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      responseDisposition: 'inline',
      responseType: 'application/pdf',
    });

    console.log('[PRICE TABLE PDF URL] SUCCESS', { tableId: data.tableId });
    return { success: true, url };
  } catch (err: any) {
    console.error('[PRICE TABLE PDF URL] ERROR', err);
    return { success: false, url: null, error: err?.message || 'Erro ao gerar URL do PDF' };
  }
}

export async function deletePriceTableAdminServer(data?: { tableId?: string; idToken?: string }) {
  console.log('[PRICE TABLE DELETE ADMIN] START', { tableId: data?.tableId });
  try {
    const ctx = await getAuthenticatedUserContext(data?.idToken);

    if (ctx.userType !== 'admin') {
      return { success: false, error: 'Acesso não autorizado. Apenas administradores podem excluir tabelas.' };
    }

    if (!data?.tableId) {
      return { success: false, error: 'ID da tabela não informado.' };
    }

    const tableRef = adminDb.collection('priceTables').doc(data.tableId);
    const tableDoc = await tableRef.get();
    if (!tableDoc.exists) {
      return { success: false, error: 'Tabela não encontrada.' };
    }

    const tableData = tableDoc.data();
    const storagePath = tableData?.sourceFile?.storagePath;

    // 1. Delete all versions in subcollection
    const versionsSnap = await tableRef.collection('versions').get();
    const batchSize = 400;
    let batch = adminDb.batch();
    let count = 0;

    for (const vDoc of versionsSnap.docs) {
      batch.delete(vDoc.ref);
      count++;
      if (count >= batchSize) {
        await batch.commit();
        batch = adminDb.batch();
        count = 0;
      }
    }
    if (count > 0) {
      await batch.commit();
    }

    // 2. Delete file from Storage if storagePath exists
    if (storagePath) {
      try {
        const bucket = adminStorage.bucket();
        const file = bucket.file(storagePath);
        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          console.log('[PRICE TABLE DELETE ADMIN] STORAGE_FILE_DELETED', { storagePath });
        }
      } catch (storageErr) {
        console.warn('[PRICE TABLE DELETE ADMIN] STORAGE_DELETE_WARNING', storageErr);
      }
    }

    // 3. Delete priceTable document
    await tableRef.delete();

    console.log('[PRICE TABLE DELETE ADMIN] SUCCESS', { tableId: data.tableId });
    return { success: true };
  } catch (err: any) {
    console.error('[PRICE TABLE DELETE ADMIN] ERROR', err);
    return { success: false, error: err?.message || 'Erro ao excluir tabela de preços.' };
  }
}


