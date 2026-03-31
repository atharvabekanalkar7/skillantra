'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, Fragment } from 'react';
import {
  LayoutDashboard,
  Search,
  Briefcase,
  ClipboardList,
  FileText,
  MessageSquare,
  Users,
  UserCircle,
  Settings,
  LogOut,
  Sparkles,
  List,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { HiOutlineIdentification } from 'react-icons/hi';
import SidebarButton from './SidebarButton';
import NotificationBell from './NotificationBell';
import { showToast } from '@/lib/utils/toast';

interface SidebarProps {
  isDemo?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
  profileComplete?: boolean;
}

export default function Sidebar({ isDemo = false, isOpen = false, onClose, onToggle, profileComplete = true }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    if (!isDemo) {
      fetchUnreadCount();
      fetchUserProfile();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isDemo]);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (res.ok && data.profile) {
        setUserProfile(data.profile);
      }
    } catch (e) {
      console.error('Failed to fetch user profile:', e);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      if (isDemo) return;

      const res = await fetch('/api/conversations');
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.totalUnreadCount || 0);
    } catch (e) {
      // silently fail — user may not be logged in
    }
  };

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

  const handleNavClick = (e: React.MouseEvent) => {
    if (!profileComplete) {
      e.preventDefault();
      showToast('Please complete your profile before continuing.', 'error');
    }
  };

  // Define the base menu sections
  const allMenuSections = [
    {
      id: 'DASHBOARD',
      title: 'OVERVIEW',
      items: [
        { href: isDemo ? '/dashboard?demo=true' : '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      id: 'INTERNSHIPS',
      title: 'INTERNSHIPS',
      items: [
        { href: isDemo ? '/internships?demo=true' : '/internships', label: 'Browse Internships', icon: Briefcase },
        ...(userProfile?.user_type === 'recruiter'
          ? [
            { href: isDemo ? '/internships/new?demo=true' : '/internships/new', label: 'Post Internship', icon: Briefcase },
            { href: isDemo ? '/internships/mine?demo=true' : '/internships/mine', label: 'My Internships', icon: List }
          ]
          : []),
      ],
    },
    {
      id: 'COLLABORATIONS',
      title: 'PROJECT & RESEARCH COLLABORATIONS',
      items: [
        { href: isDemo ? '/tasks?demo=true' : '/tasks', label: 'Browse', icon: Search },
        { href: isDemo ? '/tasks/mine?demo=true' : '/tasks/mine', label: 'My Tasks', icon: ClipboardList },
      ],
    },
    {
      id: 'OTHER',
      title: 'OTHER',
      items: [
        { href: isDemo ? '/applications?demo=true' : '/applications', label: 'My Applications', icon: FileText },
        { href: isDemo ? '/resume?demo=true' : '/resume', label: 'My Resume', icon: HiOutlineIdentification },
      ],
    },
  ];

  const isRecruiter = userProfile?.user_type === 'recruiter';

  const menuSections = allMenuSections.filter(section => {
    if (isRecruiter) {
      return section.id === 'INTERNSHIPS' || section.id === 'DASHBOARD';
    }
    return true; // For student/others, show all
  });

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      if (isOpen && window.innerWidth < 768) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }, [isOpen, mounted]);

  const bottomItems = [
    { href: isDemo ? '/messages?demo=true' : '/messages', label: 'Messages', icon: MessageSquare, unread: unreadCount },
    { href: isDemo ? '/profile/edit?demo=true' : (userProfile?.id ? `/profile/${userProfile.id}` : '#'), label: 'Profile', icon: UserCircle },
    { href: isDemo ? '/settings?demo=true' : '/settings', label: 'Settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800 shadow-2xl">
      <div className="p-5 border-b border-slate-800 flex justify-between items-center">
        <Link href={isDemo ? '/dashboard?demo=true' : '/dashboard'} onClick={handleNavClick} className="flex items-center gap-2 group">
          <span className="text-xl font-bold text-slate-100 tracking-tight">
            Skill<span className="text-indigo-400">Antra</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button 
            className="md:hidden p-2 text-slate-400 hover:text-white"
            onClick={onClose}
            aria-label="Close menu"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {isDemo && (
        <div className="px-5 py-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-indigo-500/40 text-xs font-semibold text-indigo-100 shadow-[0_0_18px_rgba(79,70,229,0.45)]">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Demo preview</span>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 overscroll-contain space-y-2">
        {menuSections.map((section, idx) => (
          <Fragment key={section.id}>
            {idx > 0 && <div className="my-4 h-px bg-white/10 mx-2" />}
            <div className="mb-4">
              <p className="px-3 text-xs uppercase tracking-wider font-semibold text-white/50 mb-3">{section.title}</p>
              <ul className="space-y-1">
                {section.items.map((item: any) => {
                  const baseHref = item.href.split('?')[0];
                  const isActive = pathname === baseHref;

                  return (
                    <li key={item.href + item.label}>
                      <SidebarButton
                        href={item.href}
                        icon={<item.icon className="w-[18px] h-[18px]" />}
                        label={item.label}
                        isActive={isActive}
                        comingSoon={item.comingSoon}
                        unreadCount={item.unread}
                        onClick={(e) => {
                          handleNavClick(e);
                          if (window.innerWidth < 768) onClose?.();
                        }}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          </Fragment>
        ))}

        <div className="my-4 h-px bg-white/10 mx-2" />
        <div className="mt-4">
          <p className="px-3 text-xs uppercase tracking-wider font-semibold text-white/50 mb-3">ACCOUNT</p>
          <ul className="space-y-1">
            {bottomItems.map((item: any) => {
              const baseHref = item.href.split('?')[0];
              const isActive = pathname === baseHref;

              return (
                <li key={item.href + item.label}>
                  <SidebarButton
                    href={item.href}
                    icon={<item.icon className="w-[18px] h-[18px]" />}
                    label={item.label}
                    isActive={isActive}
                    comingSoon={item.comingSoon}
                    unreadCount={item.unread}
                    onClick={(e) => {
                      handleNavClick(e);
                      if (window.innerWidth < 768) onClose?.();
                    }}
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
      <button
        onClick={onToggle}
        className="hidden md:flex"
        style={{
          position: 'fixed',
          top: '20px',
          left: isOpen ? '208px' : '12px',
          zIndex: 50,
          background: 'var(--color-bg-elevated, #1e293b)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '6px',
          padding: '6px',
          cursor: 'pointer',
          color: 'var(--color-text-secondary, #94a3b8)',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        {isOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
      </button>

      <aside
        className={`hidden md:flex fixed left-0 top-0 h-full z-40 flex-col transition-all duration-200 ease-in-out overflow-hidden`}
        style={{
          width: isOpen ? '256px' : '0px',
          minWidth: isOpen ? '256px' : '0px',
        }}
        aria-label="Main navigation"
      >
        <div style={{ width: '256px', height: '100%' }}>
          {sidebarContent}
        </div>
      </aside>

      {mounted && (
        <div
          className={`md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => onClose?.()}
          aria-hidden="true"
        />
      )}

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
