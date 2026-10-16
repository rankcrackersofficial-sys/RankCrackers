import * as crypto from 'crypto';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

type CallableContext = functions.https.CallableContext;

function requireAuth(context: CallableContext): string {
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  return uid;
}

function requireFounder(context: CallableContext): string {
  const uid = requireAuth(context);
  const token = (context.auth?.token ?? {}) as Record<string, unknown>;
  if (token.founder !== true && token.admin !== true) {
    throw new functions.https.HttpsError('permission-denied', 'Founder authority required.');
  }
  return uid;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function asInt(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback;
}

function normaliseCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function newCode(prefix: string): string {
  const suffix = crypto.randomBytes(5).toString('hex').toUpperCase();
  return `${normaliseCode(prefix).slice(0, 8) || 'RC'}${suffix}`;
}

function assertDateWindow(data: FirebaseFirestore.DocumentData, now: number): void {
  const startsAt = data.startsAt?.toMillis?.() ?? data.startsAt ?? 0;
  const expiresAt = data.expiresAt?.toMillis?.() ?? data.expiresAt ?? 0;
  if (startsAt && now < Number(startsAt)) throw new functions.https.HttpsError('failed-precondition', 'This offer is not live yet.');
  if (expiresAt && now >= Number(expiresAt)) throw new functions.https.HttpsError('failed-precondition', 'This offer has expired.');
}

const DEFAULT_REVENUE_CATALOG = [
  { offerId: 'starter_7d', title: 'Starter Pass', amountPaise: 4900, durationDays: 7 },
  { offerId: 'rank_mission_90d', title: '90-Day Rank Mission', amountPaise: 49900, durationDays: 90 },
  { offerId: 'elite_annual', title: 'Elite Annual', amountPaise: 149900, durationDays: 365 },
] as const;

async function loadOffer(offerId: string): Promise<FirebaseFirestore.DocumentData> {
  const snap = await db.collection('revenue_offers').doc(offerId).get();
  if (!snap.exists || snap.data()?.status !== 'published') {
    throw new functions.https.HttpsError('not-found', 'Offer is not available.');
  }
  const offer = snap.data()!;
  if (asInt(offer.amountPaise) <= 0 || asInt(offer.durationDays) <= 0 || asText(offer.currency, 'INR') !== 'INR') {
    throw new functions.https.HttpsError('failed-precondition', 'Offer pricing is invalid.');
  }
  assertDateWindow(offer, Date.now());
  return { id: snap.id, ...offer };
}

async function resolveCoupon(uid: string, rawCode: string, subtotalPaise: number, offerId: string): Promise<{ discountPaise: number; coupon?: FirebaseFirestore.DocumentData }> {
  const code = normaliseCode(rawCode);
  if (!code) return { discountPaise: 0 };
  const query = await db.collection('revenue_coupons').where('code', '==', code).limit(1).get();
  if (query.empty) throw new functions.https.HttpsError('not-found', 'Coupon code is invalid.');
  const couponSnap = query.docs[0];
  const coupon = couponSnap.data();
  if (coupon.status !== 'published') throw new functions.https.HttpsError('failed-precondition', 'Coupon is not active.');
  assertDateWindow(coupon, Date.now());
  const allowedOffers = Array.isArray(coupon.offerIds) ? coupon.offerIds : [];
  if (allowedOffers.length > 0 && !allowedOffers.includes(offerId)) throw new functions.https.HttpsError('failed-precondition', 'Coupon is not valid for this offer.');
  const usedBy = await db.collection('revenue_coupon_redemptions').where('couponId', '==', couponSnap.id).where('uid', '==', uid).limit(1).get();
  if (!usedBy.empty) throw new functions.https.HttpsError('already-exists', 'Coupon has already been used on this account.');
  const maxRedemptions = asInt(coupon.maxRedemptions, 0);
  if (maxRedemptions > 0 && asInt(coupon.redemptionCount, 0) >= maxRedemptions) throw new functions.https.HttpsError('failed-precondition', 'Coupon redemption limit has been reached.');
  const value = asInt(coupon.value, 0);
  const discountPaise = coupon.discountType === 'percent'
    ? Math.min(subtotalPaise, Math.floor(subtotalPaise * Math.min(value, 100) / 100))
    : Math.min(subtotalPaise, Math.max(value, 0));
  return { discountPaise, coupon: { id: couponSnap.id, ...coupon } };
}

export const createRevenueOffer = functions.https.onCall(async (data, context) => {
  const uid = requireFounder(context);
  const offerId = asText(data?.offerId) || db.collection('revenue_offers').doc().id;
  const amountPaise = asInt(data?.amountPaise);
  if (amountPaise <= 0) throw new functions.https.HttpsError('invalid-argument', 'amountPaise must be positive.');
  const offer = {
    title: asText(data?.title, 'RankCrackers Offer'),
    description: asText(data?.description),
    amountPaise,
    currency: 'INR',
    durationDays: Math.max(asInt(data?.durationDays, 30), 1),
    status: 'draft',
    createdBy: uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await db.collection('revenue_offers').doc(offerId).set(offer, { merge: true });
  return { offerId, status: 'draft' };
});

export const ensureRevenueCatalog = functions.https.onCall(async (_data, context) => {
  const uid = requireFounder(context);
  const batch = db.batch();
  const existing = await Promise.all(
    DEFAULT_REVENUE_CATALOG.map((preset) =>
      db.collection('revenue_offers').doc(preset.offerId).get(),
    ),
  );
  const result: Array<{ offerId: string; status: string }> = [];
  existing.forEach((snap, index) => {
    const preset = DEFAULT_REVENUE_CATALOG[index];
    if (snap.exists) {
      result.push({ offerId: preset.offerId, status: snap.data()?.status ?? 'existing' });
      return;
    }
    batch.set(db.collection('revenue_offers').doc(preset.offerId), {
      ...preset,
      currency: 'INR',
      status: 'draft',
      createdBy: uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    result.push({ offerId: preset.offerId, status: 'draft_created' });
  });
  if (result.some((item) => item.status === 'draft_created')) await batch.commit();
  return { offers: result };
});

export const publishRevenueOffer = functions.https.onCall(async (data, context) => {
  const uid = requireFounder(context);
  const offerId = asText(data?.offerId);
  if (!offerId) throw new functions.https.HttpsError('invalid-argument', 'offerId is required.');
  const offerRef = db.collection('revenue_offers').doc(offerId);
  const offerSnap = await offerRef.get();
  const offer = offerSnap.data();
  if (!offerSnap.exists || !offer) {
    throw new functions.https.HttpsError('not-found', 'Offer draft not found.');
  }
  if (asInt(offer.amountPaise) <= 0 || asInt(offer.durationDays) <= 0 || !asText(offer.title)) {
    throw new functions.https.HttpsError('failed-precondition', 'Offer must have valid title, price, and duration before publishing.');
  }
  await db.collection('revenue_offers').doc(offerId).set({ status: 'published', publishedBy: uid, publishedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return { offerId, status: 'published' };
});

export const createRevenueCoupon = functions.https.onCall(async (data, context) => {
  const uid = requireFounder(context);
  const couponId = db.collection('revenue_coupons').doc().id;
  const code = normaliseCode(asText(data?.code)) || newCode(asText(data?.prefix, 'RC'));
  const discountType = asText(data?.discountType, 'percent');
  const value = asInt(data?.value);
  if (!['percent', 'fixed'].includes(discountType) || value <= 0 || (discountType === 'percent' && value > 100)) {
    throw new functions.https.HttpsError('invalid-argument', 'Coupon discount is invalid.');
  }
  const existing = await db.collection('revenue_coupons').where('code', '==', code).limit(1).get();
  if (!existing.empty) throw new functions.https.HttpsError('already-exists', 'Coupon code already exists.');
  const expiryDays = Math.max(asInt(data?.expiryDays, 30), 1);
  await db.collection('revenue_coupons').doc(couponId).set({
    code, discountType, value, offerIds: Array.isArray(data?.offerIds) ? data.offerIds : [],
    maxRedemptions: Math.max(asInt(data?.maxRedemptions, 0), 0), redemptionCount: 0,
    startsAt: admin.firestore.Timestamp.now(),
    expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
    status: 'draft', createdBy: uid, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });
  return { couponId, code, status: 'draft' };
});

export const publishRevenueCoupon = functions.https.onCall(async (data, context) => {
  const uid = requireFounder(context);
  const couponId = asText(data?.couponId);
  if (!couponId) throw new functions.https.HttpsError('invalid-argument', 'couponId is required.');
  const couponSnap = await db.collection('revenue_coupons').doc(couponId).get();
  const coupon = couponSnap.data();
  if (!couponSnap.exists || !coupon) {
    throw new functions.https.HttpsError('not-found', 'Coupon draft not found.');
  }
  const couponValue = asInt(coupon.value);
  const couponType = asText(coupon.discountType);
  if (!asText(coupon.code) || !['percent', 'fixed'].includes(couponType) || couponValue <= 0 || (couponType === 'percent' && couponValue > 100)) {
    throw new functions.https.HttpsError('failed-precondition', 'Coupon must have valid code and discount before publishing.');
  }
  await db.collection('revenue_coupons').doc(couponId).set({ status: 'published', publishedBy: uid, publishedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return { couponId, status: 'published' };
});

export const createUpiPaymentOrder = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const offerId = asText(data?.offerId);
  const offer = await loadOffer(offerId);
  const subtotalPaise = asInt(offer.amountPaise);
  const couponResult = await resolveCoupon(uid, asText(data?.couponCode), subtotalPaise, offerId);
  const amountPaise = subtotalPaise - couponResult.discountPaise;
  const orderId = db.collection('revenue_payment_orders').doc().id;
  const merchantVpa = process.env.UPI_MERCHANT_VPA || '';
  const intent = merchantVpa ? `upi://pay?pa=${encodeURIComponent(merchantVpa)}&pn=${encodeURIComponent('RankCrackers')}&am=${(amountPaise / 100).toFixed(2)}&cu=INR&tr=${encodeURIComponent(orderId)}&tn=${encodeURIComponent(offer.title)}` : '';
  await db.collection('revenue_payment_orders').doc(orderId).set({
    orderId, uid, offerId, durationDays: asInt(offer.durationDays, 30), paymentMode: asText(data?.paymentMode, 'intent'), couponId: couponResult.coupon?.id ?? null, subtotalPaise, discountPaise: couponResult.discountPaise, amountPaise, currency: 'INR', status: 'created', paymentRail: 'upi', createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });
  return { orderId, amountPaise, currency: 'INR', upiIntent: intent, coupon: couponResult.coupon ? { code: couponResult.coupon.code, discountPaise: couponResult.discountPaise } : null, verification: 'pending_server_authorization' };
});

export const verifyUpiPaymentOrder = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const orderId = asText(data?.orderId);
  const snap = await db.collection('revenue_payment_orders').doc(orderId).get();
  if (!snap.exists || snap.data()?.uid !== uid) throw new functions.https.HttpsError('not-found', 'Payment order not found.');
  const order = snap.data()!;
  return { orderId, status: order.status, entitlementState: order.status === 'paid' ? 'active' : 'pending' };
});

export const recordUpiProviderAuthorization = functions.https.onCall(async (data, context) => {
  const uid = requireFounder(context);
  const orderId = asText(data?.orderId);
  const providerTransactionId = asText(data?.providerTransactionId);
  if (!orderId || !providerTransactionId) throw new functions.https.HttpsError('invalid-argument', 'Provider authorization fields are required.');
  const orderRef = db.collection('revenue_payment_orders').doc(orderId);
  await db.runTransaction(async (tx) => {
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) throw new functions.https.HttpsError('not-found', 'Payment order not found.');
    const order = orderSnap.data()!;
    if (order.status === 'paid') return;
    tx.update(orderRef, { status: 'paid', providerTransactionId, authorizedBy: uid, authorizedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    tx.set(db.collection('revenue_entitlements').doc(`${order.uid}_${order.offerId}`), { uid: order.uid, offerId: order.offerId, orderId, status: 'active', startsAt: FieldValue.serverTimestamp(), expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + Math.max(asInt(order.durationDays, 30), 1) * 24 * 60 * 60 * 1000), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    if (order.couponId) {
      tx.set(db.collection('revenue_coupon_redemptions').doc(`${order.couponId}_${order.uid}`), { couponId: order.couponId, uid: order.uid, orderId, redeemedAt: FieldValue.serverTimestamp() });
      tx.update(db.collection('revenue_coupons').doc(order.couponId), { redemptionCount: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() });
    }
  });
  return { orderId, status: 'paid' };
});
