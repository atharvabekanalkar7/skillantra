'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export function SplashScreen({ children }: { children: React.ReactNode }) {
    const [phase, setPhase] = useState<'idle' | 'enter' | 'hold' | 'exit' | 'done'>('idle');

    useEffect(() => {
        try {
            if (sessionStorage.getItem('splashShown')) {
                setPhase('done');
                return;
            }
        } catch (e) { }

        const raf = requestAnimationFrame(() => setPhase('enter'));
        const holdTimer = setTimeout(() => setPhase('hold'), 100);
        const exitTimer = setTimeout(() => setPhase('exit'), 1235);
        const doneTimer = setTimeout(() => {
            try { sessionStorage.setItem('splashShown', '1'); } catch (e) { }
            setPhase('done');
        }, 1528);

        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(holdTimer);
            clearTimeout(exitTimer);
            clearTimeout(doneTimer);
        };
    }, []);

    return (
        <>
            {children}

            {phase !== 'done' && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        backgroundColor: '#060910',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        willChange: 'opacity',
                        opacity: phase === 'exit' ? 0 : 1,
                        transition: phase === 'exit'
                            ? 'opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1)'
                            : 'none',
                        pointerEvents: phase === 'exit' ? 'none' : 'all',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '20px',
                            willChange: 'transform, opacity',
                            transform: phase === 'idle'
                                ? 'translateY(14px) scale(0.95)'
                                : phase === 'exit'
                                    ? 'translateY(-6px) scale(0.98)'
                                    : 'translateY(0px) scale(1)',
                            opacity: phase === 'idle' ? 0 : phase === 'exit' ? 0 : 1,
                            transition: phase === 'enter'
                                ? 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s ease'
                                : phase === 'exit'
                                    ? 'transform 0.35s ease-in, opacity 0.35s ease-in'
                                    : 'none',
                        }}
                    >
                        <div
                            style={{
                                width: 72,
                                height: 72,
                                borderRadius: 18,
                                overflow: 'hidden',
                                boxShadow: '0 0 48px rgba(99,102,241,0.3), 0 0 12px rgba(99,102,241,0.15)',
                            }}
                        >
                            <Image
                                src="/SkillAntra-Logo.png"
                                alt="SkillAntra"
                                width={72}
                                height={72}
                                priority
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>

                        <div
                            style={{
                                fontSize: 22,
                                fontWeight: 700,
                                letterSpacing: '-0.4px',
                                color: '#ffffff',
                                fontFamily: 'system-ui, sans-serif',
                            }}
                        >
                            Skill<span style={{ color: '#818cf8' }}>Antra</span>
                        </div>

                        <div
                            style={{
                                fontSize: 11,
                                color: '#334155',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase' as const,
                                fontFamily: 'monospace',
                                willChange: 'opacity',
                                opacity: phase === 'hold' ? 1 : 0,
                                transition: 'opacity 0.5s ease 0.25s',
                            }}
                        >
                            IIT Mandi
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
