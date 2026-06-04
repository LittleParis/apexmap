import { useEffect, useRef } from 'react';

export function BackgroundFX() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const particles: Particle[] = [];
    const PARTICLE_COUNT = 60;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle(canvas));
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const particle of particles) {
        particle.update(canvas);
        particle.draw(ctx);
      }
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      {/* 粒子画布 - 通过 CSS 变量控制透明度 */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ opacity: 'var(--particle-opacity, 0.4)' }}
      />

      {/* 网格背景 */}
      <div className="fixed inset-0 cyber-grid pointer-events-none z-0" />

      {/* 顶部渐变光 */}
      <div className="fixed top-0 left-0 right-0 h-64 bg-gradient-to-b from-neon-cyan/[0.03] to-transparent pointer-events-none z-0" />

      {/* 底部渐变光 */}
      <div className="fixed bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-neon-magenta/[0.02] to-transparent pointer-events-none z-0" />
    </>
  );
}

class Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  canvas: HTMLCanvasElement;

  private static COLORS_DARK = ['#00f0ff', '#ff00e5', '#f0ff00', '#00ff88'];
  private static COLORS_LIGHT = ['#0891b2', '#c026d3', '#ca8a04', '#059669'];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2 + 0.5;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3;
    this.opacity = Math.random() * 0.5 + 0.1;
    this.color = Particle.COLORS_DARK[Math.floor(Math.random() * Particle.COLORS_DARK.length)];
  }

  update(canvas: HTMLCanvasElement) {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.x < 0) this.x = canvas.width;
    if (this.x > canvas.width) this.x = 0;
    if (this.y < 0) this.y = canvas.height;
    if (this.y > canvas.height) this.y = 0;

    this.opacity += (Math.random() - 0.5) * 0.02;
    this.opacity = Math.max(0.05, Math.min(0.6, this.opacity));

    // 动态适配主题
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const palette = isDark ? Particle.COLORS_DARK : Particle.COLORS_LIGHT;
    const currentColor = this.color;
    const darkIdx = Particle.COLORS_DARK.indexOf(currentColor);
    const lightIdx = Particle.COLORS_LIGHT.indexOf(currentColor);
    if (isDark && lightIdx >= 0) {
      this.color = palette[lightIdx];
    } else if (!isDark && darkIdx >= 0) {
      this.color = palette[darkIdx];
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.opacity;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.opacity * 0.1;
    ctx.fill();

    ctx.globalAlpha = 1;
  }
}
