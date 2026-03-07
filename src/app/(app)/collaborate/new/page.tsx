'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppCard } from '@/components/ui/app-card';
import { ArrowLeft, X, Info } from 'lucide-react';
import Link from 'next/link';

export default function NewCollaborationPage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [skillInput, setSkillInput] = useState('');
    const [skills, setSkills] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addSkill = () => {
        const trimmed = skillInput.trim();
        if (trimmed && !skills.includes(trimmed)) {
            setSkills(prev => [...prev, trimmed]);
            setSkillInput('');
        }
    };

    const removeSkill = (skill: string) => {
        setSkills(prev => prev.filter(s => s !== skill));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addSkill();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/collaborate/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    skills_needed: skills,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to create post');
                return;
            }

            router.push('/collaborate');
        } catch (err) {
            setError('An unexpected error occurred');
            console.error('Error creating collab post:', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="opacity-0 animate-fade-in-up max-w-2xl mx-auto py-6 md:py-8">
            <Link
                href="/collaborate"
                className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm font-medium mb-6 group transition-colors"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                Back to Collaborate
            </Link>

            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-100 mb-2">Post a Request</h1>
            <p className="text-slate-400 text-sm sm:text-base mb-6">Describe what you need help with and the skills required</p>

            {error && (
                <div className="bg-rose-900 border border-rose-800 text-rose-200 px-4 py-3 rounded-lg mb-4">
                    {error}
                </div>
            )}

            <AppCard>
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g., Need help with Data Structures assignment"
                            required
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">What do you need help with?</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Describe what you need help with in detail..."
                            required
                            rows={5}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none transition-all"
                        />
                    </div>

                    {/* Skills Needed */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Skills Needed</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {skills.map(skill => (
                                <span
                                    key={skill}
                                    className="inline-flex items-center gap-1 bg-indigo-900/40 text-indigo-300 text-xs px-3 py-1.5 rounded-lg border border-indigo-700/50 font-medium"
                                >
                                    {skill}
                                    <button
                                        type="button"
                                        onClick={() => removeSkill(skill)}
                                        className="text-indigo-400 hover:text-indigo-200 transition-colors ml-0.5"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={skillInput}
                                onChange={e => setSkillInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a skill and press Enter"
                                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                            />
                            <button
                                type="button"
                                onClick={addSkill}
                                className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-all text-sm font-medium"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Campus */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Campus</label>
                        <input
                            type="text"
                            value="IIT Mandi"
                            readOnly
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-400 text-sm cursor-not-allowed"
                        />
                    </div>

                    {/* Cross-campus toggle (disabled) */}
                    <div className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-700/40 rounded-xl">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-400">Open to cross-campus</span>
                            <div className="relative group">
                                <Info className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl z-10">
                                    Coming soon
                                </div>
                            </div>
                        </div>
                        <div className="w-10 h-6 bg-slate-700/50 rounded-full relative cursor-not-allowed opacity-50">
                            <div className="absolute left-1 top-1 w-4 h-4 bg-slate-500 rounded-full" />
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting || !title.trim() || !description.trim()}
                        className="w-full min-h-[48px] bg-indigo-600 text-white py-3 px-6 rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] font-semibold text-sm touch-manipulation"
                    >
                        {submitting ? 'Posting...' : 'Post Request'}
                    </button>
                </form>
            </AppCard>
        </div>
    );
}
