import { Component as Globe } from "@/components/ui/interactive-globe";

export default function Demo() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-8">
      <div className="w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden relative">
        <div className="flex flex-col md:flex-row min-h-[500px]">
          <div className="flex-1 flex flex-col justify-center p-10 md:p-14 relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-400 mb-6 w-fit">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All systems operational
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-100 leading-[1.1] mb-4">
              Global Edge
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Network
              </span>
            </h1>

            <p className="text-sm md:text-base text-slate-400 max-w-md leading-relaxed mb-8">
              Deployed across 150+ points of presence worldwide. Your data
              served from the nearest node in under 50ms. Drag the globe to
              explore.
            </p>

            <div className="flex items-center gap-6 text-slate-100">
              <div>
                <p className="text-2xl font-bold">150+</p>
                <p className="text-xs text-slate-500">Edge Nodes</p>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div>
                <p className="text-2xl font-bold">&lt;50ms</p>
                <p className="text-xs text-slate-500">Avg Latency</p>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div>
                <p className="text-2xl font-bold">99.99%</p>
                <p className="text-xs text-slate-500">Uptime</p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 md:p-0 min-h-[400px]">
            <Globe size={460} />
          </div>
        </div>
      </div>
    </div>
  );
}

