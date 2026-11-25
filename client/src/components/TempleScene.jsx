import React, { useEffect, useRef } from 'react';

export const TempleScene = ({ children }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 1,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -Math.random() * 0.6 - 0.2,
      opacity: Math.random() * 0.7 + 0.3,
      pulse: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#060911');
      skyGrad.addColorStop(0.4, '#0a121e');
      skyGrad.addColorStop(0.8, '#0b1d28');
      skyGrad.addColorStop(1, '#0c1720');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      const moonX = width * 0.3;
      const moonY = height * 0.15;
      const moonRadius = Math.min(width, height) * 0.08;

      const moonGlow = ctx.createRadialGradient(
        moonX,
        moonY,
        moonRadius * 0.5,
        moonX,
        moonY,
        moonRadius * 3
      );
      moonGlow.addColorStop(0, 'rgba(180, 235, 245, 0.25)');
      moonGlow.addColorStop(0.5, 'rgba(45, 175, 195, 0.08)');
      moonGlow.addColorStop(1, 'rgba(10, 20, 35, 0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonRadius * 3, 0, Math.PI * 2);
      ctx.fill();

      const moonDisc = ctx.createRadialGradient(
        moonX - moonRadius * 0.3,
        moonY - moonRadius * 0.3,
        moonRadius * 0.1,
        moonX,
        moonY,
        moonRadius
      );
      moonDisc.addColorStop(0, '#ffffff');
      moonDisc.addColorStop(0.7, '#e0f4f7');
      moonDisc.addColorStop(1, '#97cfd9');
      ctx.fillStyle = moonDisc;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
      ctx.fill();

      const drawWaterfall = (x, w) => {
        const wfGrad = ctx.createLinearGradient(x, height * 0.45, x, height);
        wfGrad.addColorStop(0, 'rgba(14, 165, 233, 0.25)');
        wfGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.45)');
        wfGrad.addColorStop(1, 'rgba(125, 211, 252, 0.6)');
        ctx.fillStyle = wfGrad;
        ctx.fillRect(x, height * 0.45, w, height * 0.55);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        for (let i = 0; i < 5; i++) {
          const streamX = x + Math.random() * w;
          ctx.fillRect(streamX, height * 0.45, 2, height * 0.55);
        }
      };

      if (width > 600) {
        drawWaterfall(0, width * 0.1);
        drawWaterfall(width * 0.9, width * 0.1);
      }

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += 0.03;

        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        const currentOpacity = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse));

        ctx.fillStyle = `rgba(251, 191, 36, ${currentOpacity})`;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden bg-temple-dark flex flex-col justify-between">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="relative z-10 flex flex-col w-full h-full flex-1">
        {children}
      </div>
    </div>
  );
};
