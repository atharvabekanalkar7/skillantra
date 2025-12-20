'use client';

import { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSearchParams } from 'next/navigation';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get('demo') === 'true';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-violet-950 flex relative overflow-hidden">
      {/* Subtle background glows */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]"></div>
      
      <Sidebar isDemo={isDemo} />
      <main className="flex-1 ml-64 p-8 relative z-10">
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-violet-950 flex">
        <Sidebar isDemo={false} />
        <main className="flex-1 ml-64 p-8">
          <div className="flex items-center justify-center p-8">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500/30"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-cyan-400 absolute top-0 left-0"></div>
            </div>
          </div>
        </main>
      </div>
    }>
      <AppLayoutContent>{children}</AppLayoutContent>
    </Suspense>
  );
}

