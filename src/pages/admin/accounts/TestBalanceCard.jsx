import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { getWallet, adminAddBalance, toArabicError } from '../../../services/firebaseAdmin';

const money = (n) => `${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} ر.س`;

/**
 * «إضافة رصيد تجريبي» — self top-up is switched off until online payment
 * exists (TOPUP_DISABLED), so an admin adds balance for testing through
 * adminAddBalance. The note is required and is saved on the transaction.
 * Any amount the account owes is paid off first.
 */
export const TestBalanceCard = ({ uid }) => {
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    getWallet(uid).then(setWallet).catch(() => setWallet(null));
  }, [uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    const value = Number(amount);
    if (!(value > 0)) { setError('أدخل مبلغاً أكبر من صفر.'); return; }
    if (!/^\d+(\.\d{1,2})?$/.test(amount.trim())) { setError('المبلغ يقبل خانتين عشريتين كحد أقصى.'); return; }
    if (!note.trim()) { setError('الملاحظة مطلوبة — اكتب سبب إضافة الرصيد.'); return; }
    if (!window.confirm(`إضافة ${money(value)} رصيداً تجريبياً لهذا الحساب؟`)) return;

    setBusy(true);
    try {
      const res = await adminAddBalance(uid, value, note.trim());
      setResult(res);
      setWallet({ totalBalance: res.totalBalance, reservedAmount: res.reservedAmount, availableBalance: res.availableBalance });
      setAmount('');
      setNote('');
    } catch (err) {
      setError(toArabicError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <h3 style={{ marginBottom: 8 }}>إضافة رصيد تجريبي</h3>
      <p className="text-helper" style={{ marginTop: 0, marginBottom: 16 }}>
        شحن المحفظة متوقف للمستخدمين حتى تفعيل الدفع الإلكتروني. يُسجّل الرصيد المضاف كعملية شحن مع ملاحظتك، ويُسدَّد منه أولاً أي مبلغ مستحق على الحساب.
      </p>
      {wallet && (
        <div style={{ marginBottom: 16, fontSize: 14 }}>
          <strong>الرصيد المتاح:</strong> {money(wallet.availableBalance)}
          {wallet.reservedAmount > 0 && <span className="text-helper"> (الإجمالي {money(wallet.totalBalance)}، منه {money(wallet.reservedAmount)} محجوز)</span>}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 160px' }}>
          <Input label="المبلغ (ر.س)" numeric="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={busy} />
        </div>
        <div style={{ flex: '2 1 240px' }}>
          <Input label="ملاحظة (مطلوبة)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثال: رصيد تجريبي لاختبار رحلة كاملة" disabled={busy} />
        </div>
        <Button type="submit" variant="primary" isLoading={busy} disabled={busy}>إضافة الرصيد</Button>
      </form>
      {error && <div role="alert" style={{ marginTop: 12, color: 'var(--color-error)', fontSize: 14 }}>{error}</div>}
      {result && (
        <div role="status" style={{ marginTop: 12, padding: 12, borderRadius: 8, backgroundColor: 'rgba(16,185,129,0.08)', color: 'var(--color-success)', fontSize: 14 }}>
          تمت إضافة {money(result.amount)}.
          {result.appliedToDebt > 0 && ` سُدّد منها ${money(result.appliedToDebt)} من المبلغ المستحق، وأُضيف ${money(result.credited)} إلى الرصيد.`}
          {result.remainingDebt > 0 && ` لا يزال على الحساب ${money(result.remainingDebt)}.`}
        </div>
      )}
    </Card>
  );
};
