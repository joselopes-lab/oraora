import { adminDb } from '../src/firebase/index.server';

async function auditEtapa656() {
  console.log("=== AUDITORIA ETAPA 6.5.6 ===");

  const oraSnap = await adminDb.collection('oraPublicInventory').get();
  console.log("Total no oraPublicInventory:", oraSnap.size);

  let matchCount = 0;
  for (const doc of oraSnap.docs) {
    const d = doc.data();
    const isBessa = (d.neighborhood || '').toLowerCase().includes('bessa') && (d.city || '').toLowerCase().includes('joao pessoa');
    const isApt = (d.type || '').toLowerCase().includes('apartamento');
    const has3Bed = d.bedrooms === 3 || (d.bedroomOptions && d.bedroomOptions.includes(3));
    const has2Bath = d.bathrooms === 2;
    const has2Parking = d.parkingSpaces === 2;
    const has85Area = d.usableArea === 85 || (d.usableArea && Math.round(d.usableArea) === 85);

    if (isBessa || (isApt && has3Bed)) {
      matchCount++;
      console.log(`Candidato ${doc.id}:`, {
        title: d.title,
        price: d.price,
        images: d.images?.length,
        publicUrl: d.publicUrl,
        neighborhood: d.neighborhood,
        bedrooms: d.bedrooms,
        bedroomOptions: d.bedroomOptions,
        bathrooms: d.bathrooms,
        parkingSpaces: d.parkingSpaces,
        usableArea: d.usableArea,
        sourceCollection: d.sourceCollection,
        sourceId: d.sourceId
      });

      // Check source
      if (d.sourceCollection && d.sourceId) {
        const srcDoc = await adminDb.collection(d.sourceCollection).doc(d.sourceId).get();
        if (srcDoc.exists) {
          const s = srcDoc.data();
          console.h ?? console.log("  Source data:", {
            titulo: s?.informacoesbasicas?.titulo || s?.title,
            nome: s?.informacoesbasicas?.nome,
            valor: s?.informacoesbasicas?.valorVenda ?? s?.informacoesbasicas?.valor ?? s?.informacoesbasicas?.salePrice ?? s?.price,
            fotos: s?.fotos?.length || s?.imagens?.length || s?.images?.length
          });
        }
      }
    }
  }
  console.log("Total candidatos listados:", matchCount);
}

auditEtapa656().catch(console.error);
