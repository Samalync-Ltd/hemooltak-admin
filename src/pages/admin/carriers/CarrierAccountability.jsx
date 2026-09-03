import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { getCarriersAccountability, resetCarrierWarnings, removeCarrierBlock } from '../../../admin/mock/carriers';

export const CarrierAccountability = () => {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCarriers();
  }, []);

  const loadCarriers = async () => {
    setLoading(true);
    try {
      const data = await getCarriersAccountability();
      setCarriers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetWarnings = async (id) => {
    if (!window.confirm('هل أنت متأكد من تصفير عدد الإنذارات لهذا الناقل؟')) return;
    
    try {
      await resetCarrierWarnings(id);
      loadCarriers();
    } catch (err) {
      alert('حدث خطأ');
    }
  };

  const handleRemoveBlock = async (id) => {
    if (!window.confirm('هل أنت متأكد من رفع الحظر عن هذا الناقل؟')) return;
    
    try {
      await removeCarrierBlock(id);
      loadCarriers();
    } catch (err) {
      alert('حدث خطأ');
    }
  };

  if (loading) return <div style={{ padding: 24 }}>جاري التحميل...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ margin: 0 }}>مساءلة الناقلين</h2>

      <Card>
        {carriers.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            لا توجد بيانات
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: 14 }}>
                  <th style={{ padding: '12px 16px' }}>رقم الناقل</th>
                  <th style={{ padding: '12px 16px' }}>اسم الناقل</th>
                  <th style={{ padding: '12px 16px' }}>الإنذارات</th>
                  <th style={{ padding: '12px 16px' }}>حالة الحظر</th>
                  <th style={{ padding: '12px 16px' }}>المديونية (للقراءة فقط)</th>
                  <th style={{ padding: '12px 16px' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {carriers.map(carrier => (
                  <tr key={carrier.carrierId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{carrier.carrierId}</td>
                    <td style={{ padding: '16px' }}>{carrier.carrierName}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        color: carrier.warningCount >= 3 ? 'var(--color-error)' : (carrier.warningCount > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)'),
                        fontWeight: carrier.warningCount > 0 ? 'bold' : 'normal'
                      }}>
                        {carrier.warningCount} إنذارات
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {carrier.isBlocked ? (
                        <span style={{ color: 'var(--color-error)', fontWeight: 'bold' }}>محظور</span>
                      ) : (
                        <span style={{ color: 'var(--color-success)' }}>غير محظور</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', color: carrier.outstandingDebt > 0 ? 'var(--color-error)' : 'inherit', fontWeight: carrier.outstandingDebt > 0 ? 'bold' : 'normal' }}>
                      {carrier.outstandingDebt} ر.س
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button 
                          variant="outline" 
                          disabled={carrier.warningCount === 0}
                          onClick={() => handleResetWarnings(carrier.carrierId)}
                        >
                          تصفير الإنذارات
                        </Button>
                        <Button 
                          variant="outline"
                          style={carrier.isBlocked ? { borderColor: 'var(--color-success)', color: 'var(--color-success)' } : {}}
                          disabled={!carrier.isBlocked}
                          onClick={() => handleRemoveBlock(carrier.carrierId)}
                        >
                          رفع الحظر
                        </Button>
                      </div>
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
