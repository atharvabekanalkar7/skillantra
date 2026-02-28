'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCountdown } from './timeAgo';

/**
 * React hook for live-updating deadline countdown.
 * - Updates every second when < 1 hour remaining
 * - Updates every 30 seconds when < 1 day remaining
 * - Updates every 60 seconds when > 1 day remaining
 * - Cleans up interval on unmount (no memory leaks)
 * - Returns { text, expired } or null if no deadline
 */
export function useCountdown(deadline: string | null | undefined) {
    const computeState = useCallback(() => {
        if (!deadline) return null;
        return formatCountdown(deadline);
    }, [deadline]);

    const [state, setState] = useState(computeState);

    useEffect(() => {
        if (!deadline) {
            setState(null);
            return;
        }

        // Initial computation
        const initial = computeState();
        setState(initial);

        // Don't set up interval if already expired
        if (initial?.expired) return;

        const getInterval = (): number => {
            const now = new Date();
            const target = new Date(deadline);
            const diffMs = target.getTime() - now.getTime();

            if (diffMs <= 0) return 0; // expired
            if (diffMs < 1000 * 60 * 60) return 1000; // < 1 hour: every second
            if (diffMs < 1000 * 60 * 60 * 24) return 30000; // < 1 day: every 30s
            return 60000; // > 1 day: every 60s
        };

        let timerId: ReturnType<typeof setTimeout>;

        const tick = () => {
            const newState = computeState();
            setState(newState);

            if (newState?.expired) return; // Stop ticking

            const interval = getInterval();
            if (interval > 0) {
                timerId = setTimeout(tick, interval);
            }
        };

        const interval = getInterval();
        if (interval > 0) {
            timerId = setTimeout(tick, interval);
        }

        return () => {
            clearTimeout(timerId);
        };
    }, [deadline, computeState]);

    return state;
}
