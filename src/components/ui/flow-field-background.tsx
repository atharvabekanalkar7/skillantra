"use client";

import React, { useEffect, useRef } from "react";

interface NeuralBackgroundProps {
    color?: string;
    trailOpacity?: number;
    particleCount?: number;
    speed?: number;
}

export function NeuralBackground({
    color = "#6366f1",
    trailOpacity = 0.1,
    particleCount = 500,
    speed = 0.7,
}: NeuralBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const isDark = true;
        const rgbColor = color.startsWith("#") ? hexToRgb(color) : "100, 116, 139";

        const particles: Particle[] = [];

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            life: number;
            maxLife: number;

            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * speed;
                this.vy = (Math.random() - 0.5) * speed;
                this.size = Math.random() * 1.5 + 0.5;
                this.maxLife = Math.random() * 100 + 50;
                this.life = this.maxLife;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.life--;

                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;

                if (this.life <= 0) {
                    this.x = Math.random() * width;
                    this.y = Math.random() * height;
                    this.life = this.maxLife;
                }
            }

            draw() {
                if (!ctx) return;
                const alpha = Math.max(0, this.life / this.maxLife);
                ctx.fillStyle = `rgba(${rgbColor}, ${alpha * 0.75})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        const draw = () => {
            ctx.fillStyle = `rgba(15, 23, 42, ${trailOpacity})`;
            ctx.fillRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
            }

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 100) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(${rgbColor}, ${(1 - dist / 100) * 0.28})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener("resize", handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", handleResize);
        };
    }, [color, trailOpacity, particleCount, speed]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />
    );
}

function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : "100, 116, 139";
}
