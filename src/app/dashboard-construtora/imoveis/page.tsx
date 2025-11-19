'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { type Property } from '@/app/dashboard/properties/page';
import PropertyCard from '@/components/property-card';
import { Loader2, Building, PlusCircle, FilePen, Eye, MousePointerClick } from 'lucide-react';
import { usePropertyActions } from '@/hooks/use-property-actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ConstrutoraImoveisPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const router = useRouter();
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const { 
        selectedProperty, 
        isSheetOpen, 
        handleViewDetails, 
        setIsSheetOpen,
        PropertyDetailSheet
    } = usePropertyActions({ id: user?.uid || '', name: user?.displayName || ''});

    useEffect(() => {
        if (!user) {
            if (!loadingAuth) setIsLoading(false);
            return;
        }

        const propertiesQuery = query(collection(db, 'properties'), where('builderId', '==', user.uid));
        const unsubscribe = onSnapshot(propertiesQuery, (snapshot) => {
            const propsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
            setProperties(propsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Erro ao buscar imóveis: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user, loadingAuth]);

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                <Building className="h-10 w-10 mt-2"/>
                <div>
                    <h1 className="text-6xl font-thin tracking-tight">Meus Imóveis</h1>
                    <p className="font-light text-[23px] text-black">Gerencie todos os seus empreendimentos cadastrados.</p>
                </div>
            </div>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        {/* Title removed from here to avoid duplication */}
                    </div>
                    <Button size="sm" onClick={() => router.push('/dashboard-construtora/properties/edit/new')}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Cadastrar Novo Imóvel
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading || loadingAuth ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : properties.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {properties.map(prop => (
                                <div key={prop.id} className="flex flex-col">
                                    <PropertyCard 
                                        property={prop} 
                                        layout="horizontal"
                                        onViewDetails={() => handleViewDetails(prop)}
                                    />
                                    <div className="p-3 bg-muted/50 rounded-b-lg border-x border-b flex justify-around text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1.5" title="Visualizações">
                                            <Eye className="h-4 w-4"/>
                                            <span>{prop.views || 0}</span>
                                        </div>
                                         <div className="flex items-center gap-1.5" title="Cliques">
                                            <MousePointerClick className="h-4 w-4"/>
                                            <span>{prop.clicks || 0}</span>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex gap-2">
                                        <Button 
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => router.push(`/dashboard-construtora/properties/edit/${prop.id}`)}
                                        >
                                            <FilePen className="mr-2 h-4 w-4" />
                                            Editar
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">Você ainda não possui imóveis cadastrados.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {selectedProperty && (
                <PropertyDetailSheet 
                    property={selectedProperty} 
                    brokerId={user?.uid || ''} 
                    isOpen={isSheetOpen} 
                    onOpenChange={setIsSheetOpen} 
                />
            )}
        </div>
    )
}
