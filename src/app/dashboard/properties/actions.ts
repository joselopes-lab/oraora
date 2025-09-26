'use server';

import { generatePropertySeo, type GeneratePropertySeoOutput } from "@/ai/flows/generate-property-seo-flow";

type SeoInput = {
    nome: string;
    tipo: string;
    cidade: string;
    estado: string;
    quartos: string;
    descricao: string;
}

function formatBedrooms(bedrooms: string[] | string | undefined): string {
    if (!bedrooms) return 'não informado';
    if (Array.isArray(bedrooms)) {
        if (bedrooms.length === 0) return 'não informado';
        return bedrooms.join(' e ');
    }
    return bedrooms;
}

export async function handleGeneratePropertySeo(propertyData: SeoInput): Promise<{ success: boolean, data?: GeneratePropertySeoOutput, error?: string}> {
    if (!propertyData.nome || !propertyData.tipo || !propertyData.cidade || !propertyData.estado) {
        return { success: false, error: 'Informações básicas do imóvel (nome, tipo, cidade, estado) são necessárias para gerar o SEO.'}
    }

    try {
        const result = await generatePropertySeo(propertyData);
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Error generating property SEO:", error);
        return { success: false, error: error.message || 'Ocorreu um erro desconhecido ao gerar o SEO.'};
    }
}
