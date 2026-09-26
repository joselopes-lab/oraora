import { adminDb } from '../src/firebase/index.server';

async function debugOceania() {
  const snap = await adminDb.collection('oraPublicInventory')
    .where('neighborhoodNormalized', '==', 'jardim oceania')
    .get();

  console.log("Jardim Oceania in oraPublicInventory:", snap.size);
  snap.docs.forEach(d => {
    const data = d.data();
    console.log(`- ID: ${d.id} | Type: ${data.type} | Bedrooms: ${data.bedrooms} | Price: ${data.price} | Neighborhood: ${data.neighborhood}`);
  });
}
debugOceania().catch(console.error);
