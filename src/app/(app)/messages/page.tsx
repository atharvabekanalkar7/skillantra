'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatTimeAgo } from '@/lib/utils/timeAgo';

type UserProfile = {
  id: string;
  name: string;
  user_type: string;
};

type Conversation = {
  id: string;
  status: 'pending' | 'active' | 'ignored';
  is_sender: boolean;
  other_user: UserProfile;
  unread_count: number;
  last_message_at: string;
  updated_at: string;
  created_at: string;
  last_message: { content: string; created_at: string } | null;
};

type Message = {
  id: string;
  sender_profile_id: string;
  content: string;
  created_at: string;
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'active' | 'requests'>('active');

  // Active Thread State
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [activeConvoDetail, setActiveConvoDetail] = useState<Conversation & { is_receiver?: boolean } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Mobile layout state
  const [showThreadOnMobile, setShowThreadOnMobile] = useState(false);

  // Refs for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConvoId) {
      fetchMessages(activeConvoId);
      // Optimistically mark as read in local state
      setConversations(prev => prev.map(c => c.id === activeConvoId ? { ...c, unread_count: 0 } : c));
    }
  }, [activeConvoId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error: ${res.status}`);
      setConversations(data.conversations || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (id: string) => {
    setLoadingMessages(true);
    setMsgError(null);
    try {
      // Mark as read in DB in parallel
      fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markRead: true })
      }).catch(e => console.error('Failed to mark read', e));

      const res = await fetch(`/api/conversations/${id}/messages`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error: ${res.status}`);

      setMessages(data.messages || []);
      setActiveConvoDetail(data.conversation);
    } catch (err: any) {
      setMsgError(err.message || 'Failed to load thread');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvoId) return;

    setSendingMessage(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConvoId,
          content: newMessage
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error: ${res.status}`);

      // Optimistically add message
      setMessages([...messages, data.message]);
      setNewMessage('');

      fetchConversations();
    } catch (err: any) {
      setMsgError(err.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const updateConversationStatus = async (status: 'active' | 'ignored') => {
    if (!activeConvoId) return;
    try {
      const res = await fetch(`/api/conversations/${activeConvoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Update local state
      setConversations(conversations.map(c => c.id === activeConvoId ? { ...c, status } : c));
      if (activeConvoDetail) setActiveConvoDetail({ ...activeConvoDetail, status });

      // If ignored, kick them out of the active view on mobile or switch tab
      if (status === 'ignored') {
        setActiveConvoId(null);
        setShowThreadOnMobile(false);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filter conversations
  const activeChatsList = conversations.filter(c => c.status === 'active' || (c.status === 'pending' && c.is_sender));
  const requestsList = conversations.filter(c => c.status === 'pending' && !c.is_sender);

  // Current visible list
  const currentList = activeTab === 'active' ? activeChatsList : requestsList;

  // Pending Badge Count
  const pendingRequestsCount = requestsList.filter(c => c.unread_count > 0).length;

  // Active Thread logic
  const isInputLocked = activeConvoDetail ? (
    activeConvoDetail.status === 'ignored' ||
    (activeConvoDetail.status === 'pending' && activeConvoDetail.is_sender) ||
    (activeConvoDetail.status === 'pending' && !activeConvoDetail.is_sender) // Receivers must accept first
  ) : true;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="opacity-0 animate-fade-in-up h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Messages</h1>
        <p className="text-white/60 text-sm mb-3">Connect with collaborators and expand your network.</p>
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200/90 px-4 py-2 rounded-xl text-sm flex items-center gap-2 w-fit">
          <span>⚠️</span>
          <span>Please refresh the page to load the latest messages.</span>
        </div>
      </div>

      {error ? (
        <div className="bg-red-500/20 text-red-200 border border-red-500/50 p-4 rounded-xl">
          {error}
        </div>
      ) : conversations.length === 0 ? (
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-8 sm:p-12 text-center border border-purple-400/30 flex-1 flex flex-col justify-center items-center">
          <div className="text-5xl sm:text-6xl mb-4">📭</div>
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">Your inbox is empty.</h2>
          <p className="text-white/60 mb-6 max-w-sm">
            Visit someone's profile to send them a direct message and start collaborating.
          </p>
          <Link href="/tasks" className="text-purple-300 hover:text-purple-200 font-semibold bg-purple-500/20 px-6 py-2 rounded-xl transition-colors">
            Browse Tasks
          </Link>
        </div>
      ) : (
        <div className="flex-1 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-purple-400/30 overflow-hidden flex shadow-xl relative min-h-0">

          {/* SIDEBAR: CONVERSATION LIST */}
          <div className={`${showThreadOnMobile ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col border-r border-purple-400/20`}>
            {/* Tabs */}
            <div className="flex border-b border-purple-400/20 bg-slate-900/80">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'active' ? 'text-purple-300 border-purple-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
              >
                Chats
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 flex justify-center items-center gap-2 ${activeTab === 'requests' ? 'text-purple-300 border-purple-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
              >
                Requests
                {pendingRequestsCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingRequestsCount}</span>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {currentList.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">
                  {activeTab === 'active' ? 'No active chats.' : 'No pending requests.'}
                </div>
              ) : (
                currentList.map(c => {
                  const isActive = activeConvoId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveConvoId(c.id);
                        setShowThreadOnMobile(true);
                      }}
                      className={`w-full text-left p-4 border-b border-purple-400/10 transition-colors ${isActive ? 'bg-purple-500/10 hover:bg-purple-500/20' : 'hover:bg-slate-800/60'}`}
                    >
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <span className={`font-semibold truncate flex-1 ${c.unread_count > 0 ? 'text-white' : 'text-white/80'}`}>
                          {c.other_user.name}
                        </span>
                        <span className={`text-xs whitespace-nowrap ${c.unread_count > 0 ? 'text-purple-300 font-medium' : 'text-white/40'}`}>
                          {formatTimeAgo(c.last_message_at)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm gap-2">
                        <span className={`truncate flex-1 ${c.unread_count > 0 ? 'text-slate-200 font-medium' : 'text-white/50'}`}>
                          {c.is_sender && c.status === 'pending' ? 'Sent request...' : c.last_message?.content || 'New conversation'}
                        </span>
                        {c.unread_count > 0 && (
                          <span className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0 animate-pulse"></span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* MAIN CHAT AREA */}
          <div className={`${showThreadOnMobile ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0 bg-slate-900/20`}>
            {activeConvoDetail ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-purple-400/20 bg-slate-900/60 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => setShowThreadOnMobile(false)}
                      className="md:hidden p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      ←
                    </button>
                    <div className="min-w-0">
                      <Link href={`/profile/${activeConvoDetail.other_user.id}`} className="font-semibold text-white text-base md:text-lg hover:underline truncate block">
                        {activeConvoDetail.other_user.name}
                      </Link>
                      <span className="text-xs text-purple-300 truncate block">
                        {activeConvoDetail.other_user.user_type}
                      </span>
                    </div>
                  </div>

                  {/* Receiver Action Buttons for Pending Requests */}
                  {!activeConvoDetail.is_sender && activeConvoDetail.status === 'pending' && (
                    <div className="flex gap-2 ml-2 shrink-0">
                      <button onClick={() => updateConversationStatus('ignored')} className="px-3 py-1.5 text-xs text-red-200 bg-red-500/20 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors">
                        Ignore
                      </button>
                      <button onClick={() => updateConversationStatus('active')} className="px-3 py-1.5 text-xs text-green-200 bg-green-500/20 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors">
                        Accept
                      </button>
                    </div>
                  )}
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-full text-white/50"><LoadingSpinner /></div>
                  ) : messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-white/50 text-sm">No messages yet.</div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.sender_profile_id !== activeConvoDetail.other_user.id; // Safest check

                      return (
                        <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${isMe
                            ? 'bg-purple-600/80 text-white rounded-tr-sm'
                            : 'bg-slate-700/80 text-white rounded-tl-sm border border-slate-600'
                            }`}>
                            <p className="text-sm md:text-base whitespace-pre-wrap break-words">{m.content}</p>
                            <span className="text-[10px] opacity-60 mt-1 block text-right">
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-slate-900/60 border-t border-purple-400/20 shrink-0">
                  {msgError && <div className="text-red-300 text-xs mb-2 text-center bg-red-500/10 py-1 rounded">{msgError}</div>}

                  {activeConvoDetail.status === 'pending' && activeConvoDetail.is_sender && (
                    <div className="text-center text-sm text-amber-200/80 bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
                      Request sent. Waiting for {activeConvoDetail.other_user.name} to accept before keeping the conversation going.
                    </div>
                  )}

                  {activeConvoDetail.status === 'pending' && !activeConvoDetail.is_sender && (
                    <div className="text-center text-sm text-purple-200/80 bg-purple-500/10 rounded-xl p-3 border border-purple-500/20">
                      Accept this request to continue messaging.
                    </div>
                  )}

                  {activeConvoDetail.status === 'ignored' && (
                    <div className="text-center text-sm text-red-200/80 bg-red-500/10 rounded-xl p-3 border border-red-500/20">
                      This request was ignored. Messaging is permanently locked.
                    </div>
                  )}

                  {!isInputLocked && (
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        disabled={sendingMessage}
                        className="flex-1 bg-slate-800 border border-purple-500/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sendingMessage}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-5 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      >
                        {sendingMessage ? '...' : 'Send'}
                      </button>
                    </form>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-white/40 p-8 text-center min-h-0">
                <div className="text-4xl mb-4">💬</div>
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
