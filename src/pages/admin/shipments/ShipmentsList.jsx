import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { getShipments } from '../../../services/firebaseAdmin';
import { ShipmentStatus } from '../../../constants/enums';

const FILTERS = [
  { value: 'ALL', label: 'الكل' },
  { value: ShipmentStatus.PENDING_OFFERS, label: 'بانتظار العروض' },
  { value: ShipmentStatus.NEGOTIATING, label: 'قيد التفاوض' },
  { value: ShipmentStatus.ACTIVE, label: 'نشطة' },
  { value: ShipmentStatus.COMPLETED, label: 'مكتملة' },
  { value: ShipmentStatus.CANCELLED, label: 'ملغاة' },
];

export const ShipmentsList = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const navigate = useNavigate();

  const loadShipments = async () => {
    setLoading(true);
    setError('');
    try {
      setShipments(await getShipments());
    } catch (err) {
      console.error(err);
      setError(err.message || 'تعذر تحميل الشحنات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadShipments(); }, []);

  const filteredShipments = shipments.filter(s => filter === 'ALL' || s.status === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>الشحنات</h2>
        <Button variant="outline" onClick={loadShipments}>تحديث</Button>
      </div>

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
        ) : filteredShipments.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            لا توجد شحنات مطابقة للفلتر المحدد
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: 14 }}>
                  <th style={{ padding: '12px 16px' }}>رقم الشحنة</th>
                  <th style={{ padding: '12px 16px' }}>الشاحن</th>
                  <th style={{ padding: '12px 16px' }}>المسار</th>
                  <th style={{ padding: '12px 16px' }}>السعر</th>
                  <th style={{ padding: '12px 16px' }}>تاريخ الإنشاء</th>
                  <th style={{ padding: '12px 16px' }}>الحالة</th>
                  <th style={{ padding: '12px 16px' }}>الناقل المكلف</th>
                  <th style={{ padding: '12px 16px' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.map(shp => (
                  <tr key={shp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px', fontWeight: 600, fontSize: 13 }}>{shp.id}</td>
                    <td style={{ padding: '16px' }}>{shp.shipperName}</td>
                    <td style={{ padding: '16px' }}>
                      {shp.pickupCity} &larr; {shp.deliveryCity}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {shp.finalPrice != null ? `${shp.finalPrice} ر.س` : <span className="text-helper">{shp.suggestedPrice} ر.س (مقترح)</span>}
                    </td>
                    <td style={{ padding: '16px' }}>{shp.createdAt ? shp.createdAt.toLocaleDateString('ar-SA') : '—'}</td>
                    <td style={{ padding: '16px' }}><StatusBadge status={shp.status} /></td>
                    <td style={{ padding: '16px' }}>
                      {shp.assignedCarrierName ? shp.assignedCarrierName : <span className="text-helper">لم يتم التكليف</span>}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <Button variant="outline" onClick={() => navigate(`/admin/shipments/${shp.id}`)}>
                        التفاصيل
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
