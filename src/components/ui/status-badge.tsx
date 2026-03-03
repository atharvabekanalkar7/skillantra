import { cn } from "@/lib/utils";

type BadgeStatus = "open" | "pending" | "closed";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    status: string;
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
    const normalizedStatus = status.toLowerCase() as BadgeStatus;

    const statusStyles: Record<BadgeStatus, string> = {
        open: "bg-emerald-900 text-emerald-400 border border-emerald-700",
        pending: "bg-amber-900 text-amber-400 border border-amber-700",
        closed: "bg-rose-900 text-rose-400 border border-rose-700",
    };

    const style = statusStyles[normalizedStatus] || "bg-slate-800 text-slate-300 border border-slate-700";

    // Format: First letter capital only
    const displayStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    return (
        <span
            className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-medium inline-block",
                style,
                className
            )}
            {...props}
        >
            {displayStatus}
        </span>
    );
}
