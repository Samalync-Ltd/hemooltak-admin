import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { getAccountById, updateAccountStatus, updateDocumentStatus } from '../../../admin/mock/accounts';
import { ACCOUNT_STATUS, DOCUMENT_STATUS } from '../../../admin/mock/constants';

export const AccountDetails = () => {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAccount();
  }, [accountId]);

  const loadAccount = async () => {
    setLoading(true);
    try {
      const data = await getAccountById(accountId);
      setAccount(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDecision = async (status) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في ${status === ACCOUNT_STATUS.VERIFIED ? 'توثيق' : 'رفض'} هذا الحساب بالكامل؟`)) {
      return;
    }
    
    try {
      const updated = await updateAccountStatus(accountId, status);
      setAccount(updated);
    } catch (err) {
      alert('حدث خطأ');
    }
  };

  const handleDocumentDecision = async (docId, status) => {
    if (!window.confirm(`هل أنت متأكد من قرارك لهذا المستند؟`)) {
      return;
    }

    try {
      await updateDocumentStatus(accountId, docId, status);
      // Reload account to get fresh data
      loadAccount();
    } catch (err) {
      alert('حدث خطأ');
    }
  };

  if (loading) return <div style={{ padding: 24 }}>جاري التحميل...</div>;
  if (error) return <div style={{ padding: 24, color: 'var(--color-error)' }}>{error}</div>;
  if (!account) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button variant="outline" onClick={() => navigate('/admin/accounts')}>عودة</Button>
          <h2 style={{ margin: 0 }}>تفاصيل الحساب: {account.id}</h2>
        </div>
        <StatusBadge status={account.status} />
      </div>

      <div className="responsive-two-col">
        {/* Personal & Company Info */}
        <Card>
          <h3 style={{ marginBottom: 16 }}>المعلومات الأساسية</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div className="text-helper">الاسم الكامل</div>
              <div style={{ fontWeight: 600 }}>{account.fullName}</div>
            </div>
            <div>
              <div className="text-helper">النوع</div>
              <div style={{ fontWeight: 600 }}>{account.type === 'SHIPPER' ? 'شاحن' : 'ناقل'}</div>
            </div>
            <div>
              <div className="text-helper">رقم الجوال</div>
              <div style={{ fontWeight: 600, direction: 'ltr', textAlign: 'right' }}>{account.phone}</div>
            </div>
            <div>
              <div className="text-helper">البريد الإلكتروني</div>
              <div style={{ fontWeight: 600 }}>{account.email}</div>
            </div>
            {account.companyName && (
              <div>
                <div className="text-helper">اسم الشركة</div>
                <div style={{ fontWeight: 600 }}>{account.companyName}</div>
              </div>
            )}
            {account.address && (
              <div>
                <div className="text-helper">العنوان</div>
                <div style={{ fontWeight: 600 }}>{account.address}</div>
              </div>
            )}
            <div>
              <div className="text-helper">تاريخ التسجيل</div>
              <div style={{ fontWeight: 600 }}>{new Date(account.submissionDate).toLocaleDateString('ar-SA')}</div>
            </div>
          </div>

          {/* Account Level Approval */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--color-border)' }}>
            <h4 style={{ marginBottom: 16 }}>قرار الحساب الكلي</h4>
            <div style={{ display: 'flex', gap: 16 }}>
              <Button 
                style={{ backgroundColor: 'var(--color-success)', color: 'white' }}
                onClick={() => handleAccountDecision(ACCOUNT_STATUS.VERIFIED)}
                disabled={account.status === ACCOUNT_STATUS.VERIFIED}
              >
                توثيق الحساب
              </Button>
              <Button 
                style={{ backgroundColor: 'var(--color-error)', color: 'white' }}
                onClick={() => handleAccountDecision(ACCOUNT_STATUS.REJECTED)}
                disabled={account.status === ACCOUNT_STATUS.REJECTED}
              >
                رفض الحساب
              </Button>
            </div>
          </div>
        </Card>

        {/* Documents */}
        <Card>
          <h3 style={{ marginBottom: 16 }}>المستندات المرفقة</h3>
          
          {account.documents && account.documents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {account.documents.map(doc => (
                <div key={doc.id} style={{ 
                  padding: 16, 
                  border: '1px solid var(--color-border)', 
                  borderRadius: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{doc.name}</div>
                      <div className="text-helper">تم الرفع: {new Date(doc.uploadedAt).toLocaleString('ar-SA')}</div>
                    </div>
                    <StatusBadge status={doc.status} />
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Button variant="outline" style={{ flex: 1 }}>معاينة المستند</Button>
                    
                    {doc.status !== DOCUMENT_STATUS.VERIFIED && (
                      <Button 
                        style={{ backgroundColor: 'var(--color-success)', color: 'white', flex: 1 }}
                        onClick={() => handleDocumentDecision(doc.id, DOCUMENT_STATUS.VERIFIED)}
                      >
                        قبول
                      </Button>
                    )}
                    
                    {doc.status !== DOCUMENT_STATUS.REJECTED && (
                      <Button 
                        style={{ backgroundColor: 'var(--color-error)', color: 'white', flex: 1 }}
                        onClick={() => handleDocumentDecision(doc.id, DOCUMENT_STATUS.REJECTED)}
                      >
                        رفض
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              لا توجد مستندات مرفقة
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
