
import { NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Builder } from '@/app/dashboard/builders/page';

export async function GET() {
  try {
    const buildersQuery = query(collection(db, 'builders'), where('isVisibleOnSite', '==', true));
    const buildersSnapshot = await getDocs(buildersQuery);

    const publicBuilders = buildersSnapshot.docs.map(doc => {
      const builderData = doc.data() as Builder;
      return {
        id: doc.id,
        name: builderData.name,
        logoUrl: builderData.logoUrl,
        address: builderData.address,
        city: builderData.city,
        state: builderData.state,
        phone: builderData.phone,
        whatsapp: builderData.whatsapp,
        email: builderData.email,
        instagram: builderData.instagram,
        website: builderData.contato?.website, // Assuming website is in contato
      };
    });

    return NextResponse.json(publicBuilders);

  } catch (error) {
    console.error("Error fetching builders for API:", error);
    return NextResponse.json({ error: 'Failed to fetch builders' }, { status: 500 });
  }
}
