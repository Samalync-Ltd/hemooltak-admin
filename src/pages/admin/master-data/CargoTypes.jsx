import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { getSavedCargoTypes, DEFAULT_CARGO_TYPES, saveCargoTypes, toArabicError, ENGLISH_NAME_FIELD, ENGLISH_NAMES_SAVING_ENABLED } from '../../../services/firebaseAdmin';
import { SkeletonRows } from '../../../components/common/Loader';

const CARGO_CATEGORY = { NORMAL: 'NORMAL', SPECIAL_CONDITIONS: 'SPECIAL_CONDITIONS', HIGH_RISK: 'HIGH_RISK' };

const categoryLabel = {
  [CARGO_CATEGORY.NORMAL]: 'بضائع عادية',
  [CARGO_CATEGORY.SPECIAL_CONDITIONS]: 'تتطلب ظروف خاصة',
  [CARGO_CATEGORY.HIGH_RISK]: 'عالية الخطورة'
};

const categoryColors = {
  [CARGO_CATEGORY.NORMAL]: { bg: 'rgba(16, 185, 129, 0.1)', fg: 'var(--color-success)' },
  [CARGO_CATEGORY.SPECIAL_CONDITIONS]: { bg: 'rgba(245, 158, 11, 0.1)', fg: 'var(--color-warning)' },
  [CARGO_CATEGORY.HIGH_RISK]: { bg: 'rgba(239, 68, 68, 0.1)', fg: 'var(--color-error)' },
};

const newId = () => `c${Date.now().toString(36)}`;

/**
 * The list shippers pick from when posting a shipment, stored in
 * config/cargoTypes (admin-writable, readable by every signed-in user).
 * createShipment accepts only an id from this list, and copies the type's
 * name onto the shipment — so removing or renaming a type here never changes
 * existing shipments, it only changes what new ones can pick
 * (INTEGRATION.md §9). The English name is what the website shows in English.
 */
export const CargoTypes = () => {
  const [cargoTypes, setCargoTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [typeName, setTypeName] = useState('');
  const [typeNameEn, setTypeNameEn] = useState('');
  // false while config/cargoTypes has never been saved: the backend then
  // refuses every new shipment (PLATFORM_NOT_CONFIGURED).
  const [isSaved, setIsSaved] = useState(true);
  const [typeCategory, setTypeCategory] = useState(CARGO_CATEGORY.NORMAL);

  const loadTypes = async () => {
    setLoading(true);
    setError('');
    try {
      const saved = await getSavedCargoTypes();
      setIsSaved(saved !== null);
      setCargoTypes(saved ?? DEFAULT_CARGO_TYPES);
    } catch (err) {
      console.error(err);
      setError(toArabicError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTypes(); }, []);

  const persist = async (next) => {
    setSaving(true);
    try {
      await saveCargoTypes(next);
      setCargoTypes(next);
      setIsSaved(true);
      return true;
    } catch (err) {
      alert(toArabicError(err));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setTypeName('');
    setTypeNameEn('');
    setTypeCategory(CARGO_CATEGORY.NORMAL);
    setShowForm(true);
  };

  const handleOpenEdit = (type) => {
    setEditingId(type.id);
    setTypeName(type.name);
    setTypeNameEn(type[ENGLISH_NAME_FIELD] || '');
    setTypeCategory(type.category || CARGO_CATEGORY.NORMAL);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const name = typeName.trim();
    const nameEn = typeNameEn.trim();
    if (!name) return;
    if (cargoTypes.some(t => t.name === name && t.id !== editingId)) {
      alert('هذا النوع موجود مسبقاً');
      return;
    }
    // Only types in this list can be posted (the backend refuses anything
    // else), so «أخرى» is added here like any other type if it is wanted.
    const withEnglish = (type) => {
      const { [ENGLISH_NAME_FIELD]: _previous, ...rest } = type;
      return nameEn ? { ...rest, [ENGLISH_NAME_FIELD]: nameEn } : rest;
    };
    const next = editingId
      ? cargoTypes.map(t => (t.id === editingId ? withEnglish({ ...t, name, category: typeCategory }) : t))
      : [...cargoTypes, withEnglish({ id: newId(), name, category: typeCategory })];
    if (await persist(next)) setShowForm(false);
  };

  // Switched off (active: false) = no longer offered for new shipments; the
  // type stays in the list and existing shipments keep it. A type without
  // the field counts as on. (The backend doesn't check this yet — the website
  // hides switched-off types from the shipment form.)
  const handleToggle = async (type) => {
    const isActive = type.active !== false;
    if (isActive && !window.confirm(`إيقاف "${type.name}" يخفيه من خيارات الشحنات الجديدة. الشحنات الحالية لا تتأثر. متابعة؟`)) return;
    await persist(cargoTypes.map(t => {
      if (t.id !== type.id) return t;
      const { active: _active, ...rest } = t;
      return isActive ? { ...rest, active: false } : rest;
    }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف نوع البضاعة هذا؟ الشحنات الحالية لن تتأثر.')) return;
    await persist(cargoTypes.filter(t => t.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>إدارة أنواع البضائع</h2>
        <Button variant="primary" onClick={handleOpenAdd} isLoading={saving}>+ إضافة نوع جديد</Button>
      </div>

      {!loading && !isSaved && (
        <div role="alert" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '14px 18px', borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid var(--color-error)', color: 'var(--color-error)' }}>
          <span style={{ fontWeight: 600 }}>قائمة أنواع البضائع لم تُحفظ بعد — لا يمكن للشاحنين نشر أي شحنة حتى تُحفظ. الأنواع أدناه مقترحة فقط.</span>
          <Button variant="primary" isLoading={saving} onClick={() => persist(cargoTypes)}>حفظ القائمة الآن</Button>
        </div>
      )}

      {showForm && (
        <Card>
          <h3 style={{ marginBottom: 16 }}>{editingId ? 'تعديل نوع البضاعة' : 'إضافة نوع بضاعة'}</h3>
          <form onSubmit={handleSave} style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Input
                label="الاسم"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                placeholder="مثال: إلكترونيات، مواد غذائية..."
              />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Input
                label="الاسم بالإنجليزية (English name)"
                value={typeNameEn}
                onChange={(e) => setTypeNameEn(e.target.value)}
                placeholder="e.g. Electronics"
                dir="ltr"
                style={{ textAlign: 'left' }}
                disabled={!ENGLISH_NAMES_SAVING_ENABLED}
              />
              {!ENGLISH_NAMES_SAVING_ENABLED && <div className="text-helper" style={{ fontSize: 12, marginTop: -8 }}>يُفعّل حفظ الاسم الإنجليزي بعد تأكيد نشر تحديث الخادم.</div>}
            </div>
            <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: 600 }}>الفئة</label>
              <select
                value={typeCategory}
                onChange={(e) => setTypeCategory(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  fontFamily: 'inherit',
                  fontSize: 15,
                  backgroundColor: 'var(--color-surface)'
                }}
              >
                {Object.values(CARGO_CATEGORY).map(c => <option key={c} value={c}>{categoryLabel[c]}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <Button type="submit" variant="primary" isLoading={saving}>{saving ? 'جاري الحفظ' : 'حفظ'}</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <SkeletonRows rows={5} columns={5} label="جاري تحميل أنواع البضائع" />
        ) : error ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-error)' }}>{error}</div>
        ) : cargoTypes.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            لا توجد أنواع — لن يتمكن الشاحنون من نشر أي شحنة حتى تُضاف الأنواع
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: 14 }}>
                  <th style={{ padding: '12px 16px' }}>اسم النوع</th>
                  <th style={{ padding: '12px 16px' }}>الاسم بالإنجليزية</th>
                  <th style={{ padding: '12px 16px' }}>الفئة</th>
                  <th style={{ padding: '12px 16px' }}>الحالة</th>
                  <th style={{ padding: '12px 16px', width: '260px' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {cargoTypes.map(type => {
                  const colors = categoryColors[type.category] || categoryColors[CARGO_CATEGORY.NORMAL];
                  return (
                    <tr key={type.id} style={{ borderBottom: '1px solid var(--color-border)', opacity: type.active === false ? 0.6 : 1 }}>
                      <td style={{ padding: '16px', fontWeight: 600 }}>{type.name}</td>
                      <td style={{ padding: '16px' }} dir="ltr">
                        {type[ENGLISH_NAME_FIELD] || <span className="text-helper">—</span>}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 13, backgroundColor: colors.bg, color: colors.fg }}>
                          {categoryLabel[type.category] || categoryLabel[CARGO_CATEGORY.NORMAL]}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        {type.active === false
                          ? <span style={{ color: 'var(--color-text-muted)' }}>موقوف</span>
                          : <span style={{ color: 'var(--color-success)' }}>مفعّل</span>}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button variant="outline" onClick={() => handleOpenEdit(type)} isLoading={saving}>تعديل</Button>
                          <Button variant="outline" onClick={() => handleToggle(type)} isLoading={saving}>{type.active === false ? 'تفعيل' : 'إيقاف'}</Button>
                          <Button style={{ color: 'var(--color-error)' }} onClick={() => handleDelete(type.id)} isLoading={saving}>حذف</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
