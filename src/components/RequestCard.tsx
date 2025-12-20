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
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {isReceiver ? 'From' : 'To'}: {otherProfile.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {formatDate(request.created_at)}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            request.status === 'accepted'
              ? 'bg-green-100 text-green-800'
              : request.status === 'rejected'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {request.status}
        </span>
      </div>

      {request.message && (
        <p className="text-gray-700 mb-4 whitespace-pre-wrap">{request.message}</p>
      )}

      {request.status === 'pending' && isReceiver && onRespond && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => onRespond(request.id, 'accepted')}
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Accept
          </button>
          <button
            onClick={() => onRespond(request.id, 'rejected')}
            disabled={loading}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reject
          </button>
        </div>
      )}

      {request.status !== 'pending' && request.responded_at && (
        <p className="text-xs text-gray-500 mt-2">
          Responded on {formatDate(request.responded_at)}
        </p>
      )}
    </div>
  );
}

