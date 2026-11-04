import React, { useEffect, useRef, useState } from 'react';
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
import { useNavigate, useSearchParams } from 'react-router-dom';

/** "SA0380000000608010167519" -> "SA03 8000 0000 6080 1016 7519" for reading/typing into a bank app. */
const formatIban = (iban) => (iban || '').replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim();

export const CommissionsDashboard = () => {
  const [rate, setRate] = useState(null);
  const [tempRate, setTempRate] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [timeFilter, setTimeFilter] = useState('ALL'); // DAILY, MONTHLY, ALL
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();
  // Opened from the header bell as ?withdrawal=<id>: scroll to and highlight that request.
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('withdrawal');
  const refetchedFor = useRef(null);

  // Copies the unspaced IBAN — the form banking apps accept on paste.
  const copyIban = async (req) => {
    try {
      await navigator.clipboard.writeText(req.iban);
      setCopiedId(req.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      window.prompt('انسخ الآيبان:', req.iban);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!highlightId || loading) return;
    if (!withdrawals.some((w) => w.id === highlightId)) {
      // Already on this page when the request came in — the list predates
      // it. Fetch once more, but only once per id.
      if (refetchedFor.current !== highlightId) {
        refetchedFor.current = highlightId;
        loadData();
      }
      return;
    }
    document.getElementById(`withdrawal-${highlightId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightId, loading, withdrawals]);

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

  const handleWithdrawalDecision = async (req, decision) => {
    const id = req.id;
    const question = decision === 'PAID'
      ? `تأكيد أنه تم تحويل ${req.amount} ر.س إلى:\n${req.bankAccountName || '—'}\n${req.iban ? formatIban(req.iban) : 'لا يوجد آيبان'}\n\nهل تريد تحديد الطلب كمدفوع؟`
      : 'هل أنت متأكد من رفض طلب السحب هذا؟';
    if (!window.confirm(question)) {
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
                <div key={req.id} id={`withdrawal-${req.id}`} style={{ padding: 12, borderRadius: 8, border: req.id === highlightId ? '2px solid var(--color-accent)' : '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>{req.carrierName}</strong>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{req.amount} ر.س</span>
                  </div>
                  <div className="text-helper" style={{ marginBottom: 12 }}>
                    التاريخ: {req.requestDate ? req.requestDate.toLocaleDateString('ar-SA') : '—'}
                    {req.note && ` — ${req.note}`}
                  </div>
                  <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
                    <div className="text-helper" style={{ fontSize: 12, marginBottom: 6 }}>التحويل إلى</div>
                    {req.iban ? (
                      <>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{req.bankAccountName}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                          <span dir="ltr" style={{ fontFamily: 'monospace', fontSize: 14 }}>{formatIban(req.iban)}</span>
                          <Button variant="outline" onClick={() => copyIban(req)} style={{ padding: '4px 10px', fontSize: 12 }}>
                            {copiedId === req.id ? 'تم النسخ ✓' : 'نسخ الآيبان'}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div style={{ color: 'var(--color-error)', fontSize: 13 }}>
                        لا توجد بيانات بنكية على هذا الطلب (طلب قديم قبل إضافة الآيبان) — تواصل مع الناقل أو ارفض الطلب.
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      disabled={busy}
                      style={{ flex: 1, backgroundColor: 'var(--color-success)', color: 'white' }}
                      onClick={() => handleWithdrawalDecision(req, 'PAID')}
                    >
                      تحديد كمدفوع
                    </Button>
                    <Button
                      disabled={busy}
                      style={{ flex: 1, backgroundColor: 'var(--color-error)', color: 'white' }}
                      onClick={() => handleWithdrawalDecision(req, 'REJECTED')}
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
