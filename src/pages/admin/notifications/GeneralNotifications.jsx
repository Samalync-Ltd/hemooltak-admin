import React, { useState } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { sendBroadcast, toArabicError } from '../../../services/firebaseAdmin';

export const GeneralNotifications = () => {
  const [recipient, setRecipient] = useState('ALL');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null); // { type: 'success' | 'error', text }

  const handleSend = async (e) => {
    e.preventDefault();
    setNotice(null);
    if (!title.trim() || !message.trim()) {
      setNotice({ type: 'error', text: 'الرجاء إدخال عنوان ومحتوى الإشعار' });
      return;
    }

    setLoading(true);
    try {
      const { recipients } = await sendBroadcast({ title: title.trim(), body: message.trim(), audience: recipient });
      setNotice({
        type: 'success',
        text: recipients > 0 ? `تم إرسال الإشعار إلى ${recipients} مستخدم` : 'لم يُرسل الإشعار — لا يوجد مستخدمون في هذه الفئة بعد',
      });
      setTitle('');
      setMessage('');
    } catch (err) {
      // The backend refuses broadcasts that look like they carry contact or
      // location details (they show on lock screens) — say so in Arabic.
      setNotice({
        type: 'error',
        text: err?.code === 'functions/invalid-argument'
          ? 'لم يُرسل الإشعار — تأكد من عدم وجود أرقام جوال أو عناوين أو مواقع في العنوان أو المحتوى.'
          : toArabicError(err),
      });
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
          سيظهر هذا الإشعار في مركز الإشعارات الخاص بالمستخدمين المحددين، وقد يظهر على شاشة القفل في أجهزتهم — لا تكتب فيه أرقام جوال أو عناوين أو مواقع.
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
              <option value="SHIPPER">الشاحنين فقط</option>
              <option value="CARRIER">الناقلين فقط</option>
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

          {notice && (
            <div role={notice.type === 'error' ? 'alert' : 'status'} style={{ color: notice.type === 'error' ? 'var(--color-error)' : 'var(--color-success)', fontSize: 14 }}>
              {notice.text}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button type="submit" variant="primary" isLoading={loading}>
              {loading ? 'جاري الإرسال' : 'إرسال الإشعار'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
