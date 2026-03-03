"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LampContainerProps {
    children: React.ReactNode;
    className?: string;
}

export function LampContainer({ children, className }: LampContainerProps) {
    return (
        <div
            className={cn(
                "relative flex min-h-[320px] flex-col items-center justify-center overflow-hidden w-full z-0",
                className
            )}
        >
            {/* Lamp light cone */}
            <div className="relative flex w-full flex-1 items-center justify-center isolate z-0">
                {/* Left cone */}
                <motion.div
                    initial={{ opacity: 0.1, width: "8rem" }}
                    whileInView={{ opacity: 0.6, width: "16rem" }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.8, ease: "easeInOut" }}
                    style={{
                        backgroundImage:
                            "conic-gradient(var(--conic-position), var(--tw-gradient-stops))",
                    }}
                    className="absolute inset-auto right-1/2 h-40 overflow-visible w-[16rem] bg-gradient-conic from-indigo-500/10 via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]"
                >
                    <div className="absolute w-[100%] left-0 bg-slate-50 bg-slate-950 h-24 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
                    <div className="absolute w-10 h-[100%] left-0 bg-slate-50 bg-slate-950 bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" />
                </motion.div>

                {/* Right cone */}
                <motion.div
                    initial={{ opacity: 0.1, width: "8rem" }}
                    whileInView={{ opacity: 0.6, width: "16rem" }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.8, ease: "easeInOut" }}
                    style={{
                        backgroundImage:
                            "conic-gradient(var(--conic-position), var(--tw-gradient-stops))",
                    }}
                    className="absolute inset-auto left-1/2 h-40 w-[16rem] bg-gradient-conic from-transparent via-transparent to-indigo-500/10 text-white [--conic-position:from_290deg_at_center_top]"
                >
                    <div className="absolute w-10 h-[100%] right-0 bg-slate-50 bg-slate-950 bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" />
                    <div className="absolute w-[100%] right-0 bg-slate-50 bg-slate-950 h-24 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
                </motion.div>

                {/* Top gradient line */}
                <div className="absolute top-1/2 h-32 w-full translate-y-6 scale-x-150 bg-slate-50 bg-slate-950 blur-2xl" />
                <div className="absolute top-1/2 z-50 h-32 w-full bg-transparent opacity-10 backdrop-blur-md" />

                {/* Main glow line */}
                <motion.div
                    initial={{ width: "6rem" }}
                    whileInView={{ width: "12rem" }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.8, ease: "easeInOut" }}
                    className="absolute inset-auto z-30 h-[2px] w-48 -translate-y-[5rem] rounded-full bg-indigo-500/30"
                />

                {/* Diffused glow */}
                <motion.div
                    initial={{ width: "8rem" }}
                    whileInView={{ width: "16rem" }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.8, ease: "easeInOut" }}
                    className="absolute inset-auto z-50 h-24 w-64 -translate-y-[6rem] rounded-full bg-indigo-500/5 blur-2xl"
                />
            </div>

            {/* Content */}
            <div className="relative z-50 flex -translate-y-20 flex-col items-center px-5">
                {children}
            </div>
        </div>
    );
}

export default LampContainer;
