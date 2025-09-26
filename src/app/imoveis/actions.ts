
'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

export async function incrementPropertyView(propertyId: string) {
    if (!propertyId) return;
    try {
        const propertyRef = doc(db, 'properties', propertyId);
        await updateDoc(propertyRef, {
            views: increment(1)
        });
    } catch (error) {
        // We can ignore errors here, as it's not critical for the user experience
        console.error(`Failed to increment view for property ${propertyId}:`, error);
    }
}

export async function incrementPropertyClick(propertyId: string) {
     if (!propertyId) return;
    try {
        const propertyRef = doc(db, 'properties', propertyId);
        await updateDoc(propertyRef, {
            clicks: increment(1)
        });
    } catch (error) {
        console.error(`Failed to increment click for property ${propertyId}:`, error);
    }
}

    