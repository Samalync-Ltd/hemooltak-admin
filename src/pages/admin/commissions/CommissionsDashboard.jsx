import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import {
  getCommissionConfig,
  setCommissionConfig,
  getCommissionReport,
  getWithdrawals,
  processWithdrawal,
} from '../../../services/firebaseAdmin';
import { WithdrawalStatus } from '../../../constants/enums';
import { useNavigate } from 'react-router-dom';

export const CommissionsDashboard = () => {
  const [rate, setRate] = useState(null);
  const [tempRate, setTempRate] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [timeFilter, setTimeFilter] = useState('ALL'); // DAILY, MONTHLY, ALL
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [config, txs, wreqs] = await Promise.all([
        getCommissionConfig(),
        getCommissionReport(),
        getWithdrawals(),
      ]);

      setRate(config.commissionPercent);
      setTempRate(config.commissionPercent != null ? String(config.commissionPercent) : '');
      setTransactions(txs);
      setWithdrawals(wreqs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRate = async (e) => {
    e.preventDefault();
    const newRate = parseFloat(tempRate);
    if (isNaN(newRate) || newRate < 0 || newRate > 100) {
      alert('الرجاء إدخال نسبة صحيحة بين 0 و 100');
      return;
    }

    setBusy(true);
    try {
      await setCommissionConfig({ commissionPercent: newRate, warningThreshold: 3 });
      setRate(newRate);
      alert('تم تحديث نسبة العمولة بنجاح. بدون هذه النسبة لا يمكن تسوية أي رحلة أو إلغاء بعد الإسناد.');
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء التحديث');
    } finally {
      setBusy(false);
    }
  };

  const handleWithdrawalDecision = async (id, decision) => {
    if (!window.confirm(`هل أنت متأكد من تغيير حالة هذا الطلب إلى ${decision === 'PAID' ? 'مدفوع' : 'مرفوض'}؟`)) {
      return;
    }
    let reason;
    if (decision === 'REJECTED') {
      reason = window.prompt('سبب رفض طلب السحب:');
      if (reason === null) return;
      if (!reason.trim()) { alert('سبب الرفض مطلوب'); return; }
    }

    setBusy(true);
    try {
      await processWithdrawal(id, decision, reason);
      await loadData();
    } catch (err) {
      alert(err.message || 'حدث خطأ');
    } finally {
      setBusy(false);
    }
  };

  // Filter logic
  const now = new Date();
  const filteredTxs = transactions.filter(tx => {
    if (timeFilter === 'ALL') return true;
    if (!tx.date) return false;

    if (timeFilter === 'DAILY') {
      return tx.date.toDateString() === now.toDateString();
    }
    if (timeFilter === 'MONTHLY') {
      return tx.date.getMonth() === now.getMonth() && tx.date.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const totalCommission = filteredTxs.reduce((sum, tx) => sum + tx.amount, 0);

  if (loading) return <div style={{ padding: 24 }}>جاري التحميل...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ margin: 0 }}>العمولات والمدفوعات</h2>

      <div className="responsive-two-col-even">
        {/* Commission Rate Settings */}
        <Card>
          <h3 style={{ marginBottom: 16 }}>إعدادات نسبة العمولة</h3>
          <p className="text-helper" style={{ marginBottom: 24 }}>
            هذه النسبة (config/platform.commissionPercent) تُستخدم لكل من تسوية الرحلات وعمولة الإلغاء بعد الإسناد.
            {rate == null && ' — لم يتم ضبطها بعد: كل تسوية وإلغاء بعد الإسناد سيفشل حتى تُحفظ نسبة هنا.'}
          </p>
          <form onSubmit={handleUpdateRate} style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input
                label="نسبة المنصة (%)"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={tempRate}
                onChange={(e) => setTempRate(e.target.value)}
              />
            </div>
            <Button type="submit" variant="primary" disabled={busy || parseFloat(tempRate) === rate}>حفظ</Button>
          </form>
          <div style={{ marginTop: 16, padding: 12, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 8, color: 'var(--color-primary)' }}>
            <strong>النسبة الحالية:</strong> {rate != null ? `${rate}%` : 'غير محددة'}
          </div>
        </Card>

        {/* Withdrawal Requests */}
        <Card>
          <h3 style={{ marginBottom: 16 }}>طلبات سحب الرصيد (الناقلين)</h3>
          {withdrawals.filter(w => w.status === WithdrawalStatus.PENDING).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {withdrawals.filter(w => w.status === WithdrawalStatus.PENDING).map(req => (
                <div key={req.id} style={{ padding: 12, border: '1px solid var(--color-border)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>{req.carrierName}</strong>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{req.amount} ر.س</span>
                  </div>
                  <div className="text-helper" style={{ marginBottom: 12 }}>
                    التاريخ: {req.requestDate ? req.requestDate.toLocaleDateString('ar-SA') : '—'}
                    {req.note && ` — ${req.note}`}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      disabled={busy}
                      style={{ flex: 1, backgroundColor: 'var(--color-success)', color: 'white' }}
                      onClick={() => handleWithdrawalDecision(req.id, 'PAID')}
                    >
                      تحديد كمدفوع
                    </Button>
                    <Button
                      disabled={busy}
                      style={{ flex: 1, backgroundColor: 'var(--color-error)', color: 'white' }}
                      onClick={() => handleWithdrawalDecision(req.id, 'REJECTED')}
                    >
                      رفض
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-helper">لا توجد طلبات سحب معلقة</div>
          )}
        </Card>
      </div>

      {/* Commission Report */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: 0 }}>تقرير العمولات</h3>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--color-success)', marginTop: 8 }}>
              {totalCommission} ر.س
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
            <Button variant={timeFilter === 'DAILY' ? 'primary' : 'outline'} onClick={() => setTimeFilter('DAILY')}>يومي</Button>
            <Button variant={timeFilter === 'MONTHLY' ? 'primary' : 'outline'} onClick={() => setTimeFilter('MONTHLY')}>شهري</Button>
            <Button variant={timeFilter === 'ALL' ? 'primary' : 'outline'} onClick={() => setTimeFilter('ALL')}>كل الوقت</Button>
          </div>
        </div>

        {filteredTxs.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            لا توجد حركات عمولة في هذه الفترة
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: 14 }}>
                  <th style={{ padding: '12px 16px' }}>رقم الحركة</th>
                  <th style={{ padding: '12px 16px' }}>الحساب</th>
                  <th style={{ padding: '12px 16px' }}>رقم الشحنة</th>
                  <th style={{ padding: '12px 16px' }}>المبلغ</th>
                  <th style={{ padding: '12px 16px' }}>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxs.map(tx => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px' }}>{tx.id}</td>
                    <td style={{ padding: '16px' }}>{tx.userName}</td>
                    <td style={{ padding: '16px' }}>
                      {tx.shipmentId ? (
                        <a
                          href={`/admin/shipments/${tx.shipmentId}`}
                          onClick={(e) => { e.preventDefault(); navigate(`/admin/shipments/${tx.shipmentId}`); }}
                          style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
                        >
                          {tx.shipmentId}
                        </a>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 600, color: 'var(--color-success)' }}>{tx.amount} ر.س</td>
                    <td style={{ padding: '16px' }}>{tx.date ? tx.date.toLocaleString('ar-SA') : '—'}</td>
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
