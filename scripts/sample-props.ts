import { adminDb } from '../src/firebase/index.server';

async function sample() {
  const propsSnap = await adminDb.collection('properties').limit(3).get();
  console.log("=== PROPERTIES SAMPLE ===");
  propsSnap.forEach(doc => {
    console.log(doc.id, JSON.stringify(doc.data(), null, 2));
  });

  const brokerSnap = await adminDb.collection('brokerProperties').limit(3).get();
  console.log("=== BROKER PROPERTIES SAMPLE ===");
  brokerSnap.forEach(doc => {
    console.log(doc.id, JSON.stringify(doc.data(), null, 2));
  });
}

sample().catch(console.error);
