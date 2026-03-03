import { cn } from "@/lib/utils";

interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function AppCard({ children, className, ...props }: AppCardProps) {
    return (
        <div
            className={cn(
                "bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-[0_18px_45px_rgba(15,23,42,0.65)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
