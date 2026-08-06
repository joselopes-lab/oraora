'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useDoc, useFirestore, useMemoFirebase, useAuthContext, useCollection, setDocumentNonBlocking, useFirebase } from '@/firebase';
import { collection, setDoc, updateDoc, query, where, orderBy, Timestamp, limit, doc, arrayUnion, arrayRemove, deleteField, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { uploadFile } from '@/lib/storage';

interface Note {
  id: string;
  text: string;
  createdAt: string;
  authorName: string;
}

interface Proposal {
  propertyId: string;
  propertySource?: 'properties' | 'brokerProperties';
  totalValue: number;
  entryValue: number;
  financingValue: number;
  createdAt: string;
}

interface LinkedProperty {
  propertyId: string;
  source: 'properties' | 'brokerProperties';
}

interface FinancingRecord {
  bank: string;
  value: number;
  status: string;
  createdAt: string;
}

interface ClientDocument {
  url: string;
  name: string;
  uploadedAt: string;
  status: string;
}

interface PresentedProperty {
  propertyId: string;
  source: 'properties' | 'brokerProperties';
  status: 'apresentado' | 'interessado' | 'favorito' | 'visita_solicitada' | 'negociacao' | 'descartado';
  updatedAt: string | Timestamp;
}

interface TimelineLog {
  id?: string;
  type: 'auto' | 'manual';
  eventType?: string;
  title: string;
  description: string;
  createdAt: string | Timestamp;
  createdBy?: string;
  sourceType?: string;
  sourceId?: string;
}

interface Journey {
  id: string;
  clientId?: string;
  clientName: string;
  persona: string;
  stage?: 'prospeccao' | 'visitas' | 'proposta' | 'fechamento';
  statusTag?: string;
  propertyIds?: string[];
  propertyTitle?: string;
  propertyLocation?: string;
  propertyImage?: string;
  potentialValue?: number;
  notes?: string;
  createdAt: Timestamp;
  proposals?: Proposal[];
  currentProposal?: Proposal;
  // Closing specific fields
  salePropertyId?: string;
  salePropertySource?: 'properties' | 'brokerProperties';
  finalValue?: number;
  commissionPercentage?: number;
  presentedProperties?: PresentedProperty[];
  linkedProperties?: LinkedProperty[];
  timelineLogs?: TimelineLog[];
  qualification?: {
    purchaseObjective?: string;
    timeframe?: string;
    budgetMin?: number;
    budgetMax?: number;
    paymentMethod?: string;
    interestCities?: string[];
    interestNeighborhoods?: string[];
    propertyTypes?: string[];
    minBedrooms?: number;
    requiredFeatures?: string[];
  };
}

interface Persona {
  id: string;
  name: string;
  icon: string;
  iconBackgroundColor: string;
  description?: string;
  status?: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyInterest?: string;
  personaIds?: string[];
  createdAt?: Timestamp;
  documents?: {
    identity?: ClientDocument;
    civilStatus?: ClientDocument;
    residence?: ClientDocument;
    income?: ClientDocument;
  };
  financing?: { 
    bank: string;
    status: string;
    value: number;
  };
  financings?: FinancingRecord[];
  notes?: Note[];
  financialProfile?: {
    availableEquity?: number;
    useFGTS?: boolean;
    requiresFinancing?: boolean;
  };
}

interface Event {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: string;
  completed?: boolean;
  clientId?: string;
  journeyId?: string;
  propertyId?: string;
  propertySource?: 'properties' | 'brokerProperties';
}

interface Property {
  id: string;
  informacoesbasicas: {
    nome: string;
    valor?: number;
  };
  midia: string[];
  caracteristicasimovel?: {
    tipo?: string;
    quartos?: string[];
  };
  localizacao?: {
    cidade?: string;
    bairro?: string;
  };
  personaIds?: string[];
  nome?: string;
  valor?: number;
  cidade?: string;
  bairro?: string;
  tipo?: string;
  quartos?: string[];
  imagem?: string;
}

interface NormalizedProperty extends Property {
  nome: string;
  valor: number;
  cidade: string;
  bairro: string;
  tipo: string;
  quartos: string[];
  personaIds: string[];
  imagem: string;
  source: 'properties' | 'brokerProperties';
}

interface MatchingResult {
  property: NormalizedProperty;
  matchingScore: number;
  matchedCriteria: string[];
  unmatchedCriteria: string[];
}

const steps = [
  { id: 1, label: 'Cadastro', stage: 'prospeccao' },
  { id: 2, label: 'Persona', stage: 'prospeccao' },
  { id: 3, label: 'Imóveis', stage: 'prospeccao' },
  { id: 4, label: 'Visitas', stage: 'visitas' },
  { id: 5, label: 'Proposta', stage: 'proposta' },
  { id: 6, label: 'Documentação', stage: 'fechamento' },
  { id: 7, label: 'Financiamento', stage: 'fechamento' },
  { id: 8, label: 'Fechamento', stage: 'fechamento' },
];

const BRAZILIAN_BANKS = [
  "Caixa Econômica Federal",
  "Banco do Brasil",
  "Itaú Unibanco",
  "Bradesco",
  "Santander",
  "Safra",
  "BTG Pactual",
  "Nubank",
  "Inter",
  "C6 Bank",
  "Banrisul",
  "BRB",
  "Banco do Nordeste",
  "Banco da Amazônia",
  "Sicredi",
  "Sicoob",
  "Banco PAN",
  "Banco BMG",
  "Votorantim",
  "Original"
].sort();

const docTypes = [
  { key: 'identity', label: 'Identidade (RG/CNH)' },
  { key: 'civilStatus', label: 'Estado Civil' },
  { key: 'residence', label: 'Residência' },
  { key: 'income', label: 'Comprovante de Renda' },
];

const formatTimelineDate = (createdAt: any) => {
  if (!createdAt) return '';
  try {
    if (typeof createdAt.toDate === 'function') {
      return format(createdAt.toDate(), 'dd/MM/yyyy, HH:mm', { locale: ptBR });
    }
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) {
      return format(d, 'dd/MM/yyyy, HH:mm', { locale: ptBR });
    }
  } catch (e) {
    console.error(e);
  }
  return '';
};

const normalizeQuartos = (val: any): string[] => {
  if (val === null || val === undefined) {
    return [];
  }
  if (Array.isArray(val)) {
    return val
      .map(item => {
        if (item === null || item === undefined) return '';
        return String(item).trim();
      })
      .filter(Boolean);
  }
  const strVal = String(val).trim();
  return strVal ? [strVal] : [];
};

const formatCurrency = (val?: number) => {
  if (val === undefined || val === null) return 'Não informado';
  const parts = val.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${intPart},${parts[1]}`;
};

export default function JourneyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { firestore, storage } = useFirebase();
  const { user, isReady } = useAuthContext();
  const { toast } = useToast();
  
  const [currentPropIndex, setCurrentPropIndex] = useState(0);
  const [currentProposalIndex, setCurrentProposalIndex] = useState(0);
  const [currentFinancingIndex, setCurrentFinancingIndex] = useState(0);
  
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isEditingProposal, setIsEditingProposal] = useState(false);
  const [isFinancingModalOpen, setIsFinancingModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>([]);
  const [savingPersona, setSavingPersona] = useState(false);
  const [isQualifModalOpen, setIsQualifModalOpen] = useState(false);
  const [isMatchingModalOpen, setIsMatchingModalOpen] = useState(false);
  const [savingQualif, setSavingQualif] = useState(false);
  const [qualifForm, setQualifForm] = useState({
    purchaseObjective: '',
    timeframe: '',
    budgetMin: 0,
    budgetMax: 0,
    paymentMethod: '',
    interestCities: '',
    interestNeighborhoods: '',
    propertyTypes: '',
    minBedrooms: 0,
    requiredFeatures: '',
    availableEquity: 0,
    useFGTS: false,
    requiresFinancing: false
  });

  // Form States
  const [proposalData, setProposalData] = useState({ propertyId: '', totalValue: 0, entryValue: 0 });
  const [financingData, setFinancingData] = useState({ bank: '', value: 0, status: 'Em análise' });
  const [newNoteText, setNewNoteText] = useState('');
  const [closingData, setClosingData] = useState({ propertyId: '', finalValue: 0, commissionPercentage: 4 });
  const [timelineForm, setTimelineForm] = useState({ eventType: 'call', description: '' });
  const [eventForm, setEventForm] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    type: 'reuniao',
  });

  const journeyRef = useMemoFirebase(
    () => (isReady && firestore && user?.uid && id && id !== '[id]' ? doc(firestore, 'journeys', id) : null),
    [isReady, firestore, user?.uid, id]
  );
  const { data: journey, isLoading: isJourneyLoading } = useDoc<Journey>(journeyRef);

  const clientRef = useMemoFirebase(
    () => (isReady && firestore && user?.uid && journey?.clientId ? doc(firestore, 'leads', journey.clientId) : null),
    [isReady, firestore, user?.uid, journey?.clientId]
  );
  
  // Custom subscription for Lead that catches permission errors silently to avoid global modal crash
  const [client, setClient] = useState<Lead | null>(null);
  const [isClientLoading, setIsClientLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!clientRef) {
      setClient(null);
      setIsClientLoading(false);
      return;
    }

    setIsClientLoading(true);

    const unsubscribe = onSnapshot(
      clientRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setClient({ ...(snapshot.data() as Lead), id: snapshot.id });
        } else {
          setClient(null);
        }
        setIsClientLoading(false);
      },
      (error) => {
        if (error.code === 'permission-denied') {
          console.warn(`[Firestore Permission Guard] Sem permissão para ler o lead ${journey?.clientId}. Usando fallback journey.clientName.`);
        } else {
          console.error("[Firestore Lead Error]", error);
        }
        setClient(null);
        setIsClientLoading(false);
      }
    );

    return () => unsubscribe();
  }, [clientRef, journey?.clientId]);

  const globalPropertyIds = useMemo(() => {
    if (journey?.linkedProperties && journey.linkedProperties.length > 0) {
      return journey.linkedProperties
        .filter(p => p.source === 'properties')
        .map(p => p.propertyId);
    }
    return journey?.propertyIds || [];
  }, [journey?.linkedProperties, journey?.propertyIds]);

  const brokerPropertyIds = useMemo(() => {
    if (journey?.linkedProperties && journey.linkedProperties.length > 0) {
      return journey.linkedProperties
        .filter(p => p.source === 'brokerProperties')
        .map(p => p.propertyId);
    }
    return journey?.propertyIds || [];
  }, [journey?.linkedProperties, journey?.propertyIds]);

  const linkedPropertiesQuery = useMemoFirebase(
    () => (isReady && firestore && user?.uid && globalPropertyIds.length > 0
      ? query(collection(firestore, 'properties'), where('__name__', 'in', globalPropertyIds.slice(0, 30))) 
      : null),
    [isReady, firestore, user?.uid, globalPropertyIds]
  );
  const { data: propertiesFromGlobal } = useCollection<Property>(linkedPropertiesQuery);

  const personasQuery = useMemoFirebase(
    () => (isReady && firestore && user?.uid ? query(collection(firestore, 'personas')) : null),
    [isReady, firestore, user?.uid]
  );
  const { data: personas } = useCollection<Persona>(personasQuery);

  const linkedBrokerPropertiesQuery = useMemoFirebase(
    () => (isReady && firestore && user?.uid && brokerPropertyIds.length > 0
      ? query(collection(firestore, 'brokerProperties'), where('brokerId', '==', user.uid), where('__name__', 'in', brokerPropertyIds.slice(0, 30))) 
      : null),
    [isReady, firestore, user?.uid, brokerPropertyIds]
  );
  const { data: propertiesFromBroker } = useCollection<Property>(linkedBrokerPropertiesQuery);

  const allLinkedProperties = useMemo(() => {
    const globalMapped = (propertiesFromGlobal || []).map(p => ({ ...p, source: 'properties' as const }));
    const brokerMapped = (propertiesFromBroker || []).map(p => ({ ...p, source: 'brokerProperties' as const }));

    if (journey?.linkedProperties && journey.linkedProperties.length > 0) {
      return journey.linkedProperties.map(link => {
        if (link.source === 'properties') {
          return globalMapped.find(p => p.id === link.propertyId);
        } else {
          return brokerMapped.find(p => p.id === link.propertyId);
        }
      }).filter(Boolean) as any[];
    }

    const combined = [...globalMapped, ...brokerMapped];
    const unique = new Map();
    combined.forEach(p => unique.set(p.id, p));
    return (journey?.propertyIds || []).map(id => unique.get(id)).filter(Boolean) as any[];
  }, [propertiesFromGlobal, propertiesFromBroker, journey?.linkedProperties, journey?.propertyIds]);

  const resolvedPersonas = useMemo(() => {
    if (!client?.personaIds || !personas) return [];
    return client.personaIds
      .map(id => personas.find(p => p.id === id))
      .filter((p): p is Persona => !!p);
  }, [client?.personaIds, personas]);

  // Load broker portfolio to filter global properties according to existing visibility criteria
  const portfolioDocRef = useMemoFirebase(
    () => (isReady && firestore && user?.uid ? doc(firestore, 'portfolios', user.uid) : null),
    [isReady, firestore, user?.uid]
  );
  const { data: portfolio } = useDoc<{ propertyIds: string[] }>(portfolioDocRef);

  const portfolioIds = useMemo(() => portfolio?.propertyIds || [], [portfolio?.propertyIds]);

  // Load available global properties present in broker portfolio using __name__ in filter
  const allPropertiesQuery = useMemoFirebase(
    () => (isReady && firestore && user?.uid && portfolioIds.length > 0 ? query(collection(firestore, 'properties'), where('__name__', 'in', portfolioIds.slice(0, 30))) : null),
    [isReady, firestore, user?.uid, portfolioIds]
  );
  const { data: allProperties } = useCollection<Property>(allPropertiesQuery);

  // Load all available broker properties
  const allBrokerPropertiesQuery = useMemoFirebase(
    () => (isReady && firestore && user?.uid ? query(collection(firestore, 'brokerProperties'), where('brokerId', '==', user.uid)) : null),
    [isReady, firestore, user?.uid]
  );
  const { data: allBrokerProperties } = useCollection<Property>(allBrokerPropertiesQuery);

  // Unified and normalized available properties list (ETAPA 5A)
  const availableProperties = useMemo<NormalizedProperty[]>(() => {
    const portfolioIds = portfolio?.propertyIds || [];
    const myPortfolio = (allProperties || []).filter(p => portfolioIds.includes(p.id));
    
    // Normalize and add source field
    const normalizedGlobal = myPortfolio.map(p => ({
      ...p,
      nome: p.informacoesbasicas?.nome || '',
      valor: p.informacoesbasicas?.valor || 0,
      cidade: p.localizacao?.cidade || '',
      bairro: p.localizacao?.bairro || '',
      tipo: p.caracteristicasimovel?.tipo || '',
      quartos: normalizeQuartos(p.caracteristicasimovel?.quartos !== undefined ? p.caracteristicasimovel.quartos : p.quartos),
      personaIds: p.personaIds || [],
      imagem: p.midia?.[0] || '',
      source: 'properties' as const,
    }));

    const normalizedBroker = (allBrokerProperties || []).map(p => ({
      ...p,
      nome: p.informacoesbasicas?.nome || '',
      valor: p.informacoesbasicas?.valor || 0,
      cidade: p.localizacao?.cidade || '',
      bairro: p.localizacao?.bairro || '',
      tipo: p.caracteristicasimovel?.tipo || '',
      quartos: normalizeQuartos(p.caracteristicasimovel?.quartos !== undefined ? p.caracteristicasimovel.quartos : p.quartos),
      personaIds: p.personaIds || [],
      imagem: p.midia?.[0] || '',
      source: 'brokerProperties' as const,
    }));

    const combined = [...normalizedGlobal, ...normalizedBroker];
    
    // Unify list by id to prevent duplicates
    const unique = new Map<string, NormalizedProperty>();
    combined.forEach(p => unique.set(p.id, p));
    
    return Array.from(unique.values());
  }, [allProperties, allBrokerProperties, portfolio]);

  // Dynamic matching score calculator (ETAPA 5B)
  const matchingResults = useMemo<MatchingResult[]>(() => {
    const qual = journey?.qualification;
    const clientPersonas = client?.personaIds || [];

    const norm = (s: string) => {
      if (!s) return '';
      return s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    };

    const results = (availableProperties || []).map(p => {
      let totalWeight = 0;
      let matchedScoreSum = 0;
      const matchedCriteria: string[] = [];
      const unmatchedCriteria: string[] = [];

      // 1. Orçamento (Weight: 25)
      const budgetMin = qual?.budgetMin;
      const budgetMax = qual?.budgetMax;
      const hasMinBudget = typeof budgetMin === 'number' && budgetMin > 0;
      const hasMaxBudget = typeof budgetMax === 'number' && budgetMax > 0;
      if (hasMinBudget || hasMaxBudget) {
        const weight = 25;
        totalWeight += weight;

        const propValue = p.valor || 0;
        let satisfiesMin = true;
        let satisfiesMax = true;

        if (hasMinBudget && propValue < budgetMin) {
          satisfiesMin = false;
        }
        if (hasMaxBudget && propValue > budgetMax) {
          satisfiesMax = false;
        }

        if (satisfiesMin && satisfiesMax) {
          matchedScoreSum += weight * 1.0;
          matchedCriteria.push("Orçamento");
        } else {
          unmatchedCriteria.push("Orçamento");
        }
      }

      // 2. Localização: Cidade/Bairro (Weight: 25)
      const interestCities = qual?.interestCities;
      const interestNeighborhoods = qual?.interestNeighborhoods;
      const hasCities = Array.isArray(interestCities) && interestCities.length > 0;
      const hasNeighborhoods = Array.isArray(interestNeighborhoods) && interestNeighborhoods.length > 0;
      if (hasCities || hasNeighborhoods) {
        const weight = 25;
        totalWeight += weight;

        const propCityNorm = norm(p.cidade || '');
        const propBairroNorm = norm(p.bairro || '');

        let cityMatches = false;
        if (hasCities) {
          cityMatches = interestCities.some(
            c => norm(c) === propCityNorm
          );
        }

        let neighborhoodMatches = false;
        if (hasNeighborhoods) {
          neighborhoodMatches = interestNeighborhoods.some(
            n => norm(n) === propBairroNorm
          );
        }

        if (hasCities && hasNeighborhoods) {
          if (cityMatches && neighborhoodMatches) {
            matchedScoreSum += weight * 1.0;
            matchedCriteria.push("Cidade e Bairro");
          } else if (cityMatches || neighborhoodMatches) {
            matchedScoreSum += weight * 0.5;
            matchedCriteria.push(cityMatches ? "Cidade" : "Bairro");
            unmatchedCriteria.push(cityMatches ? "Bairro" : "Cidade");
          } else {
            unmatchedCriteria.push("Cidade e Bairro");
          }
        } else if (hasCities) {
          if (cityMatches) {
            matchedScoreSum += weight * 1.0;
            matchedCriteria.push("Cidade");
          } else {
            unmatchedCriteria.push("Cidade");
          }
        } else {
          if (neighborhoodMatches) {
            matchedScoreSum += weight * 1.0;
            matchedCriteria.push("Bairro");
          } else {
            unmatchedCriteria.push("Bairro");
          }
        }
      }

      // 3. Tipo de Imóvel (Weight: 20)
      const propertyTypes = qual?.propertyTypes;
      const hasPropertyTypes = Array.isArray(propertyTypes) && propertyTypes.length > 0;
      if (hasPropertyTypes) {
        const weight = 20;
        totalWeight += weight;

        const propTypeNorm = norm(p.tipo || '');
        const matchesType = propertyTypes.some(
          t => norm(t) === propTypeNorm
        );

        if (matchesType) {
          matchedScoreSum += weight * 1.0;
          matchedCriteria.push("Tipo de Imóvel");
        } else {
          unmatchedCriteria.push("Tipo de Imóvel");
        }
      }

      // 4. Mínimo de Quartos (Weight: 15)
      const minBedrooms = qual?.minBedrooms;
      const hasMinBedrooms = typeof minBedrooms === 'number' && minBedrooms > 0;
      if (hasMinBedrooms) {
        const weight = 15;
        totalWeight += weight;

        const propQuartos = p.quartos || [];
        const maxBedrooms = propQuartos.reduce((max, qStr) => {
          const num = parseInt(qStr.replace(/\D/g, ''), 10);
          return !isNaN(num) && num > max ? num : max;
        }, 0);

        if (maxBedrooms >= minBedrooms) {
          matchedScoreSum += weight * 1.0;
          matchedCriteria.push("Quartos");
        } else {
          unmatchedCriteria.push("Quartos");
        }
      }

      // 5. Persona (Weight: 15)
      const hasPersonas = Array.isArray(clientPersonas) && clientPersonas.length > 0;
      if (hasPersonas) {
        const weight = 15;
        totalWeight += weight;

        const propPersonaIds = p.personaIds || [];
        const hasIntersection = propPersonaIds.some(pid => clientPersonas.includes(pid));

        if (hasIntersection) {
          matchedScoreSum += weight * 1.0;
          matchedCriteria.push("Perfil de Persona");
        } else {
          unmatchedCriteria.push("Perfil de Persona");
        }
      }

      const matchingScore = totalWeight > 0 ? Math.round((matchedScoreSum / totalWeight) * 100) : 100;

      return {
        property: p,
        matchingScore,
        matchedCriteria,
        unmatchedCriteria,
      };
    });

    return results.sort((a, b) => b.matchingScore - a.matchingScore);
  }, [availableProperties, journey?.qualification, client?.personaIds]);

  const qualifProgress = useMemo(() => {
    let totalFields = 8;
    let filledFields = 0;
    const missingFields: string[] = [];

    // 1. Objetivo da compra
    if (journey?.qualification?.purchaseObjective) {
      filledFields++;
    } else {
      missingFields.push("objetivo da compra");
    }

    // 2. Prazo para compra
    if (journey?.qualification?.timeframe) {
      filledFields++;
    } else {
      missingFields.push("prazo para compra");
    }

    // 3. Orçamento mínimo
    if ((journey?.qualification?.budgetMin || 0) > 0) {
      filledFields++;
    } else {
      missingFields.push("orçamento mínimo");
    }

    // 4. Orçamento máximo
    if ((journey?.qualification?.budgetMax || 0) > 0) {
      filledFields++;
    } else {
      missingFields.push("orçamento máximo");
    }

    // 5. Forma de pagamento
    if (journey?.qualification?.paymentMethod) {
      filledFields++;
    } else {
      missingFields.push("forma de pagamento");
    }

    // 6. Cidades ou bairros de interesse
    const hasCities = journey?.qualification?.interestCities && journey.qualification.interestCities.length > 0;
    const hasNeighborhoods = journey?.qualification?.interestNeighborhoods && journey.qualification.interestNeighborhoods.length > 0;
    if (hasCities || hasNeighborhoods) {
      filledFields++;
    } else {
      missingFields.push("cidades ou bairros de interesse");
    }

    // 7. Tipos de imóvel
    if (journey?.qualification?.propertyTypes && journey.qualification.propertyTypes.length > 0) {
      filledFields++;
    } else {
      missingFields.push("tipo de imóvel");
    }

    // 8. Mínimo de quartos
    if ((journey?.qualification?.minBedrooms || 0) > 0) {
      filledFields++;
    } else {
      missingFields.push("mínimo de quartos");
    }

    // Lead financial profile (only if client/lead is accessible)
    if (client) {
      // availableEquity
      totalFields++;
      if ((client.financialProfile?.availableEquity || 0) > 0) {
        filledFields++;
      } else {
        missingFields.push("recursos próprios / entrada");
      }

      // requiresFinancing
      totalFields++;
      const reqFin = client.financialProfile?.requiresFinancing;
      if (reqFin !== undefined && reqFin !== null) {
        filledFields++;
      } else {
        missingFields.push("necessidade de financiamento");
      }

      // useFGTS (only when requiresFinancing is true)
      if (reqFin === true) {
        totalFields++;
        const fgts = client.financialProfile?.useFGTS;
        if (fgts !== undefined && fgts !== null) {
          filledFields++;
        } else {
          missingFields.push("pretensão de usar FGTS");
        }
      }
    }

    const percent = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

    let guidanceText = "";
    if (percent === 100) {
      guidanceText = "Qualificação concluída — Cliente pronto para Matching.";
    } else if (missingFields.length > 0) {
      if (missingFields.length === 1) {
        guidanceText = `Falta definir o(a) ${missingFields[0]}.`;
      } else if (missingFields.length === 2) {
        guidanceText = `Falta definir o(a) ${missingFields[0]} e o(a) ${missingFields[1]}.`;
      } else {
        guidanceText = `Falta definir ${missingFields.slice(0, -1).join(', ')} e o(a) ${missingFields[missingFields.length - 1]}.`;
      }
    }

    return {
      percent,
      missingFields,
      guidanceText,
      totalFields,
      filledFields
    };
  }, [journey?.qualification, client]);

  const eventsQuery = useMemoFirebase(
    () => {
      if (!isReady || !firestore || !user?.uid) return null;
      // Simplificado para evitar índice composto
      return query(collection(firestore, 'events'), where('brokerId', '==', user.uid));
    },
    [isReady, firestore, user?.uid]
  );
  const { data: initialEvents } = useCollection<Event>(eventsQuery);

  const sortedEvents = useMemo(() => {
    if (!initialEvents || !journey?.clientId) return [];
    return [...initialEvents]
        .filter(e => e.clientId === journey.clientId)
        .sort((a, b) => {
            const dateA = a.date + (a.time || '00:00');
            const dateB = b.date + (b.time || '00:00');
            return dateB.localeCompare(dateA);
        }).slice(0, 5);
  }, [initialEvents, journey?.clientId]);

  const timelineQuery = useMemoFirebase(
    () => (isReady && firestore && user?.uid && id && id !== '[id]' ? query(collection(firestore, 'journeys', id, 'timeline'), orderBy('createdAt', 'desc'), limit(20)) : null),
    [isReady, firestore, user?.uid, id]
  );
  const { data: timelineData } = useCollection<TimelineLog>(timelineQuery);

  const combinedChronology = useMemo(() => {
    const items: {
      id: string;
      type: 'timeline' | 'agenda';
      eventType?: string;
      title: string;
      description?: string;
      date: Date;
      completed?: boolean;
      createdBy?: string;
    }[] = [];

    // Add timeline logs
    if (timelineData) {
      timelineData.forEach((log) => {
        let logDate = new Date();
        if (log.createdAt) {
          if (typeof (log.createdAt as any).toDate === 'function') {
            logDate = (log.createdAt as any).toDate();
          } else {
            logDate = new Date(log.createdAt as any);
          }
        }
        items.push({
          id: log.id || Math.random().toString(),
          type: 'timeline',
          eventType: log.eventType || 'note',
          title: log.title,
          description: log.description,
          date: logDate,
          createdBy: log.createdBy,
        });
      });
    }

    // Add agenda events
    if (sortedEvents) {
      sortedEvents.forEach((evt) => {
        let evtDate = new Date();
        try {
          if (evt.date) {
            const dateStr = evt.date + 'T' + (evt.time || '00:00') + ':00';
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) {
              evtDate = parsed;
            } else {
              evtDate = new Date(evt.date + 'T00:00:00');
            }
          }
        } catch (err) {
          console.error("Erro ao analisar data do evento:", err);
        }
        items.push({
          id: evt.id,
          type: 'agenda',
          eventType: evt.type,
          title: evt.title,
          description: `Compromisso agendado${evt.time ? ` para as ${evt.time}` : ''}`,
          date: evtDate,
          completed: evt.completed,
        });
      });
    }

    // Add journey creation
    if (journey?.createdAt) {
      let createDate = new Date();
      if (typeof (journey.createdAt as any).toDate === 'function') {
        createDate = (journey.createdAt as any).toDate();
      } else {
        createDate = new Date(journey.createdAt as any);
      }
      items.push({
        id: 'journey-creation',
        type: 'timeline',
        eventType: 'creation',
        title: 'Abertura da Jornada',
        description: 'A jornada de compra do cliente foi formalizada no sistema.',
        date: createDate,
      });
    }

    // Sort descending (newest first)
    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [timelineData, sortedEvents, journey?.createdAt]);

  // Find the first upcoming (future or today, uncompleted) agenda event
  const upcomingEvent = useMemo(() => {
    if (!sortedEvents) return null;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const future = sortedEvents
      .filter(e => !e.completed && e.date >= todayStr)
      .sort((a, b) => {
        const dateA = a.date + (a.time || '00:00');
        const dateB = b.date + (b.time || '00:00');
        return dateA.localeCompare(dateB); // soonest first
      });
    return future[0] || null;
  }, [sortedEvents]);

  // List of missing document types
  const missingDocs = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    docTypes.forEach((docType) => {
      const docExists = !!client?.documents?.[docType.key as keyof NonNullable<Lead['documents']>];
      if (!docExists) {
        list.push(docType);
      }
    });
    return list;
  }, [client?.documents]);

  // Find last activity text
  const lastActivityText = useMemo(() => {
    if (combinedChronology.length > 0) {
      const mostRecent = combinedChronology[0];
      try {
        const timeStr = formatDistanceToNow(mostRecent.date, { addSuffix: true, locale: ptBR });
        return `Última atualização ${timeStr}`;
      } catch (err) {
        console.error(err);
      }
    }
    return 'Nenhuma movimentação registrada';
  }, [combinedChronology]);

  const proposals = useMemo(() => {
    if (!journey) return [];
    const list = [...(journey.proposals || [])];
    if (journey.currentProposal && !list.some(p => p.createdAt === journey.currentProposal?.createdAt)) {
      list.unshift(journey.currentProposal);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [journey]);

  const financings = useMemo(() => {
    if (!client) return [];
    const list = [...(client.financings || [])];
    if (client.financing && !list.some(f => f.bank === client.financing?.bank && f.value === client.financing?.value)) {
      list.unshift({ 
        ...client.financing, 
        createdAt: (client.financing as any).createdAt || client.createdAt?.toDate().toISOString() || new Date().toISOString() 
      });
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [client]);

  const currentStepIndex = useMemo(() => {
    if (!journey || !journey.stage) return 0;
    const stageMap: Record<string, number> = { 'prospeccao': 2, 'visitas': 3, 'proposta': 4, 'fechamento': 7 };
    return stageMap[journey.stage] || 0;
  }, [journey]);

  useEffect(() => {
    if (journey) {
      setClosingData({
        propertyId: journey.salePropertyId || (journey.propertyIds?.[0] || ''),
        finalValue: journey.finalValue || journey.potentialValue || 0,
        commissionPercentage: journey.commissionPercentage || 4,
      });
    }
  }, [journey]);

  const prevStageRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!journey || !journey.stage) {
      return;
    }

    const prevStage = prevStageRef.current;
    prevStageRef.current = journey.stage;

    // Ignoramos o primeiro carregamento da página (prevStage === undefined)
    if (prevStage === undefined) {
      return;
    }

    if (prevStage !== journey.stage) {
      const registerStageChangeLog = async () => {
        if (!firestore || !id || !user) return;

        const stageLabelMap: Record<string, string> = {
          prospeccao: 'Prospecção',
          visitas: 'Visitas',
          proposta: 'Proposta',
          fechamento: 'Fechamento',
        };

        const oldLabel = (prevStage && stageLabelMap[prevStage]) || prevStage;
        const newLabel = (journey.stage && stageLabelMap[journey.stage]) || journey.stage;

        try {
          const payload = {
            type: 'auto',
            eventType: 'stage_changed',
            title: 'Etapa atualizada',
            description: `Etapa alterada de ${oldLabel} para ${newLabel}.`,
            createdAt: serverTimestamp(),
            createdBy: user.uid,
          };
          console.log("DIAGNOSTIC PRE-ADDDOC:", {
            journeyId: id,
            userId: user.uid,
            isFirestoreInitialized: !!firestore,
            payload
          });
          const timelineRef = collection(firestore, 'journeys', id, 'timeline');
          await addDoc(timelineRef, payload);
        } catch (error: any) {
          console.error("DIAGNOSTIC TIMELINE ERROR DETAILS:", {
            code: error?.code,
            message: error?.message,
            stack: error?.stack,
            fullError: error
          });
          toast({
            variant: 'destructive',
            title: "Erro ao gravar histórico",
            description: "A etapa da jornada foi alterada com sucesso, mas o log automático correspondente não pôde ser gravado."
          });
        }
      };

      registerStageChangeLog();
    }
  }, [journey?.stage, firestore, id, user, toast]);

  const handleSaveProposal = async () => {
    if (!firestore || !journeyRef || !proposalData.propertyId || !proposalData.totalValue || !journey) {
      toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Preencha o valor total e selecione o imóvel.' });
      return;
    }
    const selectedProp = allLinkedProperties.find(p => p.id === proposalData.propertyId);
    const financingValue = Math.max(0, proposalData.totalValue - proposalData.entryValue);
    const now = new Date().toISOString();
    const newProposal: Proposal = {
      propertyId: proposalData.propertyId,
      propertySource: selectedProp?.source,
      totalValue: proposalData.totalValue,
      entryValue: proposalData.entryValue,
      financingValue: financingValue,
      createdAt: isEditingProposal && proposals[currentProposalIndex] ? proposals[currentProposalIndex].createdAt : now,
    };
    let updatedProposals = [...(journey.proposals || [])];
    if (isEditingProposal) {
      updatedProposals = updatedProposals.map(p => p.createdAt === newProposal.createdAt ? newProposal : p);
    } else {
      updatedProposals.push(newProposal);
    }
    try {
      setDocumentNonBlocking(journeyRef, { potentialValue: proposalData.totalValue, stage: 'proposta', statusTag: 'Proposta Enviada', proposals: updatedProposals }, { merge: true });
      toast({ title: isEditingProposal ? "Proposta Atualizada!" : "Proposta Registrada!", description: "A jornada foi atualizada." });
      setIsProposalModalOpen(false);
      resetProposalForm();
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro ao salvar" });
    }
  };

  const handleSaveFinancing = async () => {
    if (!firestore || !clientRef || !financingData.bank || !financingData.value) {
      toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Preencha os dados do financiamento.' });
      return;
    }
    const newRecord: FinancingRecord = { bank: financingData.bank, value: financingData.value, status: financingData.status, createdAt: new Date().toISOString() };
    try {
      setDocumentNonBlocking(clientRef, { financings: arrayUnion(newRecord), financing: newRecord }, { merge: true });
      toast({ title: "Financiamento Cadastrado!" });
      setIsFinancingModalOpen(false);
      setFinancingData({ bank: '', value: 0, status: 'Em análise' });
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro ao salvar" });
    }
  };

  const handleTogglePersona = (personaId: string) => {
    setSelectedPersonaIds((prev) =>
      prev.includes(personaId)
        ? prev.filter((id) => id !== personaId)
        : [...prev, personaId]
    );
  };

  const handleSavePersonas = async () => {
    if (!firestore || !clientRef) {
      toast({ variant: 'destructive', title: 'Erro de permissão', description: 'O cliente não pôde ser carregado ou não há permissão.' });
      return;
    }
    setSavingPersona(true);
    try {
      await setDocumentNonBlocking(clientRef, { personaIds: selectedPersonaIds }, { merge: true });
      toast({ title: 'Personas atualizadas!', description: 'As personas do cliente foram atualizadas.' });
      setIsPersonaModalOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: 'Não foi possível atualizar as personas do cliente.' });
    } finally {
      setSavingPersona(false);
    }
  };

  const handleSaveQualif = async () => {
    if (!firestore || !journeyRef) {
      toast({ variant: 'destructive', title: 'Erro de permissão', description: 'A jornada não pôde ser carregada ou não há permissão.' });
      return;
    }
    setSavingQualif(true);
    try {
      const updatedQualification = {
        purchaseObjective: qualifForm.purchaseObjective || '',
        timeframe: qualifForm.timeframe || '',
        budgetMin: Number(qualifForm.budgetMin) || 0,
        budgetMax: Number(qualifForm.budgetMax) || 0,
        paymentMethod: qualifForm.paymentMethod || '',
        interestCities: qualifForm.interestCities ? qualifForm.interestCities.split(',').map(s => s.trim()).filter(Boolean) : [],
        interestNeighborhoods: qualifForm.interestNeighborhoods ? qualifForm.interestNeighborhoods.split(',').map(s => s.trim()).filter(Boolean) : [],
        propertyTypes: qualifForm.propertyTypes ? qualifForm.propertyTypes.split(',').map(s => s.trim()).filter(Boolean) : [],
        minBedrooms: Number(qualifForm.minBedrooms) || 0,
        requiredFeatures: qualifForm.requiredFeatures ? qualifForm.requiredFeatures.split(',').map(s => s.trim()).filter(Boolean) : []
      };

      await setDocumentNonBlocking(journeyRef, { qualification: updatedQualification }, { merge: true });

      if (clientRef && client) {
        const updatedFinancialProfile = {
          availableEquity: Number(qualifForm.availableEquity) || 0,
          useFGTS: !!qualifForm.useFGTS,
          requiresFinancing: !!qualifForm.requiresFinancing
        };
        await setDocumentNonBlocking(clientRef, { financialProfile: updatedFinancialProfile }, { merge: true });
      }

      toast({ title: 'Qualificação atualizada!', description: 'Os dados foram salvos com sucesso.' });
      setIsQualifModalOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: 'Não foi possível atualizar os dados de qualificação.' });
    } finally {
      setSavingQualif(false);
    }
  };

  const handleMarkAsPresented = async (propertyId: string, source: 'properties' | 'brokerProperties') => {
    if (!firestore || !journeyRef) {
      toast({ variant: 'destructive', title: 'Erro de permissão', description: 'A jornada não pôde ser carregada ou não há permissão.' });
      return;
    }
    try {
      const currentPresented = journey?.presentedProperties || [];
      const exists = currentPresented.some(p => p.propertyId === propertyId && p.source === source);
      if (exists) {
        toast({ title: 'Imóvel já apresentado', description: 'Este imóvel já está registrado como apresentado.' });
        return;
      }

      const newItem: PresentedProperty = {
        propertyId,
        source,
        status: 'apresentado',
        updatedAt: Timestamp.now()
      };

      const updatedPresented = [...currentPresented, newItem];
      await setDocumentNonBlocking(journeyRef, { presentedProperties: updatedPresented }, { merge: true });
      toast({ title: 'Imóvel marcado como apresentado!' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro ao registrar', description: 'Não foi possível salvar a alteração.' });
    }
  };

  const handleUpdatePresentedStatus = async (
    propertyId: string,
    source: 'properties' | 'brokerProperties',
    newStatus: 'apresentado' | 'interessado' | 'favorito' | 'descartado'
  ) => {
    if (!firestore || !journeyRef) {
      toast({ variant: 'destructive', title: 'Erro de permissão', description: 'A jornada não pôde ser carregada ou não há permissão.' });
      return;
    }
    try {
      const currentPresented = journey?.presentedProperties || [];
      const index = currentPresented.findIndex(p => p.propertyId === propertyId && p.source === source);
      
      let updatedPresented = [...currentPresented];
      if (index > -1) {
        updatedPresented[index] = {
          ...updatedPresented[index],
          status: newStatus,
          updatedAt: Timestamp.now()
        };
      } else {
        // Fallback: If not found, add it
        updatedPresented.push({
          propertyId,
          source,
          status: newStatus,
          updatedAt: Timestamp.now()
        });
      }

      await setDocumentNonBlocking(journeyRef, { presentedProperties: updatedPresented }, { merge: true });
      toast({ title: `Status atualizado para: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}` });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro ao atualizar status', description: 'Não foi possível salvar a alteração.' });
    }
  };

  const handleLinkProperty = async (propertyId: string, source: 'properties' | 'brokerProperties') => {
    if (!firestore || !journeyRef) {
      toast({ variant: 'destructive', title: 'Erro de permissão', description: 'A jornada não pôde ser carregada ou não há permissão.' });
      return;
    }
    try {
      const currentLinked = journey?.linkedProperties || [];
      const currentPropertyIds = journey?.propertyIds || [];

      // check if already linked in linkedProperties
      const alreadyLinked = currentLinked.some(p => p.propertyId === propertyId && p.source === source);
      if (alreadyLinked) {
        toast({ title: 'Imóvel já vinculado', description: 'Este imóvel já está vinculado a esta jornada.' });
        return;
      }

      const updatedLinked = [...currentLinked, { propertyId, source }];
      
      // also maintain propertyIds for backward compatibility, preventing duplicate IDs in the string array
      const updatedPropertyIds = [...currentPropertyIds];
      if (!updatedPropertyIds.includes(propertyId)) {
        updatedPropertyIds.push(propertyId);
      }

      await setDocumentNonBlocking(journeyRef, { 
        linkedProperties: updatedLinked,
        propertyIds: updatedPropertyIds
      }, { merge: true });

      toast({ title: 'Imóvel vinculado com sucesso!' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro ao vincular', description: 'Não foi possível salvar a alteração.' });
    }
  };

  const handleSaveClosing = async () => {
    if (!firestore || !journeyRef || !closingData.propertyId || !closingData.finalValue) {
      toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Selecione o imóvel e informe o valor final.' });
      return;
    }
    try {
      const selectedProp = allLinkedProperties.find(p => p.id === closingData.propertyId);
      setDocumentNonBlocking(journeyRef, {
        salePropertyId: closingData.propertyId,
        salePropertySource: selectedProp?.source,
        finalValue: closingData.finalValue,
        commissionPercentage: closingData.commissionPercentage,
        stage: 'fechamento',
        statusTag: 'Fechamento'
      }, { merge: true });
      toast({ title: "Fechamento Registrado!", description: "Os dados de comissão e venda foram atualizados." });
      setIsClosingModalOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro ao salvar fechamento" });
    }
  };

  const handleCompleteSale = async () => {
    if (!firestore || !journeyRef) return;
    try {
      setDocumentNonBlocking(journeyRef, { 
        statusTag: 'Venda Concluída',
        stage: 'fechamento'
      }, { merge: true });
      toast({ title: "Venda Concluída!", description: "Parabéns pelo fechamento!" });
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro ao atualizar status" });
    }
  };

  const handleEndNegotiation = async () => {
    if (!firestore || !journeyRef) return;
    try {
      setDocumentNonBlocking(journeyRef, { 
        statusTag: 'Negociação Encerrada',
      }, { merge: true });
      toast({ title: "Negociação Encerrada" });
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro ao atualizar status" });
    }
  };

  const handleDocUpload = async (docType: string, file: File) => {
    if (!file || !firestore || !clientRef || !storage) return;
    setUploadingDoc(docType);
    try {
      const path = `leads/${client?.id}/documents/${docType}`;
      const url = await uploadFile(storage, path, file, () => {});
      const docData: ClientDocument = { url, name: file.name, uploadedAt: new Date().toISOString(), status: 'VALIDADO' };
      setDocumentNonBlocking(clientRef, { documents: { [docType]: docData } }, { merge: true });
      toast({ title: "Documento Enviado!" });
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro no upload" });
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleSaveNote = async () => {
    if (!newNoteText.trim() || !firestore || !clientRef) return;
    
    const noteToAdd: Note = {
      id: crypto.randomUUID(),
      text: newNoteText,
      createdAt: new Date().toISOString(),
      authorName: user?.displayName || 'Corretor',
    };

    try {
      setDocumentNonBlocking(clientRef, { notes: arrayUnion(noteToAdd) }, { merge: true });
      toast({ title: "Nota Salva!", description: "A observação foi registrada no histórico do cliente." });
      setNewNoteText('');
      setIsNotesModalOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro ao salvar nota" });
    }
  };

  const handleSaveTimelineLog = async () => {
    if (!firestore || !id || !user) return;
    if (!timelineForm.description.trim()) {
      toast({ variant: 'destructive', title: "A descrição é obrigatória" });
      return;
    }

    const titleMap: Record<string, string> = {
      call: 'Ligação',
      whatsapp: 'WhatsApp',
      meeting: 'Reunião',
      note: 'Observação',
    };

    try {
      const timelineRef = collection(firestore, 'journeys', id, 'timeline');
      await addDoc(timelineRef, {
        type: 'manual',
        eventType: timelineForm.eventType,
        title: titleMap[timelineForm.eventType] || 'Interação',
        description: timelineForm.description.trim(),
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });

      toast({ title: "Interação registrada com sucesso!" });
      setTimelineForm({ eventType: 'call', description: '' });
      setIsTimelineModalOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Erro ao registrar interação" });
    }
  };

  const handleSaveEvent = async () => {
    if (!firestore || !user?.uid || !client?.id || !id) return;
    if (!eventForm.title.trim()) {
      toast({ variant: 'destructive', title: "O título é obrigatório" });
      return;
    }

    try {
      const eventRef = doc(collection(firestore, 'events'));
      await setDoc(eventRef, {
        id: eventRef.id,
        brokerId: user.uid,
        clientId: client.id,
        journeyId: id,
        ...eventForm,
        completed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({ title: "Ação agendada com sucesso!" });
      setEventForm({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00',
        type: 'reuniao',
      });
      setIsEventModalOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Erro ao agendar ação" });
    }
  };

  const handleToggleEventCompletion = async (eventId: string, currentCompleted: boolean) => {
    if (!firestore || !eventId) return;
    try {
      await updateDoc(doc(firestore, 'events', eventId), {
        completed: !currentCompleted,
        updatedAt: serverTimestamp(),
      });
      toast({ title: !currentCompleted ? "Ação concluída com sucesso!" : "Ação reaberta." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Erro ao atualizar evento" });
    }
  };

  const handleEditProposalClick = () => {
    const current = proposals[currentProposalIndex];
    if (current) {
      setProposalData({ propertyId: current.propertyId, totalValue: current.totalValue, entryValue: current.entryValue });
      setIsEditingProposal(true);
      setIsProposalModalOpen(true);
    }
  };

  const handleDeleteProposal = async () => {
    if (!journey || !journeyRef || !proposals[currentProposalIndex]) return;
    const toRemove = proposals[currentProposalIndex];
    
    const updatedProposals = (journey.proposals || []).filter(p => p.createdAt !== toRemove.createdAt);
    const updateData: any = { proposals: updatedProposals };
    
    if (journey.currentProposal?.createdAt === toRemove.createdAt) {
      updateData.currentProposal = null;
    }

    try {
      setDocumentNonBlocking(journeyRef, updateData, { merge: true });
      toast({ title: "Proposta Excluída" });
      setCurrentProposalIndex(0);
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro ao excluir" });
    }
  };

  const handleDeleteFinancing = async () => {
    if (!client || !clientRef || !financings[currentFinancingIndex]) return;
    const toRemove = financings[currentFinancingIndex];
    
    const updatedFinancings = (client.financings || []).filter(f => f.createdAt !== toRemove.createdAt);
    const updateData: any = { financings: updatedFinancings };
    
    if (client.financing?.bank === toRemove.bank && client.financing?.value === toRemove.value) {
      updateData.financing = null;
    }

    try {
      setDocumentNonBlocking(clientRef, updateData, { merge: true });
      toast({ title: "Registro Excluído" });
      setCurrentFinancingIndex(0);
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro ao excluir" });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!client || !clientRef) return;
    const noteToRemove = client.notes?.find(n => n.id === noteId);
    if (!noteToRemove) return;
    try {
      setDocumentNonBlocking(clientRef, { notes: arrayRemove(noteToRemove) }, { merge: true });
      toast({ title: "Nota Removida" });
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro ao excluir nota" });
    }
  };

  const handleDeleteDocument = async (docKey: string) => {
    if (!client || !clientRef) return;
    try {
      setDocumentNonBlocking(clientRef, { 
        documents: { 
          [docKey]: deleteField() 
        } 
      }, { merge: true });
      toast({ title: "Documento Removido" });
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro ao remover documento" });
    }
  };

  const resetProposalForm = () => {
    setProposalData({ propertyId: '', totalValue: 0, entryValue: 0 });
    setIsEditingProposal(false);
  };

  if (isJourneyLoading || isClientLoading || !isReady) {
    return <div className="p-10 text-center text-slate-500 font-medium italic">Carregando detalhes da jornada...</div>;
  }

  if (!journey) {
    return <div className="p-10 text-center">Jornada não encontrada.</div>;
  }

  const currentDisplayedProposal = proposals[currentProposalIndex];
  const proposalProperty = allLinkedProperties.find(p => p.id === currentDisplayedProposal?.propertyId);
  const currentDisplayedFinancing = financings[currentFinancingIndex];
  
  const currentFinalValue = journey.finalValue || journey.potentialValue || 0;
  const currentCommissionPercentage = journey.commissionPercentage || 4;
  const commissionValue = (currentFinalValue * currentCommissionPercentage) / 100;
  const soldProperty = allLinkedProperties.find(p => p.id === journey.salePropertyId);
  const clientInitials = client?.name?.substring(0, 2).toUpperCase() || journey?.clientName?.substring(0, 2).toUpperCase() || 'CL';

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 text-left">
      {/* Client Header */}
      <div className="flex flex-col bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex w-full flex-col gap-6 lg:flex-row lg:justify-between lg:items-center">
          <div className="flex gap-6 items-center">
            <div className="size-24 rounded-full border-4 border-primary/20 bg-primary/10 flex items-center justify-center text-primary-hover font-black text-3xl shrink-0 uppercase shadow-inner">
              {clientInitials}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">{journey.clientName}</h1>
                <Badge className={cn("border-none uppercase text-[10px] font-bold", journey.statusTag === 'Venda Concluída' ? "bg-primary text-slate-900" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                  {journey.statusTag || 'Em Atendimento'}
                </Badge>
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex flex-wrap gap-y-1">
                <span className="inline-flex items-center gap-1 mr-4">
                  <span className="material-symbols-outlined text-sm">mail</span> {client?.email || 'N/A'}
                </span>
                <span className="inline-flex items-center gap-1 mr-4">
                  <span className="material-symbols-outlined text-sm">phone</span> {client?.phone || 'N/A'}
                </span>
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium flex flex-wrap gap-y-1">
                <span className="inline-flex items-center gap-1 mr-4">
                  <span className="material-symbols-outlined text-sm">payments</span> {journey.potentialValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">apartment</span> {journey.propertyTitle}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="flex-1 lg:flex-none h-10 px-4 font-bold rounded-xl border-red-200 text-red-600 hover:bg-red-50">
                  <span className="material-symbols-outlined text-lg mr-2">cancel</span> Encerrar Negociação
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Encerrar negociação?</AlertDialogTitle>
                  <AlertDialogDescription>Esta ação marcará a jornada como encerrada sem venda. Deseja prosseguir?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleEndNegotiation} className="bg-destructive hover:bg-destructive/90 font-bold">Confirmar Encerramento</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="flex-1 lg:flex-none h-10 px-6 bg-primary text-slate-900 text-sm font-black shadow-lg shadow-primary/20 border-none hover:scale-[1.02] transition-transform">
                  <span className="material-symbols-outlined text-lg mr-2">verified</span> Venda Concluída
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar conclusão de venda?</AlertDialogTitle>
                  <AlertDialogDescription>Parabéns! Isso marcará a jornada como concluída com sucesso e adicionará o selo de vendido.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCompleteSale} className="bg-primary text-slate-900 font-bold hover:bg-primary/90">Confirmar Venda</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="mb-2 overflow-x-auto pb-4 px-2">
        <div className="min-w-[900px] relative">
          <div className="flex justify-between relative mb-2 px-4">
            <div className="absolute top-4 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 z-0"></div>
            <div className="absolute top-4 left-0 h-1 bg-primary z-0 transition-all duration-700" style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}></div>
            {steps.map((step, idx) => {
              const isActive = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300", isActive ? "bg-primary text-slate-900 shadow-sm" : "bg-slate-200 dark:bg-slate-800 text-slate-500", isCurrent && "ring-4 ring-primary/30 scale-110")}>
                    {step.id}
                  </div>
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider transition-colors", isActive ? "text-slate-900 dark:text-white" : "text-slate-400")}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Persona Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined font-bold">psychology</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Persona</h3>
              </div>
              <Dialog open={isPersonaModalOpen} onOpenChange={setIsPersonaModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="link" 
                    className="h-auto p-0 text-primary text-xs font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!client}
                    onClick={() => setSelectedPersonaIds(client?.personaIds || [])}
                  >
                    Editar Persona
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Editar Personas do Cliente</DialogTitle>
                    <DialogDescription>
                      Selecione as personas que melhor representam este cliente.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4 max-h-[300px] overflow-y-auto pr-1">
                    {personas && personas.length > 0 ? (
                      personas.map((persona) => {
                        const isChecked = selectedPersonaIds.includes(persona.id);
                        return (
                          <div 
                            key={persona.id} 
                            onClick={() => handleTogglePersona(persona.id)}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50",
                              isChecked ? "border-primary/50 bg-primary/5 dark:bg-primary/5" : "border-slate-200 dark:border-slate-800"
                            )}
                          >
                            <Checkbox 
                              checked={isChecked} 
                              onCheckedChange={() => handleTogglePersona(persona.id)} 
                              id={`persona-checkbox-${persona.id}`}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1 -mt-0.5">
                              <div className="flex items-center gap-2 mb-1">
                                {persona.icon && (
                                  <div className={cn("size-6 rounded flex items-center justify-center shrink-0", persona.iconBackgroundColor || "bg-primary/10 text-primary")}>
                                    <span className="material-symbols-outlined text-xs">{persona.icon}</span>
                                  </div>
                                )}
                                <span className="font-semibold text-sm text-slate-900 dark:text-white">{persona.name}</span>
                              </div>
                              {persona.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{persona.description}</p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center py-4">Nenhuma persona ativa cadastrada.</p>
                    )}
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost">Cancelar</Button>
                    </DialogClose>
                    <Button 
                      onClick={handleSavePersonas} 
                      className="bg-primary text-slate-900 border-none hover:brightness-110"
                      disabled={savingPersona}
                    >
                      {savingPersona ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {resolvedPersonas.length > 0 ? (
              <div className="space-y-3 mb-4">
                {resolvedPersonas.map((persona) => (
                  <div key={persona.id} className="bg-primary/5 p-4 rounded-lg border border-primary/10 flex items-start gap-3">
                    {persona.icon ? (
                      <div className={cn("size-10 rounded-lg flex items-center justify-center shrink-0", persona.iconBackgroundColor || "bg-primary/10 text-primary")}>
                        <span className="material-symbols-outlined text-xl">{persona.icon}</span>
                      </div>
                    ) : (
                      <div className="size-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-xl font-bold">psychology</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-primary-hover font-bold text-lg mb-1 truncate">{persona.name}</p>
                      {persona.description ? (
                        <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed line-clamp-3">{persona.description}</p>
                      ) : (
                        <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">Perfil identificado para segmentação de imóveis compatíveis.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-primary/5 p-4 rounded-lg mb-4 border border-primary/10">
                <p className="text-primary-hover font-bold text-lg mb-1">{journey.persona || 'Não informada'}</p>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Perfil identificado para segmentação de imóveis compatíveis.</p>
              </div>
            )}
            <div className="mt-auto space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Região de Interesse</span>
                <span className="text-slate-900 dark:text-white font-medium">{journey.propertyLocation}</span>
              </div>
            </div>
          </div>

          {/* Qualificação Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined font-bold">assignment_turned_in</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Qualificação</h3>
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <Dialog open={isQualifModalOpen} onOpenChange={setIsQualifModalOpen}>
                  <DialogTrigger asChild>
                  <Button 
                    variant="link" 
                    className="h-auto p-0 text-primary text-xs font-bold hover:underline"
                    onClick={() => {
                      const q = journey?.qualification || {};
                      const f = client?.financialProfile || {};
                      setQualifForm({
                        purchaseObjective: q.purchaseObjective || '',
                        timeframe: q.timeframe || '',
                        budgetMin: q.budgetMin || 0,
                        budgetMax: q.budgetMax || 0,
                        paymentMethod: q.paymentMethod || '',
                        interestCities: q.interestCities ? q.interestCities.join(', ') : '',
                        interestNeighborhoods: q.interestNeighborhoods ? q.interestNeighborhoods.join(', ') : '',
                        propertyTypes: q.propertyTypes ? q.propertyTypes.join(', ') : '',
                        minBedrooms: q.minBedrooms || 0,
                        requiredFeatures: q.requiredFeatures ? q.requiredFeatures.join(', ') : '',
                        availableEquity: f.availableEquity || 0,
                        useFGTS: !!f.useFGTS,
                        requiresFinancing: !!f.requiresFinancing
                      });
                    }}
                  >
                    Editar Qualificação
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Editar Qualificação da Jornada</DialogTitle>
                    <DialogDescription>
                      Atualize as preferências de compra para esta jornada. Os campos em branco serão considerados não informados.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4 pr-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="purchaseObjective">Objetivo da Compra</Label>
                        <Select 
                          value={qualifForm.purchaseObjective} 
                          onValueChange={(val) => setQualifForm({ ...qualifForm, purchaseObjective: val })}
                        >
                          <SelectTrigger id="purchaseObjective" className="h-10 bg-slate-50 dark:bg-slate-800 border-none">
                            <SelectValue placeholder="Selecione o objetivo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="moradia">Moradia</SelectItem>
                            <SelectItem value="investimento">Investimento</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="timeframe">Prazo para Compra</Label>
                        <Input 
                          id="timeframe"
                          placeholder="Ex: Imediato, 3 meses, etc."
                          className="h-10 bg-slate-50 dark:bg-slate-800 border-none"
                          value={qualifForm.timeframe}
                          onChange={(e) => setQualifForm({ ...qualifForm, timeframe: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="budgetMin">Orçamento Mínimo (R$)</Label>
                        <Input 
                          id="budgetMin"
                          type="number"
                          placeholder="0"
                          className="h-10 bg-slate-50 dark:bg-slate-800 border-none"
                          value={qualifForm.budgetMin || ''}
                          onChange={(e) => setQualifForm({ ...qualifForm, budgetMin: Number(e.target.value) })}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="budgetMax">Orçamento Máximo (R$)</Label>
                        <Input 
                          id="budgetMax"
                          type="number"
                          placeholder="0"
                          className="h-10 bg-slate-50 dark:bg-slate-800 border-none"
                          value={qualifForm.budgetMax || ''}
                          onChange={(e) => setQualifForm({ ...qualifForm, budgetMax: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                        <Input 
                          id="paymentMethod"
                          placeholder="Ex: À vista, Financiamento, FGTS"
                          className="h-10 bg-slate-50 dark:bg-slate-800 border-none"
                          value={qualifForm.paymentMethod}
                          onChange={(e) => setQualifForm({ ...qualifForm, paymentMethod: e.target.value })}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="minBedrooms">Quartos Mínimo</Label>
                        <Input 
                          id="minBedrooms"
                          type="number"
                          placeholder="0"
                          className="h-10 bg-slate-50 dark:bg-slate-800 border-none"
                          value={qualifForm.minBedrooms || ''}
                          onChange={(e) => setQualifForm({ ...qualifForm, minBedrooms: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="interestCities">Cidades de Interesse</Label>
                      <Input 
                        id="interestCities"
                        placeholder="Ex: São Paulo, Campinas (separadas por vírgula)"
                        className="h-10 bg-slate-50 dark:bg-slate-800 border-none"
                        value={qualifForm.interestCities}
                        onChange={(e) => setQualifForm({ ...qualifForm, interestCities: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="interestNeighborhoods">Bairros de Interesse</Label>
                      <Input 
                        id="interestNeighborhoods"
                        placeholder="Ex: Pinheiros, Vila Madalena (separadas por vírgula)"
                        className="h-10 bg-slate-50 dark:bg-slate-800 border-none"
                        value={qualifForm.interestNeighborhoods}
                        onChange={(e) => setQualifForm({ ...qualifForm, interestNeighborhoods: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="propertyTypes">Tipos de Imóvel</Label>
                      <Input 
                        id="propertyTypes"
                        placeholder="Ex: Apartamento, Casa, Cobertura (separadas por vírgula)"
                        className="h-10 bg-slate-50 dark:bg-slate-800 border-none"
                        value={qualifForm.propertyTypes}
                        onChange={(e) => setQualifForm({ ...qualifForm, propertyTypes: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="requiredFeatures">Características Importantes</Label>
                      <Input 
                        id="requiredFeatures"
                        placeholder="Ex: Varanda gourmet, Portaria 24h, Piscina (separadas por vírgula)"
                        className="h-10 bg-slate-50 dark:bg-slate-800 border-none"
                        value={qualifForm.requiredFeatures}
                        onChange={(e) => setQualifForm({ ...qualifForm, requiredFeatures: e.target.value })}
                      />
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Perfil Financeiro do Cliente (Salvo no Lead)
                        </h4>
                        {!client && (
                          <span className="text-[10px] bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded font-medium">
                            Lead Inacessível (Visualização Apenas)
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="availableEquity" className={!client ? "opacity-60" : ""}>
                          Recursos Próprios / Entrada Disponível (R$)
                        </Label>
                        <Input 
                          id="availableEquity"
                          type="number"
                          placeholder="Ex: 150000"
                          className="h-10 bg-slate-50 dark:bg-slate-800 border-none disabled:opacity-50"
                          value={qualifForm.availableEquity || ''}
                          onChange={(e) => setQualifForm({ ...qualifForm, availableEquity: Number(e.target.value) })}
                          disabled={!client}
                        />
                      </div>

                      <div className="flex flex-col gap-3 pt-1">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="useFGTS" 
                            checked={qualifForm.useFGTS} 
                            onCheckedChange={(checked) => setQualifForm({ ...qualifForm, useFGTS: !!checked })}
                            disabled={!client}
                          />
                          <Label htmlFor="useFGTS" className={cn("text-sm cursor-pointer select-none", !client && "opacity-60 cursor-not-allowed")}>
                            Pretende utilizar o saldo do FGTS
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="requiresFinancing" 
                            checked={qualifForm.requiresFinancing} 
                            onCheckedChange={(checked) => setQualifForm({ ...qualifForm, requiresFinancing: !!checked })}
                            disabled={!client}
                          />
                          <Label htmlFor="requiresFinancing" className={cn("text-sm cursor-pointer select-none", !client && "opacity-60 cursor-not-allowed")}>
                            Necessita de financiamento habitacional
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost">Cancelar</Button>
                    </DialogClose>
                    <Button 
                      onClick={handleSaveQualif} 
                      className="bg-primary text-slate-900 border-none hover:brightness-110"
                      disabled={savingQualif}
                    >
                      {savingQualif ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isMatchingModalOpen} onOpenChange={setIsMatchingModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="link" 
                    className="h-auto p-0 text-primary text-xs font-bold hover:underline flex items-center gap-0.5"
                  >
                    <span className="material-symbols-outlined text-[14px] font-bold">recommend</span>
                    Ver Imóveis Recomendados
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                      <span className="material-symbols-outlined text-primary text-2xl font-bold">recommend</span>
                      Imóveis Recomendados
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400">
                      Visualização de imóveis compatíveis com o perfil do cliente ordenados pelo score de aderência.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="py-4 space-y-4">
                    {/* 1. Qualificação Incompleta Warning */}
                    {qualifProgress.percent < 100 && (
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-xl flex items-start gap-3 text-amber-800 dark:text-amber-300 text-xs">
                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg font-bold shrink-0">info</span>
                        <div>
                          <span className="font-bold">Qualificação Incompleta ({qualifProgress.percent}%):</span> Completar a qualificação da jornada adicionando mais preferências de compra melhora consideravelmente a precisão das recomendações do motor de Matching.
                        </div>
                      </div>
                    )}

                    {/* 2. Check if there are any criteria filled */}
                    {(() => {
                      const hasAnyCriteria = !!(
                        (journey?.qualification?.budgetMin && journey.qualification.budgetMin > 0) ||
                        (journey?.qualification?.budgetMax && journey.qualification.budgetMax > 0) ||
                        (journey?.qualification?.interestCities && journey.qualification.interestCities.length > 0) ||
                        (journey?.qualification?.interestNeighborhoods && journey.qualification.interestNeighborhoods.length > 0) ||
                        (journey?.qualification?.propertyTypes && journey.qualification.propertyTypes.length > 0) ||
                        (journey?.qualification?.minBedrooms && journey.qualification.minBedrooms > 0) ||
                        (client?.personaIds && client.personaIds.length > 0)
                      );

                      if (!hasAnyCriteria) {
                        return (
                          <div className="bg-slate-50 dark:bg-slate-800/20 p-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                            <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">find_replace</span>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Qualificação sem critérios preenchidos</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                              Nenhum critério de Matching (orçamento, localização, tipo, quartos ou persona) foi preenchido na Qualificação.
                              Por favor, adicione critérios clicando em <strong className="text-primary">&quot;Editar Qualificação&quot;</strong> para ativar o cálculo de compatibilidade de forma realística.
                            </p>
                          </div>
                        );
                      }

                      if (matchingResults.length === 0) {
                        return (
                          <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                            <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700 mb-2 font-light">apartment</span>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nenhum imóvel disponível</p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">O inventário unificado de imóveis está vazio ou inacessível no momento.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          {matchingResults.map((item) => {
                            const prop = item.property;
                            const isHighMatch = item.matchingScore >= 80;
                            const imageSrc = prop.midia?.[0] || prop.imagem || 'https://picsum.photos/seed/placeholder/400/300';
                            
                            return (
                              <div 
                                key={`${prop.id}-${prop.source}`}
                                className={cn(
                                  "p-4 rounded-xl border transition-all flex flex-col md:flex-row gap-4",
                                  isHighMatch 
                                    ? "border-emerald-500/30 bg-emerald-50/5 dark:bg-emerald-950/5 hover:border-emerald-500/50" 
                                    : "border-slate-200 dark:border-slate-800 hover:border-primary/20 bg-white dark:bg-slate-900"
                                )}
                              >
                                {/* Imagem do Imóvel */}
                                <div className="w-full md:w-40 h-32 rounded-lg overflow-hidden relative shrink-0 border border-slate-200 dark:border-slate-700">
                                  <Image 
                                    src={imageSrc} 
                                    alt={prop.nome} 
                                    fill 
                                    referrerPolicy="no-referrer"
                                    className="object-cover" 
                                  />
                                  {isHighMatch && (
                                    <div className="absolute top-2 left-2 bg-emerald-500 text-slate-950 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm">
                                      Alta Aderência
                                    </div>
                                  )}
                                </div>

                                {/* Informações */}
                                <div className="flex-1 flex flex-col justify-between min-w-0">
                                  <div>
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                      <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                                        {prop.nome}
                                      </h4>
                                      <div className={cn(
                                        "px-2.5 py-1 rounded-full text-xs font-black shrink-0 flex items-center gap-1",
                                        isHighMatch 
                                          ? "bg-emerald-500 text-slate-950" 
                                          : item.matchingScore >= 50
                                            ? "bg-primary text-slate-950"
                                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                      )}>
                                        <span className="material-symbols-outlined text-[12px] font-black">handshake</span>
                                        {item.matchingScore}%
                                      </div>
                                    </div>

                                    <p className="text-base font-black text-slate-900 dark:text-white">
                                      {formatCurrency(prop.valor)}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                      <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">location_on</span>
                                        {prop.bairro ? `${prop.bairro}, ${prop.cidade}` : prop.cidade}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">villa</span>
                                        {prop.tipo}
                                      </span>
                                      {Array.isArray(prop.quartos) && prop.quartos.length > 0 && (
                                        <span className="flex items-center gap-1">
                                          <span className="material-symbols-outlined text-xs">bed</span>
                                          {prop.quartos.join(', ')}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Critérios */}
                                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2">
                                    {/* Critérios Atendidos */}
                                    {item.matchedCriteria.length > 0 && (
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mr-1">Compatível:</span>
                                        {item.matchedCriteria.map((c, idx) => (
                                          <span key={idx} className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/10">
                                            <span className="material-symbols-outlined text-[10px] font-bold">check</span> {c}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {/* Critérios Não Atendidos */}
                                    {item.unmatchedCriteria.length > 0 && (
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mr-1">Incompatível:</span>
                                        {item.unmatchedCriteria.map((c, idx) => (
                                          <span key={idx} className="inline-flex items-center gap-1 text-[10px] bg-slate-50 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium border border-slate-200/50 dark:border-slate-800">
                                            <span className="material-symbols-outlined text-[10px]">close</span> {c}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Apresentação & Status (ETAPA 5D.2) */}
                                  {(() => {
                                    const presentedItem = (journey?.presentedProperties || []).find(
                                      (p) => p.propertyId === prop.id && p.source === prop.source
                                    );
                                    const isLinked = (journey?.linkedProperties || []).some(
                                      (lp) => lp.propertyId === prop.id && lp.source === prop.source
                                    ) || (journey?.propertyIds || []).includes(prop.id);
                                    return (
                                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/10 p-3 rounded-lg">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                            Apresentação:
                                          </span>
                                          {presentedItem ? (
                                            <Badge className={cn(
                                              "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border",
                                              presentedItem.status === 'apresentado' && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/50",
                                              presentedItem.status === 'interessado' && "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-800/50",
                                              presentedItem.status === 'favorito' && "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/50",
                                              presentedItem.status === 'descartado' && "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800/50"
                                            )}>
                                              {presentedItem.status}
                                            </Badge>
                                          ) : (
                                            <span className="text-xs text-slate-400 italic">Não apresentado</span>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                          {isLinked ? (
                                            <Badge className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/50 flex items-center gap-1">
                                              <span className="material-symbols-outlined text-[12px] font-bold">link</span>
                                              Vinculado
                                            </Badge>
                                          ) : (
                                            <Button
                                              size="sm"
                                              onClick={() => handleLinkProperty(prop.id, prop.source)}
                                              variant="outline"
                                              className="h-8 text-xs font-bold border-slate-200 hover:border-primary dark:border-slate-800 flex items-center gap-1 bg-white dark:bg-slate-900"
                                            >
                                              <span className="material-symbols-outlined text-sm">link</span>
                                              Vincular
                                            </Button>
                                          )}

                                          {presentedItem ? (
                                            <div className="flex items-center gap-2">
                                              <span className="text-[10px] text-slate-400 font-bold uppercase">Status:</span>
                                              <Select
                                                value={presentedItem.status}
                                                onValueChange={(val) => handleUpdatePresentedStatus(prop.id, prop.source, val as any)}
                                              >
                                                <SelectTrigger className="h-8 w-36 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="apresentado">Apresentado</SelectItem>
                                                  <SelectItem value="interessado">Interessado</SelectItem>
                                                  <SelectItem value="favorito">★ Favorito</SelectItem>
                                                  <SelectItem value="descartado">✕ Descartado</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          ) : (
                                            <Button
                                              size="sm"
                                              onClick={() => handleMarkAsPresented(prop.id, prop.source)}
                                              className="h-8 text-xs font-bold bg-primary text-slate-900 hover:brightness-110 flex items-center gap-1"
                                            >
                                              <span className="material-symbols-outlined text-sm font-bold">visibility</span>
                                              Marcar Apresentado
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  <DialogFooter className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <DialogClose asChild>
                      <Button variant="ghost">Fechar</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            </div>

            {journey?.qualification || client?.financialProfile ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                {/* Dynamic Progress Indicator */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status da Qualificação
                    </span>
                    <span className="text-sm font-black text-primary">
                      {qualifProgress.percent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                    <div 
                      className={cn(
                        "h-full transition-all duration-500 ease-out",
                        qualifProgress.percent === 100 ? "bg-emerald-500" : "bg-primary"
                      )}
                      style={{ width: `${qualifProgress.percent}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {qualifProgress.percent === 100 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
                        Qualificação concluída — Cliente pronto para Matching.
                      </span>
                    ) : (
                      <>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Próxima etapa: </span>
                        {qualifProgress.guidanceText}
                      </>
                    )}
                  </p>
                </div>

                <div>
                  {journey?.qualification && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">target</span> Objetivo
                          </p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize mt-0.5">
                            {journey.qualification.purchaseObjective || 'Não informado'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">schedule</span> Prazo
                          </p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                            {journey.qualification.timeframe || 'Não informado'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">payments</span> Orçamento
                          </p>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                            {journey.qualification.budgetMin || journey.qualification.budgetMax ? (
                              <>
                                {journey.qualification.budgetMin ? formatCurrency(journey.qualification.budgetMin) : 'R$ 0'} - {journey.qualification.budgetMax ? formatCurrency(journey.qualification.budgetMax) : 'Ilimitado'}
                              </>
                            ) : (
                              'Não informado'
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">credit_card</span> Pagamento
                          </p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                            {journey.qualification.paymentMethod || 'Não informado'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">bed</span> Quartos
                          </p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                            {journey.qualification.minBedrooms ? `${journey.qualification.minBedrooms}+ quartos` : 'Não informado'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">villa</span> Tipos de Imóvel
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {journey.qualification.propertyTypes && journey.qualification.propertyTypes.length > 0 ? (
                              journey.qualification.propertyTypes.map((t, idx) => (
                                <Badge key={idx} variant="secondary" className="text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-none font-medium">
                                  {t}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Não informado</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">location_city</span> Regiões/Cidades/Bairros
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {journey.qualification.interestCities && journey.qualification.interestCities.map((c, idx) => (
                              <Badge key={`city-${idx}`} className="text-[10px] bg-primary/10 text-primary-hover border-none font-medium">
                                {c}
                              </Badge>
                            ))}
                            {journey.qualification.interestNeighborhoods && journey.qualification.interestNeighborhoods.map((n, idx) => (
                              <Badge key={`neigh-${idx}`} className="text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-none font-medium">
                                {n}
                              </Badge>
                            ))}
                            {(!journey.qualification.interestCities || journey.qualification.interestCities.length === 0) &&
                             (!journey.qualification.interestNeighborhoods || journey.qualification.interestNeighborhoods.length === 0) && (
                              <span className="text-xs text-slate-400 italic">Nenhum local cadastrado</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">star</span> Características Necessárias
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {journey.qualification.requiredFeatures && journey.qualification.requiredFeatures.length > 0 ? (
                              journey.qualification.requiredFeatures.map((f, idx) => (
                                <Badge key={idx} variant="secondary" className="text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-none font-medium">
                                  {f}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 italic">Nenhuma característica informada</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Perfil Financeiro do Cliente */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-3 space-y-2.5">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-primary">account_balance_wallet</span> Perfil Financeiro do Lead
                  </p>
                  {client ? (
                    <div className="grid grid-cols-2 gap-3 bg-slate-50/50 dark:bg-slate-800/20 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60">
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 font-medium block">Recursos Próprios / Entrada</span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {client.financialProfile?.availableEquity ? formatCurrency(client.financialProfile.availableEquity) : 'Não informado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Usa FGTS?</span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {client.financialProfile?.useFGTS === undefined ? 'Não informado' : client.financialProfile.useFGTS ? 'Sim' : 'Não'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Quer Financiamento?</span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {client.financialProfile?.requiresFinancing === undefined ? 'Não informado' : client.financialProfile.requiresFinancing ? 'Sim' : 'Não'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2 bg-amber-50/50 dark:bg-amber-950/10 rounded-lg border border-dashed border-amber-200/50">
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        Lead Inacessível ou não localizado
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center py-8 text-center bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-4xl mb-2">assignment_late</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Qualificação não preenchida</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Preencha os dados para obter um melhor matching futuramente.</p>
              </div>
            )}
          </div>

          {/* Imóveis Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">apartment</span>
                <h3 className="font-bold text-slate-900 dark:text-white">Imóveis de Interesse</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {allLinkedProperties.length > 0 ? `${currentPropIndex + 1} de ${allLinkedProperties.length}` : '0 de 0'}
                </span>
              </div>
            </div>
            {allLinkedProperties.length > 0 ? (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-primary/30 transition-all group">
                    <div className="h-12 w-12 rounded overflow-hidden relative shrink-0 border border-slate-200 dark:border-slate-600">
                      <Image src={allLinkedProperties[currentPropIndex]?.midia?.[0] || 'https://picsum.photos/seed/placeholder/400/300'} alt={allLinkedProperties[currentPropIndex]?.informacoesbasicas?.nome} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">{allLinkedProperties[currentPropIndex]?.informacoesbasicas?.nome}</p>
                      <p className="text-xs text-slate-500">{allLinkedProperties[currentPropIndex]?.informacoesbasicas?.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })}</p>
                    </div>
                    <Link href={`/imoveis/${allLinkedProperties[currentPropIndex]?.id}`} target="_blank" className="p-1.5 rounded-lg text-slate-300 group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-lg">open_in_new</span>
                    </Link>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-3 mt-4">
                  <button onClick={() => setCurrentPropIndex(prev => Math.max(0, prev - 1))} disabled={currentPropIndex === 0} className="text-[10px] font-black text-slate-400 hover:text-primary disabled:opacity-20 uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-colors"><span className="material-symbols-outlined text-sm">chevron_left</span> Anterior</button>
                  <button onClick={() => setCurrentPropIndex(prev => Math.min(allLinkedProperties.length - 1, prev + 1))} disabled={currentPropIndex === allLinkedProperties.length - 1} className="text-[10px] font-black text-slate-400 hover:text-primary disabled:opacity-20 uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-colors">Próximo <span className="material-symbols-outlined text-sm">chevron_right</span></button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 flex-1 flex flex-col justify-center">
                <p className="text-xs text-slate-400 italic">Nenhum imóvel vinculado.</p>
              </div>
            )}
          </div>

          {/* Visitas Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">event_available</span>
                <h3 className="font-bold text-slate-900 dark:text-white">Visitas Agendadas</h3>
              </div>
              <Button variant="link" asChild className="h-auto p-0 text-primary text-xs font-bold hover:underline">
                <Link href="/dashboard/agenda">Criar Roteiro</Link>
              </Button>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[150px] pr-1">
              {sortedEvents.filter(e => e.type === 'visita').length ? sortedEvents.filter(e => e.type === 'visita').map(event => (
                <div key={event.id} className={cn("flex items-center gap-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0", event.completed && "opacity-50")}>
                  <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 rounded h-12 w-12 shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-500">{format(parseISO(event.date), 'MMM', { locale: ptBR })}</span>
                    <span className="text-lg font-bold text-primary">{format(parseISO(event.date), 'dd')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">{event.title}</p>
                    <p className="text-xs text-slate-500">{event.time}h • {event.completed ? 'Realizada' : 'Agendada'}</p>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-400 text-center py-6 italic">Nenhuma visita registrada.</p>
              )}
            </div>
          </div>

          {/* Proposta Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">description</span>
                <h3 className="font-bold text-slate-900 dark:text-white">Propostas ({proposals.length})</h3>
              </div>
              <Dialog open={isProposalModalOpen} onOpenChange={(open) => { setIsProposalModalOpen(open); if (!open) resetProposalForm(); }}>
                <DialogTrigger asChild><button className="bg-primary text-slate-900 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest hover:brightness-110 transition-all cursor-pointer shadow-sm">Nova Proposta</button></DialogTrigger>
                <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
                  <DialogHeader className="p-6 border-b bg-white dark:bg-slate-900">
                    <DialogTitle className="text-xl font-bold">{isEditingProposal ? 'Editar Proposta' : 'Nova Proposta'}</DialogTitle>
                  </DialogHeader>
                  <div className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Label>Imóvel</Label>
                      <Select value={proposalData.propertyId} onValueChange={(val) => setProposalData({ ...proposalData, propertyId: val })}>
                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none shadow-inner"><SelectValue placeholder="Selecione um imóvel" /></SelectTrigger>
                        <SelectContent>{allLinkedProperties.map(p => <SelectItem key={p.id} value={p.id}>{p.informacoesbasicas.nome}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor Total</Label>
                      <Input type="number" className="h-12 rounded-xl bg-slate-50 border-none" value={proposalData.totalValue || ''} onChange={(e) => setProposalData({...proposalData, totalValue: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor de Entrada</Label>
                      <Input type="number" className="h-12 rounded-xl bg-slate-50 border-none" value={proposalData.entryValue || ''} onChange={(e) => setProposalData({...proposalData, entryValue: Number(e.target.value)})} />
                    </div>
                  </div>
                  <footer className="p-6 border-t bg-slate-50 flex gap-3">
                    <DialogClose asChild><Button variant="ghost" className="flex-1">Cancelar</Button></DialogClose>
                    <Button onClick={handleSaveProposal} className="flex-1 bg-primary text-slate-900 font-bold h-11 rounded-xl shadow-lg border-none">Salvar Dados</Button>
                  </footer>
                </DialogContent>
              </Dialog>
            </div>
            {proposals.length > 0 ? (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center"><span className="text-sm text-slate-500">Valor Ofertado</span><span className="text-base font-bold text-slate-900 dark:text-white">{currentDisplayedProposal.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between items-center"><span className="text-sm text-slate-500">Imóvel</span><span className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[150px]">{proposalProperty?.informacoesbasicas?.nome}</span></div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button onClick={handleDeleteProposal} className="text-red-500 text-[10px] font-bold uppercase tracking-widest hover:underline cursor-pointer">Excluir</button>
                      <button onClick={handleEditProposalClick} className="text-primary text-[10px] font-bold uppercase tracking-widest hover:underline cursor-pointer">Editar</button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-4 mt-4">
                  <button onClick={() => setCurrentProposalIndex(prev => Math.max(0, prev - 1))} disabled={currentProposalIndex === 0} className="text-[10px] font-black text-slate-400 hover:text-primary disabled:opacity-20 uppercase tracking-widest flex items-center gap-1 cursor-pointer"><span className="material-symbols-outlined text-sm">chevron_left</span> Anterior</button>
                  <button onClick={() => setCurrentProposalIndex(prev => Math.min(proposals.length - 1, prev + 1))} disabled={currentProposalIndex === proposals.length - 1} className="text-[10px] font-black text-slate-400 hover:text-primary disabled:opacity-20 uppercase tracking-widest flex items-center gap-1 cursor-pointer">Próxima <span className="material-symbols-outlined text-sm">chevron_right</span></button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 flex-1 flex flex-col justify-center"><p className="text-xs text-slate-400 italic">Nenhuma proposta.</p></div>
            )}
          </div>

          {/* Documentação Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">folder_shared</span>
                <h3 className="font-bold text-slate-900 dark:text-white">Documentação</h3>
              </div>
              <Dialog open={isDocsModalOpen} onOpenChange={setIsDocsModalOpen}>
                <DialogTrigger asChild><button className="bg-primary text-slate-900 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest hover:brightness-110 transition-all cursor-pointer shadow-sm">Gerenciar</button></DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Gerenciar Documentos</DialogTitle>
                    <DialogDescription>Faça o upload ou remova os documentos obrigatórios do cliente.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    {docTypes.map(docType => {
                      const docExists = !!client?.documents?.[docType.key as keyof NonNullable<Lead['documents']>];
                      return (
                        <div key={docType.key} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs font-bold uppercase text-slate-500">{docType.label}</Label>
                            {docExists && (
                              <button onClick={() => handleDeleteDocument(docType.key)} className="text-[10px] text-red-500 font-bold hover:underline uppercase">Excluir</button>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <label className={cn("flex-1 cursor-pointer h-10 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg text-xs font-medium hover:border-primary transition-all", uploadingDoc === docType.key && "opacity-50 pointer-events-none")}>
                              {uploadingDoc === docType.key ? 'Enviando...' : docExists ? 'Substituir Documento' : 'Clique para carregar'}
                              <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleDocUpload(docType.key, e.target.files[0])} />
                            </label>
                            {docExists && (
                              <span className="material-symbols-outlined text-green-500">check_circle</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <DialogFooter><DialogClose asChild><Button variant="ghost">Fechar</Button></DialogClose></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[150px] pr-1">
              {docTypes.map((docType) => {
                const docRef = client?.documents?.[docType.key as keyof NonNullable<Lead['documents']>];
                return (
                  <div key={docType.key} className="flex items-center justify-between text-sm p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                    <div className="flex items-center gap-2">
                      <span className={cn("material-symbols-outlined text-lg", docRef?.status === 'VALIDADO' ? 'text-green-500' : 'text-amber-500')}>
                        {docRef?.status === 'VALIDADO' ? 'check_circle' : 'pending'}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 text-xs">{docType.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {docRef?.url && (
                        <>
                          <a href={docRef.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-primary transition-colors" title="Visualizar"><span className="material-symbols-outlined text-base">visibility</span></a>
                          <a href={docRef.url} download={docRef.name} className="text-slate-400 hover:text-primary transition-colors" title="Baixar"><span className="material-symbols-outlined text-base">download</span></a>
                        </>
                      )}
                      <span className={cn("text-[9px] font-bold", docRef?.status === 'VALIDADO' ? 'text-green-600' : 'text-amber-600')}>
                        {docRef?.status || 'PENDENTE'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financiamento Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">account_balance</span>
                <h3 className="font-bold text-slate-900 dark:text-white">Financiamento ({financings.length})</h3>
              </div>
              <Dialog open={isFinancingModalOpen} onOpenChange={setIsFinancingModalOpen}>
                <DialogTrigger asChild><button className="bg-primary text-slate-900 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest hover:brightness-110 transition-all cursor-pointer shadow-sm">Cadastrar</button></DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Cadastrar Financiamento</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label>Banco</Label><Select value={financingData.bank} onValueChange={(val) => setInitialFinancingData({...financingData, bank: val})}><SelectTrigger><SelectValue placeholder="Selecione o banco" /></SelectTrigger><SelectContent>{BRAZILIAN_BANKS.map(bank => <SelectItem key={bank} value={bank}>{bank}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Valor do Crédito</Label><Input type="number" value={financingData.value || ''} onChange={(e) => setInitialFinancingData({...financingData, value: Number(e.target.value)})} /></div>
                    <div className="space-y-2"><Label>Status</Label><Select value={financingData.status} onValueChange={(val) => setInitialFinancingData({...financingData, status: val})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Não iniciado">Não iniciado</SelectItem><SelectItem value="Em análise">Em análise</SelectItem><SelectItem value="Aprovado">Aprovado</SelectItem><SelectItem value="Reprovado">Reprovado</SelectItem></SelectContent></Select></div>
                  </div>
                  <DialogFooter><DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose><Button onClick={handleSaveFinancing} className="bg-primary text-slate-900 border-none">Salvar Dados</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {financings.length > 0 ? (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded font-bold text-primary shadow-sm border border-slate-200">{currentDisplayedFinancing.bank.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentDisplayedFinancing.bank}</p>
                      <button onClick={handleDeleteFinancing} className="text-red-500 text-[9px] font-bold uppercase hover:underline cursor-pointer">Excluir Registro</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-[9px] text-slate-500 font-bold uppercase">Status</p><p className="text-sm font-bold">{currentDisplayedFinancing.status}</p></div>
                    <div><p className="text-[9px] text-slate-500 font-bold uppercase">Valor</p><p className="text-sm font-bold">{currentDisplayedFinancing.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })}</p></div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-3 mt-4">
                  <button onClick={() => setCurrentFinancingIndex(prev => Math.max(0, prev - 1))} disabled={currentFinancingIndex === 0} className="text-[10px] font-black text-slate-400 hover:text-primary disabled:opacity-20 uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-colors"><span className="material-symbols-outlined text-xs">chevron_left</span> Anterior</button>
                  <button onClick={() => setCurrentFinancingIndex(prev => Math.min(financings.length - 1, prev + 1))} disabled={currentFinancingIndex === financings.length - 1} className="text-[10px] font-black text-slate-400 hover:text-primary disabled:opacity-20 uppercase tracking-widest flex items-center gap-1 cursor-pointer">Próxima <span className="material-symbols-outlined text-xs">chevron_right</span></button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 flex-1 flex flex-col justify-center"><p className="text-xs text-slate-400 italic">Nenhum financiamento.</p></div>
            )}
          </div>

          {/* Fechamento Card */}
          <div className="md:col-span-2 bg-slate-950 text-white p-6 rounded-xl border border-slate-800 shadow-xl h-full">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <span className="material-symbols-outlined text-primary">handshake</span>
                </div>
                <h3 className="font-bold text-xl text-white">Fechamento e Comissões</h3>
              </div>
              <Dialog open={isClosingModalOpen} onOpenChange={setIsClosingModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-slate-900 h-9 px-6 rounded-lg text-xs font-bold shadow-lg shadow-primary/20 transition-all hover:brightness-105 active:scale-95 border-none">
                    Configurar Venda
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
                  <DialogHeader className="p-6 border-b bg-white dark:bg-slate-900">
                    <DialogTitle className="text-xl font-bold">Dados do Fechamento</DialogTitle>
                    <DialogDescription>Selecione o imóvel vendido e os termos finais do acordo.</DialogDescription>
                  </DialogHeader>
                  <div className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Label>Imóvel da Venda</Label>
                      <Select value={closingData.propertyId} onValueChange={(val) => setClosingData({...closingData, propertyId: val})}>
                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none shadow-inner">
                          <SelectValue placeholder="Selecione o imóvel" />
                        </SelectTrigger>
                        <SelectContent>
                          {allLinkedProperties.map(p => <SelectItem key={p.id} value={p.id}>{p.informacoesbasicas.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor Final Acordado (R$)</Label>
                      <Input 
                        type="number" 
                        className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
                        value={closingData.finalValue || ''} 
                        onChange={(e) => setClosingData({...closingData, finalValue: Number(e.target.value)})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Porcentagem da Comissão (%)</Label>
                      <Input 
                        type="number" 
                        className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
                        value={closingData.commissionPercentage || ''} 
                        onChange={(e) => setClosingData({...closingData, commissionPercentage: Number(e.target.value)})} 
                      />
                    </div>
                    <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                      <p className="text-[10px] font-black uppercase text-primary-hover mb-1">Comissão Líquida Estimada</p>
                      <p className="text-lg font-black text-slate-900">
                        {((closingData.finalValue * closingData.commissionPercentage) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <footer className="p-6 border-t bg-slate-50 flex gap-3">
                    <DialogClose asChild><Button variant="ghost" className="flex-1">Cancelar</Button></DialogClose>
                    <Button onClick={handleSaveClosing} className="flex-1 bg-primary text-slate-900 font-bold h-11 rounded-xl shadow-lg border-none">Salvar Dados</Button>
                  </footer>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-inner">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Valor Final Acordado</p>
                <p className="text-xl font-black text-white">{currentFinalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })}</p>
                {soldProperty && <p className="text-[9px] text-slate-500 mt-1 truncate font-medium uppercase tracking-wider">{soldProperty.informacoesbasicas.nome}</p>}
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-inner">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Comissão ({currentCommissionPercentage}%)</p>
                <p className="text-xl font-black text-primary">{commissionValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-inner">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Previsão de Escritura</p>
                <p className="text-xl font-bold text-white">A definir</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Painel de Próximos Passos */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-auto">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <span className="material-symbols-outlined text-primary text-lg font-bold">next_plan</span> Próximos Passos
            </h3>
            
            {/* 1. Próxima Ação */}
            <div className="mb-5">
              <h4 className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider mb-2">Próxima Ação Agendada</h4>
              {upcomingEvent ? (
                <div className="p-3 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/10 flex gap-3 items-start group relative">
                  <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-base">
                      {upcomingEvent.type === 'visita' ? 'explore' : upcomingEvent.type === 'reuniao' ? 'groups' : 'event'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pr-6">
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug truncate">{upcomingEvent.title}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                      {format(new Date(upcomingEvent.date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                      {upcomingEvent.time && ` às ${upcomingEvent.time}`}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleToggleEventCompletion(upcomingEvent.id, !!upcomingEvent.completed)}
                    className="absolute right-2 top-2 p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Marcar como concluída"
                  >
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 flex flex-col gap-2 items-center text-center">
                  <span className="material-symbols-outlined text-slate-400 text-xl">event_busy</span>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Nenhuma próxima ação agendada.</p>
                  <Button 
                    variant="default" 
                    className="h-8 px-4 text-[11px] font-bold mt-1" 
                    onClick={() => setIsEventModalOpen(true)}
                  >
                    Agendar Próxima Ação
                  </Button>
                </div>
              )}
            </div>

            {/* 2. Documentação Pendente (Sugerida) */}
            <div className="mb-5">
              <h4 className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider mb-2">Documentação Sugerida</h4>
              {missingDocs.length > 0 ? (
                <div className="space-y-1.5">
                  {missingDocs.map(docType => (
                    <div key={docType.key} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="material-symbols-outlined text-xs text-slate-400">pending</span>
                      <span className="font-medium truncate">{docType.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-green-500/5 dark:bg-green-500/10 rounded border border-green-500/10 text-[11px] text-green-800 dark:text-green-400">
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  <span className="font-semibold">Documentação básica completa</span>
                </div>
              )}
            </div>

            {/* 3. Próximos Marcos da Jornada */}
            <div>
              <h4 className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider mb-2">Marcos da Jornada</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs p-1.5 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Proposta Comercial</span>
                  <Badge variant="secondary" className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border-none", proposals.length > 0 ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400")}>
                    {proposals.length > 0 ? 'Enviada' : 'Pendente'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs p-1.5 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Análise de Crédito</span>
                  <Badge variant="secondary" className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border-none", financings.length > 0 ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400")}>
                    {financings.length > 0 ? 'Concluída' : 'Pendente'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs p-1.5 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Assinatura de Contrato</span>
                  <Badge variant="secondary" className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border-none", journey?.statusTag === 'Venda Concluída' ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400")}>
                    {journey?.statusTag === 'Venda Concluída' ? 'Concluído' : 'Pendente'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Notas do Corretor */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 h-fit">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider"><span className="material-symbols-outlined text-primary text-lg">sticky_note_2</span> Notas Internas</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {client?.notes?.length ? client.notes.map(note => (
                <div key={note.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 relative group">
                  <p className="text-xs text-slate-900 dark:text-slate-100 leading-relaxed italic pr-6">&quot;{note.text}&quot;</p>
                  <button 
                    onClick={() => handleDeleteNote(note.id)}
                    className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                  <div className="flex justify-between items-center mt-2"><span className="text-[9px] font-bold text-slate-400 uppercase">{note.authorName}</span><span className="text-[9px] text-slate-400">{format(new Date(note.createdAt), 'dd MMM, HH:mm', { locale: ptBR })}</span></div>
                </div>
              )) : (<p className="text-xs text-slate-400 text-center py-6 italic">Nenhuma observação.</p>)}
            </div>
            <Dialog open={isNotesModalOpen} onOpenChange={setIsNotesModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full mt-4 h-9 text-xs font-bold border-dashed border-slate-300 transition-all hover:bg-slate-50">Adicionar Nota</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nova Nota Interna</DialogTitle>
                  <DialogDescription>Registre uma observação importante sobre o atendimento deste cliente.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Textarea 
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Descreva aqui os detalhes..."
                    rows={6}
                    className="rounded-xl bg-slate-50 border-none focus:ring-primary shadow-inner"
                  />
                </div>
                <DialogFooter className="flex gap-2">
                  <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                  <Button onClick={handleSaveNote} className="bg-primary text-slate-900 font-bold px-8 border-none">Salvar Nota</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Histórico Timeline */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 h-fit">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                  <span className="material-symbols-outlined text-primary text-lg">history</span> Cronologia
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
                  {lastActivityText}
                </p>
              </div>
              <button 
                onClick={() => {
                  setTimelineForm({ eventType: 'call', description: '' });
                  setIsTimelineModalOpen(true);
                }}
                className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary transition-colors hover:text-white cursor-pointer"
                title="Registrar Interação"
              >
                <span className="material-symbols-outlined text-lg">add</span>
              </button>
            </div>

            <div className="relative pl-6 space-y-6 max-h-[600px] overflow-y-auto pr-2 pt-2 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-150 dark:before:bg-slate-800">
              {combinedChronology.length > 0 ? combinedChronology.map((item) => {
                const config = (() => {
                  if (item.eventType === 'stage_changed') {
                    return {
                      icon: 'sync_alt',
                      iconClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30',
                      tag: 'Progresso',
                    };
                  }
                  if (item.eventType === 'creation') {
                    return {
                      icon: 'flag',
                      iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
                      tag: 'Início',
                    };
                  }
                  if (item.type === 'timeline') {
                    switch (item.eventType) {
                      case 'call':
                        return {
                          icon: 'call',
                          iconClass: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 border-sky-100 dark:border-sky-900/30',
                          tag: 'Contato',
                        };
                      case 'whatsapp':
                        return {
                          icon: 'chat',
                          iconClass: 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400 border-green-100 dark:border-green-900/30',
                          tag: 'WhatsApp',
                        };
                      case 'meeting':
                        return {
                          icon: 'groups',
                          iconClass: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 border-violet-100 dark:border-violet-900/30',
                          tag: 'Reunião',
                        };
                      case 'note':
                      default:
                        return {
                          icon: 'sticky_note_2',
                          iconClass: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-100 dark:border-slate-700/80',
                          tag: 'Anotação',
                        };
                    }
                  } else {
                    const isCompleted = item.completed;
                    let icon = 'calendar_today';
                    let tag = 'Agenda';
                    let colorClass = 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';

                    if (item.eventType === 'visita') {
                      icon = 'explore';
                      tag = 'Visita';
                      colorClass = 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
                    } else if (item.eventType === 'reuniao') {
                      icon = 'groups';
                      tag = 'Compromisso';
                      colorClass = 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 border-violet-100 dark:border-violet-900/30';
                    }

                    if (isCompleted) {
                      colorClass = 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
                      tag = `${tag} (Concluído)`;
                    }

                    return {
                      icon: isCompleted ? 'check_circle' : icon,
                      iconClass: colorClass,
                      tag: tag,
                    };
                  }
                })();

                return (
                  <div key={item.id} className="relative group/item">
                    {/* Event Icon badge container aligned to left margin line */}
                    <div className={cn(
                      "absolute -left-[31px] top-0.5 h-6 w-6 rounded-full flex items-center justify-center border text-xs shadow-sm transition-all group-hover/item:scale-110",
                      config.iconClass
                    )}>
                      <span className="material-symbols-outlined text-[14px] font-bold">{config.icon}</span>
                    </div>

                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        {config.tag}
                      </span>
                      <span className="text-[9px] text-slate-400 shrink-0 font-medium">
                        {format(item.date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 group-hover/item:text-primary transition-colors">
                      {item.title}
                    </p>
                    
                    {item.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-line leading-relaxed">
                        {item.description}
                      </p>
                    )}
                    
                    {item.createdBy && (
                      <p className="text-[9px] text-slate-400 mt-1 italic font-medium">
                        Por {item.createdBy}
                      </p>
                    )}
                  </div>
                );
              }) : (
                <p className="text-xs text-slate-400 text-center py-6 italic">Aguardando novos eventos...</p>
              )}
            </div>

            <Button 
              onClick={() => {
                setTimelineForm({ eventType: 'call', description: '' });
                setIsTimelineModalOpen(true);
              }}
              variant="outline" 
              className="w-full mt-6 h-10 text-xs font-bold bg-slate-50 dark:bg-slate-800 border-none hover:bg-primary hover:text-slate-950 transition-all shadow-sm"
            >
              Registrar Interação
            </Button>

            <Dialog open={isTimelineModalOpen} onOpenChange={setIsTimelineModalOpen}>
              <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 border-b bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                  <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">Registrar Interação</DialogTitle>
                  <DialogDescription className="text-slate-500 dark:text-slate-400">Registre uma nova interação realizada com o cliente na jornada de compra.</DialogDescription>
                </DialogHeader>
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Tipo de Interação</Label>
                    <Select 
                      value={timelineForm.eventType} 
                      onValueChange={(val) => setTimelineForm(prev => ({ ...prev, eventType: val }))}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none shadow-inner text-slate-900 dark:text-white">
                        <SelectValue placeholder="Selecione o tipo..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                        <SelectItem value="call">Ligação</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="meeting">Reunião</SelectItem>
                        <SelectItem value="note">Observação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Descrição</Label>
                    <Textarea 
                      value={timelineForm.description}
                      onChange={(e) => setTimelineForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descreva brevemente o que foi conversado ou observado..."
                      rows={5}
                      className="rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-primary shadow-inner text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <footer className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                  <DialogClose asChild><Button variant="ghost" className="flex-1 hover:bg-slate-200 dark:hover:bg-slate-800">Cancelar</Button></DialogClose>
                  <Button onClick={handleSaveTimelineLog} className="flex-1 bg-primary text-slate-900 font-bold h-11 rounded-xl shadow-lg border-none hover:brightness-110 transition-all">Registrar</Button>
                </footer>
              </DialogContent>
            </Dialog>

            {/* Modal de Nova Ação */}
            <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
              <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
                <header className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <span className="material-symbols-outlined text-primary">event_available</span>
                    Agendar Ação
                  </DialogTitle>
                </header>
                <div className="p-6 space-y-4 bg-white dark:bg-slate-900">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Tipo de Ação</Label>
                    <Select value={eventForm.type} onValueChange={(val) => setEventForm(prev => ({ ...prev, type: val }))}>
                      <SelectTrigger className="w-full h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-none">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tarefa">Tarefa/Follow-up</SelectItem>
                        <SelectItem value="reuniao">Reunião</SelectItem>
                        <SelectItem value="visita">Visita</SelectItem>
                        <SelectItem value="ligacao">Ligação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Título / Descrição</Label>
                    <Input 
                      value={eventForm.title}
                      onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: Ligar para confirmar envio..."
                      className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Data</Label>
                      <Input 
                        type="date"
                        value={eventForm.date}
                        onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                        className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Hora</Label>
                      <Input 
                        type="time"
                        value={eventForm.time}
                        onChange={(e) => setEventForm(prev => ({ ...prev, time: e.target.value }))}
                        className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
                <footer className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                  <DialogClose asChild><Button variant="ghost" className="flex-1 hover:bg-slate-200 dark:hover:bg-slate-800">Cancelar</Button></DialogClose>
                  <Button onClick={handleSaveEvent} className="flex-1 bg-primary text-slate-900 font-bold h-11 rounded-xl shadow-lg border-none hover:brightness-110 transition-all">Salvar</Button>
                </footer>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
);
  
  function setInitialFinancingData(data: typeof financingData) {
    setFinancingData(data);
  }
}
