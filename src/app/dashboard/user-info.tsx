
'use client';

import { useAuth, useDoc, useFirebase, useMemoFirebase, useCollection } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, collection, query, where, orderBy, limit, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthContext } from "@/firebase/auth-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState, useEffect, useMemo } from 'react';
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";

type BrokerProfile = {
    slug: string;
    domain?: string; // Adicionado para lidar com domínio personalizado
};

type Announcement = {
  id: string;
  title: string;
  content: string;
  recipients: string[];
  type: 'broadcast' | 'notification' | 'rede_oraora';
  status: 'sent' | 'scheduled' | 'draft';
  relatedId?: string;
  createdAt: Timestamp;
};

export function UserMenu() {
    const { user, userProfile, authLoading, profileLoading, isReady } = useAuthContext();
    const { firestore } = useFirebase();
    const auth = useAuth();
    const router = useRouter();
    const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [lastReadId, setLastReadId] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('last_read_announcement');
        if (saved) setLastReadId(saved);
    }, []);

    const brokerDocRef = useMemoFirebase(
        () => (firestore && user && userProfile?.userType === 'broker' && isReady ? doc(firestore, 'brokers', user.uid) : null),
        [firestore, user, userProfile, isReady]
    );
    const { data: brokerProfile, isLoading: isBrokerLoading } = useDoc<BrokerProfile>(brokerDocRef);

    const announcementsQuery = useMemoFirebase(
        () => {
            if (!firestore || !userProfile || !user || !isReady) return null;
            return query(
                collection(firestore, 'announcements'),
                where('recipients', 'array-contains-any', [userProfile.userType, user.uid]),
                where('status', '==', 'sent'),
                orderBy('createdAt', 'desc'),
                limit(5)
            );
        },
        [firestore, userProfile, user?.uid, isReady]
    );

    const { data: announcements } = useCollection<Announcement>(announcementsQuery);
    
    const latestAnnouncement = announcements?.[0];

    const unreadCount = useMemo(() => {
        if (!announcements) return 0;
        if (!lastReadId) return announcements.length;
        return latestAnnouncement?.id !== lastReadId ? 1 : 0;
    }, [announcements, lastReadId, latestAnnouncement]);

    const hasUnread = unreadCount > 0;

    const handleOpenAnnouncement = (ann: Announcement) => {
        if (ann.type === 'rede_oraora' && ann.relatedId) {
            router.push(`/dashboard/solicitacoes-rede/${ann.relatedId}`);
        } else {
            setSelectedAnnouncement(ann);
            setIsAnnouncementOpen(true);
        }
        
        if (ann.id === latestAnnouncement?.id) {
            setLastReadId(ann.id);
            localStorage.setItem('last_read_announcement', ann.id);
        }
    };

    const handleLogout = () => {
        if (auth) {
            if (firestore && user) {
                const userRef = doc(firestore, 'users', user.uid);
                setDocumentNonBlocking(userRef, { isOnline: false }, { merge: true });
            }
            
            auth.signOut().then(() => {
                router.push('/login');
            });
        }
    };
  
    if (authLoading || profileLoading || !isReady || isBrokerLoading) {
        return (
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="h-8 w-px bg-gray-200"></div>
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
        );
    }

    const isBroker = userProfile?.userType === 'broker';
    const isAdmin = userProfile?.userType === 'admin';

    const brokerSiteUrl = brokerProfile?.domain 
        ? `https://${brokerProfile.domain}` 
        : ((brokerProfile?.slug || user?.uid) ? `/sites/${brokerProfile?.slug || user?.uid}` : null);

    const siteUrl = isAdmin ? '/' : brokerSiteUrl || (user?.uid ? `/sites/${user.uid}` : '#');

    const canViewSite = isAdmin || (isBroker && (brokerSiteUrl || user?.uid));

    const siteTooltip = isAdmin 
        ? 'Ver site principal' 
        : (isBroker && brokerProfile?.domain) 
        ? `Acessar ${brokerProfile.domain}` 
        : 'Ver meu site público';

    return (
        <div className="flex items-center gap-2 md:gap-4">
            <TooltipProvider>
                {canViewSite && (
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <Button asChild variant="outline" size="sm" className="h-8 md:h-9 px-2 md:px-3 gap-1.5 md:gap-2 font-bold bg-white border-slate-200 hover:bg-slate-50 transition-all rounded-lg shadow-sm">
                              <Link href={siteUrl} target="_blank">
                                  <span className="material-symbols-outlined text-[16px] md:text-[18px]">public</span>
                                  <span className="hidden md:inline">Ver site</span>
                              </Link>
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                          <p>{siteTooltip}</p>
                      </TooltipContent>
                  </Tooltip>
                )}
                
                <div className="flex items-center gap-1 md:gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button asChild variant="ghost" size="icon" className="size-8 md:size-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-text-secondary transition-colors relative">
                                <Link href="/dashboard/suporte">
                                    <span className="material-symbols-outlined text-[18px] md:text-[20px]">help</span>
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Suporte e Ajuda</p>
                        </TooltipContent>
                    </Tooltip>

                    <Popover>
                        <PopoverTrigger asChild>
                            <button 
                                className="size-8 md:size-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-text-secondary transition-colors relative cursor-pointer outline-none"
                            >
                                <span className="material-symbols-outlined text-[18px] md:text-[20px]">notifications</span>
                                {hasUnread && (
                                    <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 size-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                                )}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0 overflow-hidden rounded-xl border border-gray-100 shadow-xl" align="end" sideOffset={8}>
                            <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-white">
                                <h3 className="text-sm font-bold text-text-main uppercase tracking-tighter">Notificações</h3>
                                {unreadCount > 0 && (
                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{unreadCount} Nova{unreadCount > 1 ? 's' : ''}</span>
                                )}
                            </div>
                            <div className="max-h-[360px] overflow-y-auto bg-white">
                                {announcements && announcements.length > 0 ? (
                                    announcements.map((ann) => (
                                        <div 
                                            key={ann.id} 
                                            onClick={() => handleOpenAnnouncement(ann)}
                                            className="p-4 hover:bg-background-light transition-colors cursor-pointer border-b border-gray-50 flex gap-3 relative text-left"
                                        >
                                            <div className={cn(
                                                "size-10 shrink-0 rounded-lg flex items-center justify-center shadow-sm",
                                                ann.type === 'rede_oraora' ? "bg-primary/20 text-primary-hover" : "bg-blue-50 text-blue-500"
                                            )}>
                                                <span className="material-symbols-outlined text-[20px]">
                                                    {ann.type === 'rede_oraora' ? 'zap' : 'campaign'}
                                                </span>
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <p className="text-xs font-bold text-text-main truncate uppercase tracking-tighter">{ann.title}</p>
                                                    <span className="text-[9px] font-bold text-text-secondary whitespace-nowrap">
                                                        {ann.createdAt ? formatDistanceToNow(ann.createdAt.toDate(), { addSuffix: true, locale: ptBR }) : ''}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-1">{ann.content}</p>
                                            </div>
                                            {ann.id !== lastReadId && ann.id === latestAnnouncement?.id && (
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 size-2 bg-red-500 rounded-full"></div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-xs text-text-secondary italic">
                                        Nenhuma notificação por enquanto.
                                    </div>
                                )}
                            </div>
                            <div className="p-3 text-center border-t border-gray-50 bg-gray-50/50">
                                <Link 
                                    href="/dashboard/notificacoes" 
                                    className="text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary-hover transition-colors"
                                >
                                    Ver todas as notificações
                                </Link>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </TooltipProvider>

            <div className="h-8 w-px bg-gray-200"></div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button type="button" className="flex items-center cursor-pointer group outline-none focus:ring-2 focus:ring-primary/20 rounded-full" title={user?.displayName || "Perfil"}>
                        <span className="block size-9 rounded-full bg-gray-200 overflow-hidden border border-gray-100 hover:ring-2 hover:ring-primary/30 transition-all">
                            <Avatar>
                                <AvatarImage src={user?.photoURL || ""} alt="Avatar"/>
                                <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                        </span>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user?.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/dashboard/perfil">
                            <span className="material-symbols-outlined mr-2 text-base">person</span>
                            Meu Perfil
                        </Link>
                    </DropdownMenuItem>
                    {isBroker && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/dominio">
                            <span className="material-symbols-outlined mr-2 text-base">language</span>
                            Domínio
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                        <span className="material-symbols-outlined mr-2 text-base">settings</span>
                        Configurações
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:bg-red-50 focus:text-red-600">
                         <span className="material-symbols-outlined mr-2 text-base">logout</span>
                        Sair
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isAnnouncementOpen} onOpenChange={setIsAnnouncementOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-2 text-primary font-bold text-xs uppercase tracking-widest">
                            <span className="material-symbols-outlined text-lg">campaign</span>
                            Comunicado Oficial
                        </div>
                        <DialogTitle className="text-2xl font-black text-slate-900 leading-tight">
                            {selectedAnnouncement?.title}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-400">
                            Enviado em {selectedAnnouncement?.createdAt && format(selectedAnnouncement.createdAt.toDate(), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 border-y border-slate-50 my-4">
                        <p className="text-slate-600 text-base leading-relaxed whitespace-pre-wrap">
                            {selectedAnnouncement?.content}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsAnnouncementOpen(false)} className="w-full bg-slate-900 text-white font-bold h-12 rounded-xl">
                            Entendido
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
