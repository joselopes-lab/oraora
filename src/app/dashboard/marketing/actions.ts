'use server';

import { adminDb } from '@/firebase/index.server';
import { revalidatePath } from 'next/cache';

export async function getMarketingSettings(brokerId: string) {
    if (!brokerId) return null;
    const docRef = adminDb.collection('brokers').doc(brokerId);
    const doc = await docRef.get();
    if (!doc.exists) return null;
    const data = doc.data();
    return {
        googleAnalyticsId: data?.googleAnalyticsId || '',
        gtmId: data?.gtmId || '',
        metaPixelId: data?.metaPixelId || '',
    };
}

export async function saveMarketingSettings(brokerId: string, settings: { googleAnalyticsId: string, gtmId: string, metaPixelId: string }) {
    if (!brokerId) throw new Error('Unauthorized');
    
    // Validation
    if (settings.googleAnalyticsId && !/^G-[A-Z0-9]+$/.test(settings.googleAnalyticsId)) {
        throw new Error('Formato de GA4 inválido. Use G-XXXXXXXXXX.');
    }
    if (settings.gtmId && !/^GTM-[A-Z0-9]+$/.test(settings.gtmId)) {
        throw new Error('Formato de GTM inválido. Use GTM-XXXXXXX.');
    }
    if (settings.metaPixelId && !/^\d+$/.test(settings.metaPixelId)) {
        throw new Error('Formato de Meta Pixel inválido. Deve ser um ID numérico.');
    }

    const docRef = adminDb.collection('brokers').doc(brokerId);
    await docRef.set({
        googleAnalyticsId: settings.googleAnalyticsId,
        gtmId: settings.gtmId,
        metaPixelId: settings.metaPixelId,
    }, { merge: true });
    
    revalidatePath('/dashboard/marketing');
    return { success: true };
}
