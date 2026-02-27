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
    <div className="max-w-2xl mx-auto opacity-0 animate-fade-in-up">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Create New Task</h1>
        <p className="text-white/80 text-sm sm:text-base">Post a task to find skilled collaborators</p>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-purple-400/30">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 min-h-[44px]"
              placeholder="e.g., Build a React dashboard"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
              placeholder="Describe the task in detail..."
            />
          </div>

          <div>
            <label htmlFor="skills" className="block text-sm font-medium text-white mb-2">
              Skills Required
            </label>
            <input
              id="skills"
              type="text"
              value={skillsRequired}
              onChange={(e) => setSkillsRequired(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 min-h-[44px]"
              placeholder="React, TypeScript, Node.js (comma-separated)"
            />
            <p className="mt-2 text-sm text-white/60">Separate skills with commas</p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 sm:py-4 min-h-[44px] border border-purple-500/50 rounded-lg text-white hover:bg-purple-500/10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors touch-manipulation font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 min-h-[44px] bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 sm:py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] font-semibold touch-manipulation"
            >
              {loading ? 'Creating...' : 'Create Task'}
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

