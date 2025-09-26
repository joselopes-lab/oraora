
'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

export async function incrementBannerView(bannerId: string) {
    if (!bannerId) return;
    try {
        const bannerRef = doc(db, 'banners', bannerId);
        await updateDoc(bannerRef, {
            views: increment(1)
        });
    } catch (error) {
        // We can ignore errors here, as it's not critical for the user experience
        console.error(`Failed to increment view for banner ${bannerId}:`, error);
    }
}

export async function incrementBannerClick(bannerId: string) {
     if (!bannerId) return;
    try {
        const bannerRef = doc(db, 'banners', bannerId);
        await updateDoc(bannerRef, {
            clicks: increment(1)
        });
    } catch (error) {
        console.error(`Failed to increment click for banner ${bannerId}:`, error);
    }
}
