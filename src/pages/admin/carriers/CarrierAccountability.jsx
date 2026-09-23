import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { getCarriersAccountability, liftSuspension, forgiveDebt } from '../../../services/firebaseAdmin';

export const CarrierAccountability = () => {
  const [carriers, setCarriers] = useState([]);
  const [threshold, setThreshold] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadCarriers = async () => {
    setLoading(true);
    setError('');
    try {
      const { carriers: rows, warningThreshold } = await getCarriersAccountability();
      // Most urgent first: suspended, then by warnings, then by debt.
      rows.sort((a, b) => (b.isSuspended - a.isSuspended) || (b.warnings - a.warnings) || (b.outstandingDebt - a.outstandingDebt));
      setCarriers(rows);
      setThreshold(warningThreshold);
    } catch (err) {
      console.error(err);
      setError(err.message || 'تعذر تحميل بيانات الناقلين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCarriers(); }, []);

  const run = async (id, action) => {
    setBusyId(id);
    try {
      await action();
      await loadCarriers();
    } catch (err) {
      alert(err.message || 'حدث خطأ');
    } finally {
      setBusyId(null);
    }
  };

  const handleLiftSuspension = (carrier, resetWarnings) => {
    const reason = window.prompt(resetWarnings
      ? 'سبب رفع الإيقاف وتصفير الإنذارات:'
      : `سبب رفع الإيقاف (ستبقى الإنذارات ${carrier.warnings}، وأي إلغاء قادم قد يعيد الإيقاف):`);
    if (!reason || !reason.trim()) return;
    run(carrier.id, () => liftSuspension(carrier.id, reason.trim(), resetWarnings));
  };

  const handleForgiveDebt = (carrier) => {
    const reason = window.prompt(`إعفاء الناقل من المديونية (${carrier.outstandingDebt} ر.س).\nسبب الإعفاء:`);
    if (!reason || !reason.trim()) return;
    const amountInput = window.prompt('المبلغ المعفى (اتركه فارغاً لإعفاء كامل المديونية):', '');
    if (amountInput === null) return;
    const amount = amountInput.trim() ? Number(amountInput) : undefined;
    if (amount !== undefined && !(amount > 0)) {
      alert('المبلغ غير صحيح');
      return;
    }
    run(carrier.id, async () => {
      const res = await forgiveDebt(carrier.id, reason.trim(), amount);
      alert(`تم إعفاء ${res.forgiven} ر.س — المتبقي: ${res.remainingDebt} ر.س`);
    });
  };

  if (loading) return <div style={{ padding: 24 }}>جاري التحميل...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>مساءلة الناقلين</h2>
        <Button variant="outline" onClick={loadCarriers}>تحديث</Button>
      </div>

      <Card>
        <p className="text-helper" style={{ margin: 0, lineHeight: 1.8 }}>
          يحصل الناقل على إنذار عند إلغاء رحلة بعد إسنادها، ويُوقف تلقائياً عند بلوغ {threshold} إنذارات.
          رفع الإيقاف يتم بقرار إداري فقط، ويمكن معه تصفير الإنذارات. الإعفاء من المديونية لا يرفع الإيقاف ولا يغيّر الإنذارات.
        </p>
      </Card>

      <Card>
        {error ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-error)' }}>{error}</div>
        ) : carriers.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            لا يوجد ناقلون مسجلون
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: 14 }}>
                  <th style={{ padding: '12px 16px' }}>الناقل</th>
                  <th style={{ padding: '12px 16px' }}>الإنذارات</th>
                  <th style={{ padding: '12px 16px' }}>حالة الإيقاف</th>
                  <th style={{ padding: '12px 16px' }}>المديونية</th>
                  <th style={{ padding: '12px 16px' }}>الرحلات المكتملة</th>
                  <th style={{ padding: '12px 16px' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {carriers.map(carrier => (
                  <tr key={carrier.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600 }}>{carrier.name}</div>
                      <div className="text-helper" dir="ltr" style={{ textAlign: 'right', fontSize: 12 }}>{carrier.phone}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        color: carrier.warnings >= threshold ? 'var(--color-error)' : (carrier.warnings > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)'),
                        fontWeight: carrier.warnings > 0 ? 'bold' : 'normal'
                      }}>
                        {carrier.warnings} / {threshold}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {carrier.isSuspended ? (
                        <span style={{ color: 'var(--color-error)', fontWeight: 'bold' }}>موقوف</span>
                      ) : (
                        <span style={{ color: 'var(--color-success)' }}>نشط{carrier.isBusy ? ' (في رحلة)' : ''}</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', color: carrier.outstandingDebt > 0 ? 'var(--color-error)' : 'inherit', fontWeight: carrier.outstandingDebt > 0 ? 'bold' : 'normal' }}>
                      {carrier.outstandingDebt} ر.س
                    </td>
                    <td style={{ padding: '16px' }}>{carrier.completedTrips}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Button
                          variant="outline"
                          style={carrier.isSuspended ? { borderColor: 'var(--color-success)', color: 'var(--color-success)' } : {}}
                          disabled={!carrier.isSuspended || busyId === carrier.id}
                          onClick={() => handleLiftSuspension(carrier, false)}
                        >
                          رفع الإيقاف
                        </Button>
                        <Button
                          variant="outline"
                          disabled={!carrier.isSuspended || busyId === carrier.id}
                          onClick={() => handleLiftSuspension(carrier, true)}
                        >
                          رفع الإيقاف وتصفير الإنذارات
                        </Button>
                        <Button
                          variant="outline"
                          disabled={carrier.outstandingDebt <= 0 || busyId === carrier.id}
                          onClick={() => handleForgiveDebt(carrier)}
                        >
                          إعفاء من المديونية
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
