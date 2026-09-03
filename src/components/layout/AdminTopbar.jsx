import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import styles from './Layout.module.css';
import { getAdminSession, adminLogout } from '../../admin/mock/auth';
import { useNavigate } from 'react-router-dom';

export const AdminTopbar = ({ onMenuClick }) => {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setSession(getAdminSession());
  }, []);

  const handleLogout = async () => {
    await adminLogout();
    navigate('/admin/login');
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarLeft}>
        <button type="button" className={styles.menuButton} onClick={onMenuClick} aria-label="فتح القائمة">
          <Menu size={22} />
        </button>
        <span style={{ fontWeight: 600, fontSize: 18, color: 'var(--color-primary)' }}>بوابة الإدارة المركزية</span>
      </div>

      <div className={styles.topbarRight}>
        {session && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className={styles.userInfo}>
              <div className={styles.avatar} style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                {session.name.substring(0, 1)}
              </div>
              <div className={styles.userText}>
                <span className={styles.userName}>{session.name}</span>
                <span className={styles.userRole}>مدير النظام</span>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              style={{
                color: 'var(--color-error)',
                fontWeight: 600,
                padding: '8px 16px',
                borderRadius: 8,
                backgroundColor: 'rgba(239, 68, 68, 0.1)'
              }}
            >
              تسجيل الخروج
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
