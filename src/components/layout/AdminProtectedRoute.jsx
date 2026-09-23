import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { subscribeToAdminSession } from '../../services/firebaseAdmin';

export const AdminProtectedRoute = () => {
  // Firebase's auth state isn't known synchronously on a fresh page load —
  // it resolves once via onAuthStateChanged, so this starts in an explicit
  // "checking" state rather than assuming logged-out and flashing a
  // redirect before the real session is known.
  const [session, setSession] = useState(undefined);

  useEffect(() => subscribeToAdminSession(setSession), []);

  if (session === undefined) {
    return <div style={{ padding: 24 }}>جاري التحقق من الجلسة...</div>;
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};
