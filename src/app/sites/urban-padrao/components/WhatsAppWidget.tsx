
'use client';
import { useState } from 'react';
import { WhatsAppLeadModal } from '@/components/WhatsAppLeadModal';

type WhatsAppWidgetProps = {
  broker: any;
  property?: any;
  source?: string;
};

export function WhatsAppWidget({ broker, property, source = 'floating_widget' }: WhatsAppWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          isOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'
        }`}
      >
        <button
          aria-label="Chat on WhatsApp"
          className="flex items-center justify-center size-14 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <span className="material-symbols-outlined text-3xl">chat</span>
        </button>
      </div>

      <WhatsAppLeadModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        broker={broker}
        property={property}
        source={source}
        origin="whatsapp"
      />
    </>
  );
}
