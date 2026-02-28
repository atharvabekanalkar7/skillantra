'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import SidebarButton from './SidebarButton';

interface SidebarProps {
  isDemo?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isDemo = false, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    if (!isDemo) {
      fetchUnreadCount();
      // Poll every 30 seconds for new messages
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isDemo]);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      if (res.ok) {
        setUnreadCount(data.totalUnreadCount || 0);
      }
    } catch (e) {
      console.error('Failed to fetch unread count');
    }
  };

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose?.();
  }, [pathname]);

  const handleLogout = async () => {
    if (isDemo) {
      router.push('/');
      router.refresh();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { href: isDemo ? '/dashboard?demo=true' : '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: isDemo ? '/tasks?demo=true' : '/tasks', label: 'Browse Tasks', icon: '🔍' },
    { href: isDemo ? '/tasks/mine?demo=true' : '/tasks/mine', label: 'My Tasks', icon: '📋' },
    { href: isDemo ? '/applications?demo=true' : '/applications', label: 'My Applications', icon: '📝' },
    { href: isDemo ? '/messages?demo=true' : '/messages', label: 'Messages', icon: '💬', unread: unreadCount },
    { href: '#', label: 'Skill-based Matchmaking', icon: '🎯', comingSoon: true },
    { href: isDemo ? '/leaderboard?demo=true' : '/leaderboard', label: 'Leaderboard', icon: '🏆', comingSoon: true },
    { href: isDemo ? '/profile/edit?demo=true' : '/profile/edit', label: 'Profile', icon: '👤' },
    { href: isDemo ? '/settings?demo=true' : '/settings', label: 'Settings', icon: '⚙️' },
  ];

  const sidebarContent = (
    <>
      <div className="p-5 border-b-2 border-cyan-500/20">
        <Link href={isDemo ? '/dashboard?demo=true' : '/dashboard'} className="flex items-center gap-2 group">
          <span className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
            SkillAntra
          </span>
        </Link>
        {isDemo && (
          <div className="mt-3 px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/50 text-yellow-300 text-xs font-bold rounded-lg shadow-[0_0_15px_rgba(250,204,21,0.4)] animate-pulse">
            ⚡ DEMO MODE
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 overscroll-contain">
        <ul className="space-y-2">
          {navItems.map((item, index) => {
            const baseHref = item.href.split('?')[0];
            const isActive = pathname === baseHref || pathname?.startsWith(baseHref + '/');
            return (
              <li key={item.href} className="animate-slide-in-right" style={{ animationDelay: `${index * 0.05}s`, opacity: 0 }}>
                <SidebarButton
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  isActive={isActive}
                  comingSoon={item.comingSoon}
                  unreadCount={item.unread}
                  onClick={onClose}
                />
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t-2 border-cyan-500/20 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] text-white bg-red-500/20 border border-red-400/50 rounded-xl hover:bg-red-500/30 hover:border-red-400 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 font-semibold touch-manipulation"
        >
          <span className="text-lg shrink-0">🚪</span>
          <span className="text-sm truncate">{isDemo ? 'Exit Demo' : loading ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar - fixed left, visible on md and up */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-purple-950/95 via-indigo-950/95 to-black/95 backdrop-blur-md border-r border-purple-500/30 z-40 flex-col"
        aria-label="Main navigation"
      >
        {sidebarContent}
      </aside>

      {/* Mobile: overlay when open */}
      {mounted && (
        <div
          className={`md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          onClick={onClose}
          onTouchEnd={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar - slide-in drawer */}
      <aside
        className={`md:hidden fixed left-0 top-0 h-full w-[min(280px,85vw)] max-w-[280px] bg-gradient-to-b from-purple-950 via-indigo-950 to-black z-50 flex flex-col transform transition-transform duration-300 ease-out overscroll-contain ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
        }}
        aria-label="Mobile navigation"
        aria-hidden={!isOpen}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
