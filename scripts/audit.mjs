
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp();
const db = getFirestore(app);

async function audit() {
  console.log('--- Auditoria de Runtime ---');
  
  // 1. Encontrar o primeiro corretor
  const brokerId = 'v4fCAA4aEwOvrZY6PDITLuwKrt02';
  const brokerSnap = await db.collection('brokers').doc(brokerId).get();
  if (!brokerSnap.exists) {
    console.log('Broker não encontrado.');
    return;
  }
  
  const brokerData = brokerSnap.data();
  console.log('1. ID do Corretor:', brokerId);
  console.log('   Slug:', brokerData.slug);
  
  // 2. Simular busca de propriedades (simplificado)
  const portfolioSnap = await db.collection('portfolios').doc(brokerId).get();
  let propertyIds = portfolioSnap.exists ? (portfolioSnap.data().propertyIds || []) : [];
  
  let properties = [];
  if (propertyIds.length > 0) {
    const propsSnap = await db.collection('properties').where('__name__', 'in', propertyIds.slice(0, 10)).get();
    propsSnap.forEach(doc => properties.push({ id: doc.id, collection: 'properties', ...doc.data() }));
  }
  
  const brokerPropsSnap = await db.collection('brokerProperties').where('brokerId', '==', brokerId).limit(10).get();
  brokerPropsSnap.forEach(doc => properties.push({ id: doc.id, collection: 'brokerProperties', ...doc.data() }));
  
  if (properties.length === 0) {
    console.log('Nenhum imóvel encontrado para este corretor.');
    return;
  }
  
  // 3. Identificar o primeiro imóvel
  const firstProperty = properties[0];
  console.log('2. ID do primeiro imóvel:', firstProperty.id);
  console.log('   Coleção de origem:', firstProperty.collection);
  
  // 4. Valores reais
  console.log('3. property.midia:', JSON.stringify(firstProperty.midia));
  console.log('   property.media:', JSON.stringify(firstProperty.media));
  
  // 5. Simular displayImage
  const displayImage = firstProperty.midia?.[0] || firstProperty.media?.[0] || "/images/property-placeholder.jpg";
  console.log('4. Valor final de displayImage:', displayImage);
  
  // 6. URL final
  console.log('5. URL final utilizada pelo card:', displayImage);
  
  // 7. Checar status da URL (se for remota)
  if (displayImage.startsWith('http')) {
    try {
      const res = await fetch(displayImage, { method: 'HEAD' });
      console.log('6. Status da URL:', res.status);
    } catch (e) {
      console.log('6. Status da URL: Erro ao acessar (' + e.message + ')');
    }
  } else {
    console.log('6. Status da URL: N/A (URL local: ' + displayImage + ')');
  }
  
  console.log('7. Verificação de HTML: (Simulado baseando-se no código do Layout)');
  console.log('   O layout utiliza a variável displayImage na renderização.');
}

audit().catch(console.error);
