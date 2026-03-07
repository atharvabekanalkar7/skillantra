'use client';
import { useEffect, useState } from 'react';
import {
    Bell, CheckCircle2, XCircle, FileText, Briefcase, Award, Users,
    Check, Loader2
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string | null;
    is_read: boolean;
    created_at: string;
    metadata: Record<string, any>;
}

const TYPE_ICONS: Record<string, { icon: any; bg: string; text: string }> = {
    new_application: { icon: Users, bg: 'bg-blue-50', text: 'text-blue-600' },
    application_accepted: { icon: CheckCircle2, bg: 'bg-green-50', text: 'text-green-600' },
    application_rejected: { icon: XCircle, bg: 'bg-red-50', text: 'text-red-600' },
    offer_letter_ready: { icon: Award, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    upload_offer_letter_reminder: { icon: FileText, bg: 'bg-amber-50', text: 'text-amber-600' },
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { isDemo, setShowDemoModal } = require('@/lib/utils/useDemoGuard').useDemoGuard();
  require('react').useEffect(() => { if(isDemo) setShowDemoModal(true); }, [isDemo]);

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [markingRead, setMarkingRead] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => { loadNotifications(); }, []);

    async function loadNotifications() {
        setLoading(true);
        try {
            const res = await fetch('/api/notifications');
            const json = await res.json();
            if (res.ok) {
                setNotifications(json.data || []);
                setUnreadCount(json.unread_count || 0);
            }
        } catch { } finally {
            setLoading(false);
        }
    }

    async function markAllRead() {
        setMarkingRead(true);
        try {
            const res = await fetch('/api/notifications/mark-read', { method: 'PATCH' });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
            }
        } catch { } finally {
            setMarkingRead(false);
        }
    }

    function timeAgo(date: string): string {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    }

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-6 h-6 text-[var(--color-text-muted)] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-secondary)]">
            <div className="bg-[var(--color-bg-elevated)] border-b border-[var(--color-border)]0">
                <div className="max-w-2xl mx-auto px-4 py-5 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                            <Bell className="w-6 h-6 text-blue-600" /> Notifications
                        </h1>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            disabled={markingRead}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                        >
                            <Check className="w-3.5 h-3.5" /> {markingRead ? 'Marking...' : 'Mark all read'}
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-4 space-y-2">
                {notifications.length === 0 ? (
                    <div className="text-center py-20">
                        <Bell className="w-12 h-12 text-[var(--color-text-secondary)] mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">No notifications yet</h3>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">You&apos;ll be notified about your applications and internships here</p>
                    </div>
                ) : (
                    notifications.map(notif => {
                        const typeInfo = TYPE_ICONS[notif.type] || { icon: Bell, bg: 'bg-[var(--color-bg-secondary)]', text: 'text-[var(--color-text-secondary)]' };
                        const Icon = typeInfo.icon;

                        return (
                            <div
                                key={notif.id}
                                className={`flex gap-3 p-4 rounded-xl border transition-colors ${notif.is_read
                                    ? 'bg-[var(--color-bg-elevated)] border-[var(--color-border)]0'
                                    : 'bg-blue-50/30 border-blue-100'
                                    }`}
                            >
                                <div className={`w-9 h-9 rounded-lg ${typeInfo.bg} flex items-center justify-center flex-shrink-0`}>
                                    <Icon className={`w-4 h-4 ${typeInfo.text}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={`text-sm ${notif.is_read ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-primary)] font-medium'}`}>
                                            {notif.title}
                                        </p>
                                        <span className="text-[11px] text-[var(--color-text-muted)] flex-shrink-0">{timeAgo(notif.created_at)}</span>
                                    </div>
                                    {notif.body && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{notif.body}</p>}
                                    {!notif.is_read && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
