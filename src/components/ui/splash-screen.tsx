"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function SplashScreen({ children }: { children: React.ReactNode }) {
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        const hasShown = sessionStorage.getItem("splashShown");
        if (hasShown) {
            setShowSplash(false);
        } else {
            const timer = setTimeout(() => {
                setShowSplash(false);
                sessionStorage.setItem("splashShown", "true");
            }, 1200); // 1.2s display + 0.6s exit = 1.8s total

            return () => clearTimeout(timer);
        }
    }, []);

    return (
        <>
            <AnimatePresence>
                {showSplash && (
                    <motion.div
                        id="splash-screen"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, filter: "blur(10px)" }}
                            animate={{
                                scale: [0.8, 1, 7],
                                opacity: [0, 1, 0.3],
                                filter: ["blur(10px)", "blur(0px)", "blur(0px)"]
                            }}
                            transition={{
                                duration: 1.2,
                                ease: [0.22, 1, 0.36, 1],
                                times: [0, 0.4, 1]
                            }}
                            className="relative w-32 h-32 md:w-40 md:h-40"
                        >
                            <Image
                                src="/skillantra-logo.svg"
                                alt="SkillAntra Logo"
                                fill
                                priority
                                unoptimized
                                className="object-contain"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {children}
        </>
    );
}
