import { adminDb } from '../src/firebase/index.server';
import { normalizeBrokerProperty } from '../src/lib/ora/property-normalizer';
import { reconcilePublicInventory } from '../src/lib/ora/inventory-reconciliation.server';
import { processOraSearch } from '../src/lib/ora/search-orchestrator.server';
import { searchPublicProperties } from '../src/lib/ora/search';

async function runEtapa653() {
  console.log("=== EXECUTANDO ETAPA 6.5.3 ===");

  // FASE 2: Validação em memória
  const propsSnap = await adminDb.collection('properties').get();
  const brokerPropsSnap = await adminDb.collection('brokerProperties').get();

  const allDocs: { col: string; id: string; data: any }[] = [];
  propsSnap.docs.forEach(d => allDocs.push({ col: 'properties', id: d.id, data: d.data() }));
  brokerPropsSnap.docs.forEach(d => allDocs.push({ col: 'brokerProperties', id: d.id, data: d.data() }));

  let typeValidCount = 0;
  let bedroomsDefinedCount = 0;
  let areaDefinedCount = 0;
  const typeDist: Record<string, number> = {};

  const normalizedList = allDocs.map(item => {
    const norm = normalizeBrokerProperty(item.id, item.data);
    if (norm) {
      if (norm.type && norm.type !== 'Imóvel') typeValidCount++;
      typeDist[norm.type] = (typeDist[norm.type] || 0) + 1;
      if (norm.bedrooms !== undefined) bedroomsDefinedCount++;
      if (norm.usableArea !== undefined) areaDefinedCount++;
    }
    return { ...item, norm };
  });

  console.log("Fase 2 - Total normalizados em memória:", normalizedList.length);
  console.log("Fase 2 - Com tipo válido (!= 'Imóvel'):", typeValidCount);
  console.log("Fase 2 - Com bedrooms definido:", bedroomsDefinedCount);
  console.log("Fase 2 - Com área definida:", areaDefinedCount);
  console.log("Fase 2 - Distribuição de tipos:", JSON.stringify(typeDist, null, 2));

  // Simular busca em memória para Jardim Oceania (Apartamento, >=3 quartos, <=650k)
  const joaoPessoaOceaniaApts3Q650k = normalizedList.filter(item => {
    const p = item.norm;
    if (!p) return false;
    const isJP = p.city.toLowerCase().includes('joao pessoa');
    const isOceania = p.neighborhood.toLowerCase().includes('jardim oceania');
    const isApt = p.type.toLowerCase().includes('apartamento');
    const hasBedrooms = p.bedrooms !== undefined && p.bedrooms >= 3;
    const hasPrice = p.price <= 650000;
    return isJP && isOceania && isApt && hasBedrooms && hasPrice;
  });

  console.log("Fase 2 - Candidatos em memória (Jardim Oceania, Apt, >=3q, <=650k):", joaoPessoaOceaniaApts3Q650k.length);
  joaoPessoaOceaniaApts3Q650k.forEach(c => {
    console.log(`  - ID: ${c.id} | Título: ${c.norm?.title} | Tipo: ${c.norm?.type} | Quartos: ${c.norm?.bedrooms} | Preço: ${c.norm?.price}`);
  });

  // FASE 3: Dry Run Reconciliation
  console.log("Fase 3 - Executando Dry Run da Reconciliação...");
  const dryRunStats = await reconcilePublicInventory({ dryRun: true });
  console.log("Fase 3 - Dry Run stats:", JSON.stringify(dryRunStats, null, 2));

  // FASE 3: Reconciliação Real (Writes em oraPublicInventory)
  console.log("Fase 3 - Executando Reconciliação Real (oraPublicInventory)...");
  const realStats = await reconcilePublicInventory({ dryRun: false });
  console.log("Fase 3 - Reconciliação Real stats:", JSON.stringify(realStats, null, 2));

  // FASE 4: Repetir a primeira busca real da ORA
  console.log("Fase 4 - Testando busca real da ORA: 'quero um apartamento no jardim oceania, 3 quartos, ate 650 mil'");
  const searchResult = await processOraSearch({
    message: "quero um apartamento no jardim oceania, 3 quartos, ate 650 mil"
  });

  console.log("Fase 4 - searchReady:", searchResult.searchReady);
  console.log("Fase 4 - intent:", JSON.stringify(searchResult.intent, null, 2));
  console.log("Fase 4 - totalReturned:", searchResult.totalReturned);
  searchResult.properties.forEach(p => {
    console.log(`  -> [${p.id}] ${p.title} | Bairro: ${p.neighborhood} | Tipo: ${p.type} | Quartos: ${p.bedrooms} | Preço: ${p.price}`);
  });

  // Testes de regressão A/B/C/D/E
  console.log("Testes de Regressão:");
  const testA = await searchPublicProperties({ city: "João Pessoa", neighborhoods: ["Jardim Oceania"] }, { resultLimit: 100 });
  console.log("  - Teste A (Jardim Oceania):", testA.length);

  const testB = await searchPublicProperties({ city: "João Pessoa", neighborhoods: ["Jardim Oceania"], maxPrice: 650000 }, { resultLimit: 100 });
  console.log("  - Teste B (Jardim Oceania + maxPrice 650k):", testB.length);

  const testC = await searchPublicProperties({ city: "João Pessoa", neighborhoods: ["Jardim Oceania"], minBedrooms: 3 }, { resultLimit: 100 });
  console.log("  - Teste C (Jardim Oceania + minBedrooms 3):", testC.length);

  const testD = await searchPublicProperties({ city: "João Pessoa", propertyTypes: ["Apartamento"] }, { resultLimit: 100 });
  console.log("  - Teste D (João Pessoa + Apartamento):", testD.length);

  const testE = await searchPublicProperties({ city: "João Pessoa", neighborhoods: ["Jardim Oceania"], propertyTypes: ["Apartamento"], minBedrooms: 3, maxPrice: 650000 }, { resultLimit: 100 });
  console.log("  - Teste E (Busca completa):", testE.length);
  testE.forEach(p => {
    console.log(`    * [${p.id}] ${p.title} | ${p.neighborhood} | ${p.type} | Q: ${p.bedrooms} | R$ ${p.price}`);
  });
}

runEtapa653().catch(console.error);
