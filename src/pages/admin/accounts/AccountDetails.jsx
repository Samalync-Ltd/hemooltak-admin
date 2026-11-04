import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { StatusBadge } from '../../../components/common/StatusBadge';
import {
  getAccountById, approveAccount, rejectAccount,
  approveDocument, rejectDocument,
  approveTruckDocument, rejectTruckDocument,
  toArabicError,
} from '../../../services/firebaseAdmin';
import { AccountStatus, DocumentStatus, AccountDocumentTypeAr, TruckTypeAr, RequiredDocuments } from '../../../constants/enums';

/** null = cancelled, '' = confirmed but left blank, otherwise the trimmed reason. */
const promptReason = (label) => {
  const reason = window.prompt(`سبب رفض ${label}:`);
  return reason === null ? null : reason.trim();
};

/**
 * Dates on these records are written by more than one client (web, mobile,
 * backend) and are not all the same type — a Firestore Timestamp, a Date, an
 * ISO string or epoch millis. Rendering a Timestamp object directly makes
 * React throw and blanks the whole page, so everything goes through here.
 */
const formatDateValue = (value, withTime = false) => {
  if (value == null || value === '') return '—';
  const date = typeof value.toDate === 'function' ? value.toDate()
    : value instanceof Date ? value
      : typeof value === 'number' ? new Date(value)
        : null;
  if (!date) return String(value);
  if (Number.isNaN(date.getTime())) return '—';
  return withTime ? date.toLocaleString('ar-SA') : date.toLocaleDateString('ar-SA');
};

// Where each required document stands — the most advanced state wins, so a
// re-uploaded copy (PENDING) beats the rejected one it replaced.
const DocState = { APPROVED: 'APPROVED', PENDING: 'PENDING', REJECTED: 'REJECTED', MISSING: 'MISSING' };
const docStateOf = (documents, type) => {
  const statuses = documents.filter((d) => d.type === type).map((d) => d.status);
  if (statuses.includes(DocumentStatus.APPROVED)) return DocState.APPROVED;
  if (statuses.includes(DocumentStatus.PENDING)) return DocState.PENDING;
  if (statuses.includes(DocumentStatus.REJECTED)) return DocState.REJECTED;
  return DocState.MISSING;
};

const docStateView = {
  [DocState.APPROVED]: { icon: '✓', text: 'تم القبول', color: 'var(--color-success)' },
  [DocState.PENDING]: { icon: '⏳', text: 'بانتظار قبولك', color: 'var(--color-warning)' },
  [DocState.REJECTED]: { icon: '✗', text: 'مرفوض — بانتظار رفع نسخة جديدة من المستخدم', color: 'var(--color-error)' },
  [DocState.MISSING]: { icon: '—', text: 'لم يُرفع بعد', color: 'var(--color-text-muted)' },
};

const truckPaperLabel = (field) => (field === 'operatingCard' ? 'بطاقة التشغيل' : 'الاستمارة (رخصة السير)');

export const AccountDetails = () => {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [showVerifyBlockers, setShowVerifyBlockers] = useState(false);

  useEffect(() => {
    setShowVerifyBlockers(false);
    setActionError('');
    loadAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  // Opened from the header bell as /admin/accounts/:id#truck-<id> — bring
  // that truck into view once it has rendered.
  useEffect(() => {
    if (!account || !hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [account, hash]);

  // `silent` refreshes in place after an action. Swapping the whole page for
  // a loading line (and losing the scroll position) on every approve/reject
  // is what read as a "white screen" — especially on the first call, while
  // the Cloud Function is still cold-starting.
  const loadAccount = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await getAccountById(accountId);
      setAccount(data);
      setError('');
    } catch (err) {
      if (silent) setActionError(toArabicError(err));
      else setError(toArabicError(err));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const runAction = async (action) => {
    setBusy(true);
    setActionError('');
    try {
      await action();
      await loadAccount({ silent: true });
    } catch (err) {
      setActionError(toArabicError(err));
    } finally {
      setBusy(false);
    }
  };

  /** Asks for a rejection reason; returns it, or null when the admin cancelled or left it blank. */
  const askReason = (label) => {
    const reason = promptReason(label);
    if (reason === '') setActionError('سبب الرفض مطلوب — لم يتم رفض أي شيء.');
    return reason || null;
  };

  if (loading) return <div style={{ padding: 24 }}>جاري التحميل...</div>;
  if (error) return <div style={{ padding: 24, color: 'var(--color-error)' }}>{error}</div>;
  if (!account) return null;

  const documents = account.documents || [];
  const requiredTypes = RequiredDocuments[account.type]?.[account.accountType] || [];
  const checklist = requiredTypes.map((type) => ({ type, state: docStateOf(documents, type) }));
  const blockers = checklist.filter((item) => item.state !== DocState.APPROVED);
  const isVerified = account.status === AccountStatus.VERIFIED;

  const handleVerify = () => {
    // The button stays clickable — but verifying before every required
    // document is approved can only fail, so explain why here instead of
    // round-tripping to the backend for an English error.
    if (blockers.length > 0) {
      setShowVerifyBlockers(true);
      return;
    }
    if (!window.confirm('هل أنت متأكد من رغبتك في توثيق هذا الحساب بالكامل؟')) return;
    runAction(() => approveAccount(accountId));
  };

  const handleRejectAccount = () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في رفض هذا الحساب بالكامل؟')) return;
    const reason = askReason('الحساب');
    if (!reason) return;
    runAction(() => rejectAccount(accountId, reason));
  };

  const handleDocumentDecision = (docId, approve) => {
    if (approve) return runAction(() => approveDocument(accountId, docId));
    const reason = askReason('المستند');
    if (!reason) return;
    runAction(() => rejectDocument(accountId, docId, reason));
  };

  const handleTruckDocumentDecision = (truckId, field, approve) => {
    if (approve) return runAction(() => approveTruckDocument(accountId, truckId, field));
    const reason = askReason(truckPaperLabel(field));
    if (!reason) return;
    runAction(() => rejectTruckDocument(accountId, truckId, field, reason));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button variant="outline" onClick={() => navigate('/admin/accounts')}>عودة</Button>
          <h2 style={{ margin: 0 }}>تفاصيل الحساب: {account.id}</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <StatusBadge status={account.status} />
          {account.isSuspended && <StatusBadge status="REJECTED" label="موقوف (isSuspended)" />}
        </div>
      </div>

      {actionError && (
        <div role="alert" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
          padding: '12px 16px', borderRadius: 8,
          backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid var(--color-error)', color: 'var(--color-error)',
        }}>
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError('')} aria-label="إغلاق" style={{ color: 'inherit', fontWeight: 700 }}>×</button>
        </div>
      )}

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
              <div style={{ fontWeight: 600 }}>
                {account.type === 'SHIPPER' ? 'شاحن' : 'ناقل'}
                {account.accountType && ` — ${account.accountType === 'COMPANY' ? 'شركة' : 'فرد'}`}
              </div>
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
                <div style={{ fontWeight: 600 }}>{formatDateValue(account.submissionDate)}</div>
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
            <h4 style={{ marginBottom: 12 }}>قرار الحساب الكلي</h4>

            {!isVerified && (
              <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  الترتيب: اقبل كل مستند مطلوب أولاً من «المستندات المرفقة»، ثم اضغط «توثيق الحساب».
                </div>
                {checklist.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {checklist.map(({ type, state }) => (
                      <li key={type} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 14 }}>
                        <span>{AccountDocumentTypeAr[type] || type}</span>
                        <span style={{ color: docStateView[state].color, fontWeight: 600 }}>
                          {docStateView[state].icon} {docStateView[state].text}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 16 }}>
              <Button
                style={{ backgroundColor: 'var(--color-success)', color: 'white' }}
                onClick={handleVerify}
                disabled={busy || isVerified}
              >
                توثيق الحساب
              </Button>
              <Button
                style={{ backgroundColor: 'var(--color-error)', color: 'white' }}
                onClick={handleRejectAccount}
                disabled={busy || account.status === AccountStatus.REJECTED}
              >
                رفض الحساب
              </Button>
            </div>

            {showVerifyBlockers && blockers.length > 0 && !isVerified && (
              <div role="alert" style={{
                marginTop: 16, padding: '12px 16px', borderRadius: 8,
                backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--color-warning)',
              }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>لا يمكن توثيق الحساب بعد</div>
                <div style={{ marginBottom: 6 }}>يجب قبول المستندات التالية أولاً:</div>
                <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                  {blockers.map(({ type, state }) => (
                    <li key={type}>
                      <strong>{AccountDocumentTypeAr[type] || type}</strong> — {docStateView[state].text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>

        {/* Documents */}
        <Card>
          <h3 style={{ marginBottom: 16 }}>المستندات المرفقة</h3>

          {documents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {documents.map(doc => {
                const isPending = doc.status === DocumentStatus.PENDING;
                const isRequired = requiredTypes.includes(doc.type);
                return (
                  <div key={doc.id} id={`doc-${doc.id}`} style={{
                    padding: 16,
                    border: isPending ? '2px solid var(--color-warning)' : '1px solid var(--color-border)',
                    backgroundColor: isPending ? 'rgba(245, 158, 11, 0.05)' : undefined,
                    borderRadius: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{AccountDocumentTypeAr[doc.type] || doc.type}</div>
                        <div className="text-helper">تم الرفع: {formatDateValue(doc.uploadedAt, true)}</div>
                      </div>
                      <StatusBadge status={doc.status} />
                    </div>

                    {isPending && (
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#B45309' }}>
                        ⏳ بانتظار قبولك{isRequired && !isVerified ? ' — مطلوب قبل توثيق الحساب' : ''}
                      </div>
                    )}
                    {doc.status === DocumentStatus.REJECTED && doc.rejectReason && (
                      <div style={{ fontSize: 13, color: 'var(--color-error)' }}>سبب الرفض: {doc.rejectReason}</div>
                    )}

                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="outline" style={{ flex: 1 }} disabled={!doc.fileUrl} onClick={() => window.open(doc.fileUrl, '_blank', 'noopener')}>معاينة المستند</Button>

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
                );
              })}
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
          <h3 style={{ marginBottom: 8 }}>مركبات الناقل</h3>
          <p className="text-helper" style={{ marginBottom: 16 }}>
            مستندات المركبات لا تمنع توثيق الحساب، لكن المركبة لا تظهر للاختيار حتى تُقبل بطاقة التشغيل والاستمارة.
          </p>
          {account.trucks && account.trucks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {account.trucks.map(truck => (
                <div key={truck.id} id={`truck-${truck.id}`} style={{
                  padding: 16, borderRadius: 8,
                  border: hash === `#truck-${truck.id}` ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }}>
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
                      const isPending = paper.status === DocumentStatus.PENDING && !!paper.fileUrl;
                      return (
                        <div key={field} style={{
                          padding: 12, borderRadius: 8,
                          border: isPending ? '2px dashed var(--color-warning)' : '1px dashed var(--color-border)',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <strong>{truckPaperLabel(field)}</strong>
                            <StatusBadge status={paper.status} />
                          </div>
                          {field === 'operatingCard' && paper.expiryDate && (
                            <div className="text-helper" style={{ marginBottom: 8 }}>ينتهي: {formatDateValue(paper.expiryDate)}</div>
                          )}
                          {!paper.fileUrl && (
                            <div className="text-helper" style={{ marginBottom: 8 }}>لم يُرفع بعد</div>
                          )}
                          {paper.status === DocumentStatus.REJECTED && paper.rejectReason && (
                            <div style={{ fontSize: 13, color: 'var(--color-error)', marginBottom: 8 }}>سبب الرفض: {paper.rejectReason}</div>
                          )}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Button variant="outline" size="sm" style={{ flex: 1 }} disabled={!paper.fileUrl} onClick={() => window.open(paper.fileUrl, '_blank', 'noopener')}>معاينة</Button>
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
