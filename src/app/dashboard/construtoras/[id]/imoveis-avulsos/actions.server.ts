'use server';

import { adminDb } from '@/firebase/index.server';
import { getAuthenticatedUserContext } from '@/app/dashboard/construtoras/tabelas.actions.server';
import { isPropertyLinkedToProject } from '@/lib/utils';

export async function listProperties(constructorId: string, idToken?: string) {
  const ctx = await getAuthenticatedUserContext(idToken);
  
  // Auth validation: Check for constructor, construtora, or admin
  if (ctx.userType !== 'constructor' && ctx.userType !== 'construtora' && ctx.userType !== 'admin') {
    throw new Error('Unauthorized');
  }
  
  // Authorization: Ensure the requester belongs to the requested constructor if not admin
  if (ctx.userType !== 'admin' && ctx.tenantId !== constructorId) {
    throw new Error('Unauthorized');
  }

  const snapshot = await adminDb.collection("properties")
    .where("builderId", "==", constructorId)
    .get();
    
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.informacoesbasicas?.nome || data.title || data.name || 'Sem nome',
      code: data.id ? data.id.substring(0, 6).toUpperCase() : doc.id.substring(0, 6).toUpperCase(),
      availableToNetwork: !!data.availableToNetwork,
      projectId: data.projectId || null,
      midia: data.midia || [],
      localizacao: data.localizacao || {},
      valores: data.valores || {},
      _rawData: data // Mantendo raw para validação de filtro
    };
  }).filter((p: any) => !isPropertyLinkedToProject(p._rawData)).map(({ _rawData, ...rest }) => rest); 
}

export async function togglePropertyAvailability(propertyId: string, available: boolean, idToken?: string) {
  const ctx = await getAuthenticatedUserContext(idToken);
  
  // Auth validation
  if (ctx.userType !== 'constructor' && ctx.userType !== 'construtora' && ctx.userType !== 'admin') {
    throw new Error('Unauthorized');
  }

  const propertyRef = adminDb.collection("properties").doc(propertyId);
  const propertyDoc = await propertyRef.get();
  
  if (!propertyDoc.exists) {
    throw new Error("Property not found");
  }
  
  const propertyData = propertyDoc.data();
  
  // Authorization: Ensure the property belongs to the constructor if not admin (can also support tenantId)
  const isOwner = propertyData?.builderId === ctx.tenantId || propertyData?.tenantId === ctx.tenantId;
  if (ctx.userType !== 'admin' && !isOwner) {
    throw new Error("Unauthorized access");
  }

  await propertyRef.update({ availableToNetwork: available });
  return { success: true };
}

export async function debugAuditProperties(tenantId: string) {
    const snap = await adminDb.collection('properties')
        .where('tenantId', '==', tenantId)
        .limit(5)
        .get();
    
    return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}
