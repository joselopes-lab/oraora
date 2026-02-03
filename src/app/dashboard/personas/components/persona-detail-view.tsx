'use client';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.ceil(properties.length / itemsPerPage);
    const paginatedProperties = properties.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const formatArrayToString = (value: string[] | string | undefined): string => {
        if (!value) return 'N/A';
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        return String(value);
    };
    
    return (
        <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex flex-col">
                <nav className="flex items-center gap-2 text-xs text-text-secondary mb-2 font-medium">
                    <Link className="hover:text-primary transition-colors" href="/dashboard">Dashboard</Link>
                    <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                    <Link className="hover:text-primary transition-colors" href="/dashboard/personas">Personas</Link>
                    <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                    <span className="text-text-main">Detalhes da Persona</span>
                </nav>
                <h1 className="text-3xl font-bold text-text-main tracking-tight">{persona.name}</h1>
                </div>
                <div className="flex items-center gap-3">
                {canEdit && (
                    <Link href={`/dashboard/personas/editar/${persona.id}`} passHref>
                        <Button className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-text-main bg-primary hover:bg-primary-hover shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                            <span className="material-symbols-outlined text-[20px] mr-2">edit</span>
                            Editar Persona
                        </Button>
                    </Link>
                )}
                <Button className="flex items-center gap-2 bg-secondary hover:bg-[#74d12e] text-white font-bold py-2.5 px-6 rounded-lg shadow-glow transition-all">
                    <span className="material-symbols-outlined text-[20px]">description</span>
                    Gerar Relatório
                </Button>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                    <div className="aspect-[4/3] w-full bg-gray-100">
                    <img alt="Persona" className="w-full h-full object-cover" src={persona.imageUrl || "https://placehold.co/400x225.png"}/>
                    </div>
                    <div className="p-6">
                    <h3 className="text-lg font-bold text-text-main mb-3">Sobre a Persona</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">
                        {persona.description || 'Nenhuma descrição fornecida.'}
                    </p>
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
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                            <h3 className="font-bold text-text-main text-lg">Imóveis Compatíveis</h3>
                            <div className="flex items-center gap-3">
                                <button className="text-xs font-bold text-text-secondary flex items-center gap-1 hover:text-text-main transition-colors"><span className="material-symbols-outlined text-[16px]">tune</span> Personalizar Colunas</button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Imóvel</TableHead>
                                        <TableHead>Localização</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedProperties.map(property => (
                                    <TableRow key={property.id}>
                                        <TableCell className="font-medium">{property.informacoesbasicas.nome}</TableCell>
                                        <TableCell>{property.localizacao.bairro}, {property.localizacao.cidade}</TableCell>
                                        <TableCell>{property.informacoesbasicas.valor ? `${property.informacoesbasicas.valor.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}` : 'N/A'}</TableCell>
                                        <TableCell>
                                            <Badge variant={property.informacoesbasicas.status === 'Lançamento' ? 'default' : 'secondary'}>
                                                {property.informacoesbasicas.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button asChild variant="ghost" size="sm">
                                                <Link href={`/dashboard/imoveis/${property.id}`}>Ver Detalhes</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                    {properties.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">Nenhum imóvel compatível encontrado.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-xs text-text-secondary">
                                Página {currentPage} de {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button onClick={handlePrevPage} disabled={currentPage === 1} variant="outline" size="sm">Anterior</Button>
                                <Button onClick={handleNextPage} disabled={currentPage === totalPages} variant="outline" size="sm">Próximo</Button>
                            </div>
                        </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
