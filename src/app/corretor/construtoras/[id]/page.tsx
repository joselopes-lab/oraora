
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, Building2, Mail, Phone, Instagram, Home, Loader2, PlusCircle, CheckCircle } from 'lucide-react';
import PropertyCard from '@/components/property-card';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useToast } from '@/hooks/use-toast';
import { type Property } from '@/app/dashboard/properties/page';
import { usePropertyActions } from '@/hooks/use-property-actions';
import { useAuth } from '@/context/auth-context';

interface Builder {
  id: string;
  name: string;
  address: string;
  state: string;
  city: string;
  instagram: string;
  phone: string;
  whatsapp: string;
  email: string;
}

export default function BuilderDetailPageCorretor() {
  const params = useParams();
  const { toast } = useToast();
  const { user, propertyCount, propertyLimit } = useAuth();
  const builderId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [builder, setBuilder] = useState<Builder | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [portfolioPropertyIds, setPortfolioPropertyIds] = useState<string[]>([]);
  const [hiddenPropertyIds, setHiddenPropertyIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { 
    selectedProperty, 
    isSheetOpen, 
    handleViewDetails, 
    setIsSheetOpen,
    PropertyDetailSheet
  } = usePropertyActions({ id: builder?.id || '', name: builder?.name || '', whatsapp: builder?.whatsapp }, 'broker-panel');


  useEffect(() => {
    if (!builderId) return;

    const fetchBuilderAndProperties = async () => {
      setIsLoading(true);
      try {
        const builderDocRef = doc(db, 'builders', builderId);
        const builderDocSnap = await getDoc(builderDocRef);

        if (!builderDocSnap.exists() || !builderDocSnap.data().isVisibleOnSite) {
          notFound();
          return;
        }
        setBuilder({ id: builderDocSnap.id, ...builderDocSnap.data() } as Builder);

        const propertiesQuery = query(
          collection(db, 'properties'),
          where('builderId', '==', builderId),
          where('isVisibleOnSite', '==', true)
        );
        const propertiesSnapshot = await getDocs(propertiesQuery);
        const propertiesData = propertiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        setProperties(propertiesData);

      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuilderAndProperties();
  }, [builderId]);
  
 useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setPortfolioPropertyIds(data.portfolioPropertyIds || []);
        setHiddenPropertyIds(data.hiddenPortfolioPropertyIds || []);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const togglePortfolio = async () => {
    if (!user || !builderId || properties.length === 0) return;
    const userDocRef = doc(db, 'users', user.uid);
    const builderPropertyIds = properties.map(p => p.id);

    try {
        const allInPortfolio = builderPropertyIds.every(id => portfolioPropertyIds.includes(id));
        if (allInPortfolio) {
            await updateDoc(userDocRef, { 
                portfolioPropertyIds: arrayRemove(...builderPropertyIds),
                hiddenPortfolioPropertyIds: arrayRemove(...builderPropertyIds)
            });
            toast({ title: "Removido da Carteira!" });
        } else {
             if (propertyLimit !== null) {
                const newPropertiesCount = builderPropertyIds.filter(id => !portfolioPropertyIds.includes(id)).length;
                if (propertyCount + newPropertiesCount > propertyLimit) {
                    toast({ variant: 'destructive', title: "Limite do plano atingido!", description: "Você não pode adicionar mais imóveis." });
                    return;
                }
            }
            await updateDoc(userDocRef, { portfolioPropertyIds: arrayUnion(...builderPropertyIds) });
            toast({ title: "Adicionado à Carteira!" });
        }
    } catch (error) {
        toast({ variant: 'destructive', title: "Erro ao atualizar a carteira." });
    }
  };

  const handleToggleVisibility = async (propertyId: string, isVisible: boolean) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
        if (isVisible) {
            await updateDoc(userDocRef, { hiddenPortfolioPropertyIds: arrayRemove(propertyId) });
            toast({ title: 'Imóvel agora está visível no seu site.' });
        } else {
            await updateDoc(userDocRef, { hiddenPortfolioPropertyIds: arrayUnion(propertyId) });
            toast({ title: 'Imóvel agora está oculto no seu site.' });
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro ao alterar visibilidade.' });
    }
  };

  const allBuilderPropertiesInPortfolio = properties.length > 0 && properties.every(p => portfolioPropertyIds.includes(p.id));
  const isLimitReached = propertyLimit !== null && propertyCount >= propertyLimit;

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Carregando dados da construtora...</p>
      </div>
    );
  }

  if (!builder) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Construtora não encontrada</h2>
        <Link href="/corretor/construtoras" passHref>
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a lista
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link href="/corretor/construtoras" passHref>
            <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para a Lista de Construtoras
            </Button>
        </Link>
        {properties.length > 0 && (
            <Button 
                variant={allBuilderPropertiesInPortfolio ? 'secondary' : 'default'} 
                onClick={togglePortfolio}
                disabled={isLimitReached && !allBuilderPropertiesInPortfolio}
            >
                {allBuilderPropertiesInPortfolio ? <CheckCircle className="mr-2 h-4 w-4"/> : <PlusCircle className="mr-2 h-4 w-4"/>}
                {allBuilderPropertiesInPortfolio ? 'Na sua carteira' : 'Adicionar à carteira'}
            </Button>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <span>{builder.name}</span>
          </CardTitle>
          <CardDescription>{builder.address}, {builder.city} - {builder.state}</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span>{builder.phone || 'Não informado'}</span>
            </div>
             <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span>{builder.email || 'Não informado'}</span>
            </div>
             <div className="flex items-center gap-3">
                <Instagram className="h-5 w-5 text-muted-foreground" />
                <a href={builder.instagram ? `https://instagram.com/${builder.instagram.replace('@','')}`: '#'} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {builder.instagram || 'Não informado'}
                </a>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home />
            Imóveis da Construtora
          </CardTitle>
          <CardDescription>
            Lista de imóveis de {builder.name} disponíveis no site.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {properties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map(prop => {
                        const isInPortfolio = portfolioPropertyIds.includes(prop.id);
                        return (
                           <PropertyCard 
                                key={prop.id} 
                                property={prop} 
                                variant={isInPortfolio ? 'portfolio' : 'default'}
                                onToggleVisibility={isInPortfolio ? handleToggleVisibility : undefined}
                                isPubliclyVisible={isInPortfolio ? !hiddenPropertyIds.includes(prop.id) : undefined}
                                hideClientActions={true}
                                onViewDetails={() => handleViewDetails(prop)}
                            />
                        )
                    })}
                </div>
            ) : (
                 <div className="h-24 text-center flex items-center justify-center">
                    <p>Nenhum imóvel encontrado para esta construtora.</p>
                </div>
            )}
        </CardContent>
      </Card>
      
       {selectedProperty && user && (
            <PropertyDetailSheet
                property={selectedProperty}
                brokerId={user.uid}
                brokerWhatsApp={user.phoneNumber}
                isOpen={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                source="broker-panel"
            />
        )}
    </div>
  );
}
