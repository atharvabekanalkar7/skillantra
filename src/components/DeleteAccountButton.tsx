'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteAccountButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'DELETE',
      });

      // Get response as text first to handle both JSON and non-JSON responses
      const responseText = await response.text();
      
      // Log the raw response for debugging
      console.log('Delete account response:', {
        status: response.status,
        statusText: response.statusText,
        responseTextLength: responseText.length,
        responseTextPreview: responseText.substring(0, 200),
      });
      
      let data: any = null;
      
      try {
        if (responseText.trim()) {
          data = JSON.parse(responseText);
        } else {
          data = {};
        }
      } catch (parseError) {
        // If response is not JSON, use the text as error message
        console.error('Failed to parse response as JSON:', parseError);
        const errorMsg = responseText || `Failed to delete account (Status: ${response.status})`;
        setError(errorMsg);
        setDeleting(false);
        return;
      }

      if (!response.ok) {
        // Handle API errors - show the actual error message
        const errorMessage = data?.error || 
                           data?.message || 
                           data?.details ||
                           responseText || 
                           `Failed to delete account (Status: ${response.status})`;
        
        console.error('Delete account API error:', { 
          status: response.status, 
          statusText: response.statusText,
          responseText: responseText,
          parsedData: data,
          dataType: typeof data,
          dataKeys: data ? Object.keys(data) : [],
          hasError: !!data?.error,
          hasMessage: !!data?.message,
          hasDetails: !!data?.details,
          errorField: data?.error,
          messageField: data?.message,
          detailsField: data?.details,
          finalErrorMessage: errorMessage
        });
        
        setError(errorMessage);
        setDeleting(false);
        return;
      }

      // Account deleted successfully, redirect to landing page
      router.push('/?account_deleted=true');
    } catch (err) {
      setError('An unexpected error occurred');
      setDeleting(false);
    }
  };

  return (
    <div>
      {!showConfirm ? (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          Delete Account
        </button>
      ) : (
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-300 text-sm font-semibold mb-2">
              ⚠️ Warning: This action cannot be undone
            </p>
            <p className="text-white/80 text-sm mb-4">
              Type <span className="font-mono font-bold text-red-300">DELETE</span> to confirm account deletion:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError(null);
              }}
              placeholder="Type DELETE to confirm"
              className="w-full px-4 py-2 bg-gray-900/50 border border-red-500/50 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={deleting}
            />
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || confirmText !== 'DELETE'}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowConfirm(false);
                setConfirmText('');
                setError(null);
              }}
              disabled={deleting}
              className="px-6 py-3 border border-gray-500/50 rounded-lg text-white hover:bg-gray-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

