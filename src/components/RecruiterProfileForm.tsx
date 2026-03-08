'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Info, Mail, Phone, FileText, User } from 'lucide-react';

interface RecruiterProfileFormProps {
    initialProfile: any;
}

export default function RecruiterProfileForm({ initialProfile }: RecruiterProfileFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const [email, setEmail] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: initialProfile?.name || '',
        company_name: initialProfile?.company_name || '',
        designation: initialProfile?.designation || '',
        company_description: initialProfile?.company_description || '',
        company_logo_url: initialProfile?.company_logo_url || '',
        phone_number: initialProfile?.phone_number ? '+91 ' + initialProfile.phone_number : '+91 ',
    });

    useEffect(() => {
        if (initialProfile?.email) {
            setEmail(initialProfile.email);
        } else {
            const loadEmail = async () => {
                try {
                    const response = await fetch('/api/profile');
                    const data = await response.json();
                    if (data.profile && data.profile.email) {
                        setEmail(data.profile.email);
                    }
                } catch (err) {
                    console.error('Error loading email:', err);
                }
            };
            loadEmail();
        }
    }, [initialProfile]);

    const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        if (!value.startsWith('+91')) {
            value = '+91 ' + value.replace(/^\+91\s*/, '');
        }
        const afterPrefix = value.substring(4);
        const digitsOnly = afterPrefix.replace(/\D/g, '');
        if (digitsOnly.length <= 15) {
            setFormData(prev => ({ ...prev, phone_number: '+91 ' + digitsOnly }));
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const cleanedPhone = formData.phone_number.replace(/^\+91\s*/, '').trim();

        if (!formData.name.trim() || !formData.company_name.trim() || !formData.designation.trim() || !cleanedPhone) {
            setError('Name, Company Name, Designation, and Phone Number are required.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    company_name: formData.company_name.trim(),
                    designation: formData.designation.trim(),
                    company_description: formData.company_description.trim(),
                    company_logo_url: formData.company_logo_url,
                    phone_number: cleanedPhone,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update profile');
            }

            router.push('/dashboard');
            router.refresh();
        } catch (err: any) {
            console.error('Error updating recruiter profile:', err);
            setError(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {!initialProfile?.is_verified && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">
                        Your account is pending verification. You'll be able to post internships once verified.
                    </p>
                </div>
            )}

            {email && (
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                        Company Email
                    </label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                            <Mail className="w-5 h-5" />
                        </div>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            disabled
                            readOnly
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-400 cursor-not-allowed"
                        />
                    </div>
                </div>
            )}

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                    Your Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <User className="w-5 h-5" />
                    </div>
                    <input
                        id="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        placeholder="John Doe"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-slate-300 mb-2">
                    Company Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <input
                        id="company_name"
                        type="text"
                        required
                        value={formData.company_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        placeholder="e.g. Acme Corp"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="designation" className="block text-sm font-medium text-slate-300 mb-2">
                    Designation <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <User className="w-5 h-5" />
                    </div>
                    <input
                        id="designation"
                        type="text"
                        required
                        value={formData.designation}
                        onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        placeholder="e.g. HR Manager"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-slate-300 mb-2">
                    Phone Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-500">
                        <Phone className="w-4 h-4" />
                    </div>
                    <input
                        id="phone_number"
                        type="tel"
                        required
                        value={formData.phone_number}
                        onChange={handlePhoneInputChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        placeholder="+91 1234567890"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="company_description" className="block text-sm font-medium text-slate-300 mb-2">
                    Company Description
                </label>
                <div className="relative">
                    <div className="absolute left-4 top-3 text-slate-500">
                        <FileText className="w-5 h-5" />
                    </div>
                    <textarea
                        id="company_description"
                        rows={4}
                        value={formData.company_description}
                        onChange={(e) => setFormData(prev => ({ ...prev, company_description: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        placeholder="Tell us about the company..."
                    />
                </div>
            </div>

            <div>
                <label htmlFor="company_logo_url" className="block text-sm font-medium text-slate-300 mb-2">
                    Company Logo URL (Optional)
                </label>
                <input
                    id="company_logo_url"
                    type="url"
                    value={formData.company_logo_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_logo_url: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    placeholder="https://example.com/logo.png"
                />
            </div>

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Saving...' : 'Complete Profile'}
                </button>
            </div>
        </form>
    );
}
