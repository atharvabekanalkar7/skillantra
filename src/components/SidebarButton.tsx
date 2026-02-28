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
            className={`group group-hover:before:duration-500 group-hover:after:duration-500 after:duration-500 hover:border-fuchsia-800/50 hover:before:[box-shadow:_20px_20px_20px_30px_#4c1d95] duration-500 before:duration-500 hover:duration-500 hover:after:-right-8 hover:before:right-12 hover:before:-bottom-8 hover:before:blur origin-left hover:text-fuchsia-300 relative border text-left p-3 rounded-lg overflow-hidden before:absolute before:w-12 before:h-12 before:content-[''] before:right-1 before:top-1 before:z-10 before:bg-indigo-900 before:rounded-full before:blur-xl after:absolute after:z-10 after:w-20 after:h-20 after:content-[''] after:bg-fuchsia-900/80 after:right-8 after:top-3 after:rounded-full after:blur-xl flex items-center gap-3 px-4 py-3 active:scale-[0.98] min-h-[44px] transition-all ${isActive
                ? 'bg-purple-900/40 text-fuchsia-300 font-bold border-fuchsia-800/50'
                : 'bg-transparent text-gray-300 border-transparent hover:bg-purple-900/20'
                } ${className}`}
        >
            <span className="text-lg group-hover:scale-110 transition-transform shrink-0 relative z-20">{icon}</span>
            <span className="text-sm font-semibold truncate flex-1 relative z-20">{label}</span>
            {unreadCount > 0 ? (
                <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] shrink-0 relative z-20">
                    {unreadCount}
                </span>
            ) : isNew ? (
                <span className="text-[10px] font-bold bg-green-500/20 text-green-300 border border-green-500/50 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse shrink-0 relative z-20">
                    New!
                </span>
            ) : null}
        </Link>
    );
}
