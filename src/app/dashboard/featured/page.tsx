
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Star, Trash2 } from 'lucide-react';
import { getFeaturedProperties, revalidateFeatured } from './actions';
import { type Property } from '../properties/page';
import Image from 'next/image';

export default function FeaturedPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [featured1, setFeatured1] = useState<string | undefined>(undefined);
  const [featured2, setFeatured2] = useState<string | undefined>(undefined);
  const [featured3, setFeatured3] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      
      const q = query(collection(db, 'properties'), where('isVisibleOnSite', '==', true));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const propsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        setProperties(propsData);
      });

      const featuredIds = await getFeaturedProperties();
      if (featuredIds.length > 0) setFeatured1(featuredIds[0]);
      if (featuredIds.length > 1) setFeatured2(featuredIds[1]);
      if (featuredIds.length > 2) setFeatured3(featuredIds[2]);
      
      setIsLoading(false);
      return () => unsubscribe();
    };

    fetchInitialData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const propertyIds = [featured1, featured2, featured3].filter((id): id is string => !!id);

    try {
        const docRef = doc(db, 'settings', 'featured');
        await setDoc(docRef, { propertyIds });
        await revalidateFeatured();
        toast({
            title: 'Sucesso!',
            description: 'Imóveis em destaque atualizados com sucesso.',
        });
    } catch (error: any) {
        let message = 'Ocorreu um erro ao salvar.';
        if (error.code === 'permission-denied') {
            message = 'Permissão negada. Verifique as regras de segurança do Firestore.';
        }
        toast({
            variant: 'destructive',
            title: 'Erro ao salvar',
            description: message,
        });
    } finally {
        setIsSaving(false);
    }
  };

  const getAvailableProperties = (excludeId?: string) => {
      const selectedIds = new Set([featured1, featured2, featured3].filter(Boolean));
      if (excludeId) {
          selectedIds.delete(excludeId);
      }
      return properties.filter(p => !selectedIds.has(p.id));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star />
          Gerenciar Destaques
        </CardTitle>
        <CardDescription>
          Selecione os 3 imóveis que aparecerão no topo dos resultados de busca, na ordem desejada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
            properties.length > 0 ? (
                <div className="space-y-8 max-w-2xl mx-auto">
                    {[
                        { label: 'Destaque 1', value: featured1, setter: setFeatured1 },
                        { label: 'Destaque 2', value: featured2, setter: setFeatured2 },
                        { label: 'Destaque 3', value: featured3, setter: setFeatured3 },
                    ].map((item, index) => {
                        const availableProps = getAvailableProperties(item.value);
                        const selectedProp = item.value ? properties.find(p => p.id === item.value) : null;
                        return (
                            <div key={index} className="space-y-2">
                                <Label className="font-bold text-lg">{item.label}</Label>
                                <div className="flex items-center gap-2">
                                <Select onValueChange={(val) => item.setter(val === 'none' ? undefined : val)} value={item.value || 'none'}>
                                    <SelectTrigger className="h-14">
                                        <SelectValue>
                                            {selectedProp ? (
                                                <div className="flex items-center gap-3">
                                                    <Image 
                                                        src={selectedProp.midia?.[0] || 'https://placehold.co/40x40.png'} 
                                                        width={40} 
                                                        height={40} 
                                                        className="h-10 w-10 rounded-md object-cover"
                                                        alt={selectedProp.informacoesbasicas.nome}
                                                        data-ai-hint="property exterior"
                                                    />
                                                    <span className="font-semibold">{selectedProp.informacoesbasicas.nome}</span>
                                                </div>
                                            ) : (
                                                <span>Selecione um imóvel...</span>
                                            )}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhum</SelectItem>
                                        {selectedProp && (
                                            <SelectItem value={selectedProp.id}>
                                                <div className="flex items-center gap-3">
                                                    <Image 
                                                        src={selectedProp.midia?.[0] || 'https://placehold.co/40x40.png'} 
                                                        width={24} 
                                                        height={24} 
                                                        className="h-6 w-6 rounded-sm object-cover"
                                                        alt={selectedProp.informacoesbasicas.nome}
                                                        data-ai-hint="property exterior"
                                                    />
                                                    <span>{selectedProp.informacoesbasicas.nome}</span>
                                                </div>
                                            </SelectItem>
                                        )}
                                        {availableProps.map(prop => (
                                            <SelectItem key={prop.id} value={prop.id}>
                                                <div className="flex items-center gap-3">
                                                    <Image 
                                                        src={prop.midia?.[0] || 'https://placehold.co/40x40.png'} 
                                                        width={24} 
                                                        height={24} 
                                                        className="h-6 w-6 rounded-sm object-cover"
                                                        alt={prop.informacoesbasicas.nome}
                                                        data-ai-hint="property exterior"
                                                    />
                                                    <span>{prop.informacoesbasicas.nome}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                 <Button variant="ghost" size="icon" onClick={() => item.setter(undefined)} disabled={!item.value}>
                                    <Trash2 className="h-5 w-5 text-muted-foreground"/>
                                </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
                    <p className="text-muted-foreground">Nenhum imóvel visível encontrado para selecionar.</p>
                    <p className="text-xs text-muted-foreground mt-2">Certifique-se de que os imóveis estão com a opção "Visível no site público" ativada.</p>
                </div>
            )
        )}
      </CardContent>
       <CardFooter className="border-t px-6 py-4">
        <Button onClick={handleSave} disabled={isSaving || isLoading}>
          {isSaving ? <Loader2 className="animate-spin" /> : 'Salvar Destaques'}
        </Button>
      </CardFooter>
    </Card>
  );
}
