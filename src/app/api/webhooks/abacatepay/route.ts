import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/firebase/index.server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get('abacatepay-signature') || req.headers.get('x-signature') || req.headers.get('signature') || '';
    
    const webhookSecret = process.env.ABACATEPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn('[AbacatePay Webhook] ABACATEPAY_WEBHOOK_SECRET não configurado. Rejeitando por segurança (fail closed).');
      return NextResponse.json({ success: false, error: 'Webhook secret not configured' }, { status: 401 });
    }

    if (signatureHeader) {
      const hmac = crypto.createHmac('sha256', webhookSecret);
      const digest = hmac.update(rawBody).digest('hex');
      const sigClean = signatureHeader.replace(/^sha256=/, '');
      if (sigClean.length !== digest.length || !crypto.timingSafeEqual(Buffer.from(sigClean, 'utf-8'), Buffer.from(digest, 'utf-8'))) {
        console.warn('[AbacatePay Webhook] Assinatura HMAC inválida.');
        return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ success: false, error: 'Missing signature header' }, { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const eventType = payload?.event || payload?.type || 'unknown';
    const eventId = payload?.id || payload?.eventId;

    if (!eventId) {
      return NextResponse.json({ success: false, error: 'Missing event ID for idempotency' }, { status: 400 });
    }

    const data = payload?.data || payload || {};
    const checkoutId = data.id || data.checkoutId || data.referenceId || data.externalId;
    const providerAmountCents = Number(data.amount || data.value || 0);

    const db = getAdminDb();

    // Use Firestore Transaction for atomic Idempotency + Payment update + Entitlement + Ledger
    const result = await db.runTransaction(async (transaction) => {
      // 1. Idempotency Check via paymentEvents
      const eventRef = db.collection('paymentEvents').doc(eventId);
      const eventSnap = await transaction.get(eventRef);
      if (eventSnap.exists) {
        return { status: 'already_processed' };
      }

      // 2. Map status
      let canonicalStatus = 'pending';
      if (['checkout.completed', 'transparent.completed'].includes(eventType)) {
        canonicalStatus = 'paid';
      } else if (['checkout.refunded', 'transparent.refunded'].includes(eventType)) {
        canonicalStatus = 'refunded';
      } else if (['checkout.disputed', 'transparent.disputed'].includes(eventType)) {
        canonicalStatus = 'disputed';
      } else if (['checkout.lost', 'transparent.lost'].includes(eventType)) {
        canonicalStatus = 'lost';
      }

      // 3. Locate payment
      let paymentDocRef: any = null;
      let paymentData: any = null;

      const paymentQuery = db.collection('payments').where('providerCheckoutId', '==', checkoutId);
      const paymentSnap = await transaction.get(paymentQuery);

      if (!paymentSnap.empty) {
        const docSnap = paymentSnap.docs[0];
        paymentDocRef = docSnap.ref;
        paymentData = docSnap.data();
      } else {
        const extQuery = db.collection('payments').where('externalId', '==', checkoutId);
        const extSnap = await transaction.get(extQuery);
        if (!extSnap.empty) {
          const docSnap = extSnap.docs[0];
          paymentDocRef = docSnap.ref;
          paymentData = docSnap.data();
        }
      }

      const now = Date.now();

      if (paymentDocRef && paymentData) {
        // Amount validation for paid events
        if (canonicalStatus === 'paid' && paymentData.amount && providerAmountCents > 0 && providerAmountCents !== paymentData.amount) {
          transaction.set(eventRef, {
            eventId,
            eventType,
            checkoutId,
            canonicalStatus: 'amount_mismatch',
            receivedAt: now,
            processedAt: now,
          });
          return { status: 'amount_mismatch' };
        }

        const updatePayload: any = {
          status: canonicalStatus,
          updatedAt: now,
        };
        if (canonicalStatus === 'paid') {
          updatePayload.paidAt = data.paidAt ? new Date(data.paidAt).getTime() : now;
        }
        if (canonicalStatus === 'refunded') updatePayload.refundedAt = now;
        if (canonicalStatus === 'disputed') updatePayload.disputedAt = now;
        if (canonicalStatus === 'lost') updatePayload.lostAt = now;

        transaction.update(paymentDocRef, updatePayload);

        // Grant or extend entitlement if paid
        if (canonicalStatus === 'paid' && paymentData?.userId) {
          const userId = paymentData.userId;
          const planId = paymentData.planId || 'default-plan';
          const durationDays = Number(paymentData.durationDaysSnapshot || 30);
          const durationMs = durationDays * 24 * 60 * 60 * 1000;

          const entitlementRef = db.collection('userEntitlements').doc(userId);
          const entSnap = await transaction.get(entitlementRef);

          let startsAt = now;
          let endsAt = now + durationMs;

          if (entSnap.exists) {
            const entData = entSnap.data();
            const currentEndsAt = entData?.endsAt || 0;
            if (currentEndsAt > now) {
              startsAt = currentEndsAt;
              endsAt = currentEndsAt + durationMs;
            }
          }

          transaction.set(entitlementRef, {
            userId,
            planId,
            status: 'active',
            startsAt,
            endsAt,
            sourcePaymentId: paymentDocRef.id,
            updatedAt: now,
          }, { merge: true });
        }
      }

      // Record Event Ledger
      transaction.set(eventRef, {
        eventId,
        eventType,
        checkoutId,
        canonicalStatus,
        receivedAt: now,
        processedAt: now,
      });

      return { status: 'success' };
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('[AbacatePay Webhook Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
