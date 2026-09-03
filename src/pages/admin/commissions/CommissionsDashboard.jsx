import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { 
  getCommissionRate, 
  updateCommissionRate, 
  getCommissionTransactions 
} from '../../../admin/mock/commissions';
import { getWithdrawalRequests, updateWithdrawalStatus } from '../../../admin/mock/withdrawals';
import { WITHDRAWAL_STATUS } from '../../../admin/mock/constants';
import { useNavigate } from 'react-router-dom';

export const CommissionsDashboard = () => {
  const [rate, setRate] = useState(0);
  const [tempRate, setTempRate] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('ALL'); // DAILY, MONTHLY, ALL
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentRate = await getCommissionRate();
      const txs = await getCommissionTransactions();
      const wreqs = await getWithdrawalRequests();
      
      setRate(currentRate);
      setTempRate(currentRate.toString());
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

    try {
      await updateCommissionRate(newRate);
      setRate(newRate);
      alert('تم تحديث نسبة العمولة بنجاح. ستطبق النسبة الجديدة على الشحنات القادمة.');
    } catch (err) {
      alert('حدث خطأ أثناء التحديث');
    }
  };

  const handleWithdrawalDecision = async (id, status) => {
    if (!window.confirm(`هل أنت متأكد من تغيير حالة هذا الطلب إلى ${status === WITHDRAWAL_STATUS.PAID ? 'مدفوع' : 'مرفوض'}؟`)) {
      return;
    }
    
    try {
      await updateWithdrawalStatus(id, status);
      loadData();
    } catch (err) {
      alert('حدث خطأ');
    }
  };

  // Filter logic
  const now = new Date();
  const filteredTxs = transactions.filter(tx => {
    if (timeFilter === 'ALL') return true;
    
    const txDate = new Date(tx.date);
    if (timeFilter === 'DAILY') {
      return txDate.toDateString() === now.toDateString();
    }
    if (timeFilter === 'MONTHLY') {
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
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
            هذه النسبة ستطبق على جميع الشحنات الجديدة، وعمليات الإلغاء الإدارية.
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
            <Button type="submit" variant="primary" disabled={parseFloat(tempRate) === rate}>حفظ</Button>
          </form>
          <div style={{ marginTop: 16, padding: 12, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 8, color: 'var(--color-primary)' }}>
            <strong>النسبة الحالية:</strong> {rate}%
          </div>
        </Card>

        {/* Withdrawal Requests */}
        <Card>
          <h3 style={{ marginBottom: 16 }}>طلبات سحب الرصيد (الناقلين)</h3>
          {withdrawals.filter(w => w.status === WITHDRAWAL_STATUS.PENDING).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {withdrawals.filter(w => w.status === WITHDRAWAL_STATUS.PENDING).map(req => (
                <div key={req.id} style={{ padding: 12, border: '1px solid var(--color-border)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>{req.carrierName}</strong>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{req.amount} ر.س</span>
                  </div>
                  <div className="text-helper" style={{ marginBottom: 12 }}>التاريخ: {new Date(req.requestDate).toLocaleDateString('ar-SA')}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button 
                      style={{ flex: 1, backgroundColor: 'var(--color-success)', color: 'white' }}
                      onClick={() => handleWithdrawalDecision(req.id, WITHDRAWAL_STATUS.PAID)}
                    >
                      تحديد كمدفوع
                    </Button>
                    <Button 
                      style={{ flex: 1, backgroundColor: 'var(--color-error)', color: 'white' }}
                      onClick={() => handleWithdrawalDecision(req.id, WITHDRAWAL_STATUS.REJECTED)}
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
                  <th style={{ padding: '12px 16px' }}>رقم الشحنة</th>
                  <th style={{ padding: '12px 16px' }}>المبلغ</th>
                  <th style={{ padding: '12px 16px' }}>النسبة المطبقة</th>
                  <th style={{ padding: '12px 16px' }}>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxs.map(tx => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px' }}>{tx.id}</td>
                    <td style={{ padding: '16px' }}>
                      <a 
                        href={`/admin/shipments/${tx.shipmentId}`} 
                        onClick={(e) => { e.preventDefault(); navigate(`/admin/shipments/${tx.shipmentId}`); }}
                        style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
                      >
                        {tx.shipmentId}
                      </a>
                    </td>
                    <td style={{ padding: '16px', fontWeight: 600, color: 'var(--color-success)' }}>{tx.amount} ر.س</td>
                    <td style={{ padding: '16px' }}>{tx.rateUsed}%</td>
                    <td style={{ padding: '16px' }}>{new Date(tx.date).toLocaleString('ar-SA')}</td>
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
