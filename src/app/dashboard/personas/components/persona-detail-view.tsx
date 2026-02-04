'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

type Persona = {
  id: string;
  name: string;
  occupation?: string;
  ageRange?: string;
  purchasingPower?: string;
  interests?: string[];
  mediaHabits?: string[];
  challenges?: string;
  narrative?: string;
  imageUrl?: string;
  propertyIds?: string[];
  propertyTypes?: string[];
  bedrooms?: string[] | string;
  garageSpaces?: string[] | string;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  description?: string;
  ticket?: string;
};

type Property = {
  id: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
  },
  localizacao: {
    bairro: string;
    cidade: string;
  }
}

type PersonaDetailViewProps = {
    persona: Persona;
    properties: Property[];
    canEdit: boolean;
};

export default function PersonaDetailView({ persona, properties, canEdit }: PersonaDetailViewProps) {
    const formatArrayToString = (value: string[] | string | undefined): string => {
        if (!value) return 'N/A';
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        return String(value);
    };
    
    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                {canEdit && (
                    <div className="flex items-center gap-3">
                        <Link href={`/dashboard/personas/editar/${persona.id}`} passHref>
                            <Button className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-text-main bg-primary hover:bg-primary-hover shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                                <span className="material-symbols-outlined text-[20px] mr-2">edit</span>
                                Editar Persona
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        <div className="md:col-span-1 aspect-square md:aspect-auto w-full bg-gray-100">
                           <img alt="Persona" className="w-full h-full object-cover" src={persona.imageUrl || "https://placehold.co/400x225.png"}/>
                        </div>
                        <div className="p-6 md:col-span-2">
                            <h3 className="text-lg font-bold text-text-main mb-3">Sobre a Persona</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                {persona.description || 'Nenhuma descrição fornecida.'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-primary p-6 rounded-xl shadow-glow">
                    <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-text-main font-bold">verified</span>
                    <span className="text-sm font-bold uppercase tracking-wider text-text-main/80">Oportunidade</span>
                    </div>
                    <p className="text-3xl font-bold text-text-main">{properties.length} Imóveis</p>
                    <p className="text-sm font-medium text-text-main/70">encontrados para este perfil</p>
                </div>
                <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">filter_list</span>
                        Critérios Selecionados
                    </h3>
                    <div className="space-y-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-[10px] font-bold text-text-secondary uppercase mb-1">Tipos de Imóvel</p>
                            <p className="text-sm font-bold text-text-main">{persona.propertyTypes?.join(', ') || 'N/A'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-[10px] font-bold text-text-secondary uppercase mb-1">Quartos</p>
                            <p className="text-sm font-bold text-text-main">{formatArrayToString(persona.bedrooms)}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-[10px] font-bold text-text-secondary uppercase mb-1">Vagas</p>
                            <p className="text-sm font-bold text-text-main">{formatArrayToString(persona.garageSpaces)}</p>
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-[10px] font-bold text-text-secondary uppercase mb-1">Faixa de Preço</p>
                            <p className="text-sm font-bold text-text-main">
                            {persona.minPrice || persona.maxPrice ? `${persona.minPrice?.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) || 'N/A'} - ${persona.maxPrice?.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) || 'N/A'}` : 'N/A'}
                            </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-[10px] font-bold text-text-secondary uppercase mb-1">Áreas Comuns</p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                            {persona.amenities?.map(amenity => (
                                <span key={amenity} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold">{amenity}</span>
                            ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
