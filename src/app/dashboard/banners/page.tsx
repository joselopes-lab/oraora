
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, FilePen, Trash2, Image as ImageIcon, Code, Eye, MousePointerClick } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export type BannerLocation = 'home_top' | 'search_top' | 'search_infeed' | 'search_bottom';

export interface Banner {
  id: string;
  name: string;
  location: BannerLocation;
  type: 'image' | 'html';
  content: string; // URL for image, HTML string for html
  link?: string; // Optional link for image banners
  isActive: boolean;
  views: number;
  clicks: number;
}

const locationLabels: Record<BannerLocation, string> = {
    'home_top': 'Página Inicial (Topo)',
    'search_top': 'Busca (Topo)',
    'search_infeed': 'Busca (Meio da Lista)',
    'search_bottom': 'Busca (Rodapé)',
}

const initialState: Omit<Banner, 'id'> = {
    name: '',
    location: 'home_top',
    type: 'image',
    content: '',
    link: '',
    isActive: true,
    views: 0,
    clicks: 0,
};

export default function BannersPage() {
    const { toast } = useToast();
    const [banners, setBanners] = useState<Banner[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentBanner, setCurrentBanner] = useState<Partial<Banner>>(initialState);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'banners'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));
            setBanners(data);
            setIsLoading(false);
        }, (error) => {
            console.error("Erro ao buscar banners: ", error);
            toast({ variant: 'destructive', title: 'Falha ao carregar banners' });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);

    const openDialog = (banner: Banner | null = null) => {
        if (banner) {
            setIsEditing(true);
            setCurrentBanner(banner);
        } else {
            setIsEditing(false);
            setCurrentBanner(initialState);
        }
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!currentBanner.name || !currentBanner.location || !currentBanner.content) {
            toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Nome, local e conteúdo são obrigatórios.' });
            return;
        }
        setIsSubmitting(true);

        const bannerData: Partial<Banner> = { ...currentBanner };
        delete bannerData.id;

        try {
            if (isEditing && currentBanner.id) {
                await updateDoc(doc(db, 'banners', currentBanner.id), bannerData);
                toast({ title: 'Banner Atualizado!' });
            } else {
                // Initialize metrics for new banners
                bannerData.views = 0;
                bannerData.clicks = 0;
                await addDoc(collection(db, 'banners'), { ...bannerData, createdAt: new Date() });
                toast({ title: 'Banner Salvo!' });
            }
            closeDialog();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Falha ao Salvar', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const openDeleteAlert = (banner: Banner) => {
        setBannerToDelete(banner);
        setIsDeleteAlertOpen(true);
    };

    const handleDelete = async () => {
        if (!bannerToDelete) return;
        try {
            await deleteDoc(doc(db, 'banners', bannerToDelete.id));
            toast({ title: 'Banner Deletado' });
            setIsDeleteAlertOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Falha ao Deletar', description: error.message });
        }
    };

    const handleToggleStatus = async (banner: Banner) => {
        try {
            await updateDoc(doc(db, 'banners', banner.id), { isActive: !banner.isActive });
            toast({ title: `Banner ${!banner.isActive ? 'ativado' : 'desativado'}.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Falha ao atualizar', description: error.message });
        }
    }


    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Gerenciador de Banners</CardTitle>
                        <CardDescription>Crie e gerencie os banners publicitários do site.</CardDescription>
                    </div>
                    <Button size="sm" className="gap-1" onClick={() => openDialog()}>
                        <PlusCircle className="h-4 w-4" />
                        Adicionar Banner
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Local</TableHead>
                                    <TableHead>Métricas</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {banners.map((banner) => (
                                    <TableRow key={banner.id}>
                                        <TableCell className="font-medium">
                                          {banner.name}
                                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                             {banner.type === 'image' ? <ImageIcon className="h-3 w-3" /> : <Code className="h-3 w-3" />}
                                             <span>{banner.type === 'image' ? 'Imagem' : 'HTML'}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell>{locationLabels[banner.location]}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                    <span>{banner.views || 0}</span>
                                                    <span className="text-muted-foreground">visualizações</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                                                    <span>{banner.clicks || 0}</span>
                                                    <span className="text-muted-foreground">cliques</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={banner.isActive}
                                                onCheckedChange={() => handleToggleStatus(banner)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="icon" onClick={() => openDialog(banner)}><FilePen className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteAlert(banner)}><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{isEditing ? 'Editar Banner' : 'Novo Banner'}</DialogTitle>
                            <DialogDescription>Preencha os dados do banner publicitário.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome</Label>
                                <Input id="name" value={currentBanner.name || ''} onChange={e => setCurrentBanner(p => ({...p, name: e.target.value}))} required />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="location">Local de Exibição</Label>
                                    <Select value={currentBanner.location} onValueChange={(v) => setCurrentBanner(p => ({...p, location: v as BannerLocation}))}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(locationLabels).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Tipo de Conteúdo</Label>
                                    <Select value={currentBanner.type} onValueChange={(v) => setCurrentBanner(p => ({...p, type: v as 'image' | 'html'}))}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="image">Imagem</SelectItem>
                                            <SelectItem value="html">HTML</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {currentBanner.type === 'image' ? (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="content">URL da Imagem</Label>
                                        <Input id="content" placeholder="https://" value={currentBanner.content || ''} onChange={e => setCurrentBanner(p => ({...p, content: e.target.value}))} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="link">Link de Destino (Opcional)</Label>
                                        <Input id="link" placeholder="https://" value={currentBanner.link || ''} onChange={e => setCurrentBanner(p => ({...p, link: e.target.value}))} />
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <Label htmlFor="content-html">Código HTML</Label>
                                    <Textarea id="content-html" rows={6} placeholder="<ins class='...'>" value={currentBanner.content || ''} onChange={e => setCurrentBanner(p => ({...p, content: e.target.value}))} required />
                                </div>
                            )}
                             <div className="flex items-center space-x-2 pt-2">
                                <Switch id="isActive" checked={currentBanner.isActive ?? true} onCheckedChange={(c) => setCurrentBanner(p => ({...p, isActive: c}))} />
                                <Label htmlFor="isActive">Ativo</Label>
                             </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Salvar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita e irá deletar o banner permanentemente.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Deletar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
