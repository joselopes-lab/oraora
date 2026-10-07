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
  const uid = 'wRBWQjPfvLQNbAoUNNVayTmbP633'; // ollarhub@gmail.com
  console.log('--- COMPARING USER AND MEMBERSHIP IN RUNTIME ENVIRONMENT ---');

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      console.log('User not found.');
      return;
    }
    const userData = userDoc.data();
    const agencyId = userData.agencyId;
    console.log('1. User Document:', userData);
    console.log('2. Users agencyId:', agencyId);
    console.log('3. Firebase Admin SDK Project ID:', sa.project_id);

    // 4. Query imobiliaria_members
    const memberQuery = await db
      .collection('imobiliaria_members')
      .where('agencyId', '==', agencyId)
      .where('userId', '==', uid)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    console.log('4. Original query matches:', memberQuery.size);
    if (!memberQuery.empty) {
      console.log('Match Doc:', memberQuery.docs[0].id, memberQuery.docs[0].data());
    }

    // 5. Query any memberships for uid
    const anyMembershipsSnap = await db.collection('imobiliaria_members').where('userId', '==', uid).get();
    console.log('5. Total memberships found for userId == uid:', anyMembershipsSnap.size);
    anyMembershipsSnap.forEach(doc => {
      console.log(`- MemberDoc ID: "${doc.id}"`);
      console.log(`  userId: "${doc.data().userId}"`);
      console.log(`  agencyId: "${doc.data().agencyId}"`);
      console.log(`  role: "${doc.data().role}"`);
      console.log(`  status: "${doc.data().status}"`);
    });

  } catch (err) {
    console.error(err);
  }
}

run();
