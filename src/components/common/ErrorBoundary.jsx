import React from 'react';
import { Button } from './Button';

/**
 * Without this, any render error unmounts the whole app and the admin is
 * left staring at a blank white page with no way back. This keeps the
 * sidebar/topbar alive and shows what happened in Arabic instead.
 * AdminLayout keys it on the route, so navigating away clears the error.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Admin page crashed:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <h3 style={{ margin: 0 }}>تعذّر عرض هذه الصفحة</h3>
        <p className="text-helper" style={{ margin: 0, maxWidth: 420 }}>
          حدث خطأ أثناء عرض البيانات. لم يتأثر أي إجراء قمت به — حدّث الصفحة للمحاولة مرة أخرى.
        </p>
        <Button onClick={() => window.location.reload()}>تحديث الصفحة</Button>
      </div>
    );
  }
}
