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
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    
    const agencyDoc = await db.collection('imobiliarias').doc(targetAgencyId).get();
    
    const membersSnap = await db.collection('imobiliaria_members')
      .where('userId', '==', uid)
      .where('agencyId', '==', targetAgencyId)
      .get();
      
    console.log('User AgencyId:', userData?.agencyId);
    console.log('Imobiliaria Exists:', agencyDoc.exists);
    console.log('Members count:', membersSnap.size);
    
    let activeFound = false;
    membersSnap.forEach(doc => {
      const data = doc.data();
      console.log('Membership:', data.role, data.status, data.leftAt);
      if (data.status === 'active') activeFound = true;
    });
    
    if (membersSnap.size === 1 && !activeFound) {
      console.log('Safe to heal: 1 record, inactive, matches criteria.');
    } else {
      console.log('Not safe to heal automatically.');
    }
    
  } catch (err) {
    console.error(err);
  }
}

run();
