'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import RequestCard from '@/components/RequestCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { CollaborationRequestWithProfiles } from '@/lib/types';

export default function RequestsPage() {
  const [incomingRequests, setIncomingRequests] = useState<CollaborationRequestWithProfiles[]>([]);
  const [sentRequests, setSentRequests] = useState<CollaborationRequestWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Create client with error handling
  let supabase;
  try {
    supabase = createClient();
  } catch (clientError: any) {
    // Error will be handled in useEffect
    supabase = null as any;
  }

  useEffect(() => {
    // Check if client was created successfully
    if (!supabase) {
      setError('Supabase configuration error. Please check your environment variables.');
      setLoading(false);
      return;
    }
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      const { data: requests, error } = await supabase
        .from('collaboration_requests')
        .select(
          `
          *,
          sender_profile:profiles!sender_id(*),
          receiver_profile:profiles!receiver_id(*)
        `
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading requests:', error);
        setLoading(false);
        return;
      }

      const requestsWithProfiles = (requests || []) as CollaborationRequestWithProfiles[];

      const incoming = requestsWithProfiles.filter((r) => r.receiver_id === profile.id);
      const sent = requestsWithProfiles.filter((r) => r.sender_id === profile.id);

      setIncomingRequests(incoming);
      setSentRequests(sent);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId: string, status: 'accepted' | 'rejected') => {
    setResponding(requestId);
    try {
      const response = await fetch('/api/requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          status,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to respond to request');
        return;
      }

      await loadRequests();
    } catch (error) {
      console.error('Error responding to request:', error);
      alert('An unexpected error occurred');
    } finally {
      setResponding(null);
    }
  };

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 opacity-0 animate-fade-in-up">
        <h2 className="text-red-300 font-semibold mb-2">Configuration Error</h2>
        <p className="text-red-200 text-sm">{error}</p>
        <p className="text-red-200/80 text-sm mt-2">
          Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file and restart your development server.
        </p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="opacity-0 animate-fade-in-up">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Collaboration Requests</h1>
        <p className="text-white/80 text-sm sm:text-base">Manage your incoming and sent requests</p>
      </div>

      <div className="space-y-6 md:space-y-8">
        <section>
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">Incoming Requests</h2>
          {incomingRequests.length === 0 ? (
            <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 sm:p-8 text-center border border-purple-400/30">
              <p className="text-white/80">No incoming requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incomingRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  isReceiver={true}
                  onRespond={handleRespond}
                  loading={responding === request.id}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">Sent Requests</h2>
          {sentRequests.length === 0 ? (
            <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 sm:p-8 text-center border border-purple-400/30">
              <p className="text-white/80">No sent requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sentRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  isReceiver={false}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

