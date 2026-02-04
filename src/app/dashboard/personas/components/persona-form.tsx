
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from "@/components/ui/checkbox";
import { useCollection, useFirestore, useMemoFirebase, useUser, useFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { uploadFile } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";


const personaSchema = z.object({
    name: z.string().min(1, { message: 'O nome é obrigatório.' }),
    description: z.string().optional(),
    propertyTypes: z.array(z.string()).optional(),
    bedrooms: z.array(z.string()).optional(),
    garageSpaces: z.array(z.string()).optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    amenities: z.array(z.string()).optional(),
    imageUrl: z.string().optional(),
});

export type PersonaFormData = z.infer<typeof personaSchema>;

type PersonaFormProps = {
    personaData?: Partial<PersonaFormData>;
    onSave: (data: PersonaFormData) => void;
    isEditing?: boolean;
    isSubmitting?: boolean;
};

type Persona = {
  id: string;
  name: string;
  icon: string;
  iconBackgroundColor: string;
};

type UploadState = {
  progress: number;
  isUploading: boolean;
  error: string | null;
};

const propertyTypeOptions = ['Casa em Condomínio', 'Apartamento', 'Lote Terreno', 'Cobertura'];
const bedroomOptions = ['1', '2', '3', '4', '5+'];
const garageOptions = ['Vaga Rotativa', '1', '2', '3', '4+'];
const amenityOptions = [
    { id: 'academia', label: 'Academia', icon: 'fitness_center' },
    { id: 'piscina', label: 'Piscina', icon: 'pool' },
    { id: 'salao_festas', label: 'Salão de Festas', icon: 'celebration' },
    { id: 'espaco_gourmet', label: 'Espaço Gourmet', icon: 'outdoor_grill' },
    { id: 'quadra', label: 'Quadra', icon: 'sports_tennis' },
    { id: 'churrasqueira', label: 'Churrasqueira', icon: 'deck' },
]

export default function PersonaForm({ onSave, isEditing, personaData, isSubmitting }: PersonaFormProps) {
  const { firestore, user, storage } = useFirebase();
  const { toast } = useToast();
  const [uploadState, setUploadState] = useState<UploadState>({ progress: 0, isUploading: false, error: null });
    
    const personasQuery = useMemoFirebase(
      () => (firestore ? query(collection(firestore, 'personas'), where('status', '==', 'Ativo')) : null),
      [firestore]
    );
    const { data: personas, isLoading: arePersonasLoading } = useCollection<Persona>(personasQuery);

  const form = useForm<PersonaFormData>({
    resolver: zodResolver(personaSchema),
    defaultValues: personaData || { 
        name: '',
        description: '',
        propertyTypes: [],
        bedrooms: [],
        garageSpaces: [],
        minPrice: 0,
        maxPrice: 0,
        amenities: [],
        imageUrl: '',
    },
  });

  useEffect(() => {
    if (isEditing && personaData) {
      const dataToReset = { ...personaData };

      // Ensure bedrooms is an array
      if (typeof dataToReset.bedrooms === 'string') {
        dataToReset.bedrooms = dataToReset.bedrooms.split(',').map(s => s.trim()).filter(Boolean);
      } else if (!Array.isArray(dataToReset.bedrooms)) {
        dataToReset.bedrooms = [];
      }

      // Ensure garageSpaces is an array
      if (typeof dataToReset.garageSpaces === 'string') {
        dataToReset.garageSpaces = dataToReset.garageSpaces.split(',').map(s => s.trim()).filter(Boolean);
      } else if (!Array.isArray(dataToReset.garageSpaces)) {
        dataToReset.garageSpaces = [];
      }
      
      form.reset(dataToReset);
    }
  }, [isEditing, personaData, form]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !storage) {
        toast({
            variant: "destructive",
            title: "Erro de Upload",
            description: "Não foi possível iniciar o upload. Tente novamente."
        });
        return;
    }

    setUploadState({ progress: 0, isUploading: true, error: null });

    try {
        const path = `personas/${user.uid}/${file.name}`;
        const onProgress = (progress: number) => {
            setUploadState(prev => ({ ...prev, progress }));
        };

        const downloadURL = await uploadFile(storage, path, file, onProgress);
        
        form.setValue('imageUrl', downloadURL, { shouldDirty: true });
        
        toast({ title: 'Upload Concluído!', description: 'A imagem foi enviada. Salve as alterações para publicar.' });

    } catch (error) {
        console.error('Upload error:', error);
        setUploadState({ progress: 0, isUploading: false, error: 'Falha no upload.' });
        toast({ variant: "destructive", title: "Erro no Upload", description: "Não foi possível enviar a imagem." });
    } finally {
        setUploadState(prev => ({ ...prev, isUploading: false }));
    }
  };
  
  
  return (
    <main className="flex-grow flex flex-col">
    <div className="flex flex-col mb-8">
        <nav className="flex items-center gap-2 text-xs text-text-secondary mb-2 font-medium">
            <Link className="hover:text-primary transition-colors" href="/dashboard/personas">Personas</Link>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-text-main">{isEditing ? 'Editar Persona' : 'Cadastro de Persona'}</span>
        </nav>
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-text-main tracking-tight">{isEditing ? 'Editar Persona' : 'Cadastro de Nova Persona'}</h1>
            <p className="text-sm text-text-secondary hidden md:block">Defina o perfil ideal para segmentação de leads</p>
        </div>
    </div>
    <Form {...form}>
    <form onSubmit={form.handleSubmit(onSave)} className="space-y-8">
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="size-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                </div>
                <h3 className="text-lg font-bold text-text-main">1. Perfil da Persona</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                 <div className="md:col-span-4 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-6 bg-gray-50/50">
                    <label htmlFor="persona-image-upload" className="cursor-pointer group text-center">
                        <div className="relative w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-105 transition-transform border">
                            {form.watch('imageUrl') ? (
                                <Image src={form.watch('imageUrl')!} alt="Pré-visualização da Persona" fill className="object-cover rounded-full" />
                            ) : (
                                <span className="material-symbols-outlined text-4xl text-gray-300">add_a_photo</span>
                            )}
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="material-symbols-outlined text-white text-3xl">upload</span>
                            </div>
                        </div>
                        <span className="text-sm font-bold text-text-main">Upload de Imagem</span>
                        <span className="text-xs text-text-secondary mt-1 block">PNG, JPG até 5MB</span>
                        <Input id="persona-image-upload" type="file" className="sr-only" onChange={handleImageUpload} disabled={uploadState.isUploading} />
                    </label>
                    {uploadState.isUploading && (
                        <div className="w-full mt-4">
                            <Progress value={uploadState.progress} className="h-2" />
                        </div>
                    )}
                    {uploadState.error && <p className="text-xs text-red-500 mt-2">{uploadState.error}</p>}
                </div>
                <div className="md:col-span-8 space-y-4">
                    <FormField control={form.control} name="name" render={({field}) => (
                        <FormItem>
                            <FormLabel>Nome da Persona <span className="text-red-500">*</span></FormLabel>
                            <FormControl><Input placeholder="Ex: Investidor Visionário" {...field} /></FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="description" render={({field}) => (
                         <FormItem>
                            <FormLabel>Descrição Detalhada</FormLabel>
                            <FormControl><Textarea placeholder="Descreva os hábitos, motivações e objetivos desta persona..." rows={6} {...field} /></FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}/>
                </div>
            </div>
        </div>
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="size-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">apartment</span>
                </div>
                <h3 className="text-lg font-bold text-text-main">2. Critérios de Imóvel</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FormField control={form.control} name="propertyTypes" render={() => (
                    <FormItem>
                        <FormLabel className="font-bold text-text-main mb-3 block">Tipo de Imóvel</FormLabel>
                        <div className="space-y-2">
                        {propertyTypeOptions.map((item) => (
                          <FormField key={item} control={form.control} name="propertyTypes" render={({ field }) => (
                              <FormItem className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-all">
                                <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), item])
                                    : field.onChange(field.value?.filter((value) => value !== item))
                                }} /></FormControl>
                                <FormLabel className="text-sm font-medium text-text-main !mt-0">{item}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                        </div>
                    </FormItem>
                )}/>
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={() => (
                    <FormItem>
                      <FormLabel className="font-bold text-text-main mb-3 block">Quantidade de Quartos</FormLabel>
                      <div className="grid grid-cols-3 gap-2">
                          {bedroomOptions.map((item) => (
                            <FormField
                              key={item}
                              control={form.control}
                              name="bedrooms"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={item}
                                    className="has-[:checked]:bg-primary has-[:checked]:border-primary has-[:checked]:text-black flex items-center justify-center py-2.5 border border-gray-200 rounded-lg text-sm font-bold cursor-pointer hover:border-primary transition-colors"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        className="hidden"
                                        checked={field.value?.includes(item)}
                                        onCheckedChange={(checked) => {
                                          const currentValue = Array.isArray(field.value) ? field.value : [];
                                          return checked
                                            ? field.onChange([...currentValue, item])
                                            : field.onChange(
                                                currentValue.filter(
                                                  (value) => value !== item
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="cursor-pointer w-full h-full text-center">
                                      {item}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                      </div>
                    <FormMessage />
                    </FormItem>
                )}/>
                <FormField
                  control={form.control}
                  name="garageSpaces"
                  render={() => (
                    <FormItem>
                      <FormLabel className="font-bold text-text-main mb-3 block">Vagas de Garagem</FormLabel>
                      <div className="grid grid-cols-3 gap-2">
                          {garageOptions.map((item) => (
                            <FormField
                              key={item}
                              control={form.control}
                              name="garageSpaces"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={item}
                                    className="has-[:checked]:bg-primary has-[:checked]:border-primary has-[:checked]:text-black flex items-center justify-center py-2.5 border border-gray-200 rounded-lg text-sm font-bold cursor-pointer hover:border-primary transition-colors"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        className="hidden"
                                        checked={field.value?.includes(item)}
                                        onCheckedChange={(checked) => {
                                          const currentValue = Array.isArray(field.value) ? field.value : [];
                                          return checked
                                            ? field.onChange([...currentValue, item])
                                            : field.onChange(
                                                currentValue.filter(
                                                  (value) => value !== item
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="cursor-pointer w-full h-full text-center">
                                      {item}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                      </div>
                    <FormMessage />
                    </FormItem>
                )}/>
            </div>
        </div>
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="size-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">payments</span>
                </div>
                <h3 className="text-lg font-bold text-text-main">3. Critérios Financeiros</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField control={form.control} name="minPrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faixa de Preço Mínima</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-secondary font-bold text-sm">R$</span>
                            <Input className="pl-12 font-bold" type="number" {...field} />
                        </div>
                    </FormControl>
                  </FormItem>
                )}/>
                <FormField control={form.control} name="maxPrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faixa de Preço Máxima</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-secondary font-bold text-sm">R$</span>
                            <Input className="pl-12 font-bold" type="number" {...field} />
                        </div>
                    </FormControl>
                  </FormItem>
                )}/>
            </div>
        </div>
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="size-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">pool</span>
                </div>
                <h3 className="text-lg font-bold text-text-main">4. Áreas Comuns Desejadas</h3>
            </div>
            <FormField control={form.control} name="amenities" render={() => (
                <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {amenityOptions.map(item => (
                        <FormField key={item.id} control={form.control} name="amenities" render={({ field }) => (
                            <FormItem className="flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/30 has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-all cursor-pointer group">
                                <FormControl>
                                <Checkbox className="hidden" checked={field.value?.includes(item.label)} onCheckedChange={(checked) => {
                                    return checked
                                        ? field.onChange([...(field.value || []), item.label])
                                        : field.onChange(field.value?.filter((value) => value !== item.label))
                                }} />
                                </FormControl>
                                <span className="material-symbols-outlined text-gray-400 group-has-[:checked]:text-primary">{item.icon}</span>
                                <FormLabel className="text-xs font-bold text-text-main">{item.label}</FormLabel>
                                <div className="size-4 rounded-full border border-gray-200 flex items-center justify-center bg-white group-has-[:checked]:border-primary">
                                    <div className="size-2 bg-primary rounded-full opacity-0 group-has-[:checked]:opacity-100"></div>
                                </div>
                            </FormItem>
                        )}/>
                    ))}
                    </div>
                </FormItem>
            )}/>
        </div>
        <div className="flex items-center justify-end gap-4 pb-12">
            <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/personas">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
                <span className="material-symbols-outlined text-[20px]">save</span>
                {isSubmitting ? 'Salvando...' : 'Salvar Persona'}
            </Button>
        </div>
    </form>
    </Form>
</main>
  );
}
    
