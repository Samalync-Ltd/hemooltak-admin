import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';
import styles from './Layout.module.css';

const AdminLayout = () => {
    return (<div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.main}>
        <AdminTopbar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>);
};
export default AdminLayout;
