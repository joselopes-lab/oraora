
const admin = require('firebase-admin');
const fs = require('fs');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'oraora---construtora'
  });
}

const db = admin.firestore();

async function inspect() {
  console.log('--- Inspecting brokerProperties ---');
  const bpSnap = await db.collection('brokerProperties').limit(5).get();
  const bpData = bpSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(JSON.stringify(bpData, null, 2));

  console.log('\n--- Inspecting properties ---');
  const pSnap = await db.collection('properties').limit(5).get();
  const pData = pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(JSON.stringify(pData, null, 2));
}

inspect().catch(console.error);
