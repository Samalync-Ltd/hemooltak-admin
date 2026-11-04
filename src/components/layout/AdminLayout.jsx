import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';
import styles from './Layout.module.css';

const AdminLayout = () => {
    const { pathname } = useLocation();
    return (<div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.main}>
        <AdminTopbar />
        <main className={styles.content}>
          <ErrorBoundary key={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>);
};
export default AdminLayout;
