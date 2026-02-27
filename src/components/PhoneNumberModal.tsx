'use client';

import { useState, useEffect } from 'react';

interface PhoneNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (phoneNumber: string) => Promise<void>;
  context?: 'create_task' | 'apply_task';
}

export default function PhoneNumberModal({ isOpen, onClose, onSave, context = 'create_task' }: PhoneNumberModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('+91 ');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPhoneNumber('+91 ');
      setError(null);
      // Lock body scroll while modal is open
      const prevOverflow = document.body.style.overflow;
      const prevPadding = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.paddingRight = prevPadding;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validatePhone = (phone: string): boolean => {
    // Remove +91 prefix and spaces for validation
    const cleaned = phone.replace(/^\+91\s*/, '').trim();
    return /^[0-9]{10,15}$/.test(cleaned);
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Ensure +91 prefix is always present
    if (!value.startsWith('+91')) {
      value = '+91 ' + value.replace(/^\+91\s*/, '');
    }
    
    // Only allow digits after +91
    const afterPrefix = value.substring(4);
    const digitsOnly = afterPrefix.replace(/\D/g, '');
    
    if (digitsOnly.length <= 15) {
      setPhoneNumber('+91 ' + digitsOnly);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleaned = phoneNumber.replace(/^\+91\s*/, '').trim();
    if (!cleaned) {
      setError('Phone number is required');
      return;
    }

    if (!validatePhone(phoneNumber)) {
      setError('Phone number must be 10-15 digits after +91');
      return;
    }

    setSaving(true);
    try {
      await onSave(cleaned);
      setPhoneNumber('+91 ');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save phone number');
    } finally {
      setSaving(false);
    }
  };

  const contextMessage = context === 'apply_task' 
    ? 'apply to tasks' 
    : 'create tasks';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm overscroll-contain"
      style={{ 
        paddingTop: 'env(safe-area-inset-top)', 
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <div className="bg-slate-900 rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-purple-400/30 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-4">Phone Number Required</h2>
        <p className="text-white/80 mb-4">
          A phone number is required to {contextMessage}. 
          Please enter your phone number below.
        </p>

        <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3 mb-6">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-200 leading-relaxed">
              <strong className="font-semibold">Privacy Notice:</strong> Your phone number will only be shared with users whose applications you accept (if creating tasks) or with task creators who accept your application (if applying to tasks). It will not be shared with anyone else or used for any other purpose.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="phone" className="block text-sm font-semibold text-white/90 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-white/70">
                <span className="text-lg">🇮🇳</span>
              </div>
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={handlePhoneInputChange}
                placeholder="+91 1234567890"
                className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-purple-400/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                maxLength={20}
              />
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
            <p className="mt-2 text-xs text-white/60">
              Enter 10-15 digits (numbers only, +91 prefix included)
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors touch-manipulation disabled:opacity-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[44px] px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] touch-manipulation"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
