'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string | null;
    is_read: boolean;
    created_at: string;
    metadata?: any;
}

export default function NotificationBell({ isDemo = false }: { isDemo?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (isDemo) return;

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [isDemo]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (e) {
            console.error('Failed to fetch notifications', e);
        }
    };

    const markAllRead = async () => {
        if (isDemo || unreadCount === 0) return;

        try {
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            await fetch('/api/notifications/mark-read', { method: 'PATCH' });
        } catch (e) {
            console.error('Failed to mark notifications as read', e);
        }
    };

    const handleToggle = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        if (newState) {
            markAllRead();
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className="relative p-2 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors focus:outline-none"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overscroll-contain">
                    <div className="sticky top-0 bg-slate-900/95 backdrop-blur px-4 py-3 border-b border-slate-800 flex justify-between items-center z-10">
                        <h3 className="font-semibold text-slate-100">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs text-indigo-400 cursor-pointer hover:text-indigo-300" onClick={markAllRead}>
                                Mark all read
                            </span>
                        )}
                    </div>

                    <div className="divide-y divide-slate-800">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-slate-500 text-sm">
                                No notifications yet.
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`p-4 transition-colors hover:bg-slate-800/50 ${!n.is_read ? 'bg-slate-800/20' : ''}`}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <h4 className={`text-sm tracking-tight leading-snug ${!n.is_read ? 'font-semibold text-slate-100' : 'font-medium text-slate-300'}`}>
                                            {n.title}
                                        </h4>
                                        {!n.is_read && <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1"></div>}
                                    </div>
                                    {n.body && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.body}</p>}
                                    <p className="text-[10px] text-slate-500 mt-2 font-medium">{formatTimeAgo(n.created_at)}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
