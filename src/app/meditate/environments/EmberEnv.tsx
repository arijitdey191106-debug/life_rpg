'use client';
import { useEffect, useRef } from 'react';

export default function EmberEnv() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let embers: { x: number, y: number, size: number, vx: number, vy: number, life: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const addEmber = () => {
      embers.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.8,
        y: canvas.height + 10,
        size: Math.random() * 3 + 1,
        vx: (Math.random() - 0.5) * 2,
        vy: -(Math.random() * 2 + 1),
        life: 1
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (Math.random() < 0.3) addEmber();

      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.x += e.vx + Math.sin(e.life * 10) * 0.5;
        e.y += e.vy;
        e.life -= 0.005;
        e.size *= 0.99;

        if (e.life <= 0 || e.size <= 0.1) {
          embers.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, ${Math.floor(100 + e.life * 100)}, 0, ${e.life})`;
        ctx.fill();
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';
      }

      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#1a0500]">
      <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-red-900/40 to-transparent mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] inset-x-0 h-1/3 bg-orange-600/20 blur-[100px] pointer-events-none" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full mix-blend-screen" />
    </div>
  );
}
