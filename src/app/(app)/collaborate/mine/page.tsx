'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatTimeAgo } from '@/lib/utils/timeAgo';
import { AppCard } from '@/components/ui/app-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { ArrowLeft, ChevronDown, ChevronUp, UserCircle, MessageSquare, Plus } from 'lucide-react';

interface Requester {
    id: string;
    name: string;
    college?: string;
    avatar_url?: string;
}

interface CollabRequest {
    id: string;
    requester_id: string;
    message: string | null;
    status: string;
    created_at: string;
    requester?: Requester;
}

interface MyPost {
    id: string;
    title: string;
    description: string;
    skills_needed: string[];
    status: string;
    created_at: string;
    collaboration_requests: CollabRequest[];
}

interface MyRequest {
    id: string;
    post_id: string;
    message: string | null;
    status: string;
    created_at: string;
    post?: {
        id: string;
        title: string;
        description: string;
        skills_needed: string[];
        status: string;
        created_at: string;
        creator?: {
            id: string;
            name: string;
            avatar_url?: string;
        };
    };
}

export default function MyCollaborationsPage() {
    const [activeTab, setActiveTab] = useState<'posts' | 'requests'>('posts');
    const [myPosts, setMyPosts] = useState<MyPost[]>([]);
    const [myRequests, setMyRequests] = useState<MyRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
    const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/collaborate/mine');
            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to load data');
                return;
            }

            setMyPosts(data.myPosts || []);
            setMyRequests(data.myRequests || []);
        } catch (err) {
            setError('An unexpected error occurred');
            console.error('Error loading my collaborations:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
        setUpdatingRequestId(requestId);
        try {
            const response = await fetch(`/api/collaborate/requests/${requestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'Failed to update request');
                return;
            }

            if (status === 'accepted') {
                setToast('✅ Request accepted — Chat opened!');
            } else {
                setToast('Request declined');
            }

            await loadData();
        } catch (err) {
            alert('An unexpected error occurred');
        } finally {
            setUpdatingRequestId(null);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="opacity-0 animate-fade-in-up max-w-5xl mx-auto py-6 md:py-8">
            <Link
                href="/collaborate"
                className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm font-medium mb-6 group transition-colors"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                Back to Collaborate
            </Link>

            <div className="mb-6 md:mb-8 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-100 mb-1 sm:mb-2">My Collaborations</h1>
                    <p className="text-slate-400 text-sm sm:text-base">Manage your posts and track your requests</p>
                </div>
                <Link
                    href="/collaborate/new"
                    className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-500 transition-all duration-200 active:scale-[0.98] md:hover:scale-[1.02] font-medium touch-manipulation"
                >
                    <Plus className="w-4 h-4" />
                    New Post
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={() => setActiveTab('posts')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'posts'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                >
                    My Posts
                    {myPosts.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-300 text-[10px] font-semibold">
                            {myPosts.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'requests'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                >
                    My Requests
                    {myRequests.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-300 text-[10px] font-semibold">
                            {myRequests.length}
                        </span>
                    )}
                </button>
            </div>

            {error && (
                <div className="bg-rose-900 border border-rose-800 text-rose-200 px-4 py-3 rounded-lg mb-4">
                    {error}
                </div>
            )}

            {/* My Posts Tab */}
            {activeTab === 'posts' && (
                <div className="space-y-4">
                    {myPosts.length === 0 ? (
                        <AppCard className="text-center p-8">
                            <p className="text-slate-400 mb-4 text-lg">You haven't posted any requests yet.</p>
                            <Link
                                href="/collaborate/new"
                                className="inline-flex items-center text-indigo-400 hover:text-indigo-300 font-medium group"
                            >
                                Create your first post <span className="group-hover:translate-x-1 transition-transform duration-200 ml-1">→</span>
                            </Link>
                        </AppCard>
                    ) : (
                        myPosts.map((post, index) => {
                            const requests = post.collaboration_requests || [];
                            const pendingCount = requests.filter(r => r.status === 'pending').length;
                            const isExpanded = expandedPostId === post.id;

                            return (
                                <AppCard
                                    key={post.id}
                                    className="opacity-0 animate-fade-in-up-delayed"
                                    style={{ animationDelay: `${index * 0.08}s` }}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                                                <h3 className="text-lg font-semibold text-slate-100">{post.title}</h3>
                                                <StatusBadge status={post.status} />
                                            </div>
                                            {requests.length > 0 && (
                                                <p className="text-sm text-indigo-400 font-medium">
                                                    {requests.length} request{requests.length !== 1 ? 's' : ''}
                                                    {pendingCount > 0 && (
                                                        <span className="ml-1 text-amber-400">({pendingCount} pending)</span>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-slate-400 text-sm mb-3 leading-relaxed">{post.description}</p>

                                    {post.skills_needed && post.skills_needed.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {post.skills_needed.map((skill, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-block bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-lg border border-slate-700 font-medium"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="text-xs text-slate-500 mb-3">{formatTimeAgo(post.created_at)}</div>

                                    {/* Manage requests toggle */}
                                    {requests.length > 0 && (
                                        <div className="border-t border-slate-800 pt-3">
                                            <button
                                                onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                                                className="flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                                            >
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                {isExpanded ? 'Hide Requests' : 'Manage Requests'}
                                            </button>

                                            {isExpanded && (
                                                <div className="space-y-3 mt-3">
                                                    {requests.map(req => (
                                                        <div
                                                            key={req.id}
                                                            className="bg-slate-800 rounded-lg p-4 border border-slate-700"
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    {req.requester?.avatar_url ? (
                                                                        <img
                                                                            src={req.requester.avatar_url}
                                                                            alt={req.requester.name}
                                                                            className="w-7 h-7 rounded-full object-cover border border-slate-600"
                                                                        />
                                                                    ) : (
                                                                        <UserCircle className="w-7 h-7 text-slate-500" />
                                                                    )}
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="text-slate-200 font-medium text-sm">{req.requester?.name || 'Unknown'}</p>
                                                                            {req.requester?.id && (
                                                                                <Link
                                                                                    href={`/profile/${req.requester.id}`}
                                                                                    className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline font-medium"
                                                                                >
                                                                                    View Profile
                                                                                </Link>
                                                                            )}
                                                                        </div>
                                                                        {req.requester?.college && (
                                                                            <p className="text-xs text-slate-500">{req.requester.college}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <StatusBadge status={req.status} />
                                                            </div>

                                                            {req.message && (
                                                                <p className="text-sm text-slate-400 mb-3 pl-9 italic">"{req.message}"</p>
                                                            )}

                                                            <div className="text-xs text-slate-500 mb-2 pl-9">{formatTimeAgo(req.created_at)}</div>

                                                            {req.status === 'pending' && (
                                                                <div className="flex flex-col sm:flex-row gap-2 mt-3 pl-9">
                                                                    <button
                                                                        onClick={() => handleUpdateRequest(req.id, 'accepted')}
                                                                        disabled={updatingRequestId === req.id}
                                                                        className="flex-1 min-h-[36px] flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 border border-emerald-600 text-white py-1.5 px-4 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] touch-manipulation"
                                                                    >
                                                                        <MessageSquare className="w-3.5 h-3.5" />
                                                                        {updatingRequestId === req.id ? 'Updating...' : 'Accept & Chat'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleUpdateRequest(req.id, 'rejected')}
                                                                        disabled={updatingRequestId === req.id}
                                                                        className="flex-1 min-h-[36px] bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white py-1.5 px-4 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] touch-manipulation"
                                                                    >
                                                                        {updatingRequestId === req.id ? 'Updating...' : 'Decline'}
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {req.status === 'accepted' && (
                                                                <div className="pl-9 mt-2">
                                                                    <Link
                                                                        href="/messages"
                                                                        className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                                                                    >
                                                                        <MessageSquare className="w-3.5 h-3.5" />
                                                                        Open Chat
                                                                    </Link>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </AppCard>
                            );
                        })
                    )}
                </div>
            )}

            {/* My Requests Tab */}
            {activeTab === 'requests' && (
                <div className="space-y-4">
                    {myRequests.length === 0 ? (
                        <AppCard className="text-center p-8">
                            <p className="text-slate-400 mb-4 text-lg">You haven't sent any help requests yet.</p>
                            <Link
                                href="/collaborate"
                                className="inline-flex items-center text-indigo-400 hover:text-indigo-300 font-medium group"
                            >
                                Browse requests <span className="group-hover:translate-x-1 transition-transform duration-200 ml-1">→</span>
                            </Link>
                        </AppCard>
                    ) : (
                        myRequests.map((req, index) => (
                            <AppCard
                                key={req.id}
                                className="opacity-0 animate-fade-in-up-delayed"
                                style={{ animationDelay: `${index * 0.08}s` }}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-semibold text-slate-100">{req.post?.title || 'Unknown Post'}</h3>
                                    <StatusBadge status={req.status} />
                                </div>

                                {req.post?.description && (
                                    <p className="text-slate-400 text-sm mb-3 leading-relaxed line-clamp-2">{req.post.description}</p>
                                )}

                                {req.post?.skills_needed && req.post.skills_needed.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {req.post.skills_needed.map((skill, i) => (
                                            <span
                                                key={i}
                                                className="inline-block bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-lg border border-slate-700 font-medium"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {req.message && (
                                    <p className="text-sm text-slate-400 italic mb-2">Your message: "{req.message}"</p>
                                )}

                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
                                    <div className="flex items-center gap-2">
                                        {req.post?.creator && (
                                            <Link
                                                href={`/profile/${req.post.creator.id}`}
                                                className="flex items-center gap-2 group"
                                            >
                                                {req.post.creator.avatar_url ? (
                                                    <img
                                                        src={req.post.creator.avatar_url}
                                                        alt={req.post.creator.name}
                                                        className="w-5 h-5 rounded-full object-cover border border-slate-700"
                                                    />
                                                ) : (
                                                    <UserCircle className="w-5 h-5 text-slate-500" />
                                                )}
                                                <span className="text-sm text-slate-400 group-hover:text-indigo-400 transition-colors font-medium">
                                                    {req.post.creator.name}
                                                </span>
                                            </Link>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-500">{formatTimeAgo(req.created_at)}</span>
                                </div>

                                {req.status === 'accepted' && (
                                    <div className="mt-3 pt-3 border-t border-slate-800">
                                        <Link
                                            href="/messages"
                                            className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            Go to Chat
                                        </Link>
                                    </div>
                                )}
                            </AppCard>
                        ))
                    )}
                </div>
            )}

            {/* Toast notification */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 bg-slate-800 border border-slate-700 text-slate-200 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-fade-in-up">
                    {toast}
                </div>
            )}
        </div>
    );
}
