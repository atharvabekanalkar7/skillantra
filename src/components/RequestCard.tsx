'use client';

import type { CollaborationRequestWithProfiles } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface RequestCardProps {
  request: CollaborationRequestWithProfiles;
  isReceiver: boolean;
  onRespond?: (requestId: string, status: 'accepted' | 'rejected') => void;
  loading?: boolean;
}

export default function RequestCard({ request, isReceiver, onRespond, loading }: RequestCardProps) {
  const router = useRouter();
  const otherProfile = isReceiver ? request.sender_profile : request.receiver_profile;

  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 hover:bg-slate-800 transition-all duration-300">
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
          className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${request.status === 'accepted'
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

      {request.status === 'accepted' && (
        <div style={{
          marginTop: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          {(otherProfile as any).phone_number && (
            <span style={{
              fontSize: '13px',
              color: 'var(--color-text-secondary, #94a3b8)'
            }}>
              📞 {(otherProfile as any).phone_number}
            </span>
          )}
          <button
            onClick={() => router.push(`/profile/${otherProfile.id}`)}
            style={{
              padding: '6px 16px',
              background: 'linear-gradient(135deg, #1e293b 0%, #020617 100%)',
              color: '#f8fafc',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              border: '1px solid #4f46e5',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              transition: 'all 0.2s ease'
            }}
          >
            Message Now
          </button>
          {(otherProfile as any).email && (
            <a
              href={`mailto:${(otherProfile as any).email}`}
              style={{
                padding: '6px 16px',
                background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
                color: '#94a3b8',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '500',
                border: '1px solid #334155',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                transition: 'all 0.2s ease'
              }}
            >
              Email
            </a>
          )}
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

