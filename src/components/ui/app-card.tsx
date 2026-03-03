import { cn } from "@/lib/utils";

interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function AppCard({ children, className, ...props }: AppCardProps) {
    return (
        <div
            className={cn(
                "bg-slate-900 border border-slate-800 rounded-xl p-6 transition hover:bg-slate-800",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
