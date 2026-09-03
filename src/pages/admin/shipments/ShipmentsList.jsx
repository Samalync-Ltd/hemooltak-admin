import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { getShipments } from '../../../admin/mock/shipments';
import { SHIPMENT_STATUS } from '../../../admin/mock/constants';

export const ShipmentsList = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    loadShipments();
  }, []);

  const loadShipments = async () => {
    setLoading(true);
    try {
      const data = await getShipments();
      setShipments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredShipments = shipments.filter(s => filter === 'ALL' || s.status === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>الشحنات</h2>
      </div>

      <Card>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
          <Button variant={filter === 'ALL' ? 'primary' : 'outline'} onClick={() => setFilter('ALL')}>الكل</Button>
          <Button variant={filter === SHIPMENT_STATUS.AWAITING_OFFERS ? 'primary' : 'outline'} onClick={() => setFilter(SHIPMENT_STATUS.AWAITING_OFFERS)}>بانتظار العروض</Button>
          <Button variant={filter === SHIPMENT_STATUS.NEGOTIATING ? 'primary' : 'outline'} onClick={() => setFilter(SHIPMENT_STATUS.NEGOTIATING)}>قيد التفاوض</Button>
          <Button variant={filter === SHIPMENT_STATUS.ACTIVE ? 'primary' : 'outline'} onClick={() => setFilter(SHIPMENT_STATUS.ACTIVE)}>نشطة</Button>
          <Button variant={filter === SHIPMENT_STATUS.COMPLETED ? 'primary' : 'outline'} onClick={() => setFilter(SHIPMENT_STATUS.COMPLETED)}>مكتملة</Button>
          <Button variant={filter === SHIPMENT_STATUS.CANCELLED ? 'primary' : 'outline'} onClick={() => setFilter(SHIPMENT_STATUS.CANCELLED)}>ملغاة</Button>
        </div>

        {loading ? (
          <div style={{ padding: 24, textAlign: 'center' }}>جاري التحميل...</div>
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
                  <th style={{ padding: '12px 16px' }}>تاريخ الإنشاء</th>
                  <th style={{ padding: '12px 16px' }}>الحالة</th>
                  <th style={{ padding: '12px 16px' }}>الناقل المكلف</th>
                  <th style={{ padding: '12px 16px' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.map(shp => (
                  <tr key={shp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{shp.id}</td>
                    <td style={{ padding: '16px' }}>{shp.shipperName}</td>
                    <td style={{ padding: '16px' }}>
                      {shp.origin} &larr; {shp.destination}
                    </td>
                    <td style={{ padding: '16px' }}>{new Date(shp.createdAt).toLocaleDateString('ar-SA')}</td>
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
