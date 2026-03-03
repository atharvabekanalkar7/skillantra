'use client';

import Link from 'next/link';

interface SidebarButtonProps {
    href: string;
    icon: string | React.ReactNode;
    label: string;
    isActive?: boolean;
    comingSoon?: boolean;
    unreadCount?: number;
    isNew?: boolean;
    className?: string;
    onClick?: () => void;
}

export default function SidebarButton({
    href,
    icon,
    label,
    isActive = false,
    comingSoon = false,
    unreadCount = 0,
    isNew = false,
    className = '',
    onClick
}: SidebarButtonProps) {
    if (comingSoon) {
        return (
            <div
                className={`relative flex items-center gap-3 px-4 py-3 text-slate-500 cursor-not-allowed rounded-2xl bg-slate-900/40 border border-slate-800/70 ${className}`}
            >
                <span className="text-[18px] shrink-0 opacity-80">{icon}</span>
                <span className="text-sm font-medium truncate">{label}</span>
                <span className="ml-auto text-[10px] rounded-full px-2 py-0.5 bg-slate-800/80 border border-slate-700 text-slate-300 shrink-0">
                    Soon
                </span>
            </div>
        );
    }

    return (
        <Link
            href={href}
            onClick={onClick}
            className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl min-h-[44px] transition-all duration-200 ${
                isActive
                    ? 'bg-slate-900/80 text-slate-50 font-medium shadow-[0_0_0_1px_rgba(79,70,229,0.5)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
            } ${className}`}
        >
            {isActive && (
                <span className="absolute inset-y-1 left-1 w-0.5 rounded-full bg-gradient-to-b from-indigo-400 via-indigo-500 to-violet-500" />
            )}
            <span
                className={`text-[18px] transition-transform shrink-0 ${
                    isActive ? 'text-indigo-400 scale-105' : 'text-slate-500 group-hover:text-slate-200'
                }`}
            >
                {icon}
            </span>
            <span className="text-sm font-medium truncate flex-1">{label}</span>
            {unreadCount > 0 ? (
                <span className="text-[10px] font-bold bg-rose-600/90 text-white px-2 py-0.5 rounded-full shrink-0 shadow-[0_0_12px_rgba(248,113,113,0.45)]">
                    {unreadCount}
                </span>
            ) : isNew ? (
                <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full shrink-0">
                    New
                </span>
            ) : null}
        </Link>
    );
}
