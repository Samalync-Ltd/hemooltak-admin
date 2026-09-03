import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { getDashboardMetrics } from '../../admin/mock/auth';

export const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await getDashboardMetrics();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return <div style={{ padding: 24 }}>جاري التحميل...</div>;
  }

  if (!metrics) {
    return <div style={{ padding: 24, color: 'var(--color-error)' }}>حدث خطأ في تحميل البيانات</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ margin: 0 }}>نظرة عامة</h2>

      {/* Main Stats Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
        <Card>
          <div className="text-helper">إجمالي المستخدمين</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--color-primary)' }}>
            {metrics.users.total}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 13, color: 'var(--color-text-muted)' }}>
            <span>شاحن: {metrics.users.shippers}</span>
            <span>ناقل: {metrics.users.carriers}</span>
          </div>
        </Card>

        <Card>
          <div className="text-helper">شحنات نشطة حالياً</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--color-primary)' }}>
            {metrics.shipmentCounts.ACTIVE || 0}
          </div>
        </Card>

        <Card>
          <div className="text-helper">حسابات قيد المراجعة</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--color-warning)' }}>
            {metrics.pendingAccounts}
          </div>
        </Card>

        <Card>
          <div className="text-helper">إجمالي العمولات المحصلة</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--color-success)' }}>
            {metrics.totalCommission} ر.س
          </div>
        </Card>
      </div>

      {/* Shipments breakdown */}
      <Card>
        <h3 style={{ marginBottom: 16 }}>تفصيل حالات الشحنات</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div className="text-helper">بانتظار العروض</div>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>{metrics.shipmentCounts.AWAITING_OFFERS || 0}</div>
          </div>
          <div>
            <div className="text-helper">قيد التفاوض</div>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>{metrics.shipmentCounts.NEGOTIATING || 0}</div>
          </div>
          <div>
            <div className="text-helper">نشطة</div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: 'var(--color-primary)' }}>{metrics.shipmentCounts.ACTIVE || 0}</div>
          </div>
          <div>
            <div className="text-helper">مكتملة</div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: 'var(--color-success)' }}>{metrics.shipmentCounts.COMPLETED || 0}</div>
          </div>
          <div>
            <div className="text-helper">ملغاة</div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: 'var(--color-error)' }}>{metrics.shipmentCounts.CANCELLED || 0}</div>
          </div>
        </div>
      </Card>
    </div>
  );
};
