
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from './ui/button';
import { ChevronDown, LogIn } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePropertyActions } from '@/hooks/use-property-actions';
import { type Property } from '@/app/dashboard/properties/page';


interface Broker {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  logoUrl?: string;
}

interface BrokerPublicHeaderProps {
  broker: Broker;
}

export default function BrokerPublicHeader({ broker }: BrokerPublicHeaderProps) {
  const { handleViewDetails, BrokerWhatsAppDialog, isWhatsAppDialogOpen, setIsWhatsAppDialogOpen, selectedProperty } = usePropertyActions(broker, 'public');
  
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };
  
  const handleWhatsAppClick = () => {
     const generalContactProp = {
        id: 'general-contact',
        slug: 'contato-geral',
        informacoesbasicas: { nome: 'Contato Geral' , descricao: ''},
     } as unknown as Property;
     handleViewDetails(generalContactProp, true);
  }

  return (
    <>
      <header 
          className="w-full" 
          style={{ backgroundColor: '#232323' }}
      >
        <div className="container mx-auto flex h-24 items-center justify-between px-4 sm:px-8">
          <Link href={`/corretor-publico/${broker.id}`} className="flex items-center gap-2 font-semibold">
            {broker.logoUrl ? (
              <Image
                src={broker.logoUrl}
                alt={`Logo de ${broker.name}`}
                width={180}
                height={50}
                className="h-14 w-auto object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted text-muted-foreground">
                  {getInitials(broker.name)}
              </div>
            )}
          </Link>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-white hover:bg-white/10 hover:text-white">
                  PT <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Português (Brasil)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={handleWhatsAppClick}
              className="bg-[#83e800] text-black hover:bg-[#76d300] gap-2 hidden sm:flex"
            >
              Falar agora <FaWhatsapp className="h-5 w-5" />
            </Button>
             <Button asChild variant="outline" className="hidden sm:flex border-white text-white bg-transparent hover:bg-white hover:text-black">
                <Link href={`/login?redirect=/corretor-publico/${broker.id}`}>
                    <LogIn className="mr-2 h-4 w-4"/>
                    Login
                </Link>
            </Button>
          </div>
        </div>
      </header>
       {broker.whatsapp && selectedProperty && (
            <BrokerWhatsAppDialog
                property={selectedProperty}
                brokerId={broker.id}
                brokerWhatsApp={broker.whatsapp}
                isOpen={isWhatsAppDialogOpen}
                onOpenChange={setIsWhatsAppDialogOpen}
            />
        )}
    </>
  );
}
