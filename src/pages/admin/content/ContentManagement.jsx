import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { mockData } from '../../../admin/mock/data';

// Basic mock service simulation for content
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));
const getContent = async () => {
  await delay();
  return { ...mockData.content };
};
const updateContent = async (key, value) => {
  await delay();
  mockData.content[key] = value;
  return value;
};

export const ContentManagement = () => {
  const [content, setContent] = useState({ aboutUs: '', terms: '' });
  const [loading, setLoading] = useState(true);
  const [savingField, setSavingField] = useState(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const data = await getContent();
      setContent(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (field) => {
    setSavingField(field);
    try {
      await updateContent(field, content[field]);
      alert('تم حفظ المحتوى بنجاح');
    } catch (err) {
      alert('حدث خطأ');
    } finally {
      setSavingField(null);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>جاري التحميل...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>إدارة محتوى المنصة</h2>
      </div>

      <div className="responsive-two-col-even">
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>من نحن (About Us)</h3>
            <Button 
              variant="primary" 
              onClick={() => handleSave('aboutUs')}
              disabled={savingField === 'aboutUs'}
            >
              {savingField === 'aboutUs' ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </Button>
          </div>
          <textarea 
            value={content.aboutUs}
            onChange={(e) => setContent(prev => ({ ...prev, aboutUs: e.target.value }))}
            style={{
              width: '100%',
              minHeight: 250,
              padding: 12,
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              fontFamily: 'inherit',
              fontSize: 15,
              resize: 'vertical'
            }}
          />
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>الشروط والأحكام</h3>
            <Button 
              variant="primary" 
              onClick={() => handleSave('terms')}
              disabled={savingField === 'terms'}
            >
              {savingField === 'terms' ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </Button>
          </div>
          <textarea 
            value={content.terms}
            onChange={(e) => setContent(prev => ({ ...prev, terms: e.target.value }))}
            style={{
              width: '100%',
              minHeight: 250,
              padding: 12,
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              fontFamily: 'inherit',
              fontSize: 15,
              resize: 'vertical'
            }}
          />
        </Card>
      </div>
    </div>
  );
};
