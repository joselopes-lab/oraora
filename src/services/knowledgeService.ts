
'use client';

import { Firestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

/**
 * @fileOverview ORAORA KNOWLEDGE ENGINE 1.0
 * 
 * Responsável por organizar e fornecer dados estruturados (Knowledge Nodes)
 * baseados no inventário e cobertura do corretor.
 */

export interface KnowledgeMetadata {
  source: 'system_config' | 'user_input' | 'market_report' | 'official_api';
  updatedAt: string;
  reliability: 'high' | 'medium' | 'low';
}

export interface KnowledgeNode<T> {
  data: T;
  metadata: KnowledgeMetadata;
}

export interface CityKnowledge {
  name: string;
  state: string;
  region?: string;
  population?: number;
  area?: string;
  isMetropolitan?: boolean;
}

export interface NeighborhoodKnowledge {
  name: string;
  cityName: string;
  state: string;
  profile?: 'residential' | 'commercial' | 'mixed' | 'luxury';
  status?: 'developing' | 'consolidated' | 'high_appreciation';
}

export interface ConstructorKnowledge {
  id: string;
  name: string;
  activeProjects: string[]; // IDs de imóveis/empreendimentos
  brokerPartnership: boolean;
}

export class KnowledgeService {
  private static instance: KnowledgeService;
  private db: Firestore;

  private constructor(db: Firestore) {
    this.db = db;
  }

  public static getInstance(db: Firestore): KnowledgeService {
    if (!KnowledgeService.instance) {
      KnowledgeService.instance = new KnowledgeService(db);
    }
    return KnowledgeService.instance;
  }

  /**
   * Coleta conhecimento sobre uma cidade baseada nos dados do sistema.
   */
  public async getCityNode(cityName: string, stateUf: string): Promise<KnowledgeNode<CityKnowledge> | null> {
    // Busca dados no arquivo de localização estático (fonte primária de confiança)
    const locationData = await import('@/lib/location-data.json');
    const state = locationData.states.find(s => s.uf === stateUf);
    const city = state?.cities.find(c => c.name === cityName);

    if (!city) return null;

    return {
      data: {
        name: city.name,
        state: stateUf,
        // Campos como PIB/IDH seriam populados aqui se existissem na base
      },
      metadata: {
        source: 'system_config',
        updatedAt: new Date().toISOString(),
        reliability: 'high'
      }
    };
  }

  /**
   * Coleta conhecimento sobre um bairro e sua relevância para o corretor.
   */
  public async getNeighborhoodNode(cityName: string, neighborhoodName: string, stateUf: string): Promise<KnowledgeNode<NeighborhoodKnowledge> | null> {
    // Relação: Bairro -> Cidade -> Estado
    return {
      data: {
        name: neighborhoodName,
        cityName,
        state: stateUf,
        status: 'consolidated'
      },
      metadata: {
        source: 'user_input',
        updatedAt: new Date().toISOString(),
        reliability: 'medium'
      }
    };
  }

  /**
   * Constrói o grafo de relação entre Construtora e Portfólio.
   */
  public async getConstructorNode(constructorId: string): Promise<KnowledgeNode<ConstructorKnowledge> | null> {
    const constRef = doc(this.db, 'constructors', constructorId);
    const constSnap = await getDoc(constRef);

    if (!constSnap.exists()) return null;

    const data = constSnap.data();
    
    // Busca imóveis vinculados a esta construtora
    const q = query(collection(this.db, 'properties'), where('builderId', '==', constructorId));
    const querySnapshot = await getDocs(q);
    const projectIds = querySnapshot.docs.map(d => d.id);

    return {
      data: {
        id: constructorId,
        name: data.name,
        activeProjects: projectIds,
        brokerPartnership: true
      },
      metadata: {
        source: 'system_config',
        updatedAt: new Date().toISOString(),
        reliability: 'high'
      }
    };
  }

  /**
   * Mapeia toda a rede de influência de um corretor.
   */
  public async getBrokerFullKnowledge(brokerId: string) {
    const coverageRef = doc(this.db, 'brokerCoverage', brokerId);
    const coverageSnap = await getDoc(coverageRef);

    if (!coverageSnap.exists()) return null;

    const coverage = coverageSnap.data();

    // Relações semânticas: Cidades -> Bairros -> Especialidades
    return {
      brokerId,
      coverageArea: {
        states: coverage.states,
        cities: coverage.cities,
        districts: coverage.districts
      },
      specialties: coverage.specialties,
      updatedAt: coverage.updatedAt
    };
  }
}
