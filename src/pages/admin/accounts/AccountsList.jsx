import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/common/Card';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { getAccounts } from '../../../admin/mock/accounts';

export const AccountsList = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, UNDER_REVIEW, SHIPPERS, CARRIERS
  const navigate = useNavigate();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await getAccounts();
      setAccounts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(acc => {
    // Tab filter
    if (activeTab === 'UNDER_REVIEW' && acc.status !== 'UNDER_REVIEW') return false;
    if (activeTab === 'SHIPPERS' && acc.type !== 'SHIPPER') return false;
    if (activeTab === 'CARRIERS' && acc.type !== 'CARRIER') return false;

    // Search filter
    if (search) {
      const query = search.toLowerCase();
      if (!acc.fullName.toLowerCase().includes(query) && !acc.phone.includes(query)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>الحسابات والمستندات</h2>
      </div>

      <Card>
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <Input 
            placeholder="بحث بالاسم أو رقم الجوال..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 300 }}
          />
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
            <Button 
              variant={activeTab === 'ALL' ? 'primary' : 'outline'} 
              onClick={() => setActiveTab('ALL')}
            >
              الكل
            </Button>
            <Button 
              variant={activeTab === 'UNDER_REVIEW' ? 'primary' : 'outline'} 
              onClick={() => setActiveTab('UNDER_REVIEW')}
            >
              قيد المراجعة
            </Button>
            <Button 
              variant={activeTab === 'SHIPPERS' ? 'primary' : 'outline'} 
              onClick={() => setActiveTab('SHIPPERS')}
            >
              الشاحنين
            </Button>
            <Button 
              variant={activeTab === 'CARRIERS' ? 'primary' : 'outline'} 
              onClick={() => setActiveTab('CARRIERS')}
            >
              الناقلين
            </Button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 24, textAlign: 'center' }}>جاري التحميل...</div>
        ) : filteredAccounts.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            لا توجد حسابات مطابقة للبحث
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: 14 }}>
                  <th style={{ padding: '12px 16px' }}>رقم الحساب</th>
                  <th style={{ padding: '12px 16px' }}>الاسم</th>
                  <th style={{ padding: '12px 16px' }}>رقم الجوال</th>
                  <th style={{ padding: '12px 16px' }}>النوع</th>
                  <th style={{ padding: '12px 16px' }}>تاريخ التسجيل</th>
                  <th style={{ padding: '12px 16px' }}>الحالة</th>
                  <th style={{ padding: '12px 16px' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map(acc => (
                  <tr key={acc.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px' }}>{acc.id}</td>
                    <td style={{ padding: '16px' }}>
                      <strong>{acc.fullName}</strong>
                      {acc.companyName && <div className="text-helper">{acc.companyName}</div>}
                    </td>
                    <td style={{ padding: '16px', direction: 'ltr', textAlign: 'right' }}>{acc.phone}</td>
                    <td style={{ padding: '16px' }}>{acc.type === 'SHIPPER' ? 'شاحن' : 'ناقل'}</td>
                    <td style={{ padding: '16px' }}>{new Date(acc.submissionDate).toLocaleDateString('ar-SA')}</td>
                    <td style={{ padding: '16px' }}>
                      <StatusBadge status={acc.status} />
                    </td>
                    <td style={{ padding: '16px' }}>
                      <Button variant="outline" onClick={() => navigate(`/admin/accounts/${acc.id}`)}>
                        عرض التفاصيل
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
