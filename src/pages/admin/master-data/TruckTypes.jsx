import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { getTruckTypes, createTruckType, updateTruckType, deleteTruckType } from '../../../admin/mock/masterData';

export const TruckTypes = () => {
  const [truckTypes, setTruckTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [typeName, setTypeName] = useState('');

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    setLoading(true);
    try {
      const data = await getTruckTypes();
      setTruckTypes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setTypeName('');
    setShowForm(true);
  };

  const handleOpenEdit = (type) => {
    setEditingId(type.id);
    setTypeName(type.name);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!typeName.trim()) return;

    try {
      if (editingId) {
        await updateTruckType(editingId, typeName);
      } else {
        await createTruckType(typeName);
      }
      setShowForm(false);
      loadTypes();
    } catch (err) {
      alert('حدث خطأ');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف نوع الشاحنة هذا؟')) return;
    try {
      await deleteTruckType(id);
      loadTypes();
    } catch (err) {
      alert('حدث خطأ');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>إدارة أنواع الشاحنات</h2>
        <Button variant="primary" onClick={handleOpenAdd}>+ إضافة نوع جديد</Button>
      </div>

      {showForm && (
        <Card>
          <h3 style={{ marginBottom: 16 }}>{editingId ? 'تعديل نوع الشاحنة' : 'إضافة نوع شاحنة'}</h3>
          <form onSubmit={handleSave} style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input 
                label="الاسم"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                placeholder="مثال: دينا، تريلا، مبرد..."
              />
            </div>
            <Button type="submit" variant="primary">حفظ</Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center' }}>جاري التحميل...</div>
        ) : truckTypes.length === 0 ? (
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
                  <th style={{ padding: '12px 16px', width: '200px' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {truckTypes.map(type => (
                  <tr key={type.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px', color: 'var(--color-text-muted)' }}>{type.id}</td>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{type.name}</td>
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
