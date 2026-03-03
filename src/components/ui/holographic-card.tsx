"use client";

import React, { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface HolographicCardProps {
    children: React.ReactNode;
    className?: string;
    containerClassName?: string;
}

export function HolographicCard({
    children,
    className,
    containerClassName,
}: HolographicCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsHovered(false), []);

    return (
        <div
            className={cn("perspective-[1000px]", containerClassName)}
            style={{ perspective: "1000px" }}
        >
            <div
                ref={cardRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={cn(
                    "relative rounded-xl border border-slate-200 bg-white border-slate-800 bg-slate-900 p-6 sm:p-8",
                    "transition-all duration-300 ease-out",
                    "hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5",
                    "motion-reduce:transform-none",
                    className
                )}
                style={{
                    transform: isHovered ? `scale3d(1.01, 1.01, 1.01)` : "scale3d(1, 1, 1)",
                    transformStyle: "preserve-3d",
                }}
            >
                {/* Subtle gradient overlay on hover */}
                <div
                    className={cn(
                        "pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300",
                        isHovered && "opacity-100"
                    )}
                    style={{
                        background:
                            "radial-gradient(600px circle at 50% 0%, rgba(99,102,241,0.03), transparent 40%)",
                    }}
                />
                <div style={{ transform: "translateZ(10px)", transformStyle: "preserve-3d" }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

export default HolographicCard;
