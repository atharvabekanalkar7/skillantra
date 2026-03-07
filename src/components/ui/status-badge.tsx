import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
    open: "bg-emerald-900 text-emerald-400 border border-emerald-700",
    pending: "bg-amber-900 text-amber-400 border border-amber-700",
    closed: "bg-rose-900 text-rose-400 border border-rose-700",
    accepted: "bg-emerald-900/70 text-emerald-300 border border-emerald-700/70",
    rejected: "bg-rose-900/70 text-rose-300 border border-rose-700/70",
    hired: "bg-green-900 text-green-300 border border-green-700",
    filled: "bg-slate-800 text-slate-400 border border-slate-700",
};

const STATUS_LABELS: Record<string, string> = {
    hired: "🎉 Hired",
};

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    status: string;
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
    const key = status.toLowerCase();
    const style = STATUS_STYLES[key] ?? "bg-slate-800 text-slate-300 border border-slate-700";
    const label = STATUS_LABELS[key] ?? (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase());

    return (
        <span
            className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-medium inline-block",
                style,
                className
            )}
            {...props}
        >
            {label}
        </span>
    );
}
