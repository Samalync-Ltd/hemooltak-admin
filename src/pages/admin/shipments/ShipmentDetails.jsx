import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { getShipmentById } from '../../../admin/mock/shipments';
import { CARGO_CATEGORY } from '../../../admin/mock/constants';

export const ShipmentDetails = () => {
  const { shipmentId } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShipment();
  }, [shipmentId]);

  const loadShipment = async () => {
    setLoading(true);
    try {
      const data = await getShipmentById(shipmentId);
      setShipment(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>جاري التحميل...</div>;
  if (!shipment) return <div style={{ padding: 24, color: 'var(--color-error)' }}>الشحنة غير موجودة</div>;

  const categoryLabel = {
    [CARGO_CATEGORY.NORMAL]: 'بضائع عادية',
    [CARGO_CATEGORY.SPECIAL_CONDITIONS]: 'ظروف خاصة',
    [CARGO_CATEGORY.HIGH_RISK]: 'عالية الخطورة'
  };

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
              <div>
                <div className="text-helper">الشاحن</div>
                <div style={{ fontWeight: 600 }}>{shipment.shipperName}</div>
              </div>
              <div>
                <div className="text-helper">تاريخ الإنشاء</div>
                <div style={{ fontWeight: 600 }}>{new Date(shipment.createdAt).toLocaleString('ar-SA')}</div>
              </div>
              <div>
                <div className="text-helper">المسار</div>
                <div style={{ fontWeight: 600 }}>{shipment.origin} &larr; {shipment.destination}</div>
              </div>
              <div>
                <div className="text-helper">نوع الشاحنة المطلوبة</div>
                <div style={{ fontWeight: 600 }}>{shipment.requiredTruckType}</div>
              </div>
              <div>
                <div className="text-helper">نوع البضاعة</div>
                <div style={{ fontWeight: 600 }}>{shipment.cargoType}</div>
              </div>
              <div>
                <div className="text-helper">فئة البضاعة</div>
                <div style={{ fontWeight: 600 }}>{categoryLabel[shipment.cargoCategory]}</div>
              </div>
              <div>
                <div className="text-helper">الوزن/الكمية</div>
                <div style={{ fontWeight: 600 }}>{shipment.weight}</div>
              </div>
            </div>
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
                    {shipment.agreedPrice} ر.س
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
            <h3 style={{ marginBottom: 16 }}>سجل العروض</h3>
            {shipment.offers && shipment.offers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {shipment.offers.map(offer => (
                  <div key={offer.id} style={{ padding: 12, border: '1px solid var(--color-border)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <strong>{offer.carrierName}</strong>
                      <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{offer.price} ر.س</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-text-muted)' }}>
                      <span>الحالة: {offer.status}</span>
                      <span>{new Date(offer.date).toLocaleString('ar-SA')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-helper">لا توجد عروض</div>
            )}
          </Card>

          <Card>
            <h3 style={{ marginBottom: 16 }}>سجل التفاوض</h3>
            {shipment.negotiations && shipment.negotiations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {shipment.negotiations.map(msg => (
                  <div key={msg.id} style={{ 
                    padding: 12, 
                    backgroundColor: msg.sender === 'SHIPPER' ? 'var(--color-background)' : 'rgba(15, 36, 64, 0.05)',
                    borderRadius: 8,
                    borderRight: msg.sender === 'SHIPPER' ? '3px solid var(--color-accent)' : '3px solid var(--color-primary)'
                  }}>
                    <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                      {msg.sender === 'SHIPPER' ? 'الشاحن' : 'الناقل'} - {new Date(msg.date).toLocaleTimeString('ar-SA')}
                    </div>
                    <div>{msg.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-helper">لا توجد مفاوضات</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
