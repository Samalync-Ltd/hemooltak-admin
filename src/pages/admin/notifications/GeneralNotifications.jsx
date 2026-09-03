import React, { useState } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';

export const GeneralNotifications = () => {
  const [recipient, setRecipient] = useState('ALL');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert('الرجاء إدخال عنوان ومحتوى الإشعار');
      return;
    }

    setLoading(true);
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 600));
      alert('تم إرسال الإشعار بنجاح (محاكاة)');
      setTitle('');
      setMessage('');
    } catch (err) {
      alert('حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ margin: 0 }}>الإشعارات العامة</h2>

      <Card style={{ maxWidth: 600 }}>
        <h3 style={{ marginBottom: 16 }}>إرسال إشعار جديد</h3>
        <p className="text-helper" style={{ marginBottom: 24 }}>
          سيظهر هذا الإشعار في مركز الإشعارات الخاص بالمستخدمين المحددين.
        </p>

        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 600 }}>المستلمون</label>
            <select 
              value={recipient} 
              onChange={(e) => setRecipient(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                fontFamily: 'inherit',
                fontSize: 15,
                backgroundColor: 'var(--color-surface)'
              }}
            >
              <option value="ALL">جميع المستخدمين</option>
              <option value="SHIPPERS">الشاحنين فقط</option>
              <option value="CARRIERS">الناقلين فقط</option>
            </select>
          </div>

          <Input 
            label="عنوان الإشعار"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="أدخل عنواناً واضحاً ومختصراً..."
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 600 }}>محتوى الإشعار</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                fontFamily: 'inherit',
                fontSize: 15,
                minHeight: 120,
                resize: 'vertical',
                backgroundColor: 'var(--color-surface)'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'جاري الإرسال...' : 'إرسال الإشعار'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
