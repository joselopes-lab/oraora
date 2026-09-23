'use server';

import { adminAuth, adminDb } from '@/firebase/index.server';
import { projectRepository } from '@/repositories/project.repository';
import { propertyRepository } from '@/repositories/property.repository';
import { cookies, headers } from 'next/headers';
import { serializeFirestoreData } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

export async function getAuthenticatedUserContext(idToken?: string) {
  let requesterUid: string | null = null;
  let decoded: any = null;

  // 1. Try to get token from provided idToken
  if (idToken) {
    try {
      decoded = await adminAuth.verifyIdToken(idToken);
      requesterUid = decoded.uid;
    } catch (e: any) {
      console.warn('Falha ao verificar ID token fornecido:', e);
    }
  }

  // 2. Try to get token from header
  if (!requesterUid) {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        decoded = await adminAuth.verifyIdToken(token);
        requesterUid = decoded.uid;
      } catch (e) {
        console.warn('Falha ao verificar ID token do header:', e);
      }
    }
  }

  // 3. Fallback to cookies
  if (!requesterUid) {
    const cookieStore = await cookies();
    // Check all possible cookie names used across the app
    const sessionCookie = cookieStore.get('session')?.value || 
                          cookieStore.get('firebase-auth-token')?.value ||
                          cookieStore.get('token')?.value ||
                          cookieStore.get('auth-token')?.value;

    if (sessionCookie) {
      try {
        decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        requesterUid = decoded.uid;
      } catch {
        try {
          decoded = await adminAuth.verifyIdToken(sessionCookie);
          requesterUid = decoded.uid;
        } catch (e) {
          console.warn('Falha ao verificar token de sessão ou ID token:', e);
        }
      }
    }

    // Also check if any other cookie stores the UID directly or if we can look up by custom session (if any)
    if (!requesterUid) {
      // If we still don't have requesterUid, check if there's any cookie containing a firebase auth token
      const allCookies = cookieStore.getAll();
      for (const cookie of allCookies) {
        if (cookie.name.includes('firebase') || cookie.name.includes('auth') || cookie.name.includes('session')) {
          try {
            decoded = await adminAuth.verifyIdToken(cookie.value);
            requesterUid = decoded.uid;
            if (requesterUid) break;
          } catch {}
        }
      }
    }
  }

  if (!requesterUid) {
    throw new Error('Usuário não autenticado no servidor.');
  }

  // 4. Get user document
  const userDoc = await adminDb.collection('users').doc(requesterUid).get();
  if (!userDoc.exists) {
    throw new Error('Perfil de usuário não encontrado.');
  }

  const userData = userDoc.data();
  return {
    uid: requesterUid,
    userType: userData?.userType,
    tenantId: userData?.tenantId,
  };
}

export async function getAllProjectsServer(idToken?: string) {
  try {
    const ctx = await getAuthenticatedUserContext(idToken);
    const projects = await projectRepository.listAll();
    return { success: true, projects: serializeFirestoreData(projects) };
  } catch (e: any) {
    console.error('Erro ao listar todos os projetos no servidor:', e);
    return { success: false, projects: [], error: e?.message || 'Erro ao carregar projetos.' };
  }
}

export async function getProjectsServer(idToken?: string) {
  const ctx = await getAuthenticatedUserContext(idToken);
  if (ctx.userType !== 'constructor') throw new Error('Acesso negado.');
  
  if (!ctx.tenantId) {
    console.error('Usuário do tipo constructor sem tenantId:', ctx.uid);
    throw new Error('Construtora não configurada corretamente.');
  }
  
  const projects = await projectRepository.listByBuilderId(ctx.tenantId);
  return serializeFirestoreData(projects);
}

export async function createProjectServer(data: { name: string; localizacao: any; idToken?: string }) {
  const ctx = await getAuthenticatedUserContext(data.idToken);
  if (ctx.userType !== 'constructor') throw new Error('Acesso negado.');

  if (!ctx.tenantId) {
    throw new Error('Construtora não configurada corretamente.');
  }

  const projectId = await projectRepository.create({
    builderId: ctx.tenantId,
    name: data.name,
    localizacao: data.localizacao,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath('/dashboard/construtoras/empreendimentos');
  return { success: true, projectId };
}

export async function updateProjectFullServer(projectId: string, data: {
  name: string;
  status?: string;
  standard?: string;
  vgvEstimado?: number;
  percentualObra?: number;
  dataEntregaEstimada?: string;
  descricaoCurta?: string;
  descricaoCompleta?: string;
  localizacao?: {
    estado: string;
    cidade: string;
    bairro: string;
    address?: string;
    cep?: string;
  };
  idToken?: string;
}) {
  const ctx = await getAuthenticatedUserContext(data.idToken);
  if (ctx.userType !== 'admin' && ctx.userType !== 'constructor') {
    throw new Error('Acesso negado.');
  }

  const project = await projectRepository.getById(projectId);
  if (!project) {
    throw new Error('Empreendimento não encontrado.');
  }

  if (ctx.userType === 'constructor' && project.builderId !== ctx.tenantId) {
    throw new Error('Empreendimento não pertence à construtora logada.');
  }

  await projectRepository.update(projectId, {
    name: data.name,
    status: data.status,
    standard: data.standard,
    vgvEstimado: data.vgvEstimado,
    percentualObra: data.percentualObra,
    dataEntregaEstimada: data.dataEntregaEstimada,
    descricaoCurta: data.descricaoCurta,
    descricaoCompleta: data.descricaoCompleta,
    localizacao: data.localizacao,
  });

  revalidatePath(`/dashboard/construtoras/empreendimentos/${projectId}`);
  revalidatePath('/dashboard/construtoras/empreendimentos');
  return { success: true };
}

export async function updateProjectCharacteristicsServer(projectId: string, data: {
  numTorres?: number;
  numUnidades?: number;
  numPavimentos?: number;
  numElevadores?: number;
  areaTerreno?: number;
  tipologiasResidenciais?: string[];
  areaMinima?: number;
  areaMaxima?: number;
  numQuartos?: string;
  suites?: string;
  vagasGaragem?: string;
  temVaranda?: boolean;
  caracteristicasGerais?: string[];
  lazerItens?: string[];
  diferenciaisEspecificos?: string;
  sustentabilidadeTecnologia?: string[];
  idToken?: string;
}) {
  const ctx = await getAuthenticatedUserContext(data.idToken);
  if (ctx.userType !== 'admin' && ctx.userType !== 'constructor') {
    throw new Error('Acesso negado.');
  }

  const project = await projectRepository.getById(projectId);
  if (!project) {
    throw new Error('Empreendimento não encontrado.');
  }

  if (ctx.userType === 'constructor' && project.builderId !== ctx.tenantId) {
    throw new Error('Empreendimento não pertence à construtora logada.');
  }

  await projectRepository.update(projectId, {
    numTorres: data.numTorres,
    numUnidades: data.numUnidades,
    numPavimentos: data.numPavimentos,
    numElevadores: data.numElevadores,
    areaTerreno: data.areaTerreno,
    tipologiasResidenciais: data.tipologiasResidenciais,
    areaMinima: data.areaMinima,
    areaMaxima: data.areaMaxima,
    numQuartos: data.numQuartos,
    suites: data.suites,
    vagasGaragem: data.vagasGaragem,
    temVaranda: data.temVaranda,
    caracteristicasGerais: data.caracteristicasGerais,
    lazerItens: data.lazerItens,
    diferenciaisEspecificos: data.diferenciaisEspecificos,
    sustentabilidadeTecnologia: data.sustentabilidadeTecnologia,
  });

  revalidatePath(`/dashboard/construtoras/empreendimentos/${projectId}`);
  revalidatePath('/dashboard/construtoras/empreendimentos');
  return { success: true };
}

export async function updateProjectPersonasServer(projectId: string, data: {
  personaIds?: string[];
  idToken?: string;
}) {
  const ctx = await getAuthenticatedUserContext(data.idToken);
  if (ctx.userType !== 'admin' && ctx.userType !== 'constructor') {
    throw new Error('Acesso negado.');
  }

  const project = await projectRepository.getById(projectId);
  if (!project) {
    throw new Error('Empreendimento não encontrado.');
  }

  if (ctx.userType === 'constructor' && project.builderId !== ctx.tenantId) {
    throw new Error('Empreendimento não pertence à construtora logada.');
  }

  await projectRepository.update(projectId, {
    personaIds: data.personaIds || [],
  });

  revalidatePath(`/dashboard/construtoras/empreendimentos/${projectId}`);
  revalidatePath('/dashboard/construtoras/empreendimentos');
  return { success: true };
}

export async function updateProjectMediaServer(projectId: string, data: {
  midia?: string[];
  idToken?: string;
}) {
  const ctx = await getAuthenticatedUserContext(data.idToken);
  if (ctx.userType !== 'admin' && ctx.userType !== 'constructor') {
    throw new Error('Acesso negado.');
  }

  const project = await projectRepository.getById(projectId);
  if (!project) {
    throw new Error('Empreendimento não encontrado.');
  }

  if (ctx.userType === 'constructor' && project.builderId !== ctx.tenantId) {
    throw new Error('Empreendimento não pertence à construtora logada.');
  }

  await projectRepository.update(projectId, {
    midia: data.midia || [],
  });

  revalidatePath(`/dashboard/construtoras/empreendimentos/${projectId}`);
  revalidatePath('/dashboard/construtoras/empreendimentos');
  return { success: true };
}

export async function updateProjectMaterialsServer(projectId: string, data: {
  materiais?: Array<{
    id: string;
    name: string;
    category: string;
    url: string;
    size?: number;
    type?: string;
    updatedAt: string;
  }>;
  idToken?: string;
}) {
  const ctx = await getAuthenticatedUserContext(data.idToken);
  if (ctx.userType !== 'admin' && ctx.userType !== 'constructor') {
    throw new Error('Acesso negado.');
  }

  const project = await projectRepository.getById(projectId);
  if (!project) {
    throw new Error('Empreendimento não encontrado.');
  }

  if (ctx.userType === 'constructor' && project.builderId !== ctx.tenantId) {
    throw new Error('Empreendimento não pertence à construtora logada.');
  }

  await projectRepository.update(projectId, {
    materiais: data.materiais || [],
  });

  revalidatePath(`/dashboard/construtoras/empreendimentos/${projectId}`);
  revalidatePath('/dashboard/construtoras/empreendimentos');
  return { success: true };
}

export async function updateProjectPublicationServer(projectId: string, data: {
  isPublished: boolean;
  idToken?: string;
}) {
  const ctx = await getAuthenticatedUserContext(data.idToken);
  if (ctx.userType !== 'admin' && ctx.userType !== 'constructor') {
    throw new Error('Acesso negado.');
  }

  const project = await projectRepository.getById(projectId);
  if (!project) {
    throw new Error('Empreendimento não encontrado.');
  }

  if (ctx.userType === 'constructor' && project.builderId !== ctx.tenantId) {
    throw new Error('Empreendimento não pertence à construtora logada.');
  }

  // If publishing, validate all mandatory requirements on server side
  if (data.isPublished) {
    const hasBasic = !!project.name && !!project.localizacao?.cidade && !!project.localizacao?.estado;
    const hasCommercial = !!project.tituloComercial && (project.precoInicial || 0) > 0 && (project.tipologias?.length || 0) > 0;
    const hasCharacteristics = (project.numTorres || 0) > 0 && (project.numUnidades || 0) > 0 && (project.lazerItens?.length || 0) > 0;
    const hasPersona = (project.personaIds?.length || 0) > 0;
    const hasMedia = (project.midia?.length || 0) > 0;
    const units = await propertyRepository.listByProjectId(projectId);
    const hasUnits = units.length > 0;
    const hasMaterials = (project.materiais?.length || 0) > 0;

    if (!hasBasic || !hasCommercial || !hasCharacteristics || !hasPersona || !hasMedia || !hasUnits || !hasMaterials) {
      throw new Error('O empreendimento não atende a todos os requisitos obrigatórios do checklist para publicação.');
    }
  }

  await projectRepository.update(projectId, {
    isPublished: data.isPublished,
  });

  revalidatePath(`/dashboard/construtoras/empreendimentos/${projectId}`);
  revalidatePath('/dashboard/construtoras/empreendimentos');
  return { success: true };
}

export async function getProjectDetailServer(projectId: string, idToken?: string) {
  const ctx = await getAuthenticatedUserContext(idToken);
  if (ctx.userType !== 'admin' && ctx.userType !== 'constructor') {
    throw new Error('Acesso negado.');
  }

  const projectSnap = await adminDb.collection('projects').doc(projectId).get();
  if (!projectSnap.exists) {
    throw new Error('Empreendimento não encontrado.');
  }

  const projectData = projectSnap.data();
  if (ctx.userType === 'constructor' && projectData?.builderId !== ctx.tenantId) {
    throw new Error('Empreendimento não pertence à construtora logada.');
  }

  const units = await propertyRepository.listByProjectId(projectId);

  const project = {
    id: projectSnap.id,
    name: projectData.name,
    builderId: projectData.builderId,
    status: projectData.status,
    standard: projectData.standard,
    vgvEstimado: projectData.vgvEstimado,
    percentualObra: projectData.percentualObra,
    dataEntregaEstimada: projectData.dataEntregaEstimada,
    descricaoCurta: projectData.descricaoCurta,
    descricaoCompleta: projectData.descricaoCompleta,
    tituloComercial: projectData.tituloComercial,
    subtituloComercial: projectData.subtituloComercial,
    precoInicial: projectData.precoInicial,
    precoMaximo: projectData.precoMaximo,
    valorMetroQuadrado: projectData.valorMetroQuadrado,
    tipologias: projectData.tipologias,
    condicoesComerciais: projectData.condicoesComerciais,
    diferenciaisCorretor: projectData.diferenciaisCorretor,
    argumentosVenda: projectData.argumentosVenda,
    observacoesComerciais: projectData.observacoesComerciais,
    numTorres: projectData.numTorres,
    numUnidades: projectData.numUnidades,
    numPavimentos: projectData.numPavimentos,
    numElevadores: projectData.numElevadores,
    areaTerreno: projectData.areaTerreno,
    tipologiasResidenciais: projectData.tipologiasResidenciais,
    areaMinima: projectData.areaMinima,
    areaMaxima: projectData.areaMaxima,
    numQuartos: projectData.numQuartos,
    suites: projectData.suites,
    vagasGaragem: projectData.vagasGaragem,
    temVaranda: projectData.temVaranda,
    caracteristicasGerais: projectData.caracteristicasGerais,
    lazerItens: projectData.lazerItens,
    diferenciaisEspecificos: projectData.diferenciaisEspecificos,
    sustentabilidadeTecnologia: projectData.sustentabilidadeTecnologia,
    personaIds: projectData.personaIds || [],
    midia: projectData.midia || [],
    materiais: projectData.materiais || [],
    localizacao: projectData.localizacao,
    isPublished: !!projectData.isPublished,
    createdAt: projectData.createdAt,
    updatedAt: projectData.updatedAt,
  };

  return serializeFirestoreData({
    project,
    units,
  });
}

export async function updateProjectCommercialServer(projectId: string, data: {
  tituloComercial?: string;
  subtituloComercial?: string;
  precoInicial?: number;
  precoMaximo?: number;
  valorMetroQuadrado?: number;
  tipologias?: string[];
  condicoesComerciais?: string;
  diferenciaisCorretor?: string;
  argumentosVenda?: string;
  observacoesComerciais?: string;
  idToken?: string;
}) {
  const ctx = await getAuthenticatedUserContext(data.idToken);
  if (ctx.userType !== 'admin' && ctx.userType !== 'constructor') {
    throw new Error('Acesso negado.');
  }

  const project = await projectRepository.getById(projectId);
  if (!project) {
    throw new Error('Empreendimento não encontrado.');
  }

  if (ctx.userType === 'constructor' && project.builderId !== ctx.tenantId) {
    throw new Error('Empreendimento não pertence à construtora logada.');
  }

  await projectRepository.update(projectId, {
    tituloComercial: data.tituloComercial,
    subtituloComercial: data.subtituloComercial,
    precoInicial: data.precoInicial,
    precoMaximo: data.precoMaximo,
    valorMetroQuadrado: data.valorMetroQuadrado,
    tipologias: data.tipologias,
    condicoesComerciais: data.condicoesComerciais,
    diferenciaisCorretor: data.diferenciaisCorretor,
    argumentosVenda: data.argumentosVenda,
    observacoesComerciais: data.observacoesComerciais,
  });

  revalidatePath(`/dashboard/construtoras/empreendimentos/${projectId}`);
  revalidatePath('/dashboard/construtoras/empreendimentos');
  return { success: true };
}

export async function updateProjectBrandingServer(
  projectId: string,
  branding: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
  } | null,
  idToken?: string
) {
  const ctx = await getAuthenticatedUserContext(idToken);
  if (ctx.userType !== 'constructor' && ctx.userType !== 'admin') {
    throw new Error('Acesso negado.');
  }

  const project = await projectRepository.getById(projectId);
  if (!project) {
    throw new Error('Empreendimento não encontrado.');
  }

  if (ctx.userType === 'constructor' && project.builderId !== ctx.tenantId) {
    throw new Error('Você não tem permissão para editar este empreendimento.');
  }

  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  const cleanBranding: any = {};

  if (branding === null) {
    await projectRepository.update(projectId, { branding: undefined as any });
  } else {
    for (const [key, value] of Object.entries(branding)) {
      if (value !== undefined && value !== null && value !== '') {
        const trimmed = String(value).trim();
        if (!hexRegex.test(trimmed)) {
          throw new Error(`Cor inválida para ${key}. Use o formato #RRGGBB.`);
        }
        cleanBranding[key] = trimmed;
      }
    }

    await projectRepository.update(projectId, {
      branding: Object.keys(cleanBranding).length > 0 ? cleanBranding : undefined,
    });
  }

  revalidatePath(`/empreendimento/${projectId}`);
  revalidatePath(`/dashboard/construtoras/empreendimentos/${projectId}/hotsite/aparencia`);
  return { success: true };
}


