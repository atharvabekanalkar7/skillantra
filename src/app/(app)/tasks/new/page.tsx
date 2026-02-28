'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PhoneNumberModal from '@/components/PhoneNumberModal';
import type { TaskAttachment } from '@/lib/types';

const ATTACHMENT_CATEGORIES = ['GitHub', 'Figma', 'Notion', 'Google Drive', 'Other'] as const;
const MODE_OPTIONS = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'in-person', label: 'In-person' },
] as const;

interface AttachmentRow {
  id: string; // client-side key for React
  category: typeof ATTACHMENT_CATEGORIES[number];
  link: string;
}

export default function NewTaskPage() {
  const router = useRouter();

  // Core fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillsRequired, setSkillsRequired] = useState('');

  // Payment
  const [paymentType, setPaymentType] = useState<'stipend' | 'other' | ''>('');
  const [stipendMin, setStipendMin] = useState('');
  const [stipendMax, setStipendMax] = useState('');
  const [paymentOtherDetails, setPaymentOtherDetails] = useState('');

  // Deadline
  const [applicationDeadline, setApplicationDeadline] = useState('');

  // Mode of work
  const [modeOfWork, setModeOfWork] = useState('');

  // Attachments
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  // Generate a unique row ID
  const genId = () => `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Attachment management
  const addAttachmentRow = useCallback(() => {
    setAttachments((prev) => [...prev, { id: genId(), category: 'GitHub', link: '' }]);
  }, []);

  const removeAttachmentRow = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const updateAttachment = useCallback((id: string, field: 'category' | 'link', value: string) => {
    setAttachments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  }, []);

  // Client-side validation
  const validate = (): string | null => {
    if (!title.trim()) return 'Title is required';

    if (paymentType === 'stipend') {
      if (!stipendMin) return 'Minimum stipend is required';
      if (!stipendMax) return 'Maximum stipend is required';
      const min = parseFloat(stipendMin);
      const max = parseFloat(stipendMax);
      if (isNaN(min) || min < 0) return 'Minimum stipend must be a non-negative number';
      if (isNaN(max) || max < 0) return 'Maximum stipend must be a non-negative number';
      if (min > max) return 'Minimum stipend cannot be greater than maximum stipend';
    }

    if (paymentType === 'other') {
      if (!paymentOtherDetails.trim()) return 'Please specify payment details';
    }

    if (applicationDeadline) {
      const deadline = new Date(applicationDeadline);
      if (isNaN(deadline.getTime())) return 'Invalid deadline';
      if (deadline.getTime() <= Date.now()) return 'Deadline must be in the future';
    }

    // Validate attachments
    for (let i = 0; i < attachments.length; i++) {
      const att = attachments[i];
      if (!att.link.trim()) return `Attachment ${i + 1} is missing a link`;
      try {
        const url = new URL(att.link.trim());
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          return `Attachment ${i + 1} URL must start with http:// or https://`;
        }
      } catch {
        return `Attachment ${i + 1} has an invalid URL`;
      }
    }

    return null;
  };

  const submitTask = async (throwOnError: boolean = false) => {
    setLoading(true);
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      if (throwOnError) throw new Error(validationError);
      return;
    }

    try {
      const payload: Record<string, any> = {
        title: title.trim(),
        description: description.trim() || null,
        skills_required: skillsRequired.trim() || null,
        payment_type: paymentType || null,
        mode_of_work: modeOfWork || null,
        application_deadline: applicationDeadline || null,
        attachments: attachments.map((a) => ({
          category: a.category,
          link: a.link.trim(),
        })),
      };

      if (paymentType === 'stipend') {
        payload.stipend_min = parseFloat(stipendMin);
        payload.stipend_max = parseFloat(stipendMax);
      } else if (paymentType === 'other') {
        payload.payment_other_details = paymentOtherDetails.trim();
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'CONTACT_REQUIRED' || data.code === 'PHONE_NUMBER_REQUIRED') {
          setLoading(false);
          setShowPhoneModal(true);
          if (throwOnError) throw new Error('Contact information required');
          return;
        }
        const errorMsg = data.error || 'Failed to create task';
        setError(errorMsg);
        setLoading(false);
        if (throwOnError) throw new Error(errorMsg);
        return;
      }

      setLoading(false);
      router.push('/tasks/mine');
      router.refresh();
    } catch (err: any) {
      const errorMsg = err.message || 'An unexpected error occurred';
      setError(errorMsg);
      setLoading(false);
      if (throwOnError) throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPendingSubmit(true);
    await submitTask();
    setPendingSubmit(false);
  };

  // Minimum datetime for deadline (now + 5 minutes)
  const getMinDeadline = () => {
    const d = new Date(Date.now() + 5 * 60 * 1000);
    return d.toISOString().slice(0, 16);
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

          {/* Title */}
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

          {/* Description */}
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

          {/* Skills Required */}
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

          {/* Payment Method */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-white">
              Payment Method
            </label>
            <select
              value={paymentType}
              onChange={(e) => {
                const val = e.target.value as 'stipend' | 'other' | '';
                setPaymentType(val);
                // Clear opposite fields on switch
                if (val === 'stipend') {
                  setPaymentOtherDetails('');
                } else if (val === 'other') {
                  setStipendMin('');
                  setStipendMax('');
                } else {
                  setStipendMin('');
                  setStipendMax('');
                  setPaymentOtherDetails('');
                }
              }}
              className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 min-h-[44px] appearance-none"
            >
              <option value="">Select payment method</option>
              <option value="stipend">Stipend</option>
              <option value="other">Other (Please specify)</option>
            </select>

            {/* Consistent-height container to prevent layout shift */}
            <div className="min-h-0">
              {paymentType === 'stipend' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                  <div>
                    <label htmlFor="stipend-min" className="block text-xs font-medium text-white/70 mb-1">
                      Min Stipend (₹) <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="stipend-min"
                      type="number"
                      min="0"
                      value={stipendMin}
                      onChange={(e) => setStipendMin(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 min-h-[44px]"
                      placeholder="e.g., 3000"
                    />
                  </div>
                  <div>
                    <label htmlFor="stipend-max" className="block text-xs font-medium text-white/70 mb-1">
                      Max Stipend (₹) <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="stipend-max"
                      type="number"
                      min="0"
                      value={stipendMax}
                      onChange={(e) => setStipendMax(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 min-h-[44px]"
                      placeholder="e.g., 10000"
                    />
                  </div>
                </div>
              )}

              {paymentType === 'other' && (
                <div className="animate-fade-in">
                  <label htmlFor="payment-other" className="block text-xs font-medium text-white/70 mb-1">
                    Payment Details <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="payment-other"
                    type="text"
                    value={paymentOtherDetails}
                    onChange={(e) => setPaymentOtherDetails(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 min-h-[44px]"
                    placeholder="e.g., Equity-based, Revenue share, Certificate + LOR"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Mode of Work */}
          <div>
            <label htmlFor="mode-of-work" className="block text-sm font-medium text-white mb-2">
              Mode of Work
            </label>
            <select
              id="mode-of-work"
              value={modeOfWork}
              onChange={(e) => setModeOfWork(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 min-h-[44px] appearance-none"
            >
              <option value="">Select mode of work</option>
              {MODE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Application Deadline */}
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-white mb-2">
              Application Deadline
            </label>
            <input
              id="deadline"
              type="datetime-local"
              value={applicationDeadline}
              onChange={(e) => setApplicationDeadline(e.target.value)}
              min={getMinDeadline()}
              className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 min-h-[44px] [color-scheme:dark]"
            />
            <p className="mt-2 text-sm text-white/60">
              Leave empty for no deadline. Applications will close automatically at this time.
            </p>
          </div>

          {/* Attachments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-white">
                Attachments
              </label>
              <button
                type="button"
                onClick={addAttachmentRow}
                className="text-sm text-purple-300 hover:text-purple-200 font-semibold transition-colors px-3 py-1 rounded-lg hover:bg-purple-500/10 touch-manipulation"
              >
                + Add Attachment
              </button>
            </div>

            {attachments.length === 0 && (
              <p className="text-sm text-white/50">No attachments added. Click "Add Attachment" to include links to GitHub, Figma, etc.</p>
            )}

            <div className="space-y-3">
              {attachments.map((att, index) => (
                <div
                  key={att.id}
                  className="flex flex-col sm:flex-row gap-2 p-3 bg-slate-800/40 rounded-lg border border-purple-400/20 animate-fade-in"
                >
                  <select
                    value={att.category}
                    onChange={(e) => updateAttachment(att.id, 'category', e.target.value)}
                    className="sm:w-40 px-3 py-2.5 bg-gray-900/50 border border-purple-500/50 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 min-h-[44px] appearance-none flex-shrink-0"
                  >
                    {ATTACHMENT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <input
                    type="url"
                    value={att.link}
                    onChange={(e) => updateAttachment(att.id, 'link', e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2.5 bg-gray-900/50 border border-purple-500/50 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => removeAttachmentRow(att.id)}
                    className="sm:w-10 min-h-[44px] flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors touch-manipulation flex-shrink-0"
                    title="Remove attachment"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
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
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone_number: phoneNumber }),
            });

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || 'Failed to save phone number');
            }

            // Verify the phone number was actually saved
            const verifyResponse = await fetch('/api/profile');
            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              if (!verifyData.profile?.phone_number) {
                throw new Error('Phone number was not saved. Please try again.');
              }
            }

            await new Promise(resolve => setTimeout(resolve, 200));
            await submitTask(true);
            setShowPhoneModal(false);
          } catch (err: any) {
            throw err;
          }
        }}
      />
    </div>
  );
}
