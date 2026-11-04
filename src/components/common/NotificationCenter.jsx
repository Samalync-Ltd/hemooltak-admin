import React, { useState, useEffect, useRef } from 'react';
import { Bell, UserCheck, Truck, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { subscribeToAdminInbox } from '../../services/firebaseAdmin';

const formatDate = (date) => (date ? date.toLocaleDateString('ar-SA') : '');

/**
 * Header bell: a live count of everything waiting on an admin — accounts
 * under review, truck papers pending, withdrawal requests pending — read
 * straight from Firestore (see subscribeToAdminInbox). Items disappear on
 * their own once handled; there is no separate "read" state to manage.
 */
export const NotificationCenter = () => {
    const [inbox, setInbox] = useState(null); // null until the first snapshot
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => subscribeToAdminInbox(setInbox), []);

    useEffect(() => {
        if (!isOpen) return undefined;
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        };
        const handleEscape = (event) => { if (event.key === 'Escape') setIsOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const sections = inbox ? [
        {
            key: 'accounts',
            title: 'حسابات قيد المراجعة',
            icon: UserCheck,
            items: inbox.accounts.map((a) => ({
                id: a.id,
                primary: a.name,
                secondary: `${a.role === 'CARRIER' ? 'ناقل' : 'شاحن'}${a.date ? ` — سجّل ${formatDate(a.date)}` : ''}`,
                to: `/admin/accounts/${a.id}`,
            })),
        },
        {
            key: 'trucks',
            title: 'مستندات مركبات بانتظار المراجعة',
            icon: Truck,
            items: inbox.trucks.map((t) => ({
                id: `${t.carrierId}/${t.id}`,
                primary: `${t.label}${t.plateNumber ? ` — لوحة ${t.plateNumber}` : ''}`,
                secondary: `${t.carrierName} — ${t.pendingCount === 2 ? 'مستندان' : 'مستند واحد'} بانتظار القبول`,
                to: `/admin/accounts/${t.carrierId}#truck-${t.id}`,
            })),
        },
        {
            key: 'withdrawals',
            title: 'طلبات سحب معلقة',
            icon: Wallet,
            items: inbox.withdrawals.map((w) => ({
                id: w.id,
                primary: `${w.amount} ر.س — ${w.carrierName}`,
                secondary: w.date ? `طُلب ${formatDate(w.date)}` : '',
                to: `/admin/commissions?withdrawal=${w.id}`,
            })),
        },
    ] : [];

    const total = sections.reduce((sum, s) => sum + s.items.length, 0);

    const open = (to) => {
        setIsOpen(false);
        navigate(to);
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={total > 0 ? `الإشعارات: ${total} بانتظار المراجعة` : 'الإشعارات'}
                aria-expanded={isOpen}
                style={{ color: 'var(--color-text-muted)', cursor: 'pointer', background: 'none', border: 'none', position: 'relative', padding: 6, display: 'flex' }}
            >
                <Bell size={24} />
                {total > 0 && (
                    <span style={{
                        position: 'absolute', top: 0, right: 0,
                        backgroundColor: 'var(--color-error)', color: 'white',
                        fontSize: 11, fontWeight: 'bold', borderRadius: 999,
                        minWidth: 18, height: 18, padding: '0 4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid var(--color-surface)',
                    }}>
                        {total > 99 ? '99+' : total}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: 8,
                    width: 'min(360px, calc(100vw - 32px))',
                    backgroundColor: 'var(--color-surface)', borderRadius: 8,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid var(--color-border)',
                    zIndex: 1000, overflow: 'hidden',
                }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: 16 }}>بانتظار المراجعة</h3>
                        <span className="text-helper">{inbox ? `${total} طلب` : ''}</span>
                    </div>

                    <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                        {!inbox ? (
                            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>جاري التحميل...</div>
                        ) : total === 0 ? (
                            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>لا يوجد شيء بانتظار المراجعة ✓</div>
                        ) : (
                            sections.filter((s) => s.items.length > 0).map(({ key, title, icon: Icon, items }) => (
                                <div key={key}>
                                    <div style={{ padding: '10px 16px 6px', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Icon size={14} />
                                        {title} ({items.length})
                                    </div>
                                    {items.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => open(item.to)}
                                            style={{
                                                display: 'block', width: '100%', textAlign: 'start',
                                                padding: '10px 16px', background: 'none', border: 'none',
                                                borderBottom: '1px solid var(--color-border)', cursor: 'pointer',
                                            }}
                                        >
                                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{item.primary}</div>
                                            {item.secondary && <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{item.secondary}</div>}
                                        </button>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
