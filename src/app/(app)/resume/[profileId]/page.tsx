'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Download, ChevronLeft, EyeOff } from 'lucide-react';
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

// Isolated resume HTML for PDF generation (No Tailwind, no CSS vars)
function generateResumeHTML(resume: any, profile: any): string {
    const workExperience = resume.work_experience || [];
    const education = resume.education || [];
    const projects = resume.academic_projects || [];
    const achievements = resume.extra_curricular || [];
    const skills = resume.skills || [];

    return `
      <div style="font-family: Georgia, serif; color: #222; line-height: 1.6; background: white; padding: 40px;">
        <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 4px 0; text-transform: uppercase; color: #000;">${profile.name ?? ''}</h1>
        <div style="font-size: 13px; color: #555; margin-bottom: 12px;">
          ${[profile.college, profile.phone_number, profile.email].filter(Boolean).join(' | ')}
        </div>
        <hr style="border: none; border-top: 1px solid #ccc; margin-bottom: 16px;" />
        
        ${resume.career_objective ? `
          <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 16px 0 8px 0; color: #000;">Summary</h2>
          <p style="margin: 0 0 12px 0; font-size: 13px; white-space: pre-line;">${resume.career_objective}</p>
        ` : ''}

        ${workExperience.length ? `
          <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 16px 0 8px 0; color: #000;">Work Experience</h2>
          ${workExperience.map((exp: any) => `
            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px;">
                <span>${exp.role ?? ''}</span>
                <span style="font-weight: normal; color: #666;">${exp.duration ?? ''}</span>
              </div>
              <div style="font-style: italic; color: #555; font-size: 12px;">${exp.company ?? ''}</div>
              <p style="margin: 4px 0 0 0; font-size: 13px; white-space: pre-line;">${exp.description ?? ''}</p>
            </div>
          `).join('')}
        ` : ''}

        ${projects.length ? `
          <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 16px 0 8px 0; color: #000;">Projects</h2>
          ${projects.map((p: any) => `
            <div style="margin-bottom: 10px;">
              <div style="font-weight: bold; font-size: 13px;">${p.title ?? ''}</div>
              <div style="font-size: 13px; white-space: pre-line;">${p.description ?? ''}</div>
            </div>
          `).join('')}
        ` : ''}

        ${education.length ? `
          <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 16px 0 8px 0; color: #000;">Education</h2>
          ${education.map((edu: any) => `
            <div style="margin-bottom: 8px; font-size: 13px; display: flex; justify-content: space-between;">
              <div>
                <div style="font-weight: bold;">${edu.institution ?? ''}</div>
                <div style="color: #555;">${edu.degree ?? ''}</div>
              </div>
              <div style="text-align: right; color: #666;">${edu.year ?? ''}</div>
            </div>
          `).join('')}
        ` : ''}

        ${achievements.length ? `
          <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 16px 0 8px 0; color: #000;">Achievements</h2>
          <ul style="padding-left: 18px; margin: 0; font-size: 13px;">
            ${achievements.map((a: any) => `<li>${a.description || a}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `;
}

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
                    <p style={{ margin: '0', fontSize: '14px', textAlign: 'justify', whiteSpace: 'pre-line' }}>{basicInfo.summary}</p>
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

export default function PublicResumePage({ params }: { params: Promise<{ profileId: string }> }) {
    const { profileId } = use(params);
    const router = useRouter();
    const supabase = createClient();
    const printTargetRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPublic, setIsPublic] = useState<boolean>(true);

    const [basicInfo, setBasicInfo] = useState<BasicInfo>({
        name: '', email: '', phone: '', city: '', linkedin: '', github: '', portfolio: '', summary: ''
    });
    const [education, setEducation] = useState<Education[]>([]);
    const [experience, setExperience] = useState<Experience[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);

    const [rawProfile, setRawProfile] = useState<any>(null);
    const [rawResume, setRawResume] = useState<any>(null);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // Fetch profile data
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', profileId)
                    .single();

                if (profileError || !profile) {
                    throw new Error('Student profile not found');
                }

                // Check if resume is public
                if (profile.is_resume_public === false) {
                    setIsPublic(false);
                    setLoading(false);
                    return;
                }

                // Fetch resume data
                const { data: resumeData, error: resumeError } = await supabase
                    .from('skillantra_resumes')
                    .select('*')
                    .eq('student_id', profileId)
                    .maybeSingle();

                if (!resumeData) {
                    throw new Error('Resume not found for this student');
                }

                setRawProfile(profile);
                setRawResume(resumeData);

                const links = resumeData.portfolio_links as any || {};
                setBasicInfo({
                    name: profile.name || '',
                    email: profile.email || '',
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

                // Preload html2pdf
                loadHtml2Pdf();
            } catch (err: any) {
                console.error("Load resume error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [profileId, supabase]);

    const handleGeneratePdf = async () => {
        if (!rawProfile || !rawResume) return;

        setGenerating(true);
        try {
            const { default: html2canvas } = await import('html2canvas');
            const { default: jsPDF } = await import('jspdf');

            // Create isolated div with NO inherited styles
            const printDiv = document.createElement('div');
            printDiv.setAttribute('style', [
                'position: fixed',
                'top: -99999px',
                'left: -99999px',
                'width: 794px', // A4 width at 96 DPI
                'background: #ffffff',
                'color: #222222',
                'font-family: Georgia, serif',
                'padding: 40px',
                'line-height: 1.6',
                'font-size: 14px',
                'z-index: -1',
                'isolation: isolate',
            ].join(';'));

            // Generate resume HTML with ONLY inline styles
            printDiv.innerHTML = generateResumeHTML(rawResume, rawProfile);
            document.body.appendChild(printDiv);

            const canvas = await html2canvas(printDiv, {
                scale: 2,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                logging: false,
                ignoreElements: (el) => {
                    // Ignore any element that might have lab() colors or external styles
                    return el.tagName === 'STYLE' || el.tagName === 'LINK';
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`resume-${rawProfile.name?.replace(/\s+/g, '-') ?? 'download'}.pdf`);
        } catch (err: any) {
            console.error('PDF Generation error:', err);
        } finally {
            const printDiv = document.querySelector('[style*="top: -99999px"]');
            if (printDiv) document.body.removeChild(printDiv);
            setGenerating(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    if (!isPublic) {
        return (
            <div className="max-w-4xl mx-auto py-20 px-4 text-center">
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 shadow-2xl">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700">
                        <EyeOff className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-100 mb-4">Resume Private</h1>
                    <p className="text-slate-400 text-lg max-w-md mx-auto mb-8">
                        This student has not made their resume public.
                    </p>
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20"
                    >
                        <ChevronLeft className="w-5 h-5" /> Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto py-20 px-4 text-center">
                <div className="bg-rose-950/20 border border-rose-900/50 rounded-3xl p-12 shadow-2xl">
                    <h1 className="text-3xl font-bold text-rose-200 mb-4">Unavailable</h1>
                    <p className="text-rose-300 text-lg mb-8">{error}</p>
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition-all border border-slate-700"
                    >
                        <ChevronLeft className="w-5 h-5" /> Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-950 min-h-screen py-8 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
                {/* Actions Header */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800 sticky top-4 z-10 shadow-2xl">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors font-medium px-2"
                    >
                        <ChevronLeft className="w-5 h-5" /> Back to Applicants
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handleGeneratePdf}
                            disabled={generating}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                        >
                            {generating ? <span className="animate-spin text-lg">↻</span> : <Download className="w-4 h-4" />}
                            {generating ? 'Generating...' : 'Download PDF'}
                        </button>
                    </div>
                </div>

                {/* Resume Paper */}
                <div className="bg-white rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden scale-[1.01] transition-transform">
                    <ResumeContent
                        basicInfo={basicInfo}
                        education={education}
                        experience={experience}
                        projects={projects}
                        achievements={achievements}
                    />
                </div>

                <p className="text-center text-slate-500 text-sm mt-12 mb-8">
                    Strictly for recruitment purposes via Skillantra.
                </p>
            </div>

            {/* Hidden Print Target */}
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
        </div>
    );
}
