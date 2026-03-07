'use client';
import { useState, useEffect, useCallback } from 'react';

/**
 * React hook for a live countdown timer.
 * @param targetTimestamp - Unix timestamp (ms) to count down to
 * @returns { hours, minutes, seconds, isExpired, formatted }
 */
export function useCountdown(targetTimestamp: number | null) {
    const calcRemaining = useCallback(() => {
        if (!targetTimestamp) return 0;
        return Math.max(0, targetTimestamp - Date.now());
    }, [targetTimestamp]);

    const [remaining, setRemaining] = useState(calcRemaining);

    useEffect(() => {
        setRemaining(calcRemaining());
        const interval = setInterval(() => {
            const r = calcRemaining();
            setRemaining(r);
            if (r <= 0) clearInterval(interval);
        }, 1000);
        return () => clearInterval(interval);
    }, [calcRemaining]);

    const totalSeconds = Math.floor(remaining / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const isExpired = remaining <= 0;

    const formatted = isExpired
        ? '0h 0m'
        : hours > 0
            ? `${hours}h ${minutes}m`
            : `${minutes}m ${seconds}s`;

    return { hours, minutes, seconds, remaining, isExpired, formatted };
}
