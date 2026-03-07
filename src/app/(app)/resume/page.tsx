'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Plus, Trash2, Download, Save, CheckCircle } from 'lucide-react';
import { AppCard } from '@/components/ui/app-card';
import { useDemoGuard } from '@/lib/utils/useDemoGuard';

declare global {
    interface Window {
        html2pdf: any;
    }
}

function loadHtml2Pdf(): Promise<boolean> {
    return new Promise((resolve) => {
        if (typeof window !== 'undefined' && window.html2pdf) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

// Interfaces
interface BasicInfo {
    name: string;
    email: string;
    phone: string;
    linkedin: string;
    github: string;
    portfolio: string;
}

interface Education {
    id: string;
    degree: string;
    institution: string;
    year: string;
    grade: string;
}

interface Experience {
    id: string;
    role: string;
    company: string;
    duration: string;
    description: string;
}

interface Project {
    id: string;
    title: string;
    link: string;
    description: string;
}

interface Achievement {
    id: string;
    description: string;
}

export default function ResumeBuilderPage() {
    const router = useRouter();
    const { guardAction } = useDemoGuard();
    const supabase = createClient();
    const previewRef = useRef<HTMLDivElement>(null);

    // State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [studentId, setStudentId] = useState<string | null>(null);
    const [resumeId, setResumeId] = useState<string | null>(null);

    // Form data
    const [basicInfo, setBasicInfo] = useState<BasicInfo>({
        name: '', email: '', phone: '', linkedin: '', github: '', portfolio: ''
    });
    const [education, setEducation] = useState<Education[]>([]);
    const [experience, setExperience] = useState<Experience[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);

    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    }, []);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, user_type, name')
                    .eq('user_id', user.id)
                    .single();

                if (!profile) throw new Error('Profile not found');

                // Allow both students and recruiters for demo purposes, but ideally only students
                setStudentId(profile.id);

                // Fetch existing resume
                const { data: resumeData } = await supabase
                    .from('skillantra_resumes')
                    .select('*')
                    .eq('student_id', profile.id)
                    .single();

                if (resumeData) {
                    setResumeId(resumeData.id);
                    setBasicInfo(resumeData.basic_info || { name: profile.name || '', email: user.email || '', phone: '', linkedin: '', github: '', portfolio: '' });
                    setEducation(resumeData.education || []);
                    setExperience(resumeData.experience || []);
                    setProjects(resumeData.projects || []);
                    setAchievements(resumeData.achievements || []);
                } else {
                    setBasicInfo(prev => ({ ...prev, name: profile.name || '', email: user.email || '' }));
                }

                // Preload html2pdf
                loadHtml2Pdf();
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [router, supabase]);

    // Handlers
    const handleSaveProgress = guardAction(async () => {
        if (!studentId) return;
        setSaving(true);
        try {
            const payload = {
                student_id: studentId,
                basic_info: basicInfo,
                education,
                experience,
                projects,
                achievements,
                updated_at: new Date().toISOString()
            };

            if (resumeId) {
                await supabase.from('skillantra_resumes').update(payload).eq('id', resumeId);
            } else {
                const { data } = await supabase.from('skillantra_resumes').insert(payload).select('id').single();
                if (data) setResumeId(data.id);
            }
            showToast('Progress saved successfully');
        } catch {
            showToast('Failed to save progress');
        } finally {
            setSaving(false);
        }
    });

    const handleGeneratePdf = guardAction(async () => {
        if (!studentId || !previewRef.current) return;

        const loaded = await loadHtml2Pdf();
        if (!loaded) {
            showToast('Failed to load PDF generator tool.');
            return;
        }

        setGenerating(true);
        handleSaveProgress(); // auto-save before generating

        try {
            // Temporary styles for PDF generation
            const element = previewRef.current;
            element.classList.add('pdf-mode');

            // Force light theme and white background for the PDF element temporarily
            const originalBg = element.style.backgroundColor;
            const originalColor = element.style.color;
            element.style.backgroundColor = '#ffffff';
            element.style.color = '#000000';

            const opt = {
                margin: 10,
                filename: `${basicInfo.name.replace(/\s+/g, '_')}_Resume.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // Generate Blob instead of downloading directly
            const pdfBlob = await window.html2pdf().set(opt).from(element).output('blob');

            // Restore styles
            element.style.backgroundColor = originalBg;
            element.style.color = originalColor;
            element.classList.remove('pdf-mode');

            // Upload to Supabase bucket
            const fileName = `${studentId}_${Date.now()}.pdf`;
            const { error: uploadError } = await supabase.storage
                .from('resumes')
                .upload(fileName, pdfBlob, {
                    contentType: 'application/pdf',
                    upsert: true
                });

            if (uploadError) throw new Error('Failed to upload PDF: ' + uploadError.message);

            const { data: { publicUrl } } = supabase.storage
                .from('resumes')
                .getPublicUrl(fileName);

            // Save resume URL to profile
            await supabase.from('profiles').update({ resume_url: publicUrl }).eq('id', studentId);

            showToast('PDF Generated & Saved to Profile successfully!');

            // Trigger download for the user automatically
            const link = document.createElement('a');
            link.href = URL.createObjectURL(pdfBlob);
            link.download = opt.filename;
            link.click();

        } catch (err: any) {
            console.error('PDF Generation error:', err);
            showToast('An error occurred during PDF generation');
        } finally {
            setGenerating(false);
        }
    });

    // Array manipulators
    const addItem = <T extends { id: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, defaultItem: Omit<T, 'id'>) => {
        setter(prev => [...prev, { ...defaultItem, id: crypto.randomUUID() } as T]);
    };

    const removeItem = <T extends { id: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: string) => {
        setter(prev => prev.filter(item => item.id !== id));
    };

    const updateItem = <T extends { id: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: string, field: keyof T, value: string) => {
        setter(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    if (loading) return <LoadingSpinner />;

    if (error) return (
        <div className="max-w-4xl mx-auto py-8 text-center text-rose-400">
            Error: {error}
        </div>
    );

    return (
        <div className="opacity-0 animate-fade-in-up py-6 md:py-8 px-4 sm:px-6 max-w-[1400px] mx-auto">
            {toast && (
                <div className="fixed top-5 right-5 z-50 bg-slate-800 border border-slate-700 text-slate-100 px-5 py-3 rounded-xl shadow-lg animate-fade-in-up flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    {toast}
                </div>
            )}

            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">Interactive Resume Builder</h1>
                    <p className="text-slate-400 text-sm mt-1">Build a professional resume and save it directly to your profile.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSaveProgress}
                        disabled={saving || generating}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-700 disabled:opacity-50"
                    >
                        {saving ? <span className="animate-spin text-lg">↻</span> : <Save className="w-4 h-4" />}
                        Save Progress
                    </button>
                    <button
                        onClick={handleGeneratePdf}
                        disabled={generating || saving}
                        className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                    >
                        {generating ? <span className="animate-spin text-lg">↻</span> : <Download className="w-4 h-4" />}
                        Generate PDF & Save
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left side: Editor */}
                <div className="space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto pr-2 custom-scrollbar">

                    {/* Basic Info */}
                    <AppCard>
                        <h2 className="text-lg font-semibold text-slate-100 mb-4 pb-2 border-b border-slate-800">Basic Information</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                                <input type="text" value={basicInfo.name} onChange={e => setBasicInfo({ ...basicInfo, name: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                                <input type="email" value={basicInfo.email} onChange={e => setBasicInfo({ ...basicInfo, email: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Phone</label>
                                <input type="text" value={basicInfo.phone} onChange={e => setBasicInfo({ ...basicInfo, phone: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">LinkedIn URL</label>
                                <input type="url" value={basicInfo.linkedin} onChange={e => setBasicInfo({ ...basicInfo, linkedin: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">GitHub URL</label>
                                <input type="url" value={basicInfo.github} onChange={e => setBasicInfo({ ...basicInfo, github: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Portfolio (Optional)</label>
                                <input type="url" value={basicInfo.portfolio} onChange={e => setBasicInfo({ ...basicInfo, portfolio: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
                            </div>
                        </div>
                    </AppCard>

                    {/* Education */}
                    <AppCard>
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
                            <h2 className="text-lg font-semibold text-slate-100">Education</h2>
                            <button onClick={() => addItem(setEducation, { degree: '', institution: '', year: '', grade: '' })} className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-indigo-400 px-2.5 py-1.5 rounded-md transition-colors font-medium border border-slate-700">
                                <Plus className="w-3.5 h-3.5" /> Add
                            </button>
                        </div>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {education.map((edu, i) => (
                                <div key={edu.id} className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg relative group">
                                    <button onClick={() => removeItem(setEducation, edu.id)} className="absolute top-3 right-3 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                                        <div>
                                            <input type="text" placeholder="Degree / Course" value={edu.degree} onChange={e => updateItem(setEducation, edu.id, 'degree', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:border-indigo-500 mb-2" />
                                            <input type="text" placeholder="Institution Name" value={edu.institution} onChange={e => updateItem(setEducation, edu.id, 'institution', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:border-indigo-500" />
                                        </div>
                                        <div>
                                            <input type="text" placeholder="Year (e.g. 2020-2024)" value={edu.year} onChange={e => updateItem(setEducation, edu.id, 'year', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:border-indigo-500 mb-2" />
                                            <input type="text" placeholder="Grade / CGPA" value={edu.grade} onChange={e => updateItem(setEducation, edu.id, 'grade', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:border-indigo-500" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {education.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No education added yet.</p>}
                        </div>
                    </AppCard>

                    {/* Experience */}
                    <AppCard>
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
                            <h2 className="text-lg font-semibold text-slate-100">Experience</h2>
                            <button onClick={() => addItem(setExperience, { role: '', company: '', duration: '', description: '' })} className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-indigo-400 px-2.5 py-1.5 rounded-md transition-colors font-medium border border-slate-700">
                                <Plus className="w-3.5 h-3.5" /> Add
                            </button>
                        </div>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {experience.map((exp) => (
                                <div key={exp.id} className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg relative group">
                                    <button onClick={() => removeItem(setExperience, exp.id)} className="absolute top-3 right-3 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                    <div className="grid grid-cols-1 gap-3 mt-1">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <input type="text" placeholder="Role / Job Title" value={exp.role} onChange={e => updateItem(setExperience, exp.id, 'role', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:border-indigo-500" />
                                            <input type="text" placeholder="Company Name" value={exp.company} onChange={e => updateItem(setExperience, exp.id, 'company', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:border-indigo-500" />
                                        </div>
                                        <input type="text" placeholder="Duration (e.g. Jan 2023 - Present)" value={exp.duration} onChange={e => updateItem(setExperience, exp.id, 'duration', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:border-indigo-500" />
                                        <textarea placeholder="Description of responsibilities and achievements" rows={3} value={exp.description} onChange={e => updateItem(setExperience, exp.id, 'description', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:border-indigo-500 resize-none" />
                                    </div>
                                </div>
                            ))}
                            {experience.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No experience added. (You can skip this if you're a fresher)</p>}
                        </div>
                    </AppCard>

                    {/* Projects */}
                    <AppCard>
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
                            <h2 className="text-lg font-semibold text-slate-100">Projects</h2>
                            <button onClick={() => addItem(setProjects, { title: '', link: '', description: '' })} className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-indigo-400 px-2.5 py-1.5 rounded-md transition-colors font-medium border border-slate-700">
                                <Plus className="w-3.5 h-3.5" /> Add
                            </button>
                        </div>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {projects.map((proj) => (
                                <div key={proj.id} className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg relative group">
                                    <button onClick={() => removeItem(setProjects, proj.id)} className="absolute top-3 right-3 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                    <div className="grid grid-cols-1 gap-3 mt-1">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <input type="text" placeholder="Project Title" value={proj.title} onChange={e => updateItem(setProjects, proj.id, 'title', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:border-indigo-500" />
                                            <input type="url" placeholder="Project Link (Optional)" value={proj.link} onChange={e => updateItem(setProjects, proj.id, 'link', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:border-indigo-500" />
                                        </div>
                                        <textarea placeholder="Description (Tech stack used, problem solved, etc.)" rows={3} value={proj.description} onChange={e => updateItem(setProjects, proj.id, 'description', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:border-indigo-500 resize-none" />
                                    </div>
                                </div>
                            ))}
                            {projects.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No projects added yet.</p>}
                        </div>
                    </AppCard>

                    {/* Achievements */}
                    <AppCard>
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
                            <h2 className="text-lg font-semibold text-slate-100">Achievements & Extra-curriculars</h2>
                            <button onClick={() => addItem(setAchievements, { description: '' })} className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-indigo-400 px-2.5 py-1.5 rounded-md transition-colors font-medium border border-slate-700">
                                <Plus className="w-3.5 h-3.5" /> Add
                            </button>
                        </div>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {achievements.map((ach) => (
                                <div key={ach.id} className="flex gap-3 relative group">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0"></div>
                                    <input type="text" placeholder="e.g. Top 10 in College Hackathon" value={ach.description} onChange={e => updateItem(setAchievements, ach.id, 'description', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:border-indigo-500" />
                                    <button onClick={() => removeItem(setAchievements, ach.id)} className="text-slate-600 hover:text-rose-400 px-1"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                            {achievements.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No achievements added.</p>}
                        </div>
                    </AppCard>

                </div>

                {/* Right side: Live Preview */}
                <div className="lg:sticky lg:top-8 h-max">
                    <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 pl-2 flex items-center justify-between">
                        <span>Live Preview</span>
                        <span className="text-xs normal-case text-amber-500 bg-amber-500/10 px-2 py-1 rounded">A4 Format</span>
                    </h2>

                    {/* The Preview container */}
                    <div className="bg-slate-300 rounded-xl p-4 overflow-hidden border border-slate-700 flex justify-center shadow-2xl">
                        <div
                            ref={previewRef}
                            className="bg-white w-[210mm] min-h-[297mm] shadow-sm p-[20mm] text-[#333] font-sans box-border text-[11pt] leading-relaxed origin-top scale-[0.5] sm:scale-[0.6] lg:scale-[0.5] xl:scale-[0.6] 2xl:scale-[0.7] transition-transform duration-200 pdf-preview-content"
                            style={{ margin: '0 auto', marginBottom: '-50%' }}
                        >
                            {/* Header */}
                            <div className="text-center mb-6">
                                <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900 mb-1">{basicInfo.name || 'Your Name'}</h1>
                                <div className="text-sm text-slate-600 flex flex-wrap justify-center gap-x-3 gap-y-1">
                                    {basicInfo.email && <span>{basicInfo.email}</span>}
                                    {basicInfo.phone && <><span className="text-slate-300">•</span><span>{basicInfo.phone}</span></>}
                                    {basicInfo.linkedin && <><span className="text-slate-300">•</span><span>{basicInfo.linkedin.replace(/https?:\/\/(www\.)?/, '')}</span></>}
                                    {basicInfo.github && <><span className="text-slate-300">•</span><span>{basicInfo.github.replace(/https?:\/\/(www\.)?/, '')}</span></>}
                                </div>
                            </div>

                            {/* Education */}
                            {education.length > 0 && (
                                <div className="mb-5">
                                    <h2 className="text-sm font-bold uppercase border-b border-slate-300 pb-1 mb-3 text-slate-800">Education</h2>
                                    <div className="space-y-3">
                                        {education.map(edu => (
                                            <div key={edu.id} className="flex justify-between items-start text-[10.5pt]">
                                                <div>
                                                    <div className="font-semibold text-slate-800">{edu.degree}</div>
                                                    <div className="italic text-slate-600">{edu.institution}</div>
                                                </div>
                                                <div className="text-right whitespace-nowrap">
                                                    <div className="text-slate-700">{edu.year}</div>
                                                    {edu.grade && <div className="text-slate-600 text-[10pt]">{edu.grade}</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Experience */}
                            {experience.length > 0 && (
                                <div className="mb-5">
                                    <h2 className="text-sm font-bold uppercase border-b border-slate-300 pb-1 mb-3 text-slate-800">Experience</h2>
                                    <div className="space-y-4">
                                        {experience.map(exp => (
                                            <div key={exp.id} className="text-[10.5pt]">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div>
                                                        <span className="font-semibold text-slate-800">{exp.role}</span>
                                                        <span className="text-slate-700"> | {exp.company}</span>
                                                    </div>
                                                    <div className="text-slate-700 whitespace-nowrap">{exp.duration}</div>
                                                </div>
                                                {exp.description && (
                                                    <div className="text-slate-600 text-[10pt] whitespace-pre-line leading-snug">
                                                        {exp.description}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Projects */}
                            {projects.length > 0 && (
                                <div className="mb-5">
                                    <h2 className="text-sm font-bold uppercase border-b border-slate-300 pb-1 mb-3 text-slate-800">Projects</h2>
                                    <div className="space-y-3">
                                        {projects.map(proj => (
                                            <div key={proj.id} className="text-[10.5pt]">
                                                <div className="font-semibold text-slate-800 mb-0.5">
                                                    {proj.title}
                                                    {proj.link && <span className="font-normal text-slate-500 text-[9.5pt] ml-2">({proj.link.replace(/https?:\/\/(www\.)?/, '')})</span>}
                                                </div>
                                                {proj.description && (
                                                    <div className="text-slate-600 text-[10pt] whitespace-pre-line leading-snug">
                                                        {proj.description}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Achievements */}
                            {achievements.length > 0 && (
                                <div className="mb-5">
                                    <h2 className="text-sm font-bold uppercase border-b border-slate-300 pb-1 mb-3 text-slate-800">Key Achievements</h2>
                                    <ul className="list-disc pl-5 m-0 space-y-1 text-[10.5pt] text-slate-700">
                                        {achievements.map(ach => (
                                            <li key={ach.id} className="pl-1 leading-snug">{ach.description}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* Global style to help with PDF forcing */}
            <style jsx global>{`
                .pdf-mode * {
                    transition: none !important;
                }
            `}</style>
        </div>
    );
}
