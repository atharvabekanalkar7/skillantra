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
            <div className={`flex items-center gap-3 px-4 py-3 text-gray-500 cursor-not-allowed rounded-xl bg-gray-900/30 border border-gray-700/50 ${className}`}>
                <span className="text-lg shrink-0">{icon}</span>
                <span className="text-sm font-medium truncate">{label}</span>
                <span className="text-xs ml-auto bg-gray-800 px-2 py-0.5 rounded shrink-0">Soon</span>
            </div>
        );
    }

    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg min-h-[44px] transition-colors ${isActive
                ? 'bg-slate-800 text-slate-100 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                } ${className}`}
        >
            <span className={`text-lg transition-transform shrink-0 ${isActive ? 'text-indigo-400' : ''}`}>{icon}</span>
            <span className="text-sm font-medium truncate flex-1">{label}</span>
            {unreadCount > 0 ? (
                <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full shrink-0">
                    {unreadCount}
                </span>
            ) : isNew ? (
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-2 py-0.5 rounded-full shrink-0">
                    New!
                </span>
            ) : null}
        </Link>
    );
}
