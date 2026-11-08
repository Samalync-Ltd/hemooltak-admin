import { auth, db, functions } from '../firebase/config';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import {
    doc, getDoc, getDocs, setDoc, collection, query, where, orderBy, serverTimestamp, onSnapshot,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { TruckType, TruckTypeAr, AccountDocumentTypeAr } from '../constants/enums';

const call = (name) => httpsCallable(functions, name);

const money = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

/** Arabic per backend `details.reason` — all 29 in INTEGRATION.md §18. */
const REASON_MESSAGES = {
    // Admin actions
    DOCUMENTS_NOT_APPROVED: ({ missing }) => (Array.isArray(missing) && missing.length > 0
        ? `لا يمكن توثيق الحساب قبل اعتماد المستندات التالية: ${missing.map((t) => AccountDocumentTypeAr[t] || t).join('، ')}`
        : 'لا يمكن توثيق الحساب قبل اعتماد جميع المستندات المطلوبة.'),
    TRUCK_DOCUMENT_MISSING: () => 'لم يُرفع هذا المستند بعد.',
    NOT_SUSPENDED: () => 'هذا الحساب غير موقوف.',
    WITHDRAWAL_ALREADY_PROCESSED: () => 'تمت معالجة طلب السحب هذا مسبقاً.',
    NO_DEBT: () => 'لا يوجد مبلغ مستحق على هذا الحساب.',
    // User-side reasons an admin action can also hit (e.g. adminCancelTrip)
    ACCOUNT_NOT_VERIFIED: () => 'الحساب قيد المراجعة ولم يُوثّق بعد.',
    CARRIER_SUSPENDED: () => 'حساب الناقل موقوف مؤقتاً بسبب تكرار الإلغاء.',
    CARRIER_BUSY: () => 'الناقل لديه رحلة نشطة.',
    CARRIER_IN_DEBT: ({ debt }) => (debt != null ? `على الناقل مبلغ مستحق للمنصة (${money(debt)} ر.س).` : 'على الناقل مبلغ مستحق للمنصة.'),
    PHONE_UNCHANGED: () => 'هذا هو رقم الجوال الحالي.',
    SHIPMENT_NOT_OPEN: () => 'هذه الشحنة لم تعد متاحة.',
    SITE_DETAILS_LOCKED: () => 'لا يمكن تعديل تفاصيل الموقع بعد إسناد الشحنة.',
    OWN_SHIPMENT: () => 'لا يمكن تقديم عرض على الشحنة نفسها.',
    OFFER_ALREADY_OPEN: () => 'يوجد عرض بانتظار الرد على هذه الشحنة.',
    OFFER_NOT_PENDING: () => 'هذا العرض لم يعد متاحاً. حدّث الصفحة.',
    NOT_YOUR_TURN: () => 'بانتظار رد الطرف الآخر على العرض.',
    TRUCK_WRONG_TYPE: () => 'نوع الشاحنة لا يطابق النوع المطلوب لهذه الشحنة.',
    TRUCK_CAPACITY_TOO_LOW: ({ capacityTons, weight }) => (capacityTons != null && weight != null
        ? `حمولة الشاحنة (${capacityTons} طن) أقل من وزن الشحنة (${weight} طن).`
        : 'حمولة الشاحنة أقل من وزن الشحنة.'),
    TRUCK_NOT_APPROVED: () => 'مستندات الشاحنة لم تُعتمد بعد.',
    INSUFFICIENT_BALANCE: ({ availableBalance, required, requested }) => {
        const needed = required ?? requested;
        return availableBalance != null && needed != null
            ? `الرصيد المتاح (${money(availableBalance)} ر.س) لا يكفي. المبلغ المطلوب ${money(needed)} ر.س.`
            : 'الرصيد المتاح لا يكفي لهذه العملية.';
    },
    BANK_DETAILS_MISSING: () => 'لا توجد بيانات حساب بنكي لهذا الناقل.',
    TRIP_NOT_ACTIVE: () => 'هذه الرحلة لم تعد نشطة.',
    STAGE_OUT_OF_ORDER: () => 'يجب تحديث مراحل الرحلة بالترتيب.',
    PROOF_MISSING: () => 'صورة الإثبات لم تُرفع بعد.',
    TRIP_NOT_DELIVERED: () => 'لا يمكن التقييم قبل تسليم الشحنة.',
    NOTHING_TO_CANCEL: () => 'لا يوجد إسناد لإلغائه في هذه الشحنة.',
    CANCEL_NOT_ALLOWED: () => 'لا يمكن الإلغاء بعد تحميل الشحنة.',
    // Platform setup
    PLATFORM_NOT_CONFIGURED: () => 'حدث خطأ في المنصة — نسبة العمولة غير مضبوطة في صفحة العمولات.',
    PHONE_LOGIN_UNAVAILABLE: () => 'حدث خطأ في المنصة، حاول لاحقاً',
};

/**
 * Cloud Function errors arrive in English (and Firestore's in technical
 * English) — turn them into something an Arabic-speaking admin can act on.
 * Messages that are already Arabic (thrown by this file) pass through.
 */
export const toArabicError = (err) => {
    // A backend reason code decides the message (INTEGRATION.md §18) —
    // never the English error text.
    const details = (typeof err === 'object' && err !== null) ? (err.details || err.customData?.details) : null;
    const reason = details?.reason;
    if (reason) {
        if (reason === 'PLATFORM_NOT_CONFIGURED' || reason === 'PHONE_LOGIN_UNAVAILABLE') console.error('Platform misconfigured:', reason);
        return REASON_MESSAGES[reason] ? REASON_MESSAGES[reason](details) : 'تعذّر تنفيذ هذا الإجراء حالياً. حدّث الصفحة وحاول مرة أخرى.';
    }

    const message = err?.message || '';
    if (/[؀-ۿ]/.test(message)) return message;
    const code = (err?.code || '').replace(/^functions\//, '');
    if (code === 'failed-precondition' && Array.isArray(err?.details?.missing)) {
        const names = err.details.missing.map((t) => AccountDocumentTypeAr[t] || t).join('، ');
        return `لا يمكن توثيق الحساب قبل قبول المستندات التالية: ${names}`;
    }
    switch (code) {
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
            return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        case 'auth/invalid-email':
            return 'صيغة البريد الإلكتروني غير صحيحة';
        case 'auth/user-disabled':
            return 'هذا الحساب موقوف — تواصل مع مسؤول النظام';
        case 'auth/too-many-requests':
            return 'محاولات كثيرة فاشلة — انتظر قليلاً ثم حاول مرة أخرى';
        case 'auth/network-request-failed':
            return 'تعذّر الاتصال بالخادم. تحقق من الاتصال بالإنترنت وحاول مرة أخرى.';
        case 'permission-denied':
        case 'unauthenticated':
            return 'ليست لديك صلاحية لتنفيذ هذا الإجراء. سجّل الدخول بحساب مدير ثم حاول مرة أخرى.';
        case 'not-found':
            return 'العنصر المطلوب غير موجود — ربما حُذف أو تغيّر. حدّث الصفحة وحاول مرة أخرى.';
        case 'failed-precondition':
            return 'لا يمكن تنفيذ هذا الإجراء في الحالة الحالية للطلب. حدّث الصفحة وتأكد من حالته.';
        case 'invalid-argument':
            return 'البيانات المرسلة غير صحيحة. تأكد من الحقول وحاول مرة أخرى.';
        case 'unavailable':
        case 'deadline-exceeded':
        case 'internal':
            return 'تعذّر الاتصال بالخادم. تحقق من الاتصال بالإنترنت وحاول مرة أخرى.';
        default:
            return 'حدث خطأ غير متوقع. حاول مرة أخرى.';
    }
};

// --- Session ----------------------------------------------------------
// The backend never issues an ADMIN role through signUp (INTEGRATION.md
// §3) — role is read from the caller's own users/{uid} profile, same as
// every admin Cloud Function's own auth check, so a non-admin can never
// end up on this dashboard even if they had valid credentials.
const loadAdminSession = async (user) => {
    if (!user) return null;
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists() || snap.data().role !== 'ADMIN') {
        await signOut(auth);
        return null;
    }
    const data = snap.data();
    return { id: user.uid, name: data.name, email: data.email };
};

/** Subscribes to the current admin session; fires once immediately with the current state, then on every change. Returns the unsubscribe function. */
export const subscribeToAdminSession = (callback) =>
    onAuthStateChanged(auth, async (user) => {
        callback(await loadAdminSession(user));
    });

export const adminLogin = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const session = await loadAdminSession(credential.user);
    if (!session) throw new Error('هذا الحساب لا يملك صلاحية الدخول إلى لوحة الإدارة');
    return session;
};

export const adminLogout = async () => {
    await signOut(auth);
};

// --- Accounts & documents (users/{uid}, users/{uid}/documents, users/{uid}/trucks) ---
// Field names on the wire (name, role, accountStatus, createdAt) come
// straight from INTEGRATION.md §2; `fullName`/`type`/`status`/`submissionDate`
// below are this dashboard's own display names, mapped once here.
const toAccountSummary = (docSnap) => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        fullName: data.name,
        companyName: data.companyName || null,
        phone: data.phone,
        email: data.email,
        type: data.role, // SHIPPER | CARRIER
        accountType: data.accountType || null, // INDIVIDUAL | COMPANY — decides which documents are required
        status: data.accountStatus,
        isSuspended: !!data.isSuspended,
        submissionDate: data.createdAt?.toDate?.() ?? null,
        rejectReason: data.rejectReason || null,
        // When an admin last decided on the account (approveAccount/rejectAccount set it).
        reviewedAt: data.reviewedAt?.toDate?.() ?? null,
    };
};

export const getAccounts = async () => {
    const q = query(collection(db, 'users'), where('role', 'in', ['SHIPPER', 'CARRIER']));
    const snap = await getDocs(q);
    return snap.docs.map(toAccountSummary);
};

export const getAccountById = async (uid) => {
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (!userSnap.exists()) throw new Error('الحساب غير موجود');

    const [docsSnap, trucksSnap] = await Promise.all([
        getDocs(collection(db, 'users', uid, 'documents')),
        getDocs(collection(db, 'users', uid, 'trucks')),
    ]);

    return {
        ...toAccountSummary(userSnap),
        documents: docsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        trucks: trucksSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    };
};

export const approveDocument = async (uid, documentId) =>
    (await call('approveDocument')({ uid, documentId })).data;

export const rejectDocument = async (uid, documentId, reason) =>
    (await call('rejectDocument')({ uid, documentId, reason })).data;

export const approveAccount = async (uid) =>
    (await call('approveAccount')({ uid })).data;

export const rejectAccount = async (uid, reason) =>
    (await call('rejectAccount')({ uid, reason })).data;

export const approveTruckDocument = async (uid, truckId, field) =>
    (await call('approveTruckDocument')({ uid, truckId, field })).data;

export const rejectTruckDocument = async (uid, truckId, field, reason) =>
    (await call('rejectTruckDocument')({ uid, truckId, field, reason })).data;

// --- Withdrawals (withdrawals/{id}) ------------------------------------
export const getWithdrawals = async () => {
    const snap = await getDocs(collection(db, 'withdrawals'));
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // The withdrawal doc only carries carrierId (INTEGRATION.md §9) — look
    // up each carrier's name once per unique id for display.
    const carrierIds = [...new Set(rows.map((r) => r.carrierId))];
    const names = {};
    await Promise.all(carrierIds.map(async (uid) => {
        const snap = await getDoc(doc(db, 'users', uid));
        names[uid] = snap.exists() ? snap.data().name : uid;
    }));

    return rows
        .map((r) => ({
            id: r.id,
            carrierId: r.carrierId,
            carrierName: names[r.carrierId] || r.carrierId,
            amount: r.amount,
            status: r.status,
            // Snapshot taken when the carrier requested this withdrawal —
            // pay to THIS, never to the carrier's current profile IBAN
            // (INTEGRATION.md §9). Older requests have neither field.
            iban: r.iban || null,
            bankAccountName: r.bankAccountName || null,
            note: r.note || null,
            requestDate: r.requestedAt?.toDate?.() ?? null,
        }))
        .sort((a, b) => (b.requestDate?.getTime() ?? 0) - (a.requestDate?.getTime() ?? 0));
};

// --- Admin inbox (the header bell) ----------------------------------------
// Everything waiting on an admin, read live from data that already exists:
// accounts UNDER_REVIEW, truck papers PENDING, withdrawals PENDING. Trucks
// have no collection-group read rule, so each carrier's trucks subcollection
// gets its own listener, attached and detached as carriers come and go.
const isPaperPending = (paper) => paper?.status === 'PENDING' && !!paper?.fileUrl;

/** Calls back with { accounts, trucks, withdrawals } (each newest first) on every change. Returns the unsubscribe function. */
export const subscribeToAdminInbox = (callback) => {
    let users = new Map(); // uid -> profile data
    const trucksByCarrier = new Map(); // uid -> pending truck items
    const truckUnsubs = new Map(); // uid -> unsubscribe
    let pendingWithdrawals = [];
    const ready = { users: false, withdrawals: false };

    const nameOf = (uid) => {
        const u = users.get(uid);
        return u ? (u.companyName || u.name) : uid;
    };

    const emit = () => {
        if (!ready.users || !ready.withdrawals) return;
        const accounts = [...users.entries()]
            .filter(([, u]) => u.accountStatus === 'UNDER_REVIEW')
            .map(([uid, u]) => ({ id: uid, name: u.companyName || u.name, role: u.role, date: toDate(u.createdAt) }))
            .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
        const trucks = [...trucksByCarrier.values()].flat()
            .map((t) => ({ ...t, carrierName: nameOf(t.carrierId) }));
        const withdrawals = pendingWithdrawals
            .map((w) => ({ ...w, carrierName: nameOf(w.carrierId) }))
            .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
        callback({ accounts, trucks, withdrawals });
    };

    const watchTrucks = (uid) => {
        if (truckUnsubs.has(uid)) return;
        truckUnsubs.set(uid, onSnapshot(collection(db, 'users', uid, 'trucks'), (snap) => {
            trucksByCarrier.set(uid, snap.docs
                .filter((d) => isPaperPending(d.data().operatingCard) || isPaperPending(d.data().registration))
                .map((d) => {
                    const t = d.data();
                    return {
                        id: d.id,
                        carrierId: uid,
                        label: [t.brand, t.model].filter(Boolean).join(' ') || t.plateNumber || 'مركبة',
                        plateNumber: t.plateNumber || null,
                        pendingCount: [t.operatingCard, t.registration].filter(isPaperPending).length,
                    };
                }));
            emit();
        }, (err) => console.error('inbox: trucks', uid, err)));
    };

    const unsubUsers = onSnapshot(
        query(collection(db, 'users'), where('role', 'in', ['SHIPPER', 'CARRIER'])),
        (snap) => {
            users = new Map(snap.docs.map((d) => [d.id, d.data()]));
            const carriers = new Set(snap.docs.filter((d) => d.data().role === 'CARRIER').map((d) => d.id));
            carriers.forEach(watchTrucks);
            [...truckUnsubs.keys()].filter((uid) => !carriers.has(uid)).forEach((uid) => {
                truckUnsubs.get(uid)();
                truckUnsubs.delete(uid);
                trucksByCarrier.delete(uid);
            });
            ready.users = true;
            emit();
        },
        (err) => console.error('inbox: users', err),
    );

    const unsubWithdrawals = onSnapshot(
        query(collection(db, 'withdrawals'), where('status', '==', 'PENDING')),
        (snap) => {
            pendingWithdrawals = snap.docs.map((d) => ({
                id: d.id, carrierId: d.data().carrierId, amount: d.data().amount, date: toDate(d.data().requestedAt),
            }));
            ready.withdrawals = true;
            emit();
        },
        (err) => console.error('inbox: withdrawals', err),
    );

    return () => {
        unsubUsers();
        unsubWithdrawals();
        truckUnsubs.forEach((unsub) => unsub());
    };
};

export const processWithdrawal = async (withdrawalId, decision, reason) =>
    (await call('processWithdrawal')({ withdrawalId, decision, ...(reason ? { reason } : {}) })).data;

// --- Commission config (config/platform) -------------------------------
// Readable by any signed-in user, writable by admins only (firestore.rules
// §config) — this is a direct Firestore write, not a Cloud Function; there
// is no dedicated function for it (README.md, "config/platform must be
// seeded before money can move").
export const getCommissionConfig = async () => {
    const snap = await getDoc(doc(db, 'config', 'platform'));
    if (!snap.exists()) return { commissionPercent: null, warningThreshold: 3 };
    const data = snap.data();
    return { commissionPercent: data.commissionPercent ?? null, warningThreshold: data.warningThreshold ?? 3 };
};

/** Writes only the fields passed — leaving one out keeps whatever is already in config/platform. */
export const setCommissionConfig = async ({ commissionPercent, warningThreshold }) => {
    const updates = {};
    if (commissionPercent !== undefined) updates.commissionPercent = commissionPercent;
    if (warningThreshold !== undefined) updates.warningThreshold = warningThreshold;
    await setDoc(doc(db, 'config', 'platform'), updates, { merge: true });
};

// --- Commission report ---------------------------------------------------
// There is no dedicated "commission report" collection or function in
// INTEGRATION.md — COMMISSION_DEDUCTION entries live on each user's own
// wallets/{uid}/transactions (§9), which is the only indexed, rule-allowed
// read path (see firestore.indexes.json: the `transactions` index is
// COLLECTION-scoped, not COLLECTION_GROUP, so a cross-user query isn't a
// supported access pattern). This walks every account's own transactions
// instead of guessing at an unsupported collectionGroup query.
export const getCommissionReport = async () => {
    const usersSnap = await getDocs(query(collection(db, 'users'), where('role', 'in', ['SHIPPER', 'CARRIER'])));

    const rows = [];
    await Promise.all(usersSnap.docs.map(async (userDoc) => {
        const txQ = query(
            collection(db, 'wallets', userDoc.id, 'transactions'),
            where('type', '==', 'COMMISSION_DEDUCTION'),
        );
        const txSnap = await getDocs(txQ);
        txSnap.docs.forEach((txDoc) => {
            const data = txDoc.data();
            rows.push({
                id: txDoc.id,
                userId: userDoc.id,
                userName: userDoc.data().name,
                shipmentId: data.shipmentId || null,
                amount: data.withheld ?? Math.abs(data.amount ?? 0),
                date: data.createdAt?.toDate?.() ?? null,
            });
        });
    }));

    return rows.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
};

// --- Dashboard overview --------------------------------------------------
export const getDashboardMetrics = async () => {
    const usersSnap = await getDocs(query(collection(db, 'users'), where('role', 'in', ['SHIPPER', 'CARRIER'])));
    const accounts = usersSnap.docs.map((d) => d.data());
    const shippers = accounts.filter((a) => a.role === 'SHIPPER').length;
    const carriers = accounts.filter((a) => a.role === 'CARRIER').length;
    const pendingAccounts = accounts.filter((a) => a.accountStatus === 'UNDER_REVIEW').length;

    const shipmentsSnap = await getDocs(collection(db, 'shipments'));
    const shipmentCounts = {
        PENDING_OFFERS: 0, NEGOTIATING: 0, ACTIVE: 0, COMPLETED: 0, CANCELLED: 0,
    };
    shipmentsSnap.docs.forEach((d) => {
        const status = d.data().status;
        if (shipmentCounts[status] !== undefined) shipmentCounts[status]++;
    });

    const commissionRows = await getCommissionReport();
    const totalCommission = commissionRows.reduce((sum, r) => sum + r.amount, 0);

    return {
        users: { total: shippers + carriers, shippers, carriers },
        pendingAccounts,
        shipmentCounts,
        totalCommission,
    };
};

// --- Shared helpers for the Stage 2 pages --------------------------------
const toDate = (value) => value?.toDate?.() ?? null;

/** uid -> display name, one read per unique uid. Admins may read every profile (firestore.rules users/{uid}). */
const resolveNames = async (uids) => {
    const names = {};
    await Promise.all([...new Set(uids.filter(Boolean))].map(async (uid) => {
        const snap = await getDoc(doc(db, 'users', uid));
        names[uid] = snap.exists() ? (snap.data().companyName || snap.data().name) : uid;
    }));
    return names;
};

// --- Shipments (shipments/{id}, INTEGRATION.md §9) -----------------------
export const getShipments = async () => {
    const snap = await getDocs(query(collection(db, 'shipments'), orderBy('createdAt', 'desc')));
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const names = await resolveNames(rows.flatMap((r) => [r.shipperId, r.assignedCarrierId]));
    return rows.map((r) => ({
        id: r.id,
        status: r.status,
        shipperName: names[r.shipperId] || r.shipperId,
        assignedCarrierName: r.assignedCarrierId ? (names[r.assignedCarrierId] || r.assignedCarrierId) : null,
        pickupCity: r.pickupCity,
        deliveryCity: r.deliveryCity,
        suggestedPrice: r.suggestedPrice,
        finalPrice: r.finalPrice ?? null,
        offerCount: r.offerCount ?? 0,
        createdAt: toDate(r.createdAt),
    }));
};

/**
 * Everything about one shipment an admin can see: the public listing, the
 * private siteDetails half, every offer on it (grouped into one chain per
 * carrier, in the order they were made), and the trip once one exists.
 */
export const getShipmentDetails = async (shipmentId) => {
    const shipmentSnap = await getDoc(doc(db, 'shipments', shipmentId));
    if (!shipmentSnap.exists()) return null;
    const s = shipmentSnap.data();

    const [siteSnap, offersSnap, tripSnap] = await Promise.all([
        getDoc(doc(db, 'shipments', shipmentId, 'private', 'siteDetails')),
        getDocs(collection(db, 'shipments', shipmentId, 'offers')),
        s.tripId ? getDoc(doc(db, 'trips', s.tripId)) : Promise.resolve(null),
    ]);

    const offers = offersSnap.docs
        .map((d) => ({ id: d.id, ...d.data(), createdAt: toDate(d.data().createdAt) }))
        .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));

    const names = await resolveNames([s.shipperId, s.assignedCarrierId, ...offers.map((o) => o.carrierId)]);
    const site = siteSnap.exists() ? siteSnap.data() : null;
    const trip = tripSnap?.exists() ? { id: tripSnap.id, ...tripSnap.data() } : null;

    return {
        id: shipmentSnap.id,
        ...s,
        shipperName: names[s.shipperId] || s.shipperId,
        assignedCarrierName: s.assignedCarrierId ? (names[s.assignedCarrierId] || s.assignedCarrierId) : null,
        createdAt: toDate(s.createdAt),
        loadingDate: toDate(s.loadingDate),
        cancelledAt: toDate(s.cancelledAt),
        siteDetails: site && {
            pickupLat: site.pickupCoords?.latitude, pickupLng: site.pickupCoords?.longitude,
            deliveryLat: site.deliveryCoords?.latitude, deliveryLng: site.deliveryCoords?.longitude,
            pickupNotes: site.pickupNotes || '', deliveryNotes: site.deliveryNotes || '',
            onSiteContact: site.onSiteContact,
        },
        offers: offers.map((o) => ({
            id: o.id,
            carrierId: o.carrierId,
            carrierName: o.carrierName || names[o.carrierId] || o.carrierId,
            amount: o.amount,
            status: o.status,
            proposedBy: o.proposedBy,
            rejectReason: o.rejectReason || null,
            createdAt: o.createdAt,
        })),
        trip: trip && {
            id: trip.id,
            stage: trip.stage,
            status: trip.status,
            agreedPrice: trip.agreedPrice,
            stageHistory: (trip.stageHistory || []).map((h) => ({ stage: h.stage, timestamp: toDate(h.timestamp) })),
            proofOfLoadUrl: trip.proofOfLoad?.url || null,
            proofOfDeliveryUrl: trip.proofOfDelivery?.url || null,
        },
    };
};

// --- Trips (trips/{id}) --------------------------------------------------
/** All trips, newest first — ACTIVE ones are what the admin acts on; finished ones stay visible for context. */
export const getTrips = async () => {
    const snap = await getDocs(query(collection(db, 'trips'), orderBy('createdAt', 'desc')));
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const names = await resolveNames(rows.flatMap((r) => [r.shipperId, r.carrierId]));
    const shipmentSnaps = await Promise.all([...new Set(rows.map((r) => r.shipmentId))].map((id) => getDoc(doc(db, 'shipments', id))));
    const routes = Object.fromEntries(shipmentSnaps.filter((s) => s.exists()).map((s) => [s.id, `${s.data().pickupCity} ← ${s.data().deliveryCity}`]));

    return rows.map((t) => {
        const history = t.stageHistory || [];
        const last = history[history.length - 1];
        return {
            id: t.id,
            shipmentId: t.shipmentId,
            route: routes[t.shipmentId] || '—',
            shipperName: names[t.shipperId] || t.shipperId,
            carrierName: names[t.carrierId] || t.carrierId,
            stage: t.stage,
            status: t.status, // read before stage — a CANCELLED trip keeps the stage it died at (INTEGRATION.md §8)
            agreedPrice: t.agreedPrice,
            updatedAt: toDate(t.cancelledAt) || toDate(t.completedAt) || toDate(last?.timestamp) || toDate(t.createdAt),
        };
    });
};

/** The only way to end a trip at LOADED or later (INTEGRATION.md §12). chargeTo: SHIPPER | CARRIER | NONE. */
export const adminCancelTrip = async (tripId, reason, chargeTo) =>
    (await call('adminCancelTrip')({ tripId, reason, chargeTo })).data;

// --- Carrier accountability (users/{uid} where role == CARRIER) ----------
export const getCarriersAccountability = async () => {
    const [snap, config] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('role', '==', 'CARRIER'))),
        getCommissionConfig(),
    ]);
    const carriers = snap.docs.map((d) => {
        const c = d.data();
        return {
            id: d.id,
            name: c.companyName || c.name,
            phone: c.phone,
            accountStatus: c.accountStatus,
            warnings: c.warnings ?? 0,
            isSuspended: !!c.isSuspended,
            outstandingDebt: c.outstandingDebt ?? 0,
            isBusy: !!c.isBusy,
            completedTrips: c.completedTrips ?? 0,
        };
    });
    return { carriers, warningThreshold: config.warningThreshold };
};

/** Lifts an operating ban; resetWarnings also sets warnings to 0. Only works on a suspended carrier — the backend has no standalone "reset warnings". */
export const liftSuspension = async (uid, reason, resetWarnings) =>
    (await call('liftSuspension')({ uid, reason, resetWarnings: !!resetWarnings })).data;

/** Writes off what a user owes, whole (no amount) or in part. Does not lift a suspension or touch warnings (INTEGRATION.md §12). */
export const forgiveDebt = async (uid, reason, amount) =>
    (await call('forgiveDebt')({ uid, reason, ...(amount ? { amount: Number(amount) } : {}) })).data;

// --- Broadcast notifications (sendBroadcast, INTEGRATION.md notifications) ---
/** audience: ALL | SHIPPER | CARRIER. Resolves { audience, recipients }. */
export const sendBroadcast = async ({ title, body, audience }) =>
    (await call('sendBroadcast')({ title, body, audience })).data;

// --- Platform content (config/content) -----------------------------------
// No Cloud Function exists for this; like the master data below it lives in
// config/{docId}, which only admins may write (firestore.rules).
export const getPlatformContent = async () => {
    const snap = await getDoc(doc(db, 'config', 'content'));
    const data = snap.exists() ? snap.data() : {};
    return { aboutUs: data.aboutUs || '', terms: data.terms || '' };
};

export const savePlatformContent = async (field, value) => {
    await setDoc(doc(db, 'config', 'content'), { [field]: value, updatedAt: serverTimestamp() }, { merge: true });
};

// --- Master data: truck & cargo types (config/truckTypes, config/cargoTypes) ---
// There is no Cloud Function for these. `config/{docId}` is readable by any
// signed-in user and writable by admins only (firestore.rules), so the lists
// live there and the shipper app reads them when posting a shipment.
//
// Truck types are special: the backend validates `requiredTruckType` and a
// truck's `type` against a FIXED enum (INTEGRATION.md §1). An admin can
// rename a type and hide it from new shipments, but cannot invent a new
// one — the backend would reject it.
export const DEFAULT_CARGO_TYPES = [
    { id: 'food', name: 'مواد غذائية', category: 'NORMAL' },
    { id: 'electronics', name: 'أجهزة كهربائية', category: 'NORMAL' },
    { id: 'building', name: 'مواد بناء', category: 'NORMAL' },
    { id: 'general', name: 'بضائع عامة', category: 'NORMAL' },
];

export const getCargoTypes = async () => {
    const snap = await getDoc(doc(db, 'config', 'cargoTypes'));
    return snap.exists() && Array.isArray(snap.data().items) ? snap.data().items : DEFAULT_CARGO_TYPES;
};

export const saveCargoTypes = async (items) => {
    await setDoc(doc(db, 'config', 'cargoTypes'), { items, updatedAt: serverTimestamp() });
};

/** Always returns all seven backend enum values, merged with whatever label/active overrides the admin saved. */
export const getTruckTypes = async () => {
    const snap = await getDoc(doc(db, 'config', 'truckTypes'));
    const saved = (snap.exists() && snap.data().items) || {};
    return Object.values(TruckType).map((code) => ({
        code,
        label: saved[code]?.label || TruckTypeAr[code],
        defaultLabel: TruckTypeAr[code],
        active: saved[code]?.active !== false,
    }));
};

export const saveTruckTypes = async (types) => {
    const items = Object.fromEntries(types.map((t) => [t.code, { label: t.label, active: t.active }]));
    await setDoc(doc(db, 'config', 'truckTypes'), { items, updatedAt: serverTimestamp() });
};
