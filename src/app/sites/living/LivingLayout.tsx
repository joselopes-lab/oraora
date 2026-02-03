
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Broker = {
  id: string;
  brandName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  slug: string;
};

type Property = {
  id: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
  };
  localizacao: {
    bairro: string;
    cidade: string;
  };
  midia: string[];
};

type LivingLayoutProps = {
  broker: Broker;
  properties: Property[];
}


export default function LivingLayout({ broker, properties }: LivingLayoutProps) {
  return (
    <div className="bg-white text-gray-800">
      <header className="p-4 border-b">
        <h1 className="text-2xl font-bold">{broker.brandName} - Layout Living</h1>
      </header>
      <main className="p-4">
        <h2 className="text-xl mb-4">Imóveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map(property => (
                <div key={property.id} className="border rounded-lg p-4">
                    <Image src={property.midia?.[0] || 'https://placehold.co/600x400'} alt={property.informacoesbasicas.nome} width={600} height={400} className="w-full h-48 object-cover rounded-md mb-4"/>
                    <h3 className="font-bold">{property.informacoesbasicas.nome}</h3>
                    <p>{property.localizacao.bairro}, {property.localizacao.cidade}</p>
                    <p className="text-primary font-bold mt-2">{property.informacoesbasicas.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
}
