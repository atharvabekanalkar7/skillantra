"use client";

import { useEffect } from "react";
import { playClickSound } from "@/lib/clickSound";

export default function ClickSoundProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Listen for all clicks on the document
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check if the clicked element OR any of its parents is a button
      const button = target.closest("button");

      if (button && e.isTrusted) {
        playClickSound();
      }
    };

    document.addEventListener("click", handler, { capture: true });

    return () => {
      document.removeEventListener("click", handler, { capture: true });
    };
  }, []);

  return <>{children}</>;
}
