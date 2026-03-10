'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ConnectionButtonProps {
    profileId: string;
}

export default function ConnectionButton({ profileId }: ConnectionButtonProps) {
    const [statusData, setStatusData] = useState<{ status: string; ignored_at?: string; conversationId?: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch(`/api/connections?profileId=${profileId}`);
                const data = await res.json();
                setStatusData(data);
            } catch (err) {
                console.error('Failed to fetch connection status');
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, [profileId]);

    const handleConnect = async () => {
        setActionLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/connections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: profileId })
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 429) {
                    setError(data.error); // 24h cooldown message directly from API
                } else {
                    setError(data.error || 'Failed to send request');
                }
            } else {
                setStatusData({ status: 'pending_sent', conversationId: data.conversationId });
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: 'active' | 'ignored') => {
        if (!statusData?.conversationId) return;
        setActionLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/conversations/${statusData.conversationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to update request');
            } else {
                if (newStatus === 'active') {
                    setStatusData({ status: 'active', conversationId: statusData.conversationId });
                } else {
                    setStatusData({ status: 'ignored', ignored_at: new Date().toISOString(), conversationId: statusData.conversationId });
                }
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div className="h-10 w-24 bg-slate-800 animate-pulse rounded-xl"></div>;
    }

    const { status, ignored_at } = statusData || { status: 'none' };

    let buttonContent = null;

    if (status === 'none') {
        buttonContent = (
            <button
                onClick={handleConnect}
                disabled={actionLoading}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all font-semibold active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {actionLoading ? 'Connecting...' : 'Connect'}
            </button>
        );
    } else if (status === 'pending_sent') {
        buttonContent = (
            <button
                disabled
                className="px-6 py-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl font-semibold cursor-not-allowed transition-all"
            >
                Request Sent
            </button>
        );
    } else if (status === 'pending_received') {
        buttonContent = (
            <div className="flex gap-2">
                <button
                    onClick={() => handleUpdateStatus('active')}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-green-600/20 text-green-400 border border-green-500/30 rounded-xl hover:bg-green-600/30 transition-all font-semibold active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Accept Request
                </button>
                <button
                    onClick={() => handleUpdateStatus('ignored')}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-xl hover:bg-rose-600/30 transition-all font-semibold active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Ignore
                </button>
            </div>
        );
    } else if (status === 'active') {
        buttonContent = (
            <button
                onClick={() => router.push('/messages')}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all font-semibold active:scale-[0.98]"
            >
                Message
            </button>
        );
    } else if (status === 'ignored') {
        let cooldownMsg = '';
        let canConnect = false;
        if (ignored_at) {
            const ignoredAtDate = new Date(ignored_at).getTime();
            const now = Date.now();
            const hrs24 = 24 * 60 * 60 * 1000;
            if (now - ignoredAtDate < hrs24) {
                const remainingMs = hrs24 - (now - ignoredAtDate);
                const hrs = Math.floor(remainingMs / (1000 * 60 * 60));
                const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                cooldownMsg = `Connect again in ${hrs}h ${mins}m`;
            } else {
                canConnect = true;
            }
        } else {
            // No timestamp, maybe an old record
            canConnect = true;
        }

        if (canConnect) {
            buttonContent = (
                <button
                    onClick={handleConnect}
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all font-semibold active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {actionLoading ? 'Connecting...' : 'Connect'}
                </button>
            );
        } else {
            buttonContent = (
                <button
                    disabled
                    className="px-6 py-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl font-semibold cursor-not-allowed transition-all"
                >
                    {cooldownMsg}
                </button>
            );
        }
    }

    return (
        <div className="flex flex-col items-end gap-2">
            {buttonContent}
            {error && <p className="text-rose-400 text-xs font-medium">{error}</p>}
        </div>
    );
}
