// Every value here must match hemooltak-backend/INTEGRATION.md §1 and §8
// exactly — the backend rejects anything else, it does not coerce casing.

export var UserRole;
(function (UserRole) {
    UserRole["SHIPPER"] = "SHIPPER";
    UserRole["CARRIER"] = "CARRIER";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (UserRole = {}));

export var AccountType;
(function (AccountType) {
    AccountType["INDIVIDUAL"] = "INDIVIDUAL";
    AccountType["COMPANY"] = "COMPANY";
})(AccountType || (AccountType = {}));

// Document review only — separate from isSuspended (the operating ban).
// An account can be VERIFIED and isSuspended: true at the same time.
export var AccountStatus;
(function (AccountStatus) {
    AccountStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    AccountStatus["VERIFIED"] = "VERIFIED";
    AccountStatus["REJECTED"] = "REJECTED";
})(AccountStatus || (AccountStatus = {}));

export var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["PENDING"] = "PENDING";
    DocumentStatus["APPROVED"] = "APPROVED";
    DocumentStatus["REJECTED"] = "REJECTED";
})(DocumentStatus || (DocumentStatus = {}));

export const DocumentStatusAr = {
    [DocumentStatus.PENDING]: 'قيد المراجعة',
    [DocumentStatus.APPROVED]: 'موثّق',
    [DocumentStatus.REJECTED]: 'مرفوض',
};

// The four account-level document types (§2).
export var AccountDocumentType;
(function (AccountDocumentType) {
    AccountDocumentType["NATIONAL_ID"] = "NATIONAL_ID";
    AccountDocumentType["PUBLIC_DRIVING_LICENCE"] = "PUBLIC_DRIVING_LICENCE";
    AccountDocumentType["COMMERCIAL_REGISTRATION"] = "COMMERCIAL_REGISTRATION";
    AccountDocumentType["MANAGER_ID"] = "MANAGER_ID";
})(AccountDocumentType || (AccountDocumentType = {}));

export const AccountDocumentTypeAr = {
    [AccountDocumentType.NATIONAL_ID]: 'الهوية الوطنية / الإقامة',
    [AccountDocumentType.PUBLIC_DRIVING_LICENCE]: 'رخصة قيادة عمومي',
    [AccountDocumentType.COMMERCIAL_REGISTRATION]: 'السجل التجاري',
    [AccountDocumentType.MANAGER_ID]: 'هوية المسؤول',
};

// Truck paper field names (§2) — operatingCard / registration, per truck.
export const TRUCK_DOCUMENT_FIELDS = ['operatingCard', 'registration'];

// Truck type enum (§1).
export var TruckType;
(function (TruckType) {
    TruckType["FLATBED"] = "FLATBED";
    TruckType["HEAVY_CARGO"] = "HEAVY_CARGO";
    TruckType["REFRIGERATED"] = "REFRIGERATED";
    TruckType["BOX_TRUCK"] = "BOX_TRUCK";
    TruckType["TANKER"] = "TANKER";
    TruckType["LOW_LOADER"] = "LOW_LOADER";
    TruckType["OTHER"] = "OTHER";
})(TruckType || (TruckType = {}));

export const TruckTypeAr = {
    [TruckType.FLATBED]: 'مسطحة',
    [TruckType.HEAVY_CARGO]: 'شحن ثقيل',
    [TruckType.REFRIGERATED]: 'مبردة',
    [TruckType.BOX_TRUCK]: 'صندوق مغلق',
    [TruckType.TANKER]: 'صهريج',
    [TruckType.LOW_LOADER]: 'لودر منخفض',
    [TruckType.OTHER]: 'أخرى',
};

// Stage 2 — shipments, negotiation, trips, wallet (§8).
export var ShipmentStatus;
(function (ShipmentStatus) {
    ShipmentStatus["PENDING_OFFERS"] = "PENDING_OFFERS";
    ShipmentStatus["NEGOTIATING"] = "NEGOTIATING";
    ShipmentStatus["ACTIVE"] = "ACTIVE";
    ShipmentStatus["COMPLETED"] = "COMPLETED";
    ShipmentStatus["CANCELLED"] = "CANCELLED";
})(ShipmentStatus || (ShipmentStatus = {}));

export const ShipmentStatusAr = {
    [ShipmentStatus.PENDING_OFFERS]: 'بانتظار العروض',
    [ShipmentStatus.NEGOTIATING]: 'قيد التفاوض',
    [ShipmentStatus.ACTIVE]: 'قيد التنفيذ',
    [ShipmentStatus.COMPLETED]: 'مكتملة',
    [ShipmentStatus.CANCELLED]: 'ملغاة',
};

export var OfferStatus;
(function (OfferStatus) {
    OfferStatus["PENDING"] = "PENDING";
    OfferStatus["COUNTERED"] = "COUNTERED";
    OfferStatus["ACCEPTED"] = "ACCEPTED";
    OfferStatus["REJECTED"] = "REJECTED";
})(OfferStatus || (OfferStatus = {}));

export const OfferStatusAr = {
    [OfferStatus.PENDING]: 'بانتظار الرد',
    [OfferStatus.COUNTERED]: 'عرض مضاد',
    [OfferStatus.ACCEPTED]: 'مقبول',
    [OfferStatus.REJECTED]: 'مرفوض',
};

export var ProposedBy;
(function (ProposedBy) {
    ProposedBy["SHIPPER"] = "SHIPPER";
    ProposedBy["CARRIER"] = "CARRIER";
})(ProposedBy || (ProposedBy = {}));

// Ordered — no skipping, no repeating, no going backwards (enforced server-side).
export var TripStage;
(function (TripStage) {
    TripStage["ASSIGNED"] = "ASSIGNED";
    TripStage["EN_ROUTE_PICKUP"] = "EN_ROUTE_PICKUP";
    TripStage["ARRIVED_PICKUP"] = "ARRIVED_PICKUP";
    TripStage["LOADED"] = "LOADED";
    TripStage["EN_ROUTE_DELIVERY"] = "EN_ROUTE_DELIVERY";
    TripStage["DELIVERED"] = "DELIVERED";
})(TripStage || (TripStage = {}));

export const TripStageAr = {
    [TripStage.ASSIGNED]: 'تم إسناد الشحنة',
    [TripStage.EN_ROUTE_PICKUP]: 'في الطريق لموقع التحميل',
    [TripStage.ARRIVED_PICKUP]: 'تم الوصول للتحميل',
    [TripStage.LOADED]: 'تم التحميل',
    [TripStage.EN_ROUTE_DELIVERY]: 'في الطريق للتسليم',
    [TripStage.DELIVERED]: 'تم التسليم',
};

// A field separate from `stage` — TripStage has no cancelled member, so a
// cancelled trip keeps whatever stage it died at and status carries the
// truth. ALWAYS read status before stage (INTEGRATION.md §8).
export var TripStatus;
(function (TripStatus) {
    TripStatus["ACTIVE"] = "ACTIVE";
    TripStatus["COMPLETED"] = "COMPLETED";
    TripStatus["CANCELLED"] = "CANCELLED";
})(TripStatus || (TripStatus = {}));

export const TripStatusAr = {
    [TripStatus.ACTIVE]: 'جارية',
    [TripStatus.COMPLETED]: 'مكتملة',
    [TripStatus.CANCELLED]: 'ملغاة',
};

export var TransactionType;
(function (TransactionType) {
    TransactionType["TOP_UP"] = "TOP_UP";
    TransactionType["COMMISSION_DEDUCTION"] = "COMMISSION_DEDUCTION";
    TransactionType["TRIP_SETTLEMENT"] = "TRIP_SETTLEMENT";
    TransactionType["WITHDRAWAL"] = "WITHDRAWAL";
    TransactionType["DEBT_FORGIVENESS"] = "DEBT_FORGIVENESS";
    TransactionType["FEE_DEDUCTION"] = "FEE_DEDUCTION";
})(TransactionType || (TransactionType = {}));

export var WithdrawalStatus;
(function (WithdrawalStatus) {
    WithdrawalStatus["PENDING"] = "PENDING";
    WithdrawalStatus["PAID"] = "PAID";
    WithdrawalStatus["REJECTED"] = "REJECTED";
})(WithdrawalStatus || (WithdrawalStatus = {}));

export const WithdrawalStatusAr = {
    [WithdrawalStatus.PENDING]: 'قيد المراجعة',
    [WithdrawalStatus.PAID]: 'مدفوع',
    [WithdrawalStatus.REJECTED]: 'مرفوض',
};

// adminCancelTrip's chargeTo — admin decides who is at fault.
export var ChargeTo;
(function (ChargeTo) {
    ChargeTo["SHIPPER"] = "SHIPPER";
    ChargeTo["CARRIER"] = "CARRIER";
    ChargeTo["NONE"] = "NONE";
})(ChargeTo || (ChargeTo = {}));
