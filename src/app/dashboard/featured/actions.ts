'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

// NOTE: This function is now only for reading settings.
// Writing is handled on the client-side.
export async function getFeaturedProperties(): Promise<string[]> {
  try {
    const docRef = doc(db, 'settings', 'featured');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().propertyIds || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching featured properties:", error);
    return [];
  }
}

// This function is kept to allow revalidation from the client.
export async function revalidateFeatured() {
    revalidatePath('/imoveis');
    revalidatePath('/');
}
