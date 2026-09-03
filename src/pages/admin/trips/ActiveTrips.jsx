import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { getActiveTrips, administrativelyCancelTrip } from '../../../admin/mock/trips';
import { TRIP_STAGE } from '../../../admin/mock/constants';
import { useNavigate } from 'react-router-dom';

export const ActiveTrips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const data = await getActiveTrips();
      setTrips(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminCancel = async (tripId) => {
    if (!window.confirm('تحذير: أنت على وشك إلغاء رحلة إدارياً. هذه العملية ستطبق قوانين العمولات والغرامات على الناقل. هل أنت متأكد من الاستمرار؟')) {
      return;
    }
    
    setCancellingId(tripId);
    try {
      await administrativelyCancelTrip(tripId);
      alert('تم إلغاء الرحلة بنجاح وتطبيق قوانين العمولة.');
      loadTrips();
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء الإلغاء');
    } finally {
      setCancellingId(null);
    }
  };

  const getStageLabel = (stage) => {
    const stages = {
      [TRIP_STAGE.EN_ROUTE_TO_LOADING]: 'في الطريق للتحميل',
      [TRIP_STAGE.ARRIVED]: 'وصل لموقع التحميل',
      [TRIP_STAGE.LOADED]: 'تم التحميل',
      [TRIP_STAGE.IN_TRANSIT]: 'في الطريق',
      [TRIP_STAGE.DELIVERED]: 'تم التوصيل',
      'ADMIN_CANCELLED': 'ملغاة إدارياً'
    };
    return stages[stage] || stage;
  };

  const isEligibleForCancel = (stage) => {
    return [TRIP_STAGE.LOADED, TRIP_STAGE.IN_TRANSIT, TRIP_STAGE.DELIVERED].includes(stage);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>الرحلات النشطة</h2>
      </div>

      <Card>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center' }}>جاري التحميل...</div>
        ) : trips.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            لا توجد رحلات نشطة حالياً
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: 14 }}>
                  <th style={{ padding: '12px 16px' }}>رقم الرحلة</th>
                  <th style={{ padding: '12px 16px' }}>رقم الشحنة</th>
                  <th style={{ padding: '12px 16px' }}>الناقل</th>
                  <th style={{ padding: '12px 16px' }}>المرحلة الحالية</th>
                  <th style={{ padding: '12px 16px' }}>آخر تحديث</th>
                  <th style={{ padding: '12px 16px' }}>الإجراءات الإدارية</th>
                </tr>
              </thead>
              <tbody>
                {trips.map(trip => (
                  <tr key={trip.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{trip.id}</td>
                    <td style={{ padding: '16px' }}>
                      <a 
                        href={`/admin/shipments/${trip.shipmentId}`} 
                        onClick={(e) => { e.preventDefault(); navigate(`/admin/shipments/${trip.shipmentId}`); }}
                        style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
                      >
                        {trip.shipmentId}
                      </a>
                    </td>
                    <td style={{ padding: '16px' }}>{trip.carrierName}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: 4, 
                        backgroundColor: trip.stage === 'ADMIN_CANCELLED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: trip.stage === 'ADMIN_CANCELLED' ? 'var(--color-error)' : 'var(--color-info)',
                        fontWeight: 600,
                        fontSize: 13
                      }}>
                        {getStageLabel(trip.stage)}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>{new Date(trip.updatedAt).toLocaleString('ar-SA')}</td>
                    <td style={{ padding: '16px' }}>
                      {trip.stage !== 'ADMIN_CANCELLED' && (
                        <Button 
                          style={{ 
                            backgroundColor: isEligibleForCancel(trip.stage) ? 'var(--color-error)' : 'var(--color-border)',
                            color: isEligibleForCancel(trip.stage) ? 'white' : 'var(--color-text-muted)',
                            cursor: isEligibleForCancel(trip.stage) ? 'pointer' : 'not-allowed'
                          }}
                          disabled={!isEligibleForCancel(trip.stage) || cancellingId === trip.id}
                          onClick={() => handleAdminCancel(trip.id)}
                        >
                          {cancellingId === trip.id ? 'جاري الإلغاء...' : 'إلغاء إداري'}
                        </Button>
                      )}
                      {!isEligibleForCancel(trip.stage) && trip.stage !== 'ADMIN_CANCELLED' && (
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                          غير متاح قبل مرحلة "تم التحميل"
                        </div>
                      )}
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
