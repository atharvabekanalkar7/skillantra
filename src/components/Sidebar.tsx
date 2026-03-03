'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Search,
  ClipboardList,
  FileText,
  MessageSquare,
  Target,
  Trophy,
  UserCircle,
  Settings,
  LogOut,
  Sparkles
} from 'lucide-react';
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
      const response = await fetch('/api/auth/logout', { method: 'POST' });
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
    { href: isDemo ? '/dashboard?demo=true' : '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: isDemo ? '/tasks?demo=true' : '/tasks', label: 'Browse Tasks', icon: Search },
    { href: isDemo ? '/tasks/mine?demo=true' : '/tasks/mine', label: 'My Tasks', icon: ClipboardList },
    { href: isDemo ? '/applications?demo=true' : '/applications', label: 'My Applications', icon: FileText },
    { href: isDemo ? '/messages?demo=true' : '/messages', label: 'Messages', icon: MessageSquare, unread: unreadCount },
    { href: '#', label: 'Matchmaking', icon: Target, comingSoon: true },
    { href: isDemo ? '/leaderboard?demo=true' : '/leaderboard', label: 'Leaderboard', icon: Trophy, comingSoon: true },
    { href: isDemo ? '/profile/edit?demo=true' : '/profile/edit', label: 'Profile', icon: UserCircle },
    { href: isDemo ? '/settings?demo=true' : '/settings', label: 'Settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800">
      <div className="p-5 border-b border-slate-800">
        <Link href={isDemo ? '/dashboard?demo=true' : '/dashboard'} className="flex items-center gap-2 group">
          <span className="text-xl font-bold text-slate-100">
            Skill<span className="text-indigo-500">Antra</span>
          </span>
        </Link>
        {isDemo && (
          <div className="mt-3 px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            DEMO MODE
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 overscroll-contain">
        <div className="mb-4">
          <p className="px-3 text-xs uppercase tracking-wide font-semibold text-slate-500 mb-2">Main Menu</p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const baseHref = item.href.split('?')[0];
              const isActive = pathname === baseHref || pathname?.startsWith(baseHref + '/');
              return (
                <li key={item.href + item.label}>
                  <SidebarButton
                    href={item.href}
                    icon={<item.icon className="w-[18px] h-[18px]" />}
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
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-slate-300 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 hover:text-slate-100 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 font-medium text-sm touch-manipulation"
        >
          <LogOut className="w-4 h-4 shrink-0 text-slate-400" />
          <span className="truncate">{isDemo ? 'Exit Demo' : loading ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-full w-64 z-40 flex-col"
        aria-label="Main navigation"
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mounted && (
        <div
          className={`md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={onClose}
          onTouchEnd={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`md:hidden fixed left-0 top-0 h-full w-[min(280px,85vw)] max-w-[280px] z-50 flex flex-col transform transition-transform duration-300 ease-out overscroll-contain ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
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
