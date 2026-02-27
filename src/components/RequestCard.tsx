'use client';

import type { CollaborationRequestWithProfiles } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface RequestCardProps {
  request: CollaborationRequestWithProfiles;
  isReceiver: boolean;
  onRespond?: (requestId: string, status: 'accepted' | 'rejected') => void;
  loading?: boolean;
}

export default function RequestCard({ request, isReceiver, onRespond, loading }: RequestCardProps) {
  const otherProfile = isReceiver ? request.sender_profile : request.receiver_profile;

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-purple-400/30 hover:border-purple-400 transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-white truncate">
            {isReceiver ? 'From' : 'To'}: {otherProfile.name}
          </h3>
          <p className="text-sm text-white/60 mt-1">
            {formatDate(request.created_at)}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
            request.status === 'accepted'
              ? 'bg-green-500/20 text-green-300 border border-green-400/50'
              : request.status === 'rejected'
              ? 'bg-red-500/20 text-red-300 border border-red-400/50'
              : 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/50'
          }`}
        >
          {request.status}
        </span>
      </div>

      {request.message && (
        <p className="text-white/80 mb-4 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{request.message}</p>
      )}

      {request.status === 'pending' && isReceiver && onRespond && (
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            onClick={() => onRespond(request.id, 'accepted')}
            disabled={loading}
            className="flex-1 min-h-[44px] bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] touch-manipulation font-semibold"
          >
            Accept
          </button>
          <button
            onClick={() => onRespond(request.id, 'rejected')}
            disabled={loading}
            className="flex-1 min-h-[44px] bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] touch-manipulation font-semibold"
          >
            Reject
          </button>
        </div>
      )}

      {request.status !== 'pending' && request.responded_at && (
        <p className="text-xs text-white/50 mt-2">
          Responded on {formatDate(request.responded_at)}
        </p>
      )}
    </div>
  );
}

