'use server';

import { getAdminDb, getAdminAuth } from '@/firebase/index.server';
import { headers } from 'next/headers';

export async function executeAdminFinancialAction(input: {
  action: 'extend' | 'suspend' | 'reactivate';
  targetUserId: string;
  days?: number;
  reason: string;
}) {
  const authHeader = (await headers()).get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

  if (!token) {
    throw new Error('Não autorizado. Acesso negado.');
  }

  const adminAuth = getAdminAuth();
  const decoded = await adminAuth.verifyIdToken(token);
  const adminUserId = decoded.uid;

  // Verify admin role in Firestore users collection
  const db = getAdminDb();
  const userDoc = await db.collection('users').doc(adminUserId).get();
  const userData = userDoc.data();
  if (!userData || (userData.userType !== 'admin' && userData.role !== 'admin')) {
    throw new Error('Acesso restrito a administradores.');
  }

  if (!input.reason || input.reason.trim().length === 0) {
    throw new Error('O motivo da ação administrativa é obrigatório.');
  }

  const entitlementRef = db.collection('userEntitlements').doc(input.targetUserId);
  const auditRef = db.collection('financialAdminAudit').doc();

  const now = Date.now();

  await db.runTransaction(async (transaction) => {
    const entSnap = await transaction.get(entitlementRef);
    const currentData = entSnap.exists ? entSnap.data() : null;
    const previousState = currentData ? JSON.parse(JSON.stringify(currentData)) : null;

    let newState: any = {};

    if (input.action === 'extend') {
      const days = Number(input.days || 30);
      if (days <= 0 || days > 3650) throw new Error('Quantidade de dias inválida.');
      const addMs = days * 24 * 60 * 60 * 1000;

      const currentEndsAt = currentData?.endsAt || now;
      const startsAt = currentData?.startsAt || now;
      const newEndsAt = currentEndsAt > now ? currentEndsAt + addMs : now + addMs;

      newState = {
        userId: input.targetUserId,
        planId: currentData?.planId || 'default-plan',
        status: 'active',
        startsAt,
        endsAt: newEndsAt,
        updatedAt: now,
      };
      transaction.set(entitlementRef, newState, { merge: true });
    } else if (input.action === 'suspend') {
      newState = {
        ...(currentData || {}),
        status: 'suspended',
        updatedAt: now,
      };
      transaction.set(entitlementRef, newState, { merge: true });
    } else if (input.action === 'reactivate') {
      const endsAt = currentData?.endsAt || 0;
      const status = endsAt > now ? 'active' : 'expired';
      newState = {
        ...(currentData || {}),
        status,
        updatedAt: now,
      };
      transaction.set(entitlementRef, newState, { merge: true });
    }

    transaction.set(auditRef, {
      action: input.action,
      targetUserId: input.targetUserId,
      adminUserId,
      reason: input.reason.trim(),
      createdAt: now,
      previousState,
      newState,
    });
  });

  return { success: true };
}
