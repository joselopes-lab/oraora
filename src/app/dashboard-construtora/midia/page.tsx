
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageIcon, PlusCircle, Loader2, Download, Trash2, Video, FileText, Share2, Book, Image as ImageIconLucide, HardDrive, AlertCircle } from 'lucide-react';
import { type Property } from '@/app/dashboard/properties/page';
import { handleAddMedia, handleDeleteMedia } from './actions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { uploadFile } from '@/lib/storage';


type MediaType = 'video_link' | 'image' | 'plan' | 'brand' | 'social_media' | 'ebook';

interface MediaItem {
    id: string;
    propertyId: string;
    propertyName: string;
    mediaType: MediaType;
    mediaName: string;
    fileUrl: string;
    createdAt: Timestamp;
}

const mediaTypes: { value: MediaType; label: string; icon: React.ElementType }[] = [
    { value: 'video_link', label: 'Link de Vídeo', icon: Video },
    { value: 'image', label: 'Imagem do Empreendimento', icon: ImageIconLucide },
    { value: 'plan', label: 'Planta', icon: FileText },
    { value: 'brand', label: 'Marca', icon: Share2 },
    { value: 'ebook', label: 'Ebook', icon: Book },
    { value: 'social_media', label: 'Peça para Redes Sociais', icon: ImageIconLucide },
];

function getYoutubeEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed/${urlObj.pathname.slice(1)}`;
    }
    if (urlObj.hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    return null;
  } catch (error) {
    console.error('Invalid YouTube URL:', error);
    return null;
  }
}

export default function MidiaPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const { storageLimit } = useAuth();
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    const [properties, setProperties] = useState<Property[]>([]);
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [mediaToDelete, setMediaToDelete] = useState<MediaItem | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    
    const [filterPropertyId, setFilterPropertyId] = useState<string>('all');
    const [filterMediaType, setFilterMediaType] = useState<string>('all');
    const [selectedMediaType, setSelectedMediaType] = useState<MediaType>('video_link');
    
    const [storageUsage, setStorageUsage] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [activeModal, setActiveModal] = useState<string | null>(null);
    
    const isStorageLimitReached = storageLimit !== null && storageUsage >= storageLimit;

    useEffect(() => {
        if (!user || loadingAuth) return;
        
        setIsLoading(true);
        const propsQuery = query(collection(db, 'properties'), where('builderId', '==', user.uid));
        const mediaQuery = query(collection(db, 'property_media'), where('builderId', '==', user.uid), orderBy('createdAt', 'desc'));

        const unsubProps = onSnapshot(propsQuery, snapshot => {
            setProperties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property)));
        });
        const unsubMedia = onSnapshot(mediaQuery, snapshot => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaItem));
            setMediaItems(items);
            // Simulate storage usage - 5MB per non-link item for demonstration
            const usage = items.reduce((acc, item) => item.mediaType !== 'video_link' ? acc + 5 : acc, 0);
            setStorageUsage(usage);
            setIsLoading(false);
        });

        return () => { unsubProps(); unsubMedia(); };
    }, [user, loadingAuth]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user) return;
        
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        const file = formData.get('file') as File;
        const link = formData.get('link') as string;

        if (!file?.size && !link) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Você deve fornecer um arquivo ou um link.' });
            setIsSubmitting(false);
            return;
        }

        let downloadURL = link || '';

        try {
            if (file && file.size > 0) {
                 const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
                const path = `property_media/${user.uid}/${formData.get('propertyId')?.toString().split('|')[0]}/${selectedMediaType}/${Date.now()}-${sanitizedFileName}`;
                downloadURL = await uploadFile(file, path);
                formData.set('fileUrl', downloadURL);
            }

            const result = await handleAddMedia(formData);

            if (result.success) {
                toast({ title: "Sucesso!", description: "Mídia salva com sucesso." });
                formRef.current?.reset();
                setSelectedMediaType('video_link');
            } else {
                 toast({ variant: 'destructive', title: "Erro ao salvar", description: result.error });
            }

        } catch (uploadError) {
             toast({ variant: 'destructive', title: "Erro no Upload", description: "Não foi possível enviar o arquivo." });
        } finally {
             setIsSubmitting(false);
        }
    };
    
    const openDeleteAlert = (item: MediaItem) => {
        setMediaToDelete(item);
        setIsDeleteAlertOpen(true);
    };

    const handleDelete = async () => {
        if (!mediaToDelete) return;
        const result = await handleDeleteMedia(mediaToDelete.id);
        if (result.success) {
            toast({ title: 'Mídia Excluída' });
        } else {
            toast({ variant: 'destructive', title: 'Erro ao excluir', description: result.error });
        }
        setIsDeleteAlertOpen(false);
        setMediaToDelete(null);
    };
    
    const formatDate = (timestamp: Timestamp | undefined) => {
        if (!timestamp) return 'N/A';
        return format(timestamp.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    };

    const filteredMedia = useMemo(() => {
        let items = mediaItems;
        if (filterPropertyId !== 'all') {
            items = items.filter(item => item.propertyId === filterPropertyId);
        }
        if (filterMediaType !== 'all') {
            items = items.filter(item => item.mediaType === filterMediaType);
        }
        return items;
    }, [mediaItems, filterPropertyId, filterMediaType]);
    
    const getMediaTypeIcon = (type: MediaType) => {
        const Icon = mediaTypes.find(t => t.value === type)?.icon || FileText;
        return <Icon className="h-5 w-5 text-muted-foreground" />
    }

    const usagePercentage = storageLimit !== null && storageLimit > 0 ? (storageUsage / storageLimit) * 100 : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                <ImageIcon className="h-10 w-10 mt-2"/>
                <div>
                    <h1 className="text-6xl font-thin tracking-tight">Mídia Center</h1>
                    <p className="font-light text-[23px] text-black">Gerencie os materiais de divulgação dos seus imóveis.</p>
                </div>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><PlusCircle/> Nova Mídia</CardTitle>
                            <CardDescription>Faça o upload de um novo material para um de seus imóveis.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {isStorageLimitReached && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Limite de Armazenamento Atingido</AlertTitle>
                                    <AlertDescription>
                                        Você atingiu o limite de {storageLimit}MB do seu plano. Para fazer novos uploads, considere um upgrade.
                                    </AlertDescription>
                                </Alert>
                            )}
                            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                                <input type="hidden" name="builderId" value={user?.uid || ''} />
                                <div className="space-y-2">
                                    <Label htmlFor="propertyId">Imóvel*</Label>
                                    <Select name="propertyId" required disabled={isStorageLimitReached || isSubmitting}>
                                        <SelectTrigger><SelectValue placeholder="Selecione o imóvel"/></SelectTrigger>
                                        <SelectContent>
                                            {properties.map(p => <SelectItem key={p.id} value={`${p.id}|${p.informacoesbasicas.nome}`}>{p.informacoesbasicas.nome}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="mediaType">Tipo de Mídia*</Label>
                                    <Select name="mediaType" value={selectedMediaType} onValueChange={(v) => setSelectedMediaType(v as MediaType)} required disabled={isStorageLimitReached || isSubmitting}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {mediaTypes.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mediaName">Nome do Arquivo/Link*</Label>
                                    <Input id="mediaName" name="mediaName" placeholder="Ex: Tour Virtual Apartamento Decorado" required disabled={isStorageLimitReached || isSubmitting} />
                                </div>
                                {selectedMediaType === 'video_link' ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="link">Link do Vídeo</Label>
                                        <Input id="link" name="link" type="url" placeholder="https://youtube.com/watch?v=..." disabled={isStorageLimitReached || isSubmitting} />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label htmlFor="file">Arquivo</Label>
                                        <Input id="file" name="file" type="file" disabled={isStorageLimitReached || isSubmitting} />
                                    </div>
                                )}
                                <Button type="submit" disabled={isStorageLimitReached || isSubmitting}>
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Salvar Mídia'}
                                </Button>
                            </form>
                        </CardContent>
                        {storageLimit !== null && (
                            <CardFooter className="pt-4 border-t">
                                <div className="w-full space-y-4">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <HardDrive className="h-4 w-4" />
                                        <span>Você está no plano {storageLimit === 0 ? 'Gratuito' : 'pago'}.</span>
                                    </div>
                                    <Progress value={usagePercentage} className="h-2" />
                                    <p className="text-xs text-muted-foreground text-right">
                                        Usado: {storageUsage.toFixed(1)} MB de {storageLimit} MB
                                    </p>
                                    <div className="pt-2">
                                        <Button asChild className="w-full" variant="secondary">
                                            <Link href="/dashboard-construtora/meu-plano">Ver Planos</Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardFooter>
                        )}
                    </Card>
                </div>
                 <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <CardTitle>Histórico de Mídias</CardTitle>
                                    <CardDescription>Visualize todas as mídias que você já cadastrou.</CardDescription>
                                </div>
                                <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                                    <Select value={filterPropertyId} onValueChange={setFilterPropertyId}>
                                        <SelectTrigger className="w-full sm:w-[180px]">
                                            <SelectValue placeholder="Filtrar por imóvel..."/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os Imóveis</SelectItem>
                                            {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.informacoesbasicas.nome}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                     <Select value={filterMediaType} onValueChange={setFilterMediaType}>
                                        <SelectTrigger className="w-full sm:w-[180px]">
                                            <SelectValue placeholder="Filtrar por tipo..."/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os Tipos</SelectItem>
                                            {mediaTypes.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                            ) : filteredMedia.length > 0 ? (
                                <div className="space-y-4">
                                    {filteredMedia.map(item => {
                                        const youtubeEmbedUrl = item.mediaType === 'video_link' ? getYoutubeEmbedUrl(item.fileUrl) : null;
                                        return (
                                            <Dialog key={item.id} open={activeModal === item.id} onOpenChange={(open) => setActiveModal(open ? item.id : null)}>
                                                <DialogTrigger asChild>
                                                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                                                        <div className="flex items-center gap-4">
                                                            {getMediaTypeIcon(item.mediaType)}
                                                            <div>
                                                                <p className="font-semibold">{item.mediaName}</p>
                                                                <p className="text-sm text-muted-foreground">{item.propertyName}</p>
                                                                <p className="text-xs text-muted-foreground mt-1">Cadastrado em: {formatDate(item.createdAt)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button asChild variant="outline" size="icon" disabled={!item.fileUrl} onClick={(e) => e.stopPropagation()}>
                                                                <a href={item.fileUrl} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4"/></a>
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); openDeleteAlert(item);}}>
                                                                <Trash2 className="h-4 w-4"/>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-3xl">
                                                    <DialogHeader>
                                                        <DialogTitle>{item.mediaName}</DialogTitle>
                                                        <DialogDescription>
                                                            Material para o imóvel: {item.propertyName}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="py-4">
                                                        {youtubeEmbedUrl ? (
                                                            <div className="aspect-video w-full rounded-lg overflow-hidden">
                                                                <iframe
                                                                    width="100%"
                                                                    height="100%"
                                                                    src={youtubeEmbedUrl}
                                                                    title="YouTube video player"
                                                                    frameBorder="0"
                                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                                    allowFullScreen
                                                                ></iframe>
                                                            </div>
                                                        ) : item.mediaType === 'image' || item.mediaType === 'plan' || item.mediaType === 'social_media' ? (
                                                            <div className="relative aspect-video w-full">
                                                                <Image src={item.fileUrl} alt={item.mediaName} fill sizes="100vw" className="object-contain rounded-md" />
                                                            </div>
                                                        ) : (
                                                            <div className="text-center p-8 bg-muted rounded-md">
                                                                <p className="text-muted-foreground">Pré-visualização não disponível para este tipo de arquivo.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="secondary" onClick={() => setActiveModal(null)}>Fechar</Button>
                                                        <Button asChild disabled={!item.fileUrl}>
                                                            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                                                                <Download className="mr-2 h-4 w-4" /> Baixar / Abrir
                                                            </a>
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">Nenhuma mídia encontrada.</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
             <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita e irá excluir o item de mídia permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
