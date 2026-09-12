'use client';
import { useEffect, useRef } from 'react';

export default function OceanEnv() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const drawWave = (yOffset: number, amplitude: number, frequency: number, speed: number, color: string) => {
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      ctx.lineTo(0, yOffset + Math.sin(time * speed) * amplitude);
      
      for (let x = 0; x <= canvas.width; x += 20) {
        const y = yOffset + Math.sin(x * frequency + time * speed) * amplitude;
        ctx.lineTo(x, y);
      }
      
      ctx.lineTo(canvas.width, canvas.height);
      ctx.fillStyle = color;
      ctx.fill();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const cy = canvas.height * 0.7; // Horizon
      
      drawWave(cy - 20, 15, 0.005, 1.2, 'rgba(10, 50, 100, 0.4)');
      drawWave(cy + 10, 20, 0.006, 1.5, 'rgba(15, 70, 120, 0.6)');
      drawWave(cy + 40, 25, 0.004, 2.0, 'rgba(20, 90, 140, 0.8)');
      drawWave(cy + 80, 30, 0.003, 2.5, 'rgba(25, 110, 160, 1)');

      time += 0.02;
      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-[#0a1525] to-[#1a3550]">
      {/* Sky subtle gradient / Moon */}
      <div className="absolute top-1/4 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 bg-cyan-900/20 blur-[120px] rounded-full pointer-events-none" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
