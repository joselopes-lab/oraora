const sa = require('./service-account.json');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    projectId: sa.project_id,
  });
}

const db = admin.firestore();

async function run() {
  const uid = 'IPbpDLqidSes3AaHZtezIAymc8z1';
  const targetAgencyId = 'HuK3e03xwrtB4w49D8Ej';

  try {
    const membersSnap = await db.collection('imobiliaria_members')
      .where('userId', '==', uid)
      .where('agencyId', '==', targetAgencyId)
      .get();
      
    const memberRef = membersSnap.docs[0].ref;
    
    await memberRef.update({ status: 'active', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log('Membership activated successfully.');
    
  } catch (err) {
    console.error(err);
  }
}

run();
