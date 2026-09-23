import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { StatusBadge } from '../../../components/common/StatusBadge';
import {
  getAccountById, approveAccount, rejectAccount,
  approveDocument, rejectDocument,
  approveTruckDocument, rejectTruckDocument,
} from '../../../services/firebaseAdmin';
import { AccountStatus, DocumentStatus, AccountDocumentTypeAr, TruckTypeAr } from '../../../constants/enums';

const promptReason = (label) => {
  const reason = window.prompt(`سبب رفض ${label}:`);
  if (reason === null) return null; // cancelled
  if (!reason.trim()) {
    alert('سبب الرفض مطلوب');
    return undefined; // signal "invalid, do not proceed"
  }
  return reason.trim();
};

export const AccountDetails = () => {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!window.confirm(`هل أنت متأكد من رغبتك في ${status === AccountStatus.VERIFIED ? 'توثيق' : 'رفض'} هذا الحساب بالكامل؟`)) {
      return;
    }
    setBusy(true);
    try {
      if (status === AccountStatus.VERIFIED) {
        await approveAccount(accountId);
      } else {
        const reason = promptReason('الحساب');
        if (!reason) { setBusy(false); return; }
        await rejectAccount(accountId, reason);
      }
      await loadAccount();
    } catch (err) {
      alert(err.message || 'حدث خطأ');
    } finally {
      setBusy(false);
    }
  };

  const handleDocumentDecision = async (docId, approve) => {
    setBusy(true);
    try {
      if (approve) {
        await approveDocument(accountId, docId);
      } else {
        const reason = promptReason('المستند');
        if (!reason) { setBusy(false); return; }
        await rejectDocument(accountId, docId, reason);
      }
      await loadAccount();
    } catch (err) {
      alert(err.message || 'حدث خطأ');
    } finally {
      setBusy(false);
    }
  };

  const handleTruckDocumentDecision = async (truckId, field, approve) => {
    setBusy(true);
    try {
      if (approve) {
        await approveTruckDocument(accountId, truckId, field);
      } else {
        const reason = promptReason(field === 'operatingCard' ? 'بطاقة التشغيل' : 'الاستمارة');
        if (!reason) { setBusy(false); return; }
        await rejectTruckDocument(accountId, truckId, field, reason);
      }
      await loadAccount();
    } catch (err) {
      alert(err.message || 'حدث خطأ');
    } finally {
      setBusy(false);
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
        <div style={{ display: 'flex', gap: 8 }}>
          <StatusBadge status={account.status} />
          {account.isSuspended && <StatusBadge status="REJECTED" label="موقوف (isSuspended)" />}
        </div>
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
            {account.submissionDate && (
              <div>
                <div className="text-helper">تاريخ التسجيل</div>
                <div style={{ fontWeight: 600 }}>{account.submissionDate.toLocaleDateString('ar-SA')}</div>
              </div>
            )}
            {account.rejectReason && (
              <div>
                <div className="text-helper">سبب الرفض</div>
                <div style={{ fontWeight: 600, color: 'var(--color-error)' }}>{account.rejectReason}</div>
              </div>
            )}
          </div>

          {/* Account Level Approval */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--color-border)' }}>
            <h4 style={{ marginBottom: 16 }}>قرار الحساب الكلي</h4>
            <p className="text-helper" style={{ marginBottom: 16 }}>
              التوثيق يتطلب موافقة كل المستندات المطلوبة أولاً — وإلا يرفض الطلب تلقائياً.
            </p>
            <div style={{ display: 'flex', gap: 16 }}>
              <Button
                style={{ backgroundColor: 'var(--color-success)', color: 'white' }}
                onClick={() => handleAccountDecision(AccountStatus.VERIFIED)}
                disabled={busy || account.status === AccountStatus.VERIFIED}
              >
                توثيق الحساب
              </Button>
              <Button
                style={{ backgroundColor: 'var(--color-error)', color: 'white' }}
                onClick={() => handleAccountDecision(AccountStatus.REJECTED)}
                disabled={busy || account.status === AccountStatus.REJECTED}
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
                      <div style={{ fontWeight: 'bold' }}>{AccountDocumentTypeAr[doc.type] || doc.type}</div>
                      <div className="text-helper">تم الرفع: {doc.uploadedAt?.toDate?.().toLocaleString('ar-SA') ?? '—'}</div>
                    </div>
                    <StatusBadge status={doc.status} />
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Button variant="outline" style={{ flex: 1 }} onClick={() => window.open(doc.fileUrl, '_blank')}>معاينة المستند</Button>

                    {doc.status !== DocumentStatus.APPROVED && (
                      <Button
                        style={{ backgroundColor: 'var(--color-success)', color: 'white', flex: 1 }}
                        disabled={busy}
                        onClick={() => handleDocumentDecision(doc.id, true)}
                      >
                        قبول
                      </Button>
                    )}

                    {doc.status !== DocumentStatus.REJECTED && (
                      <Button
                        style={{ backgroundColor: 'var(--color-error)', color: 'white', flex: 1 }}
                        disabled={busy}
                        onClick={() => handleDocumentDecision(doc.id, false)}
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

      {/* Trucks (carrier only) — operatingCard/registration are per truck,
          reviewed independently of the account-level documents above. */}
      {account.type === 'CARRIER' && (
        <Card>
          <h3 style={{ marginBottom: 16 }}>مركبات الناقل</h3>
          {account.trucks && account.trucks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {account.trucks.map(truck => (
                <div key={truck.id} style={{ padding: 16, border: '1px solid var(--color-border)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <strong>{truck.brand} {truck.model}</strong>
                      <span className="text-helper" style={{ marginRight: 8 }}>
                        {truck.type === 'OTHER' ? truck.customType : (TruckTypeAr[truck.type] || truck.type)} — {truck.capacityTons} طن — لوحة {truck.plateNumber}
                      </span>
                    </div>
                    <StatusBadge
                      status={truck.isSelectable ? DocumentStatus.APPROVED : DocumentStatus.PENDING}
                      label={truck.isSelectable ? 'قابلة للاختيار' : 'غير قابلة للاختيار بعد'}
                    />
                  </div>

                  <div className="responsive-two-col-even">
                    {['operatingCard', 'registration'].map((field) => {
                      const paper = truck[field] || {};
                      const label = field === 'operatingCard' ? 'بطاقة التشغيل' : 'الاستمارة (رخصة السير)';
                      return (
                        <div key={field} style={{ padding: 12, border: '1px dashed var(--color-border)', borderRadius: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <strong>{label}</strong>
                            <StatusBadge status={paper.status} />
                          </div>
                          {field === 'operatingCard' && paper.expiryDate && (
                            <div className="text-helper" style={{ marginBottom: 8 }}>ينتهي: {paper.expiryDate}</div>
                          )}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Button variant="outline" size="sm" style={{ flex: 1 }} disabled={!paper.fileUrl} onClick={() => window.open(paper.fileUrl, '_blank')}>معاينة</Button>
                            {paper.status !== DocumentStatus.APPROVED && (
                              <Button size="sm" style={{ backgroundColor: 'var(--color-success)', color: 'white', flex: 1 }} disabled={busy || !paper.fileUrl} onClick={() => handleTruckDocumentDecision(truck.id, field, true)}>
                                قبول
                              </Button>
                            )}
                            {paper.status !== DocumentStatus.REJECTED && (
                              <Button size="sm" style={{ backgroundColor: 'var(--color-error)', color: 'white', flex: 1 }} disabled={busy || !paper.fileUrl} onClick={() => handleTruckDocumentDecision(truck.id, field, false)}>
                                رفض
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              لم يسجّل هذا الناقل أي مركبة بعد
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
