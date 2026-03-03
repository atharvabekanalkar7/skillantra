import { DottedSurface } from "@/components/ui/dotted-surface";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-slate-950 overflow-x-hidden">
      <DottedSurface />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

