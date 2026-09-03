import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { getCargoTypes, createCargoType, updateCargoType, deleteCargoType } from '../../../admin/mock/masterData';
import { CARGO_CATEGORY } from '../../../admin/mock/constants';

export const CargoTypes = () => {
  const [cargoTypes, setCargoTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [typeName, setTypeName] = useState('');
  const [typeCategory, setTypeCategory] = useState(CARGO_CATEGORY.NORMAL);

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    setLoading(true);
    try {
      const data = await getCargoTypes();
      setCargoTypes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
    setTypeCategory(type.category);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!typeName.trim()) return;

    try {
      if (editingId) {
        await updateCargoType(editingId, typeName, typeCategory);
      } else {
        await createCargoType(typeName, typeCategory);
      }
      setShowForm(false);
      loadTypes();
    } catch (err) {
      alert('حدث خطأ');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف نوع البضاعة هذا؟')) return;
    try {
      await deleteCargoType(id);
      loadTypes();
    } catch (err) {
      alert('حدث خطأ');
    }
  };

  const categoryLabel = {
    [CARGO_CATEGORY.NORMAL]: 'بضائع عادية',
    [CARGO_CATEGORY.SPECIAL_CONDITIONS]: 'تتطلب ظروف خاصة',
    [CARGO_CATEGORY.HIGH_RISK]: 'عالية الخطورة'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>إدارة أنواع البضائع</h2>
        <Button variant="primary" onClick={handleOpenAdd}>+ إضافة نوع جديد</Button>
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
              <label style={{ fontSize: 14, fontWeight: 600 }}>الفئة (حسب اشتراطات النظام)</label>
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
                <option value={CARGO_CATEGORY.NORMAL}>بضائع عادية</option>
                <option value={CARGO_CATEGORY.SPECIAL_CONDITIONS}>تتطلب ظروف خاصة</option>
                <option value={CARGO_CATEGORY.HIGH_RISK}>عالية الخطورة</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <Button type="submit" variant="primary">حفظ</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center' }}>جاري التحميل...</div>
        ) : cargoTypes.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            لا توجد بيانات
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: 14 }}>
                  <th style={{ padding: '12px 16px', width: '120px' }}>المعرف</th>
                  <th style={{ padding: '12px 16px' }}>اسم النوع</th>
                  <th style={{ padding: '12px 16px' }}>الفئة</th>
                  <th style={{ padding: '12px 16px', width: '200px' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {cargoTypes.map(type => (
                  <tr key={type.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px', color: 'var(--color-text-muted)' }}>{type.id}</td>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{type.name}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: 4, 
                        fontSize: 13,
                        backgroundColor: type.category === CARGO_CATEGORY.NORMAL ? 'rgba(16, 185, 129, 0.1)' : 
                                         type.category === CARGO_CATEGORY.SPECIAL_CONDITIONS ? 'rgba(245, 158, 11, 0.1)' : 
                                         'rgba(239, 68, 68, 0.1)',
                        color: type.category === CARGO_CATEGORY.NORMAL ? 'var(--color-success)' : 
                               type.category === CARGO_CATEGORY.SPECIAL_CONDITIONS ? 'var(--color-warning)' : 
                               'var(--color-error)',
                      }}>
                        {categoryLabel[type.category]}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button variant="outline" onClick={() => handleOpenEdit(type)}>تعديل</Button>
                        <Button style={{ color: 'var(--color-error)' }} onClick={() => handleDelete(type.id)}>حذف</Button>
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
