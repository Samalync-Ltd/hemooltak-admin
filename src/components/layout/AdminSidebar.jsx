import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  FileText, 
  Package, 
  Truck, 
  DollarSign, 
  ShieldAlert, 
  Database,
  Bell,
  Globe
} from 'lucide-react';
import styles from './Layout.module.css';

export const AdminSidebar = () => {
  const navItems = [
    { label: 'نظرة عامة', path: '/admin', icon: <Home size={20}/> },
    { label: 'الحسابات والمستندات', path: '/admin/accounts', icon: <Users size={20}/> },
    { label: 'الشحنات', path: '/admin/shipments', icon: <Package size={20}/> },
    { label: 'الرحلات النشطة', path: '/admin/trips', icon: <Truck size={20}/> },
    { label: 'العمولات والمدفوعات', path: '/admin/commissions', icon: <DollarSign size={20}/> },
    { label: 'مساءلة الناقلين', path: '/admin/carriers/accountability', icon: <ShieldAlert size={20}/> },
    { label: 'أنواع الشاحنات', path: '/admin/master-data/truck-types', icon: <Database size={20}/> },
    { label: 'أنواع البضائع', path: '/admin/master-data/cargo-types', icon: <Database size={20}/> },
    { label: 'الإشعارات العامة', path: '/admin/notifications', icon: <Bell size={20}/> },
    { label: 'محتوى المنصة', path: '/admin/content', icon: <Globe size={20}/> },
  ];

  return (
    <aside className={styles.sidebar} style={{ backgroundColor: '#0A192F', overflowY: 'auto' }}>
      <div className={styles.brand}>
        <img src="/logos/1.png" alt="Hemola Logo" style={{ width: 48, height: 48, borderRadius: "5px", objectFit: 'contain', background: 'transparent' }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: 'white', lineHeight: 1, marginBottom: 4 }}>حمولة</span>
          <span style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.7)' }}>لوحة التحكم</span>
        </div>
      </div>

      <nav className={styles.nav} style={{ marginTop: 24, paddingBottom: 24 }}>
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            end={item.path === '/admin'} 
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
