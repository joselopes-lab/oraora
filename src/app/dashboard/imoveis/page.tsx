
'use client';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import Link from "next/link";
import { useCollection, useDoc, useFirestore, useMemoFirebase, useAuthContext, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, doc, arrayUnion, arrayRemove, where, getDocs, getDoc, writeBatch } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
// Add new imports
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { addDoc } from 'firebase/firestore'; // Using addDoc for the import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import locationData from '@/lib/location-data.json';
import { Badge } from "@/components/ui/badge";


type Property = {
  id: string;
  builderId: string; // ID of the 'constructors' collection document
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
  };
  localizacao: {
    cidade: string;
    estado: string;
  };
  midia: string[];
  isVisibleOnSite: boolean;
  caracteristicasimovel?: {
    quartos?: string[] | string;
    tipo?: string;
    vagas?: string;
    tamanho?: string;
  };
  areascomuns?: string[];
  personaIds?: string[];
};

type Constructor = {
    id: string;
    name: string;
};

type Portfolio = {
  propertyIds: string[];
}

type User = {
  userType: 'admin' | 'broker' | 'constructor';
  planId?: string;
};

// Type for the data structure in the JSON file
type PropertyImportData = {
  informacoesbasicas: {
    nome: string;
    status?: string;
    valor?: number;
    descricao?: string;
    previsaoentrega?: string;
    slogan?: string;
    slug?: string;
  };
  localizacao: {
    bairro: string;
    cidade: string;
    estado: string;
    endereco?: string;
    googleMapsLink?: string;
    googleStreetViewLink?: string;
  };
  midia?: string[];
  caracteristicasimovel: {
    tipo?: string;
    unidades?: {
      quartos?: string[] | string;
      vagasgaragem?: string;
    }
    tamanho?: string;
  };
  statusobra?: {
    fundacao?: string;
    estrutura?: string;
    alvenaria?: string;
    acabamentos?: string;
    pintura?: string;
  };
  areascomuns?: string[];
  caracteristicasbairro?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  youtubeVideoUrl?: string;
  isVisibleOnSite: boolean;
  personaIds?: string[];
};

type Persona = {
  id: string;
  name: string;
  minPrice?: number;
  maxPrice?: number;
  propertyTypes?: string[];
  bedrooms?: string[];
  garageSpaces?: string[] | string;
  amenities?: string[];
  description?: string;
  ticket?: string;
};


export default function ImoveisPage() {
    const { user, userProfile, isReady: isAuthReady } = useAuthContext();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

    // New state for import modal
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [importedCount, setImportedCount] = useState(0);
    const [skippedCount, setSkippedCount] = useState(0);
    const [isImportComplete, setIsImportComplete] = useState(false);
    const [importConstructorId, setImportConstructorId] = useState('');

    // State for pre-flight check
    const [importStep, setImportStep] = useState<'select' | 'confirm' | 'progress' | 'complete'>('select');
    const [propertiesToImport, setPropertiesToImport] = useState<PropertyImportData[]>([]);
    const [duplicatePropertyNames, setDuplicatePropertyNames] = useState<string[]>([]);
    const [fileToImport, setFileToImport] = useState<File | null>(null);

    // State for pagination & routing
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [currentPage, setCurrentPage] = useState(searchParams.get('page') ? parseInt(searchParams.get('page') as string, 10) : 1);
    const itemsPerPage = 10;
    
    // State for filters
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedState, setSelectedState] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedConstructor, setSelectedConstructor] = useState("all");

    useEffect(() => {
      const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string, 10) : 1;
      if(page !== currentPage) {
        setCurrentPage(page);
      }
    }, [searchParams, currentPage]);

    const parseQuartos = (quartosData: any): string[] => {
      if (!quartosData) return [];
  
      const dataAsString = Array.isArray(quartosData)
          ? quartosData.join(' ')
          : String(quartosData);
  
      const numbers = dataAsString.match(/\d+/g);
      if (!numbers || numbers.length === 0) {
          return [];
      }
  
      const quartosSet = new Set<string>();
      
      numbers.forEach(numStr => {
          const num = parseInt(numStr, 10);
          if (num >= 5) {
              quartosSet.add('5+');
          } else if (num > 0) {
              quartosSet.add(String(num));
          }
      });

      if (dataAsString.includes('5+')) {
          quartosSet.add('5+');
      }
      
      const sortedQuartos = Array.from(quartosSet).sort((a, b) => {
          const numA = parseInt(a);
          const numB = parseInt(b);
          return numA - numB;
      });

      return sortedQuartos;
    };


    const propertiesQuery = useMemoFirebase(
      () => {
        if (!firestore) return null;
        const propertiesRef = collection(firestore, 'properties');
        if (userProfile?.userType === 'broker') {
          return query(propertiesRef, where('isVisibleOnSite', '==', true));
        }
        return query(propertiesRef);
      },
      [firestore, userProfile]
    );

    // Query for all constructors to map builderId to a name
    const constructorsQuery = useMemoFirebase(
      () => (firestore ? query(collection(firestore, 'constructors')) : null),
      [firestore]
    );

    const portfolioDocRef = useMemoFirebase(
      () => (firestore && user ? doc(firestore, 'portfolios', user.uid) : null),
      [firestore, user]
    );
    
    const personasQuery = useMemoFirebase(
      () => (firestore ? query(collection(firestore, 'personas')) : null),
      [firestore]
    );

    const { data: properties, isLoading: arePropertiesLoading } = useCollection<Property>(propertiesQuery);
    const { data: constructors, isLoading: areConstructorsLoading } = useCollection<Constructor>(constructorsQuery);
    const { data: portfolio, isLoading: isPortfolioLoading } = useDoc<Portfolio>(portfolioDocRef);
    const { data: allPersonas, isLoading: arePersonasLoading } = useCollection<Persona>(personasQuery);

    const personaNameMap = useMemo(() => {
        if (!allPersonas) return {};
        return allPersonas.reduce((acc, persona) => {
            acc[persona.id] = persona.name;
            return acc;
        }, {} as Record<string, string>);
    }, [allPersonas]);

    const sortedConstructors = useMemo(() => {
      return constructors ? [...constructors].sort((a, b) => a.name.localeCompare(b.name)) : [];
    }, [constructors]);


    const { filteredProperties, constructorNameMap } = useMemo(() => {
        if (!properties || !constructors) {
            return { filteredProperties: [], constructorNameMap: {} };
        }

        const constructorMap = new Map(constructors.map(c => [c.id, c.name]));
        
        const filtered = properties.filter(property => {
            const constructorName = constructorMap.get(property.builderId) || "";
            const matchesSearchTerm = constructorName.toLowerCase().includes(searchTerm.toLowerCase()) || property.informacoesbasicas.nome.toLowerCase().includes(searchTerm.toLowerCase());
            
            const stateData = locationData.states.find(s => s.uf === selectedState || s.name === selectedState);
            const matchesState = selectedState === 'all' || (stateData && (property.localizacao.estado === stateData.uf || property.localizacao.estado === stateData.name));
            
            const status = property.informacoesbasicas.status?.trim();
            const matchesStatus = selectedStatus === 'all' 
              || (selectedStatus === 'nao-informado' && (!status || status === ''))
              || status === selectedStatus;
            
            const matchesConstructor = selectedConstructor === 'all' || property.builderId === selectedConstructor;

            return matchesSearchTerm && matchesState && matchesStatus && matchesConstructor;
        });

        return { 
            filteredProperties: filtered, 
            constructorNameMap: Object.fromEntries(constructorMap) 
        };
    }, [properties, constructors, searchTerm, selectedState, selectedStatus, selectedConstructor]);
    
    const totalPages = useMemo(() => {
        return Math.ceil(filteredProperties.length / itemsPerPage);
    }, [filteredProperties.length, itemsPerPage]);

    const paginatedProperties = useMemo(() => {
        return filteredProperties.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );
    }, [filteredProperties, currentPage, itemsPerPage]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            const current = new URLSearchParams(Array.from(searchParams.entries()));
            current.set('page', String(newPage));
            router.push(`${pathname}?${current.toString()}`);
        }
    };
    
    const handleNextPage = () => handlePageChange(currentPage + 1);
    const handlePrevPage = () => handlePageChange(currentPage - 1);


    const handleClearFilters = () => {
        setSearchTerm("");
        setSelectedState("all");
        setSelectedStatus("all");
        setSelectedConstructor("all");
        router.push(pathname);
    };

    const handleAddToPortfolio = async (propertyId: string) => {
        if (!user || !firestore || !userProfile) {
            toast({ title: "Erro", description: "Você precisa estar logado." });
            return;
        }
    
        // --- LIMIT CHECK ---
        if (userProfile.planId) {
            const planDocRef = doc(firestore, 'plans', userProfile.planId);
            const planDoc = await getDoc(planDocRef);
            
            if (planDoc.exists()) {
                const propertyLimit = planDoc.data()?.propertyLimit;
    
                if (propertyLimit !== undefined && propertyLimit !== null) {
                    // Get avulso count
                    const brokerPropertiesQuery = query(collection(firestore, 'brokerProperties'), where('brokerId', '==', user.uid));
                    const brokerPropertiesSnapshot = await getDocs(brokerPropertiesQuery);
                    const avulsoCount = brokerPropertiesSnapshot.size;
    
                    // Get portfolio count by fetching actual properties to avoid counting stale IDs
                    const portfolioDocRef = doc(firestore, 'portfolios', user.uid);
                    const portfolioDoc = await getDoc(portfolioDocRef);
                    const portfolioPropertyIds = portfolioDoc.exists() ? portfolioDoc.data()?.propertyIds || [] : [];
                    
                    let portfolioCount = 0;
                    if (portfolioPropertyIds.length > 0) {
                        const propertiesRef = collection(firestore, 'properties');
                        for (let i = 0; i < portfolioPropertyIds.length; i += 30) {
                            const batchIds = portfolioPropertyIds.slice(i, i + 30);
                            if (batchIds.length > 0) {
                                const q = query(propertiesRef, where('__name__', 'in', batchIds));
                                const propertiesSnap = await getDocs(q);
                                portfolioCount += propertiesSnap.size;
                            }
                        }
                    }
                    
                    const totalPropertyCount = avulsoCount + portfolioCount;
    
                    if (totalPropertyCount >= propertyLimit) {
                        toast({
                            variant: 'destructive',
                            title: 'Limite Atingido',
                            description: `Você atingiu o limite de ${propertyLimit} imóveis para o seu plano. Faça um upgrade para cadastrar mais.`,
                        });
                        return; // Stop execution
                    }
                }
            }
        }
        // --- END LIMIT CHECK ---
    
        const portfolioDocRef = doc(firestore, 'portfolios', user.uid);
        setDocumentNonBlocking(portfolioDocRef, {
            brokerId: user.uid,
            propertyIds: arrayUnion(propertyId)
        }, { merge: true });
    
        toast({
            title: "Imóvel Adicionado!",
            description: "O imóvel foi adicionado à sua carteira de destaques.",
        });
    };

    const handleRemoveFromPortfolio = (propertyId: string) => {
        if (!user || !firestore) return;

        const portfolioDocRef = doc(firestore, 'portfolios', user.uid);
        setDocumentNonBlocking(portfolioDocRef, {
            propertyIds: arrayRemove(propertyId)
        }, { merge: true });

        toast({
            variant: "destructive",
            title: "Imóvel Removido!",
            description: "O imóvel foi removido da sua carteira de destaques.",
        });
    };

    const handleDeleteProperty = () => {
        if (!propertyToDelete || !firestore) return;
        
        const propertyDocRef = doc(firestore, 'properties', propertyToDelete.id);
        deleteDocumentNonBlocking(propertyDocRef);

        toast({
            title: "Imóvel Excluído!",
            description: `O imóvel "${propertyToDelete.informacoesbasicas.nome}" foi removido com sucesso.`,
        });

        setPropertyToDelete(null);
    };

    const handleVisibilityChange = (property: Property, isVisible: boolean) => {
        if (!firestore || userProfile?.userType !== 'admin') return;

        const docRef = doc(firestore, 'properties', property.id);
        setDocumentNonBlocking(docRef, { isVisibleOnSite: isVisible }, { merge: true });

        toast({
            title: 'Visibilidade Alterada!',
            description: `O imóvel "${property.informacoesbasicas.nome}" agora está ${isVisible ? 'visível' : 'oculto'}.`,
        });
    };
    
    const handleFixQuartosData = async () => {
        if (!firestore || !properties) {
          toast({
            title: 'Erro',
            description: 'Não foi possível carregar os dados para a correção.',
            variant: 'destructive',
          });
          return;
        }
    
        toast({
          title: 'Iniciando correção...',
          description:
            'Aguarde enquanto analisamos e corrigimos os dados dos imóveis.',
        });
    
        try {
          const batch = writeBatch(firestore);
          let updatedCount = 0;
    
          for (const property of properties) {
            const quartosData = property.caracteristicasimovel?.quartos;
    
            if (typeof quartosData === 'string' && quartosData.trim() !== '') {
              const parsedQuartos = parseQuartos(quartosData);
              const originalQuartosString = JSON.stringify(quartosData);
              const parsedQuartosString = JSON.stringify(parsedQuartos);
              
              if(originalQuartosString !== parsedQuartosString) {
                 const propertyRef = doc(firestore, 'properties', property.id);
                 batch.update(propertyRef, { 'caracteristicasimovel.quartos': parsedQuartos });
                 updatedCount++;
              }
            }
          }
    
          if (updatedCount > 0) {
            await batch.commit();
            toast({
              title: 'Correção Concluída!',
              description: `${updatedCount} registros de imóveis foram atualizados com sucesso.`,
            });
          } else {
            toast({
              title: 'Nenhuma correção necessária.',
              description: 'Os dados de quartos já estão no formato correto.',
            });
          }
        } catch (error) {
          console.error("Erro durante a correção de dados:", error);
          toast({
            variant: "destructive",
            title: "Erro na Correção",
            description:
              "Não foi possível atualizar os dados. Verifique o console para mais detalhes.",
          });
        }
    };
    
    const isLoading = arePropertiesLoading || areConstructorsLoading || !isAuthReady || isPortfolioLoading || arePersonasLoading;
    const isAdmin = userProfile?.userType === 'admin';
    const isBroker = userProfile?.userType === 'broker';

    const resetImportState = () => {
      setIsImporting(false);
      setImportStep('select');
      setProgress(0);
      setImportedCount(0);
      setSkippedCount(0);
      setImportConstructorId('');
      setFileToImport(null);
      setPropertiesToImport([]);
      setDuplicatePropertyNames([]);
      // Reset file input
      const fileInput = document.getElementById('json-file') as HTMLInputElement;
      if(fileInput) fileInput.value = '';
    }
  
    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !firestore || !importConstructorId) {
            toast({
                variant: 'destructive',
                title: 'Pré-requisitos não atendidos',
                description: 'Selecione uma construtora e um arquivo JSON.',
            });
            return;
        }
        setFileToImport(file);
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                const dataToImport = JSON.parse(content) as PropertyImportData[];
                
                const q = query(collection(firestore, 'properties'), where('builderId', '==', importConstructorId));
                const querySnapshot = await getDocs(q);
                const existingPropertyNames = new Set(querySnapshot.docs.map(doc => doc.data().informacoesbasicas.nome.toLowerCase()));

                const newProps: PropertyImportData[] = [];
                const duplicates: string[] = [];

                dataToImport.forEach(item => {
                    if (item.informacoesbasicas?.nome && !existingPropertyNames.has(item.informacoesbasicas.nome.toLowerCase())) {
                        newProps.push(item);
                    } else {
                        duplicates.push(item.informacoesbasicas.nome);
                    }
                });

                setPropertiesToImport(newProps);
                setDuplicatePropertyNames(duplicates);
                setImportStep('confirm');
            } catch (error) {
                console.error("Erro ao processar o arquivo JSON:", error);
                toast({
                    variant: "destructive",
                    title: "Erro de Importação",
                    description: "O arquivo selecionado não é um JSON válido ou está mal formatado.",
                });
                resetImportState();
            }
        };
        reader.readAsText(file);
    };

    const executeImport = async () => {
      if (!firestore || propertiesToImport.length === 0 || !allPersonas) {
        toast({
          title: "Erro na Importação",
          description: "Não foi possível iniciar a importação. Verifique se há personas cadastradas e se o arquivo está correto.",
          variant: "destructive",
        });
        return;
      }
  
      setImportStep('progress');
      setIsImporting(true);
      
      let currentImported = 0;
  
      for (const item of propertiesToImport) {
          try {
              const matchingPersonaIds: string[] = [];

              // Auto-matching logic
              allPersonas.forEach(persona => {
                  let isMatch = true;
                  const propertyValue = item.informacoesbasicas.valor || 0;
                  
                  if ((persona.minPrice && propertyValue < persona.minPrice) || (persona.maxPrice && propertyValue > persona.maxPrice)) {
                      isMatch = false;
                  }

                  if (isMatch && persona.propertyTypes && persona.propertyTypes.length > 0) {
                      if (!persona.propertyTypes.includes(item.caracteristicasimovel?.tipo || '')) {
                          isMatch = false;
                      }
                  }

                  const propertyBedrooms = parseQuartos(item.caracteristicasimovel?.unidades?.quartos);
                  if (isMatch && persona.bedrooms && persona.bedrooms.length > 0) {
                      const hasMatchingBedrooms = propertyBedrooms.some(pBed => persona.bedrooms?.includes(pBed));
                      if (!hasMatchingBedrooms) {
                          isMatch = false;
                      }
                  }
                  
                  const propertyGarage = item.caracteristicasimovel?.unidades?.vagasgaragem || '';
                  if (isMatch && persona.garageSpaces) {
                      const garageSpacesArray = Array.isArray(persona.garageSpaces) 
                          ? persona.garageSpaces 
                          : String(persona.garageSpaces).split(',').map(s => s.trim());
                      
                      if (garageSpacesArray.length > 0) {
                          const hasMatchingGarage = garageSpacesArray.some(pGarage => {
                              if (pGarage.includes('+')) {
                                  const num = parseInt(pGarage.replace('+', ''));
                                  const propertyVagasNum = parseInt(propertyGarage);
                                  return !isNaN(propertyVagasNum) && propertyVagasNum >= num;
                              }
                              return propertyGarage.includes(pGarage);
                          });
                          if (!hasMatchingGarage) {
                              isMatch = false;
                          }
                      }
                  }

                  const propertyAmenities = item.areascomuns || [];
                  if (isMatch && persona.amenities && persona.amenities.length > 0) {
                      const hasMatchingAmenities = propertyAmenities.some(pAmenity => persona.amenities?.includes(pAmenity));
                      if (!hasMatchingAmenities) {
                          isMatch = false;
                      }
                  }

                  if (isMatch) {
                      matchingPersonaIds.push(persona.id);
                  }
              });

              const newDocRef = doc(collection(firestore, 'properties'));
              const dataToSave = {
                builderId: importConstructorId,
                informacoesbasicas: {
                    nome: item.informacoesbasicas.nome || '',
                    status: item.informacoesbasicas.status || 'Em Construção',
                    valor: item.informacoesbasicas.valor || 0,
                    descricao: item.informacoesbasicas.descricao || '',
                    previsaoentrega: item.informacoesbasicas.previsaoentrega || '',
                    slogan: item.informacoesbasicas.slogan || '',
                    slug: item.informacoesbasicas.slug || item.informacoesbasicas.nome.toLowerCase().replace(/\s+/g, '-'),
                },
                localizacao: {
                    bairro: item.localizacao.bairro || '',
                    cidade: item.localizacao.cidade || '',
                    estado: item.localizacao.estado || '',
                    address: item.localizacao.endereco || '',
                    googleMapsLink: item.localizacao.googleMapsLink || '',
                    googleStreetViewLink: item.localizacao.googleStreetViewLink || '',
                },
                midia: item.midia || [],
                caracteristicasimovel: {
                    tipo: item.caracteristicasimovel.tipo || 'Apartamento',
                    quartos: parseQuartos(item.caracteristicasimovel.unidades?.quartos),
                    vagas: item.caracteristicasimovel.unidades?.vagasgaragem || '',
                    tamanho: item.caracteristicasimovel.tamanho || '',
                },
                statusobra: item.statusobra ? {
                  fundacao: parseInt(item.statusobra.fundacao || '0', 10),
                  estrutura: parseInt(item.statusobra.estrutura || '0', 10),
                  alvenaria: parseInt(item.statusobra.alvenaria || '0', 10),
                  acabamentos: parseInt(item.statusobra.pintura || '0', 10),
                } : { fundacao: 0, estrutura: 0, alvenaria: 0, acabamentos: 0 },
                areascomuns: item.areascomuns || [],
                proximidades: item.caracteristicasbairro || [],
                seoTitle: item.seoTitle || '',
                seoDescription: item.seoDescription || '',
                seoKeywords: item.seoKeywords || '',
                youtubeVideoUrl: item.youtubeVideoUrl || '',
                isVisibleOnSite: item.isVisibleOnSite !== undefined ? item.isVisibleOnSite : true,
                personaIds: matchingPersonaIds,
                createdAt: new Date().toISOString(),
              };
              await setDoc(newDocRef, dataToSave);
              currentImported++;
          } catch(e) {
              console.error("Error writing document: ", e);
          }
          setProgress(((currentImported + duplicatePropertyNames.length) / (propertiesToImport.length + duplicatePropertyNames.length)) * 100);
      }
      
      setImportedCount(currentImported);
      setSkippedCount(duplicatePropertyNames.length);
      setIsImporting(false);
      setImportStep('complete');
  };

    const availableStates = useMemo(() => {
        if (!properties) return [];
        const states = new Set(properties.map(p => p.localizacao.estado));
        return Array.from(states).sort();
    }, [properties]);
    
    const handleStateMigration = async () => {
      if (!firestore || !isAdmin) return;

      toast({
          title: "Iniciando migração de dados de estado...",
          description: "Por favor, aguarde.",
      });

      try {
          const stateNameToUfMap = new Map(locationData.states.map(s => [s.name, s.uf]));
          let updatedCount = 0;
          const collectionsToScan = ['properties', 'brokerProperties'];
          const batch = writeBatch(firestore);

          for (const collectionName of collectionsToScan) {
              const snapshot = await getDocs(collection(firestore, collectionName));
              snapshot.forEach(docSnap => {
                  const data = docSnap.data();
                  const currentEstado = data.localizacao?.estado;
                  
                  if (currentEstado && stateNameToUfMap.has(currentEstado)) {
                      const uf = stateNameToUfMap.get(currentEstado);
                      const propertyRef = doc(firestore, collectionName, docSnap.id);
                      batch.update(propertyRef, { 'localizacao.estado': uf });
                      updatedCount++;
                  }
              });
          }
          
          if (updatedCount > 0) {
              await batch.commit();
              toast({
                  title: "Migração Concluída!",
                  description: `${updatedCount} registros de imóveis foram atualizados com sucesso.`,
              });
          } else {
              toast({
                  title: "Nenhuma atualização necessária.",
                  description: "Os dados de estado já parecem estar no formato correto.",
              });
          }

      } catch (error) {
          console.error("Erro durante a migração de dados:", error);
          toast({
              variant: "destructive",
              title: "Erro na Migração",
              description: "Não foi possível atualizar os dados. Verifique o console para mais detalhes.",
          });
      }
    };
    
    const handleLinkPersonas = async () => {
        if (!firestore || !properties || !allPersonas) {
          toast({
            title: "Erro",
            description: "Não foi possível carregar os dados necessários para a vinculação.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Iniciando vinculação...",
          description: "Analisando imóveis e personas. Isso pode levar alguns minutos.",
        });

        try {
          const batch = writeBatch(firestore);
          let updatedCount = 0;

          for (const property of properties) {
            const matchingPersonaIds: string[] = [];

            for (const persona of allPersonas) {
              let isMatch = true;
              const propertyValue = property.informacoesbasicas.valor || 0;
              
              if ((persona.minPrice && propertyValue < persona.minPrice) || (persona.maxPrice && propertyValue > persona.maxPrice)) {
                isMatch = false;
              }

              if (isMatch && persona.propertyTypes && persona.propertyTypes.length > 0) {
                if (!persona.propertyTypes.includes(property.caracteristicasimovel?.tipo || '')) {
                  isMatch = false;
                }
              }

              const propertyBedrooms = parseQuartos(property.caracteristicasimovel?.quartos);
              if (isMatch && persona.bedrooms && persona.bedrooms.length > 0) {
                const hasMatchingBedrooms = propertyBedrooms.some(pBed => persona.bedrooms?.includes(pBed));
                if (!hasMatchingBedrooms) {
                  isMatch = false;
                }
              }
              
              const propertyGarage = property.caracteristicasimovel?.vagas || '';
              if (isMatch && persona.garageSpaces) {
                  const garageSpacesArray = Array.isArray(persona.garageSpaces) 
                      ? persona.garageSpaces 
                      : String(persona.garageSpaces).split(',').map(s => s.trim());
                  
                  if (garageSpacesArray.length > 0) {
                      const hasMatchingGarage = garageSpacesArray.some(pGarage => {
                          if (pGarage.includes('+')) {
                              const num = parseInt(pGarage.replace('+', ''));
                              const propertyVagasNum = parseInt(propertyGarage);
                              return !isNaN(propertyVagasNum) && propertyVagasNum >= num;
                          }
                          return propertyGarage.includes(pGarage);
                      });
                      if (!hasMatchingGarage) {
                          isMatch = false;
                      }
                  }
              }

              const propertyAmenities = property.areascomuns || [];
              if (isMatch && persona.amenities && persona.amenities.length > 0) {
                const hasMatchingAmenities = propertyAmenities.some(pAmenity => persona.amenities?.includes(pAmenity));
                if (!hasMatchingAmenities) {
                  isMatch = false;
                }
              }

              if (isMatch) {
                matchingPersonaIds.push(persona.id);
              }
            }

            // Check if the personaIds have actually changed before adding to batch
            const existingPersonaIds = new Set(property.personaIds || []);
            const newPersonaIds = new Set(matchingPersonaIds);
            
            if (existingPersonaIds.size !== newPersonaIds.size || ![...existingPersonaIds].every(id => newPersonaIds.has(id))) {
                const propertyRef = doc(firestore, 'properties', property.id);
                batch.update(propertyRef, { personaIds: matchingPersonaIds });
                updatedCount++;
            }
          }

          if (updatedCount > 0) {
            await batch.commit();
            toast({
              title: "Vinculação Concluída!",
              description: `${updatedCount} imóveis foram atualizados com novas personas.`,
            });
          } else {
            toast({
              title: "Nenhuma atualização necessária.",
              description: "Todos os imóveis já estão corretamente vinculados às suas personas.",
            });
          }
        } catch (error) {
          console.error("Erro ao vincular personas:", error);
          toast({
            variant: "destructive",
            title: "Erro na Vinculação",
            description: "Ocorreu um erro ao tentar vincular os imóveis às personas.",
          });
        }
    };


    return (
        <AlertDialog>
          <Dialog open={isImportModalOpen} onOpenChange={(isOpen) => { if (!isImporting) { setIsImportModalOpen(isOpen); resetImportState(); } }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-main tracking-tight">Imóveis de Construtoras</h1>
                    <p className="text-text-secondary mt-1">Navegue pelo catálogo de empreendimentos das construtoras parceiras.</p>
                </div>
                <div className="flex items-center gap-3">
                    {isAdmin && (
                        <>
                          <Button onClick={() => setIsImportModalOpen(true)} variant="outline" className="bg-white border border-gray-200 hover:bg-gray-50 text-text-main font-medium py-2.5 px-5 rounded-lg transition-all duration-300 flex items-center gap-2">
                              <span className="material-symbols-outlined text-[20px]">upload</span>
                              Importar via JSON
                          </Button>
                          <Button onClick={handleStateMigration} variant="outline" className="bg-white border border-orange-200 text-orange-700 hover:bg-orange-50 font-medium py-2.5 px-5 rounded-lg transition-all duration-300 flex items-center gap-2">
                              <span className="material-symbols-outlined text-[20px]">map</span>
                              Padronizar Estados
                          </Button>
                          <Button onClick={handleFixQuartosData} variant="outline" className="bg-white border border-orange-200 text-orange-700 hover:bg-orange-50 font-medium py-2.5 px-5 rounded-lg transition-all duration-300 flex items-center gap-2">
                              <span className="material-symbols-outlined text-[20px]">construction</span>
                              Corrigir Dados
                          </Button>
                          <Button onClick={handleLinkPersonas} variant="outline" className="bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 font-medium py-2.5 px-5 rounded-lg transition-all duration-300 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">link</span>
                            Vincular Personas
                          </Button>
                          <Button asChild className="bg-secondary text-white hover:text-black font-bold py-2.5 px-5 rounded-lg shadow-sm hover:shadow-glow transition-all duration-300 flex items-center gap-2 group">
                              <Link href="/dashboard/imoveis/nova">
                                  <span className="material-symbols-outlined text-[20px]">add</span>
                                  <span className='text-white group-hover:text-black'>Novo Imóvel</span>
                              </Link>
                          </Button>
                        </>
                    )}
                </div>
            </div>
             <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-5 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-[20px]">filter_alt</span>
                        Filtros de Busca
                    </h3>
                    <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-xs font-semibold">
                        Limpar Filtros
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <Label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Construtora ou Imóvel</Label>
                    <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                    <Input
                        className="w-full pl-9 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400"
                        placeholder="Buscar por nome..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1); 
                        }}
                    />
                    </div>
                </div>
                 <div>
                    <Label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Construtora</Label>
                    <Select
                        value={selectedConstructor}
                        onValueChange={(value) => {
                            setSelectedConstructor(value);
                            setCurrentPage(1);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            {sortedConstructors.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Estado</Label>
                     <Select
                        value={selectedState}
                        onValueChange={(value) => {
                            setSelectedState(value);
                            setCurrentPage(1);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {availableStates.map(state => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                  <Label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Status</Label>
                    <Select
                        value={selectedStatus}
                        onValueChange={(value) => {
                            setSelectedStatus(value);
                            setCurrentPage(1);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="Lançamento">Lançamento</SelectItem>
                            <SelectItem value="Em Construção">Em Construção</SelectItem>
                            <SelectItem value="Pronto para Morar">Pronto para Morar</SelectItem>
                            <SelectItem value="nao-informado">Não Informado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden mb-8">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-text-secondary">
                                <TableHead className="px-6 py-4 font-bold">Empreendimento</TableHead>
                                <TableHead className="px-6 py-4 font-bold">Construtora</TableHead>
                                <TableHead className="px-6 py-4 font-bold">Personas</TableHead>
                                <TableHead className="px-6 py-4 font-bold text-center">Visibilidade</TableHead>
                                <TableHead className="px-6 py-4 font-bold text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 bg-white">
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="text-center p-10 text-text-secondary">Carregando imóveis...</TableCell></TableRow>
                            ) : paginatedProperties && paginatedProperties.length > 0 ? (
                                paginatedProperties.map(property => {
                                    const isInPortfolio = portfolio?.propertyIds?.includes(property.id);
                                    return (
                                    <TableRow key={property.id} className="group hover:bg-background-light/50 transition-colors">
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-16 w-24 rounded-lg overflow-hidden bg-gray-200 shrink-0 border border-gray-100">
                                                    <Image alt={property.informacoesbasicas.nome} className="h-full w-full object-cover" src={property.midia?.[0] || 'https://placehold.co/100x100'} width={96} height={64} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-text-main text-base">{property.informacoesbasicas.nome}</p>
                                                    <p className="text-text-secondary text-xs">{property.localizacao.cidade}, {property.localizacao.estado}</p>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${property.informacoesbasicas.status === 'Lançamento' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{property.informacoesbasicas.status}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                         <TableCell className="px-6 py-4 text-text-secondary font-medium">
                                            {constructorNameMap[property.builderId] || 'N/A'}
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {property.personaIds && property.personaIds.length > 0 ? (
                                                    property.personaIds.map(pid => (
                                                        <Badge key={pid} variant="outline" className="font-medium">
                                                            {personaNameMap[pid] || '...'}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-text-secondary">N/A</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className='flex items-center justify-center gap-2'>
                                                <Switch
                                                id={`visibility-${property.id}`}
                                                checked={property.isVisibleOnSite}
                                                onCheckedChange={(checked) => handleVisibilityChange(property, checked)}
                                                disabled={!isAdmin}
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {isBroker && (
                                                    <>
                                                        {isInPortfolio ? (
                                                            <Button variant="default" size="sm" onClick={() => handleRemoveFromPortfolio(property.id)}>
                                                                <span className="material-symbols-outlined text-sm mr-1.5">star_outline</span>
                                                                Na Carteira
                                                            </Button>
                                                        ) : (
                                                            <Button variant="outline" size="sm" onClick={() => handleAddToPortfolio(property.id)}>
                                                                <span className="material-symbols-outlined text-sm mr-1.5">star</span>
                                                                Add à Carteira
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                                {isAdmin && (
                                                    <>
                                                        <Button asChild variant="outline" size="sm">
                                                          <Link href={`/dashboard/imoveis/editar/${property.id}?page=${currentPage}`}>
                                                                <span className="material-symbols-outlined text-sm mr-1.5">edit</span>
                                                                Editar
                                                            </Link>
                                                        </Button>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="sm" onClick={() => setPropertyToDelete(property)}>
                                                                <span className="material-symbols-outlined text-sm mr-1.5">delete</span>
                                                                Excluir
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                    </>
                                                )}
                                                 <Button asChild variant="ghost" size="icon" className="p-2 text-text-secondary hover:text-primary hover:bg-gray-100 rounded-lg transition-colors" title="Ver no site público">
                                                  <Link href={`/imoveis/${property.id}`} target="_blank">
                                                    <span className="material-symbols-outlined text-[20px]">public</span>
                                                  </Link>
                                                </Button>
                                                <Button asChild variant="ghost" size="icon" className="p-2 text-text-secondary hover:text-primary hover:bg-gray-100 rounded-lg transition-colors" title="Ver Detalhes">
                                                    <Link href={`/dashboard/imoveis/${property.id}`}>
                                                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                    </Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    )
                                })
                             ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center p-10 text-text-secondary">
                                        Nenhum imóvel de construtora encontrado.
                                    </TableCell>
                                </TableRow>
                             )}
                        </TableBody>
                    </Table>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between">
                    <p className="text-xs text-text-secondary">
                        Mostrando <span className="font-bold text-text-main">
                        {filteredProperties.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
                        {Math.min(currentPage * itemsPerPage, filteredProperties.length)}
                        </span> de <span className="font-bold text-text-main">{filteredProperties.length}</span> imóveis
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="size-8" onClick={handlePrevPage} disabled={currentPage === 1}>
                            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                        </Button>
                        <span className="text-xs font-bold">{currentPage} de {totalPages}</span>
                        <Button variant="outline" size="icon" className="size-8" onClick={handleNextPage} disabled={currentPage === totalPages}>
                            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                        </Button>
                    </div>
                </div>
            </div>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o imóvel <span className="font-bold">{propertyToDelete?.informacoesbasicas.nome}</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setPropertyToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteProperty} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Sim, excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
            <DialogContent onInteractOutside={(e) => { if (isImporting) e.preventDefault(); }} className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Importar Imóveis via JSON</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    {importStep === 'select' && (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="constructor-select">1. Selecione a Construtora</Label>
                                <Select onValueChange={setImportConstructorId} value={importConstructorId}>
                                    <SelectTrigger id="constructor-select" className="w-full">
                                    <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {sortedConstructors.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="json-file" className={!importConstructorId ? 'text-muted-foreground' : ''}>2. Selecione o Arquivo JSON</Label>
                                <Input id="json-file" type="file" accept=".json" onChange={handleFileSelect} disabled={!importConstructorId} />
                            </div>
                        </div>
                    )}
                     {importStep === 'confirm' && (
                        <div className="space-y-4 text-sm">
                            <h3 className="font-bold">Confirmação de Importação</h3>
                            <p>Construtora: <span className="font-medium">{constructorNameMap[importConstructorId]}</span></p>
                            <div className="p-3 bg-green-50 text-green-800 rounded-lg border border-green-200">
                                <span className="font-bold">{propertiesToImport.length}</span> novos imóveis serão importados.
                            </div>
                            {duplicatePropertyNames.length > 0 && (
                                <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                                    <span className="font-bold">{duplicatePropertyNames.length}</span> imóveis já existem e serão ignorados.
                                </div>
                            )}
                        </div>
                    )}
                    {importStep === 'progress' && (
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                Importando imóveis, por favor aguarde...
                            </p>
                            <Progress value={progress} className="w-full" />
                            <p className="text-xs text-right text-muted-foreground">{Math.round(progress)}% ({importedCount}/{propertiesToImport.length})</p>
                        </div>
                    )}
                    {importStep === 'complete' && (
                        <div className="text-center space-y-4 p-4 rounded-lg bg-muted border">
                            <span className="material-symbols-outlined text-5xl text-green-500">task_alt</span>
                            <h3 className="text-lg font-bold text-foreground">Importação Concluída</h3>
                            <p className="text-sm text-muted-foreground">
                                <span className="font-bold text-green-600">{importedCount}</span> imóvel(is) importado(s) com sucesso.
                                <br/>
                                <span className="font-bold text-foreground">{skippedCount}</span> duplicado(s) foram ignorados.
                            </p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    {importStep === 'select' && (
                        <Button type="button" variant="secondary" onClick={() => { setIsImportModalOpen(false); resetImportState(); }}>
                            Fechar
                        </Button>
                    )}
                     {importStep === 'confirm' && (
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={resetImportState}>Cancelar</Button>
                            <Button type="button" onClick={executeImport}>Confirmar e Importar</Button>
                        </div>
                    )}
                     {(importStep === 'progress' || importStep === 'complete') && (
                        <Button type="button" variant="secondary" onClick={() => { setIsImportModalOpen(false); resetImportState(); }}>
                            Fechar
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
          </Dialog>
        </AlertDialog>
    );
}
