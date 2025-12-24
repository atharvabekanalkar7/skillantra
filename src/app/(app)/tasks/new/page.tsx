'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PhoneNumberModal from '@/components/PhoneNumberModal';

export default function NewTaskPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillsRequired, setSkillsRequired] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const submitTask = async (throwOnError: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          skills_required: skillsRequired.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'CONTACT_REQUIRED' || data.code === 'PHONE_NUMBER_REQUIRED') {
          setLoading(false);
          setShowPhoneModal(true);
          if (throwOnError) {
            throw new Error('Contact information required');
          }
          return;
        }
        const errorMsg = data.error || 'Failed to create task';
        setError(errorMsg);
        setLoading(false);
        if (throwOnError) {
          throw new Error(errorMsg);
        }
        return;
      }

      // Success - reset loading before redirect
      setLoading(false);
      router.push('/tasks/mine');
      router.refresh();
    } catch (err: any) {
      const errorMsg = err.message || 'An unexpected error occurred';
      setError(errorMsg);
      setLoading(false);
      if (throwOnError) {
        throw err;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPendingSubmit(true);
    await submitTask();
    setPendingSubmit(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Task</h1>
        <p className="text-gray-600">Post a task to find skilled collaborators</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Build a React dashboard"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the task in detail..."
            />
          </div>

          <div>
            <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
              Skills Required
            </label>
            <input
              id="skills"
              type="text"
              value={skillsRequired}
              onChange={(e) => setSkillsRequired(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="React, TypeScript, Node.js (comma-separated)"
            />
            <p className="mt-1 text-sm text-gray-500">Separate skills with commas</p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <PhoneNumberModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        context="create_task"
        onSave={async (phoneNumber) => {
          try {
            const response = await fetch('/api/profile', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                phone_number: phoneNumber,
              }),
            });

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || 'Failed to save phone number');
            }

            // Verify the phone number was actually saved by fetching the profile
            const verifyResponse = await fetch('/api/profile');
            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              if (!verifyData.profile?.phone_number) {
                throw new Error('Phone number was not saved. Please try again.');
              }
            }

            // Wait a bit to ensure the database update is committed
            // This helps avoid race conditions where the task creation API
            // might read stale profile data
            await new Promise(resolve => setTimeout(resolve, 200));

            // Retry task creation after saving phone number
            // Pass throwOnError=true so errors are propagated to the modal
            await submitTask(true);
            
            // Only close modal if task creation succeeded
            setShowPhoneModal(false);
          } catch (err: any) {
            // Error will be shown in the modal
            throw err;
          }
        }}
      />
    </div>
  );
}

