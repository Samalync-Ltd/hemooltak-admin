import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { getShipmentDetails } from '../../../services/firebaseAdmin';
import { TruckTypeAr, TripStageAr, TripStatusAr, TripStatus } from '../../../constants/enums';

const Field = ({ label, children }) => (
  <div>
    <div className="text-helper">{label}</div>
    <div style={{ fontWeight: 600 }}>{children}</div>
  </div>
);

const fmt = (date) => (date ? date.toLocaleString('ar-SA') : '—');

export const ShipmentDetails = () => {
  const { shipmentId } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getShipmentDetails(shipmentId)
      .then((data) => { if (!cancelled) setShipment(data); })
      .catch((err) => { if (!cancelled) setError(err.message || 'تعذر تحميل الشحنة'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [shipmentId]);

  if (loading) return <div style={{ padding: 24 }}>جاري التحميل...</div>;
  if (error) return <div style={{ padding: 24, color: 'var(--color-error)' }}>{error}</div>;
  if (!shipment) return <div style={{ padding: 24, color: 'var(--color-error)' }}>الشحنة غير موجودة</div>;

  const site = shipment.siteDetails;
  const trip = shipment.trip;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button variant="outline" onClick={() => navigate('/admin/shipments')}>عودة</Button>
          <h2 style={{ margin: 0 }}>تفاصيل الشحنة: {shipment.id}</h2>
        </div>
        <StatusBadge status={shipment.status} />
      </div>

      <div className="responsive-two-col">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <h3 style={{ marginBottom: 16 }}>معلومات الشحنة</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="الشاحن">{shipment.shipperName}</Field>
              <Field label="تاريخ الإنشاء">{fmt(shipment.createdAt)}</Field>
              <Field label="المسار">{shipment.pickupCity} &larr; {shipment.deliveryCity}</Field>
              <Field label="موعد التحميل">{fmt(shipment.loadingDate)}</Field>
              <Field label="نوع الشاحنة المطلوبة">{TruckTypeAr[shipment.requiredTruckType] || shipment.requiredTruckType}</Field>
              <Field label="نوع البضاعة">{shipment.cargoType}</Field>
              <Field label="الوزن">{shipment.weight} طن</Field>
              <Field label="السعر المقترح">{shipment.suggestedPrice} ر.س</Field>
              {shipment.description && <Field label="الوصف">{shipment.description}</Field>}
              <Field label="عدد العروض">{shipment.offerCount ?? 0}</Field>
            </div>
            {shipment.status === 'CANCELLED' && (
              <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'rgba(239,68,68,0.08)', color: 'var(--color-error)' }}>
                ملغاة في {fmt(shipment.cancelledAt)}{shipment.cancelReason ? ` — ${shipment.cancelReason}` : ''}
              </div>
            )}
          </Card>

          <Card>
            <h3 style={{ marginBottom: 16 }}>بيانات الموقع (خاصة)</h3>
            {site ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="إحداثيات التحميل">{site.pickupLat?.toFixed(4)}, {site.pickupLng?.toFixed(4)}</Field>
                <Field label="إحداثيات التسليم">{site.deliveryLat?.toFixed(4)}, {site.deliveryLng?.toFixed(4)}</Field>
                <Field label="ملاحظات التحميل">{site.pickupNotes || '—'}</Field>
                <Field label="ملاحظات التسليم">{site.deliveryNotes || '—'}</Field>
                <Field label="جهة الاتصال بالموقع"><span dir="ltr">{site.onSiteContact}</span></Field>
              </div>
            ) : (
              <div className="text-helper">لا توجد بيانات موقع</div>
            )}
          </Card>

          <Card>
            <h3 style={{ marginBottom: 16 }}>الناقل والسعر النهائي</h3>
            {shipment.assignedCarrierId ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div className="text-helper">الناقل المكلف</div>
                  <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{shipment.assignedCarrierName}</div>
                </div>
                <div>
                  <div className="text-helper">السعر المتفق عليه</div>
                  <div style={{ fontWeight: 'bold', fontSize: 24, color: 'var(--color-success)' }}>
                    {shipment.finalPrice} ر.س
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--color-text-muted)' }}>لم يتم تكليف ناقل بعد</div>
            )}
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <h3 style={{ marginBottom: 16 }}>سجل العروض والتفاوض</h3>
            {shipment.offers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {shipment.offers.map(offer => (
                  <div key={offer.id} style={{
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid var(--color-border)',
                    borderRight: offer.proposedBy === 'SHIPPER' ? '3px solid var(--color-accent)' : '3px solid var(--color-primary)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <strong>{offer.proposedBy === 'SHIPPER' ? `الشاحن ← ${offer.carrierName}` : offer.carrierName}</strong>
                      <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{offer.amount} ر.س</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--color-text-muted)' }}>
                      <StatusBadge status={offer.status} />
                      <span>{fmt(offer.createdAt)}</span>
                    </div>
                    {offer.rejectReason && <div style={{ fontSize: 12, marginTop: 6, color: 'var(--color-error)' }}>سبب الرفض: {offer.rejectReason}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-helper">لا توجد عروض</div>
            )}
          </Card>

          {trip && (
            <Card>
              <h3 style={{ marginBottom: 16 }}>الرحلة</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <Field label="حالة الرحلة">{TripStatusAr[trip.status] || trip.status}</Field>
                <Field label="المرحلة">{trip.status === TripStatus.CANCELLED ? `توقفت عند: ${TripStageAr[trip.stage]}` : TripStageAr[trip.stage]}</Field>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {trip.stageHistory.map((h, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>{TripStageAr[h.stage] || h.stage}</span>
                    <span className="text-helper">{fmt(h.timestamp)}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                {trip.proofOfLoadUrl && <a href={trip.proofOfLoadUrl} target="_blank" rel="noreferrer">صورة إثبات التحميل</a>}
                {trip.proofOfDeliveryUrl && <a href={trip.proofOfDeliveryUrl} target="_blank" rel="noreferrer">صورة إثبات التسليم</a>}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
