'use client';
import { useEffect, useRef } from 'react';

export default function RainEnv() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let drops: { x: number, y: number, length: number, speed: number, opacity: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < 200; i++) {
      drops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        length: Math.random() * 20 + 10,
        speed: Math.random() * 5 + 5,
        opacity: Math.random() * 0.3 + 0.1
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = 'rgba(150, 180, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';

      drops.forEach(drop => {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.speed * 0.2, drop.y + drop.length);
        ctx.strokeStyle = `rgba(150, 180, 255, ${drop.opacity})`;
        ctx.stroke();

        drop.y += drop.speed;
        drop.x -= drop.speed * 0.2; // Slight wind

        if (drop.y > canvas.height) {
          drop.y = -20;
          drop.x = Math.random() * canvas.width + 100;
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-900">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-slate-900/80 pointer-events-none mix-blend-overlay" />
    </div>
  );
}
