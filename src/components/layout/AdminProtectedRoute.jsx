import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAdminSession } from '../../admin/mock/auth';

export const AdminProtectedRoute = () => {
  const session = getAdminSession();
  
  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <Outlet />;
};
