import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { getTruckTypes, saveTruckTypes } from '../../../services/firebaseAdmin';

/**
 * The backend accepts exactly seven truck types (INTEGRATION.md §1) and
 * rejects anything else, so types cannot be added or deleted here. What the
 * admin controls — stored in config/truckTypes — is the Arabic label shown
 * to users and whether shippers may pick the type for a NEW shipment.
 */
export const TruckTypes = () => {
  const [truckTypes, setTruckTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCode, setEditingCode] = useState(null);
  const [labelDraft, setLabelDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const loadTypes = async () => {
    setLoading(true);
    setError('');
    try {
      setTruckTypes(await getTruckTypes());
    } catch (err) {
      console.error(err);
      setError(err.message || 'تعذر تحميل أنواع الشاحنات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTypes(); }, []);

  const persist = async (next) => {
    setSaving(true);
    try {
      await saveTruckTypes(next);
      setTruckTypes(next);
      return true;
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء الحفظ');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (type) => {
    setEditingCode(type.code);
    setLabelDraft(type.label);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!labelDraft.trim()) return;
    const next = truckTypes.map(t => (t.code === editingCode ? { ...t, label: labelDraft.trim() } : t));
    if (await persist(next)) setEditingCode(null);
  };

  const handleToggle = async (type) => {
    if (type.active && !window.confirm(`إيقاف "${type.label}" يمنع الشاحنين من اختياره في الشحنات الجديدة. الشحنات الحالية والشاحنات المسجلة لا تتأثر. متابعة؟`)) return;
    await persist(truckTypes.map(t => (t.code === type.code ? { ...t, active: !t.active } : t)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>إدارة أنواع الشاحنات</h2>
      </div>

      <Card>
        <p className="text-helper" style={{ margin: 0, lineHeight: 1.8 }}>
          أنواع الشاحنات ثابتة في النظام ويتحقق منها الخادم عند إنشاء الشحنات وتقديم العروض، لذلك لا يمكن إضافة نوع جديد أو حذفه.
          يمكنك تعديل الاسم الظاهر للمستخدمين، وإيقاف النوع ليختفي من خيارات الشحنات الجديدة.
        </p>
      </Card>

      {editingCode && (
        <Card>
          <h3 style={{ marginBottom: 16 }}>تعديل اسم النوع ({editingCode})</h3>
          <form onSubmit={handleSave} style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input label="الاسم الظاهر" value={labelDraft} onChange={(e) => setLabelDraft(e.target.value)} />
            </div>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</Button>
            <Button type="button" variant="outline" onClick={() => setEditingCode(null)}>إلغاء</Button>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center' }}>جاري التحميل...</div>
        ) : error ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-error)' }}>{error}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: 14 }}>
                  <th style={{ padding: '12px 16px', width: '160px' }}>الرمز</th>
                  <th style={{ padding: '12px 16px' }}>الاسم الظاهر</th>
                  <th style={{ padding: '12px 16px' }}>الحالة</th>
                  <th style={{ padding: '12px 16px', width: '220px' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {truckTypes.map(type => (
                  <tr key={type.code} style={{ borderBottom: '1px solid var(--color-border)', opacity: type.active ? 1 : 0.6 }}>
                    <td style={{ padding: '16px', color: 'var(--color-text-muted)' }} dir="ltr">{type.code}</td>
                    <td style={{ padding: '16px', fontWeight: 600 }}>
                      {type.label}
                      {type.label !== type.defaultLabel && <span className="text-helper" style={{ fontWeight: 400 }}> (الافتراضي: {type.defaultLabel})</span>}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {type.active
                        ? <span style={{ color: 'var(--color-success)' }}>مفعّل</span>
                        : <span style={{ color: 'var(--color-text-muted)' }}>موقوف</span>}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button variant="outline" onClick={() => handleOpenEdit(type)} disabled={saving}>تعديل</Button>
                        <Button variant="outline" onClick={() => handleToggle(type)} disabled={saving}>
                          {type.active ? 'إيقاف' : 'تفعيل'}
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
