'use client';

import { useState } from 'react';
import { type Property } from '@/app/dashboard/properties/page';
import PropertyDetailSheet from '@/components/property-detail-sheet';
import BrokerWhatsAppDialog from '@/components/broker-whatsapp-dialog';
import { useToast } from '@/hooks/use-toast';

interface Broker {
  id: string;
  name: string;
  whatsapp?: string;
}

type ActionSource = 'public' | 'broker-panel' | 'admin-panel';

export function usePropertyActions(broker?: Broker, source: ActionSource = 'public') {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const { toast } = useToast();

  const handleViewDetails = (property: Property, openWhatsApp = false) => {
    setSelectedProperty(property);
    if (openWhatsApp) {
      setIsWhatsAppDialogOpen(true);
    } else {
      setIsSheetOpen(true);
    }
  };

  const handleCuradoriaClick = () => {
    if (!broker?.whatsapp) {
      toast({
        variant: 'destructive',
        title: 'WhatsApp não disponível',
        description: 'Este corretor não cadastrou um número de WhatsApp.',
      });
      const formElement = document.getElementById('contact-form');
      formElement?.scrollIntoView({ behavior: 'smooth' });
    } else {
       const generalContactProp = {
        id: 'general-contact',
        slug: 'contato-geral',
        informacoesbasicas: { nome: 'Contato Geral', descricao: '' },
        caracteristicasimovel: {unidades: {}},
        contato: {},
      } as unknown as Property;
      setSelectedProperty(generalContactProp);
      setIsWhatsAppDialogOpen(true);
    }
  };

  return {
    selectedProperty,
    isSheetOpen,
    isWhatsAppDialogOpen,
    isVideoModalOpen,
    handleViewDetails,
    handleCuradoriaClick,
    setIsSheetOpen,
    setIsWhatsAppDialogOpen,
    setIsVideoModalOpen,
    PropertyDetailSheet,
    BrokerWhatsAppDialog,
    toast,
    source,
  };
}
