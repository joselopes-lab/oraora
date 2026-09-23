import { adminDb } from '@/firebase/index.server';

export interface ProjectBranding {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
}

export interface Project {
  id: string;
  builderId: string;
  name: string;
  status?: string; // e.g. 'lancamento', 'em_obras', 'pronto'
  standard?: string; // e.g. 'economico', 'medio_padrao', 'alto_padrao'
  vgvEstimado?: number;
  percentualObra?: number;
  dataEntregaEstimada?: string;
  descricaoCurta?: string;
  descricaoCompleta?: string;
  // Comercial fields
  tituloComercial?: string;
  subtituloComercial?: string;
  precoInicial?: number;
  precoMaximo?: number;
  valorMetroQuadrado?: number;
  tipologias?: string[]; // e.g. ['Studio', '1 Dorm', '2 Dorms']
  condicoesComerciais?: string;
  diferenciaisCorretor?: string;
  argumentosVenda?: string;
  observacoesComerciais?: string;
  // Characteristics fields
  numTorres?: number;
  numUnidades?: number;
  numPavimentos?: number;
  numElevadores?: number;
  areaTerreno?: number;
  tipologiasResidenciais?: string[]; // e.g. ['Apartamento', 'Studio', 'Cobertura']
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
  personaIds?: string[];
  midia?: string[];
  materiais?: Array<{
    id: string;
    name: string;
    category: string;
    url: string;
    size?: number;
    type?: string;
    updatedAt: string;
  }>;
  localizacao?: {
    estado: string;
    cidade: string;
    bairro: string;
    address?: string;
    cep?: string;
  };
  isPublished?: boolean;
  branding?: ProjectBranding;
  createdAt: any;
  updatedAt: any;
}

export const projectRepository = {
  async listAll(): Promise<Project[]> {
    const snap = await adminDb.collection('projects').get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
  },

  async listByBuilderId(builderId: string): Promise<Project[]> {
    const snap = await adminDb.collection('projects')
      .where('builderId', '==', builderId)
      .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
  },

  async getById(projectId: string): Promise<Project | null> {
    const doc = await adminDb.collection('projects').doc(projectId).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() } as Project) : null;
  },

  async create(data: Omit<Project, 'id'>): Promise<string> {
    const docRef = await adminDb.collection('projects').add({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  },

  async update(projectId: string, data: Partial<Omit<Project, 'id' | 'builderId'>>): Promise<void> {
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    await adminDb.collection('projects').doc(projectId).update({
      ...cleanData,
      updatedAt: new Date(),
    });
  },

  async delete(projectId: string): Promise<void> {
    await adminDb.collection('projects').doc(projectId).delete();
  }
};

