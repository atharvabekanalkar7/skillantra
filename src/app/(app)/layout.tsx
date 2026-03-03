'use client';

import { Suspense, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import { useSearchParams } from 'next/navigation';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get('demo') === 'true';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex relative overflow-x-hidden overflow-y-visible">
      <Sidebar isDemo={isDemo} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <MobileHeader onMenuToggle={() => setSidebarOpen((o) => !o)} isDemo={isDemo} />

      <main
        className="flex-1 w-full min-w-0 md:ml-64 pt-14 md:pt-0 px-4 sm:px-6 md:px-8 pb-8 md:pb-8 relative z-10"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {children}
      </main>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex overflow-x-hidden overflow-y-visible">
        <Sidebar isDemo={false} />
        <MobileHeader onMenuToggle={() => { }} isDemo={false} />
        <main className="flex-1 w-full min-w-0 md:ml-64 p-4 md:p-8 pt-14 md:pt-8">
          <div className="flex items-center justify-center p-8 min-h-[200px]">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500 absolute top-0 left-0"></div>
            </div>
          </div>
        </main>
      </div>
    }>
      <AppLayoutContent>{children}</AppLayoutContent>
    </Suspense>
  );
}
