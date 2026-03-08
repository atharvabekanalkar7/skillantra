'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Plus, Trash2, Download, Save, CheckCircle, FileText } from 'lucide-react';
import { AppCard } from '@/components/ui/app-card';
import { useDemoGuard } from '@/lib/utils/useDemoGuard';
import html2canvas from 'html2canvas';

// Inject EB Garamond font stylesheet
const FONT_LINK = "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&display=swap";

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
    city: string;
    linkedin: string;
    github: string;
    portfolio: string;
    summary: string;
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

// ─── Shared Resume Content Component ──────────────────────────────────────
// This component is used for BOTH the live preview and the isolated print target.
// It uses strictly inline styles to bypass Tailwind/CSS parsing issues in html2canvas.

const ResumeContent = ({
    basicInfo,
    education,
    experience,
    projects,
    achievements
}: {
    basicInfo: BasicInfo,
    education: Education[],
    experience: Experience[],
    projects: Project[],
    achievements: Achievement[]
}) => {
    const hasData = (field: any) => field && field.length > 0;
    const hasBasic = (val: string) => val && val.trim().length > 0;

    return (
        <div id="resume-content-wrapper" style={{
            fontFamily: "'EB Garamond', serif",
            padding: "40px",
            color: "#222",
            lineHeight: "1.6",
            background: "#fff",
            width: "100%",
            boxSizing: "border-box"
        }}>
            <style dangerouslySetInnerHTML={{ __html: `@import url('${FONT_LINK}');` }} />

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: 'bold', textTransform: 'uppercase', color: '#000' }}>
                    {basicInfo.name || 'Your Name'}
                </h1>
                <div style={{ fontSize: '14px', color: '#444', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
                    {hasBasic(basicInfo.city) && <span>{basicInfo.city}</span>}
                    {hasBasic(basicInfo.phone) && (<span>{hasBasic(basicInfo.city) && " | "}{basicInfo.phone}</span>)}
                    {hasBasic(basicInfo.email) && (<span>{(hasBasic(basicInfo.city) || hasBasic(basicInfo.phone)) && " | "}{basicInfo.email}</span>)}
                </div>
                <div style={{ fontSize: '14px', color: '#444', marginTop: '4px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
                    {hasBasic(basicInfo.linkedin) && <span>LinkedIn: {basicInfo.linkedin.replace(/https?:\/\/(www\.)?/, '')}</span>}
                    {hasBasic(basicInfo.github) && <span>{(hasBasic(basicInfo.linkedin)) && " | "}GitHub: {basicInfo.github.replace(/https?:\/\/(www\.)?/, '')}</span>}
                </div>
            </div>

            <hr style={{ border: "none", borderTop: "2px solid #333", marginBottom: "20px" }} />

            {/* Summary */}
            {hasBasic(basicInfo.summary) && (
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: '3px', marginTop: '0', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000' }}>Summary</h2>
                    <p style={{ margin: '0', fontSize: '14px', textAlign: 'justify' }}>{basicInfo.summary}</p>
                </div>
            )}

            {/* Experience */}
            {hasData(experience) && (
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: '3px', marginTop: '0', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000' }}>Experience</h2>
                    {experience.map(exp => (
                        <div key={exp.id} style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '15px' }}>
                                <span>{exp.role}</span>
                                <span>{exp.duration}</span>
                            </div>
                            <div style={{ fontStyle: 'italic', color: '#444', marginBottom: '4px', fontSize: '14px' }}>{exp.company}</div>
                            {hasBasic(exp.description) && (
                                <p style={{ margin: '0', fontSize: '14px', whiteSpace: 'pre-line' }}>{exp.description}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Projects */}
            {hasData(projects) && (
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: '3px', marginTop: '0', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000' }}>Projects</h2>
                    {projects.map(proj => (
                        <div key={proj.id} style={{ marginBottom: '12px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '15px' }}>
                                {proj.title} {hasBasic(proj.link) && <span style={{ fontWeight: 'normal', fontSize: '12px', color: '#666', marginLeft: '5px' }}>({proj.link})</span>}
                            </div>
                            {hasBasic(proj.description) && (
                                <p style={{ margin: '4px 0 0 0', fontSize: '14px', whiteSpace: 'pre-line' }}>{proj.description}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Education */}
            {hasData(education) && (
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: '3px', marginTop: '0', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000' }}>Education</h2>
                    {education.map(edu => (
                        <div key={edu.id} style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{edu.degree}</div>
                                <div style={{ fontSize: '14px' }}>{edu.institution}{hasBasic(edu.grade) && ` | Grade: ${edu.grade}`}</div>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '14px' }}>{edu.year}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Achievements */}
            {hasData(achievements) && (
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: '3px', marginTop: '0', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000' }}>Achievements</h2>
                    <ul style={{ paddingLeft: '20px', margin: '0' }}>
                        {achievements.map(ach => (
                            <li key={ach.id} style={{ fontSize: '14px', marginBottom: '4px' }}>{ach.description}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

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
        name: '', email: '', phone: '', city: '', linkedin: '', github: '', portfolio: '', summary: ''
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
                    .select('id, user_type, name, phone_number')
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
                    .maybeSingle();

                if (resumeData) {
                    setResumeId(resumeData.id);

                    // Map portfolio links and profile data back to basicInfo
                    const links = resumeData.portfolio_links as any || {};
                    setBasicInfo({
                        name: profile.name || '',
                        email: user.email || '',
                        phone: profile.phone_number || links.phone || '',
                        city: links.city || '',
                        linkedin: links.linkedin || '',
                        github: links.github || '',
                        portfolio: links.portfolio || '',
                        summary: resumeData.career_objective || ''
                    });

                    setEducation(resumeData.education || []);
                    setExperience(resumeData.work_experience || []);
                    setProjects(resumeData.academic_projects || []);
                    setAchievements(resumeData.extra_curricular || []);
                } else {
                    setBasicInfo(prev => ({
                        ...prev,
                        name: profile.name || '',
                        email: user.email || '',
                        phone: profile.phone_number || ''
                    }));
                }

                // Preload html2pdf
                loadHtml2Pdf();
            } catch (err: any) {
                console.error("Load data error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [router, supabase]);

    const printTargetRef = useRef<HTMLDivElement>(null);

    // Handlers
    const handleSaveProgress = guardAction(async () => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Find profile to get student_id
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!profile) throw new Error('Profile not found');

            const payload = {
                student_id: profile.id,
                education,
                work_experience: experience,
                academic_projects: projects,
                extra_curricular: achievements,
                portfolio_links: {
                    linkedin: basicInfo.linkedin,
                    github: basicInfo.github,
                    portfolio: basicInfo.portfolio,
                    phone: basicInfo.phone,
                    email: basicInfo.email
                },
                updated_at: new Date().toISOString()
            };

            const { error: saveError } = await supabase
                .from('skillantra_resumes')
                .upsert(payload, { onConflict: 'student_id' });

            if (saveError) throw saveError;

            // Also update profile name/phone if they changed
            await supabase
                .from('profiles')
                .update({
                    name: basicInfo.name,
                    phone_number: basicInfo.phone
                })
                .eq('id', profile.id);

            showToast('Progress saved successfully');
            return true;
        } catch (err: any) {
            console.error('Save error:', err);
            showToast(err.message || 'Failed to save progress');
            return false;
        } finally {
            setSaving(false);
        }
    });

    const handleGeneratePdf = guardAction(async () => {
        if (!printTargetRef.current) return;

        const loaded = await loadHtml2Pdf();
        if (!loaded) {
            showToast('Failed to load PDF generator tool.');
            return;
        }

        setGenerating(true);

        // 1. Save progress first
        const saved = await handleSaveProgress();
        if (!saved) {
            setGenerating(false);
            return;
        }

        try {
            const printTarget = printTargetRef.current;

            // Set up options
            const fileName = `resume-${basicInfo.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;

            // Generate PDF from the isolated target
            const opt = {
                margin: 0,
                filename: fileName,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    allowTaint: false,
                    backgroundColor: '#ffffff',
                    logging: false
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            await window.html2pdf().set(opt).from(printTarget).save();
            showToast('Resume PDF downloaded successfully!');
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
                                <label className="block text-xs font-medium text-slate-400 mb-1">City / Location</label>
                                <input type="text" value={basicInfo.city} onChange={e => setBasicInfo({ ...basicInfo, city: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-slate-400 mb-1">Professional Summary</label>
                                <textarea rows={3} value={basicInfo.summary} onChange={e => setBasicInfo({ ...basicInfo, summary: e.target.value })} placeholder="Briefly describe your career goals and key strengths..." className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 resize-none" />
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
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700">Auto-scaling</span>
                        </div>
                    </h2>

                    {/* High-fidelity Live Preview with EB Garamond */}
                    <div className="bg-slate-800/40 rounded-xl overflow-hidden border border-slate-700 shadow-2xl min-h-[500px]">
                        <div className="bg-white text-slate-900 shadow-inner">
                            <ResumeContent
                                basicInfo={basicInfo}
                                education={education}
                                experience={experience}
                                projects={projects}
                                achievements={achievements}
                            />
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-3 px-2 italic text-center">
                        Sections without content are automatically hidden. The PDF version will be perfectly formatted for A4.
                    </p>
                </div>
            </div>

            {/* ───── Hidden Print Target ───── */}
            {/* This div is moved off-screen and used strictly for PDF generation via html2canvas */}
            <div style={{ position: 'absolute', left: '-9999px', top: '0', width: '210mm' }}>
                <div ref={printTargetRef} style={{ background: '#fff' }}>
                    <ResumeContent
                        basicInfo={basicInfo}
                        education={education}
                        experience={experience}
                        projects={projects}
                        achievements={achievements}
                    />
                </div>
            </div>

            {/* Global style to help with PDF forcing */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                    border-radius: 10px;
                }
                @media print {
                    .no-print { display: none; }
                }
            `}</style>
        </div>
    );
}
