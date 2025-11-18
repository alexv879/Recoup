'use client';

import React, { useEffect, useRef } from 'react';

interface ConfettiPiece {
    x: number;
    y: number;
    size: number;
    color: string;
    velocity: number;
    rotation: number;
    rotationSpeed: number;
}

interface ConfettiAnimationProps {
    onComplete?: () => void;
    duration?: number;
}

export const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({
    onComplete,
    duration = 3000
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | undefined>(undefined);
    const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ['#2196f3', '#4caf50', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4'];
        const pieces: ConfettiPiece[] = [];

        // Create confetti pieces
        for (let i = 0; i < 50; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: -20 - Math.random() * 100,
                size: Math.random() * 10 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                velocity: Math.random() * 5 + 2,
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 10 - 5
            });
        }

        const animate = () => {
            if (!ctx || !canvas) return;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and draw each piece
            pieces.forEach(piece => {
                piece.y += piece.velocity;
                piece.rotation += piece.rotationSpeed;

                ctx.save();
                ctx.translate(piece.x, piece.y);
                ctx.rotate((piece.rotation * Math.PI) / 180);
                ctx.fillStyle = piece.color;
                ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
                ctx.restore();
            });

            // Check if animation should continue
            const elapsed = Date.now() - startTimeRef.current;
            if (elapsed < duration && pieces.some(p => p.y < canvas.height)) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                onComplete?.();
            }
        };

        animate();

        // Cleanup
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [duration, onComplete]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[9999]"
            style={{ width: '100%', height: '100%' }}
        />
    );
};
