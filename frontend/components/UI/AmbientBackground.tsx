"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/components/UI/ThemeProvider";

type Particle = {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  phase: number;
};

export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme, themeId } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrame = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const count = themeId === "space-cosmos" ? 130 : themeId === "neon-gaming" ? 44 : 30;
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 0.8 + Math.random() * (themeId === "space-cosmos" ? 2 : 5),
      speedX: (Math.random() - 0.5) * (themeId === "neon-gaming" ? 1.1 : 0.25),
      speedY: (Math.random() - 0.35) * (themeId === "ocean-marine" ? -0.7 : 0.28),
      opacity: 0.15 + Math.random() * 0.55,
      phase: Math.random() * Math.PI * 2,
    }));

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = theme.accent;
      context.strokeStyle = theme.accent;
      for (const particle of particles) {
        if (!reducedMotion) {
          particle.x += particle.speedX;
          particle.y += particle.speedY;
          particle.x += Math.sin(time / 1400 + particle.phase) * 0.08;
          if (particle.x < -20) particle.x = width + 20;
          if (particle.x > width + 20) particle.x = -20;
          if (particle.y < -20) particle.y = height + 20;
          if (particle.y > height + 20) particle.y = -20;
        }
        context.globalAlpha = particle.opacity;
        if (themeId === "neon-gaming") {
          context.beginPath();
          for (let point = 0; point < 6; point++) {
            const angle = (Math.PI * 2 * point) / 6;
            const x = particle.x + Math.cos(angle) * particle.size;
            const y = particle.y + Math.sin(angle) * particle.size;
            point ? context.lineTo(x, y) : context.moveTo(x, y);
          }
          context.closePath();
          context.stroke();
        } else {
          context.beginPath();
          context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          context.fill();
        }
      }
      context.globalAlpha = 1;
      if (themeId === "neon-gaming") {
        context.globalAlpha = 0.07;
        for (let y = 0; y < height; y += 9) context.fillRect(0, y, width, 1);
        context.globalAlpha = 1;
      }
      animationFrame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    animationFrame = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrame);
    };
  }, [theme.accent, themeId]);

  return <canvas ref={canvasRef} className="ambient-canvas" aria-hidden="true" />;
}

