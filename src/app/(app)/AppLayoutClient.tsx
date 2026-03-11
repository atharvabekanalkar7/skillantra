'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import { useSearchParams, usePathname, redirect } from 'next/navigation';

interface AppLayoutClientProps {
    children: React.ReactNode;
    profileComplete: boolean;
    isDemo?: boolean;
}

export default function AppLayoutClient({ children, profileComplete, isDemo: isDemoProp }: AppLayoutClientProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const isDemo = isDemoProp || searchParams?.get('demo') === 'true';
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        if (typeof window === 'undefined') return true;
        const stored = localStorage.getItem('sidebar-open');
        return stored === null ? true : stored !== 'false';
    });

    // Global profile completion guard
    const isCompleteProfilePath = pathname === '/complete-profile';
    const isAuthPath = pathname.startsWith('/auth');
    const isApiPath = pathname.startsWith('/api');

    if (!profileComplete && !isCompleteProfilePath && !isAuthPath && !isApiPath) {
        redirect('/complete-profile');
    }

    const handleToggle = () => {
        setIsSidebarOpen(prev => {
            const newState = !prev;
            localStorage.setItem('sidebar-open', String(newState));
            return newState;
        });
    };

    return (
        <div className="min-h-screen bg-slate-950 flex relative overflow-x-hidden overflow-y-visible">
            <Sidebar
                isDemo={isDemo}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onToggle={handleToggle}
                profileComplete={profileComplete}
            />
            <MobileHeader onMenuToggle={() => setIsSidebarOpen((o) => !o)} isDemo={isDemo} />

            <main
                className={`flex-1 w-full min-w-0 pt-14 md:pt-0 px-4 sm:px-6 md:px-8 pb-8 md:pb-8 relative z-10 transition-all duration-200 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'
                    }`}
                style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
            >
                {children}
            </main>
        </div>
    );
}
