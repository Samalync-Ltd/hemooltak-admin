import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { getTrips, adminCancelTrip } from '../../../services/firebaseAdmin';
import { TripStageAr, TripStatus, TripStatusAr, ChargeTo } from '../../../constants/enums';

const CHARGE_OPTIONS = [
  { value: ChargeTo.CARRIER, label: 'الناقل (تُحتسب العمولة عليه + إنذار)' },
  { value: ChargeTo.SHIPPER, label: 'الشاحن (تُحتسب العمولة عليه)' },
  { value: ChargeTo.NONE, label: 'لا أحد — ظرف قاهر (تحرير المبلغ المحجوز)' },
];

const FILTERS = [
  { value: TripStatus.ACTIVE, label: 'الجارية' },
  { value: 'ALL', label: 'الكل' },
  { value: TripStatus.COMPLETED, label: 'المكتملة' },
  { value: TripStatus.CANCELLED, label: 'الملغاة' },
];

const statusColors = {
  [TripStatus.ACTIVE]: { bg: 'rgba(59, 130, 246, 0.1)', fg: 'var(--color-info)' },
  [TripStatus.COMPLETED]: { bg: 'rgba(16, 185, 129, 0.1)', fg: 'var(--color-success)' },
  [TripStatus.CANCELLED]: { bg: 'rgba(239, 68, 68, 0.1)', fg: 'var(--color-error)' },
};

export const ActiveTrips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState(TripStatus.ACTIVE);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [chargeTo, setChargeTo] = useState(ChargeTo.CARRIER);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const loadTrips = async () => {
    setLoading(true);
    setError('');
    try {
      setTrips(await getTrips());
    } catch (err) {
      console.error(err);
      setError(err.message || 'تعذر تحميل الرحلات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTrips(); }, []);

  const openCancel = (trip) => {
    setCancelTarget(trip);
    setReason('');
    setChargeTo(ChargeTo.CARRIER);
  };

  const handleAdminCancel = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('يرجى كتابة سبب الإلغاء');
      return;
    }
    if (!window.confirm('تحذير: سيتم إنهاء الرحلة وإلغاء الشحنة نهائياً وتطبيق العمولة على الطرف المحدد. هل تريد المتابعة؟')) return;
    setSubmitting(true);
    try {
      const res = await adminCancelTrip(cancelTarget.id, reason.trim(), chargeTo);
      const parts = [`تم إلغاء الرحلة.`];
      if (res.chargedTo !== ChargeTo.NONE) {
        parts.push(`العمولة: ${res.commission} ر.س — المدفوع: ${res.commissionPaid} ر.س — أضيف للمديونية: ${res.addedToDebt} ر.س`);
      }
      if (res.warnings != null) parts.push(`إنذارات الناقل الآن: ${res.warnings}${res.suspended ? ' (تم إيقافه)' : ''}`);
      alert(parts.join('\n'));
      setCancelTarget(null);
      loadTrips();
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء الإلغاء');
    } finally {
      setSubmitting(false);
    }
  };

  const visible = trips.filter(t => filter === 'ALL' || t.status === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>الرحلات</h2>
        <Button variant="outline" onClick={loadTrips}>تحديث</Button>
      </div>

      {cancelTarget && (
        <Card>
          <h3 style={{ marginBottom: 8 }}>إلغاء إداري للرحلة {cancelTarget.id}</h3>
          <p className="text-helper" style={{ marginBottom: 16 }}>
            {cancelTarget.route} — {cancelTarget.carrierName} — المرحلة: {TripStageAr[cancelTarget.stage]}
          </p>
          <form onSubmit={handleAdminCancel} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="سبب الإلغاء" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="مثال: حادث على الطريق" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: 600 }}>على من تُحتسب العمولة؟</label>
              {CHARGE_OPTIONS.map(opt => (
                <label key={opt.value} style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                  <input type="radio" name="chargeTo" value={opt.value} checked={chargeTo === opt.value} onChange={() => setChargeTo(opt.value)} />
                  {opt.label}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit" style={{ backgroundColor: 'var(--color-error)', color: 'white' }} disabled={submitting}>
                {submitting ? 'جاري الإلغاء...' : 'تأكيد الإلغاء'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setCancelTarget(null)} disabled={submitting}>تراجع</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
          {FILTERS.map(f => (
            <Button key={f.value} variant={filter === f.value ? 'primary' : 'outline'} onClick={() => setFilter(f.value)}>{f.label}</Button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 24, textAlign: 'center' }}>جاري التحميل...</div>
        ) : error ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-error)' }}>{error}</div>
        ) : visible.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            لا توجد رحلات
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: 14 }}>
                  <th style={{ padding: '12px 16px' }}>رقم الرحلة</th>
                  <th style={{ padding: '12px 16px' }}>الشحنة</th>
                  <th style={{ padding: '12px 16px' }}>الشاحن</th>
                  <th style={{ padding: '12px 16px' }}>الناقل</th>
                  <th style={{ padding: '12px 16px' }}>السعر</th>
                  <th style={{ padding: '12px 16px' }}>الحالة / المرحلة</th>
                  <th style={{ padding: '12px 16px' }}>آخر تحديث</th>
                  <th style={{ padding: '12px 16px' }}>الإجراءات الإدارية</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(trip => {
                  const colors = statusColors[trip.status] || statusColors[TripStatus.ACTIVE];
                  return (
                    <tr key={trip.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '16px', fontWeight: 600, fontSize: 13 }}>{trip.id}</td>
                      <td style={{ padding: '16px' }}>
                        <a
                          href={`/admin/shipments/${trip.shipmentId}`}
                          onClick={(e) => { e.preventDefault(); navigate(`/admin/shipments/${trip.shipmentId}`); }}
                          style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
                        >
                          {trip.route}
                        </a>
                      </td>
                      <td style={{ padding: '16px' }}>{trip.shipperName}</td>
                      <td style={{ padding: '16px' }}>{trip.carrierName}</td>
                      <td style={{ padding: '16px' }}>{trip.agreedPrice} ر.س</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: 4, backgroundColor: colors.bg, color: colors.fg, fontWeight: 600, fontSize: 13 }}>
                          {TripStatusAr[trip.status]}
                        </span>
                        <div style={{ fontSize: 12, marginTop: 6, color: 'var(--color-text-muted)' }}>
                          {TripStageAr[trip.stage] || trip.stage}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>{trip.updatedAt ? trip.updatedAt.toLocaleString('ar-SA') : '—'}</td>
                      <td style={{ padding: '16px' }}>
                        {trip.status === TripStatus.ACTIVE ? (
                          <Button style={{ backgroundColor: 'var(--color-error)', color: 'white' }} onClick={() => openCancel(trip)}>
                            إلغاء إداري
                          </Button>
                        ) : (
                          <span className="text-helper">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
