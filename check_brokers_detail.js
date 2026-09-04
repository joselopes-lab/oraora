const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

async function run() {
  const snap = await db.collection('brokers').get();
  snap.forEach(doc => {
    console.log('Broker doc ID:', doc.id, doc.data());
  });
}
run().catch(console.error);
