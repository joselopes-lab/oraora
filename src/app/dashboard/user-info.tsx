
'use client';

import { useAuth, useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthContext } from "@/firebase/auth-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type BrokerProfile = {
    slug: string;
};

export function UserMenu() {
    const { user, userProfile, authLoading, profileLoading } = useAuthContext();
    const { firestore } = useFirebase();
    const auth = useAuth();
    const router = useRouter();

    const brokerDocRef = useMemoFirebase(
        () => (firestore && user && userProfile?.userType === 'broker' ? doc(firestore, 'brokers', user.uid) : null),
        [firestore, user, userProfile]
    );
    const { data: brokerProfile, isLoading: isBrokerLoading } = useDoc<BrokerProfile>(brokerDocRef);

    const handleLogout = () => {
        router.push('/login');
    };
  
    if (authLoading || profileLoading || isBrokerLoading) {
        return (
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="h-8 w-px bg-gray-200"></div>
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
        );
    }

    const isBroker = userProfile?.userType === 'broker';
    const isAdmin = userProfile?.userType === 'admin';

    const siteUrl = isAdmin ? '/' : (isBroker && brokerProfile?.slug) ? `/sites/${brokerProfile.slug}` : '#';
    const siteTooltip = isAdmin ? 'Ver site principal' : 'Ver meu site público';

    return (
        <div className="flex items-center gap-4">
            <TooltipProvider>
                {(isAdmin || (isBroker && brokerProfile?.slug)) && (
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <Button asChild variant="ghost" size="icon" className="size-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-text-secondary transition-colors relative">
                              <Link href={siteUrl} target="_blank">
                                  <span className="material-symbols-outlined text-[20px]">public</span>
                              </Link>
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                          <p>{siteTooltip}</p>
                      </TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button className="size-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-text-secondary transition-colors relative">
                            <span className="material-symbols-outlined text-[20px]">notifications</span>
                            <span className="absolute top-2 right-2 size-2 bg-secondary rounded-full border border-white"></span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Notificações</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <div className="h-8 w-px bg-gray-200"></div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button type="button" className="flex items-center gap-3 cursor-pointer group">
                        <span className="text-right hidden sm:block">
                            <span className="block text-sm font-bold text-text-main">{user?.displayName || 'Usuário'}</span>
                            <span className="block text-xs text-text-secondary">{userProfile?.userType === 'admin' ? 'Admin Master' : userProfile?.userType === 'broker' ? 'Corretor' : 'Construtora'}</span>
                        </span>
                        <span className="block size-9 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
                            <Avatar>
                                <AvatarImage src={user?.photoURL || "https://i.pravatar.cc/150?u=a042581f4e29026704d"} alt="Avatar"/>
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
        </div>
    );
}
