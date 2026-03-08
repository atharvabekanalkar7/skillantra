'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatTimeAgo } from '@/lib/utils/timeAgo';
import { AppCard } from '@/components/ui/app-card';
import { createClient } from '@/lib/supabase/client';
import { Search, Plus, HandHelping, Settings2, Lock, X, UserCircle } from 'lucide-react';

interface CollabPost {
    id: string;
    created_by: string;
    title: string;
    description: string;
    skills_needed: string[];
    campus: string;
    status: string;
    created_at: string;
    creator?: {
        id: string;
        name: string;
        college?: string;
        avatar_url?: string;
    };
}

export default function CollaboratePage() {
    const [posts, setPosts] = useState<CollabPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [requestedPostIds, setRequestedPostIds] = useState<Set<string>>(new Set());
    const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
    const [isRecruiter, setIsRecruiter] = useState(false);

    // Modal state
    const [modalPostId, setModalPostId] = useState<string | null>(null);
    const [modalCreatorName, setModalCreatorName] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [sendingRequest, setSendingRequest] = useState(false);

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        setLoading(true);
        setError(null);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('user_type').eq('user_id', user.id).single();
                if (profile?.user_type === 'recruiter') {
                    setIsRecruiter(true);
                    setLoading(false);
                    return; // Don't load posts for recruiters
                }
            }

            const response = await fetch('/api/collaborate/posts');
            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to load posts');
                return;
            }

            setPosts(data.posts || []);
            setRequestedPostIds(new Set(data.requestedPostIds || []));
            setCurrentProfileId(data.currentProfileId || null);
        } catch (err) {
            setError('An unexpected error occurred');
            console.error('Error loading collab posts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendRequest = async () => {
        if (!modalPostId) return;
        setSendingRequest(true);
        try {
            const response = await fetch('/api/collaborate/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: modalPostId, message: modalMessage }),
            });
            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'Failed to send request');
                return;
            }

            setRequestedPostIds(prev => new Set([...prev, modalPostId]));
            setModalPostId(null);
            setModalMessage('');
        } catch (err) {
            alert('An unexpected error occurred');
        } finally {
            setSendingRequest(false);
        }
    };

    // Client-side filter by skill
    const filteredPosts = posts.filter(post => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const matchesSkill = post.skills_needed?.some(s => s.toLowerCase().includes(q));
        const matchesTitle = post.title.toLowerCase().includes(q);
        return matchesSkill || matchesTitle;
    });

    if (loading) return <LoadingSpinner />;

    return (
        <div className="opacity-0 animate-fade-in-up max-w-5xl mx-auto py-6 md:py-8">
            {/* Header */}
            <div className="mb-6 md:mb-8 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-100 mb-1 sm:mb-2">Collaborate</h1>
                    <p className="text-slate-400 text-sm sm:text-base">Find peers to help you or offer your skills</p>
                </div>
                {!isRecruiter && (
                    <Link
                        href="/collaborate/new"
                        className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-500 transition-all duration-200 active:scale-[0.98] md:hover:scale-[1.02] font-medium touch-manipulation"
                    >
                        <Plus className="w-4 h-4" />
                        Post a Request
                    </Link>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-3 mb-6">
                <button className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 transition-all">
                    1-on-1 Help
                </button>
                <button
                    disabled
                    className="px-5 py-2.5 rounded-xl text-sm font-medium bg-slate-800/60 text-slate-500 border border-slate-700/50 cursor-not-allowed flex items-center gap-2"
                >
                    <Lock className="w-3.5 h-3.5" />
                    Teams & Projects
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 text-[10px] font-semibold uppercase tracking-wide">Soon</span>
                </button>
            </div>

            {/* Search filter */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by skill or title..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                />
            </div>

            {error && (
                <div className="bg-rose-900 border border-rose-800 text-rose-200 px-4 py-3 rounded-lg mb-4">
                    {error}
                </div>
            )}

            {isRecruiter ? (
                <AppCard className="text-center p-8 md:p-10">
                    <p className="text-slate-400 mb-4 text-lg">
                        Team collaboration is only available for students
                    </p>
                </AppCard>
            ) : filteredPosts.length === 0 ? (
                <AppCard className="text-center p-8 md:p-10">
                    <p className="text-slate-400 mb-4 text-lg">
                        {posts.length === 0
                            ? 'No collaboration requests yet. Be the first!'
                            : 'No posts match your search.'}
                    </p>
                    {posts.length === 0 && (
                        <Link
                            href="/collaborate/new"
                            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 font-medium group"
                        >
                            Post a request <span className="group-hover:translate-x-1 transition-transform duration-200 ml-1">→</span>
                        </Link>
                    )}
                </AppCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPosts.map((post, index) => {
                        const isOwner = post.created_by === currentProfileId;
                        const hasRequested = requestedPostIds.has(post.id);

                        return (
                            <AppCard
                                key={post.id}
                                className="flex flex-col opacity-0 animate-fade-in-up-delayed"
                                style={{ animationDelay: `${index * 0.08}s` }}
                            >
                                <h3 className="text-lg font-semibold text-slate-100 mb-2">{post.title}</h3>
                                <p className="text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">{post.description}</p>

                                {post.skills_needed && post.skills_needed.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Skills Needed:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {post.skills_needed.map((skill, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-block bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-lg border border-slate-700 font-medium"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Posted by */}
                                {post.creator && (
                                    <Link
                                        href={`/profile/${post.creator.id}`}
                                        className="flex items-center gap-2 mb-2 group"
                                    >
                                        {post.creator.avatar_url ? (
                                            <img
                                                src={post.creator.avatar_url}
                                                alt={post.creator.name}
                                                className="w-6 h-6 rounded-full object-cover border border-slate-700"
                                            />
                                        ) : (
                                            <UserCircle className="w-6 h-6 text-slate-500" />
                                        )}
                                        <span className="text-sm text-slate-400 group-hover:text-indigo-400 transition-colors font-medium truncate">
                                            {post.creator.name}
                                        </span>
                                    </Link>
                                )}

                                <div className="text-xs text-slate-500 mb-4">{formatTimeAgo(post.created_at)}</div>

                                <div className="mt-auto pt-4 border-t border-slate-800">
                                    {isOwner ? (
                                        <Link
                                            href="/collaborate/mine"
                                            className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-slate-800 text-slate-200 py-2 px-4 rounded-xl hover:bg-slate-700 border border-slate-700 transition-all duration-200 active:scale-[0.98] font-medium text-sm touch-manipulation"
                                        >
                                            <Settings2 className="w-4 h-4" />
                                            Manage Requests
                                        </Link>
                                    ) : hasRequested ? (
                                        <button
                                            disabled
                                            className="w-full min-h-[44px] bg-slate-800 text-slate-400 py-2 px-4 rounded-xl border border-slate-700 font-medium text-sm cursor-not-allowed"
                                        >
                                            Request Sent
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setModalPostId(post.id);
                                                setModalCreatorName(post.creator?.name || 'this person');
                                                setModalMessage('');
                                            }}
                                            className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-xl hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 active:scale-[0.98] font-medium text-sm touch-manipulation"
                                        >
                                            <HandHelping className="w-4 h-4" />
                                            I Can Help
                                        </button>
                                    )}
                                </div>
                            </AppCard>
                        );
                    })}
                </div>
            )}

            {/* My Requests link */}
            <div className="mt-8 text-center">
                <Link
                    href="/collaborate/mine"
                    className="inline-flex items-center text-indigo-400 hover:text-indigo-300 font-medium text-sm group"
                >
                    View My Posts & Requests <span className="group-hover:translate-x-1 transition-transform duration-200 ml-1">→</span>
                </Link>
            </div>

            {/* "I Can Help" Modal */}
            {modalPostId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
                        onClick={() => { setModalPostId(null); setModalMessage(''); }}
                    />
                    <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
                        <button
                            onClick={() => { setModalPostId(null); setModalMessage(''); }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-semibold text-slate-100 mb-1">Send a help request</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Let <span className="text-indigo-400 font-medium">{modalCreatorName}</span> know you can help
                        </p>
                        <textarea
                            value={modalMessage}
                            onChange={e => setModalMessage(e.target.value)}
                            placeholder="Add a message (optional)..."
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none transition-all"
                        />
                        <button
                            onClick={handleSendRequest}
                            disabled={sendingRequest}
                            className="w-full mt-4 min-h-[44px] bg-indigo-600 text-white py-2.5 px-4 rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] font-medium text-sm touch-manipulation"
                        >
                            {sendingRequest ? 'Sending...' : 'Send Request'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
