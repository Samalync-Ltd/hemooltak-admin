import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { getCargoTypes, saveCargoTypes } from '../../../services/firebaseAdmin';

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
 * The backend stores `cargoType` as free text, so removing a type here
 * never breaks existing shipments — it only stops it being offered.
 */
export const CargoTypes = () => {
  const [cargoTypes, setCargoTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [typeName, setTypeName] = useState('');
  const [typeCategory, setTypeCategory] = useState(CARGO_CATEGORY.NORMAL);

  const loadTypes = async () => {
    setLoading(true);
    setError('');
    try {
      setCargoTypes(await getCargoTypes());
    } catch (err) {
      console.error(err);
      setError(err.message || 'تعذر تحميل أنواع البضائع');
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
      return true;
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء الحفظ');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setTypeName('');
    setTypeCategory(CARGO_CATEGORY.NORMAL);
    setShowForm(true);
  };

  const handleOpenEdit = (type) => {
    setEditingId(type.id);
    setTypeName(type.name);
    setTypeCategory(type.category || CARGO_CATEGORY.NORMAL);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const name = typeName.trim();
    if (!name) return;
    if (name === 'أخرى') {
      alert('"أخرى" خيار ثابت يظهر دائماً للشاحن ولا يحتاج إلى إضافة');
      return;
    }
    if (cargoTypes.some(t => t.name === name && t.id !== editingId)) {
      alert('هذا النوع موجود مسبقاً');
      return;
    }
    const next = editingId
      ? cargoTypes.map(t => (t.id === editingId ? { ...t, name, category: typeCategory } : t))
      : [...cargoTypes, { id: newId(), name, category: typeCategory }];
    if (await persist(next)) setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف نوع البضاعة هذا؟ الشحنات الحالية لن تتأثر.')) return;
    await persist(cargoTypes.filter(t => t.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>إدارة أنواع البضائع</h2>
        <Button variant="primary" onClick={handleOpenAdd} disabled={saving}>+ إضافة نوع جديد</Button>
      </div>

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
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center' }}>جاري التحميل...</div>
        ) : error ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-error)' }}>{error}</div>
        ) : cargoTypes.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            لا توجد أنواع — سيظهر للشاحن خيار "أخرى" فقط
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: 14 }}>
                  <th style={{ padding: '12px 16px' }}>اسم النوع</th>
                  <th style={{ padding: '12px 16px' }}>الفئة</th>
                  <th style={{ padding: '12px 16px', width: '200px' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {cargoTypes.map(type => {
                  const colors = categoryColors[type.category] || categoryColors[CARGO_CATEGORY.NORMAL];
                  return (
                    <tr key={type.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '16px', fontWeight: 600 }}>{type.name}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 13, backgroundColor: colors.bg, color: colors.fg }}>
                          {categoryLabel[type.category] || categoryLabel[CARGO_CATEGORY.NORMAL]}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button variant="outline" onClick={() => handleOpenEdit(type)} disabled={saving}>تعديل</Button>
                          <Button style={{ color: 'var(--color-error)' }} onClick={() => handleDelete(type.id)} disabled={saving}>حذف</Button>
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
