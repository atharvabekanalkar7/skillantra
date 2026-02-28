'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SendDMButtonProps {
    receiverId: string;
    receiverName: string;
}

export default function SendDMButton({ receiverId, receiverName }: SendDMButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    const [submittingRequest, setSubmittingRequest] = useState(false);
    const [requestError, setRequestError] = useState<string | null>(null);
    const router = useRouter();

    const handleSendMessage = async () => {
        if (!messageContent.trim()) {
            setRequestError('Please enter a message.');
            return;
        }

        setSubmittingRequest(true);
        setRequestError(null);

        try {
            const res = await fetch('/api/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    receiverId,
                    messageContent: messageContent.trim()
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 409 && data.conversationId) {
                    // Already exists, just silently redirect to conversations
                    router.push('/messages');
                    return;
                }
                setRequestError(data.error || 'Failed to send message');
            } else {
                // Success! Redirect to messages portal
                router.push('/messages');
            }
        } catch (err) {
            setRequestError('An unexpected error occurred. Please try again later.');
        } finally {
            setSubmittingRequest(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg font-semibold active:scale-[0.98]"
            >
                💬 Message {receiverName}
            </button>

            {/* Collaboration Request Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-left">
                    <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl scale-100 animate-fade-in-up">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-white mb-2">Message {receiverName}</h2>
                            <p className="text-white/60 text-sm mb-6">
                                Send an initial message to start a conversation with {receiverName}.
                            </p>

                            {requestError && (
                                <div className="mb-4 bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-red-200 text-sm font-medium">
                                    {requestError}
                                </div>
                            )}

                            <textarea
                                value={messageContent}
                                onChange={(e) => setMessageContent(e.target.value)}
                                placeholder={`Hi ${receiverName}, I'd love to connect with you regarding...`}
                                className="w-full bg-slate-800 border-2 border-purple-500/30 rounded-xl p-4 text-white placeholder-white/30 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all resize-y min-h-[150px] mb-6"
                                disabled={submittingRequest}
                            />

                            <div className="flex justify-end gap-3 font-semibold">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={submittingRequest}
                                    className="px-5 py-2.5 rounded-xl border-2 border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={submittingRequest}
                                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all flex items-center gap-2 group shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submittingRequest ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            Send Message <span className="group-hover:translate-x-1 transition-transform">→</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
