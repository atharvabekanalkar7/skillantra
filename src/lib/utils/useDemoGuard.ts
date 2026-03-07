"use client";
import { showToast } from './toast';

export function useDemoGuard() {
    const guardAction = <T extends (...args: any[]) => any>(action: T) => {
        return ((...args: Parameters<T>) => {
            const isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true');
            if (isDemo) {
                showToast('This action is disabled in demo mode', 'info');
                return;
            }
            return action(...args);
        }) as T;
    };
    return { guardAction };
}
