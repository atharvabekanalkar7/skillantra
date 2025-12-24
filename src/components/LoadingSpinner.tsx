export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500/30"></div>
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-cyan-400 absolute top-0 left-0 shadow-[0_0_20px_rgba(34,211,238,0.6)]"></div>
      </div>
    </div>
  );
}

