import React, { useEffect, useState, useRef } from "react";
import { loadPreferences } from "../theme/themeEngine";

const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prefs, setPrefs] = useState(loadPreferences());
  const isLight = prefs.theme.startsWith("light");

  // Sync preferences
  useEffect(() => {
    const handlePreferencesUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setPrefs(customEvent.detail);
      } else {
        setPrefs(loadPreferences());
      }
    };
    window.addEventListener("preferences-updated", handlePreferencesUpdated);
    return () => window.removeEventListener("preferences-updated", handlePreferencesUpdated);
  }, []);

  // Parse accent color to RGB for canvas alpha manipulation
  const getRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : { r: 99, g: 102, b: 241 };
  };

  // Canvas particle/polygon animation
  useEffect(() => {
    if (prefs.background !== "particles" && prefs.background !== "polygons") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: { x: number; y: number; vx: number; vy: number; radius: number }[] = [];
    let animationFrameId: number;
    let width = canvas.width;
    let height = canvas.height;

    const initParticles = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      
      const particleCount = Math.min(Math.floor((width * height) / 12000), 120); // Responsive amount
      particles = Array.from({ length: particleCount }).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8 * (prefs.animations ? 1 : 0),
        vy: (Math.random() - 0.5) * 0.8 * (prefs.animations ? 1 : 0),
        radius: Math.random() * 1.5 + 0.5,
      }));
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, width, height);

      const isPolygons = prefs.background === "polygons";
      const connDistance = isPolygons ? 180 : 150;
      const color = getRgb(prefs.accentColor);
      const rgbStr = `${color.r}, ${color.g}, ${color.b}`;

      // Update & Draw dots
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Bounce edges
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        if (!isPolygons) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgbStr}, ${isLight ? 0.4 : 0.6})`;
          ctx.fill();
        }

        // Connect lines & Triangles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connDistance) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            // Calculate opacity based on distance from base threshold
            const opacity = (1 - dist / connDistance) * (isLight ? 0.15 : 0.3);
            ctx.strokeStyle = `rgba(${rgbStr}, ${opacity})`;
            ctx.lineWidth = isPolygons ? 1.5 : 1;
            ctx.stroke();

            if (isPolygons) {
              // Draw filled triangle if a 3rd point is also close to both
              for (let k = j + 1; k < particles.length; k++) {
                const p3 = particles[k];
                const d2 = Math.sqrt((p2.x - p3.x)**2 + (p2.y - p3.y)**2);
                if (d2 < connDistance) {
                  const d3 = Math.sqrt((p.x - p3.x)**2 + (p.y - p3.y)**2);
                  if (d3 < connDistance) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.lineTo(p3.x, p3.y);
                    ctx.closePath();
                    const avgDist = (dist + d2 + d3) / 3;
                    const fillOpacity = Math.max(0, (1 - avgDist / connDistance) * (isLight ? 0.08 : 0.12));
                    ctx.fillStyle = `rgba(${rgbStr}, ${fillOpacity})`;
                    ctx.fill();
                  }
                }
              }
            }
          }
        }
      }

      if (prefs.animations) {
        animationFrameId = requestAnimationFrame(drawParticles);
      }
    };

    initParticles();
    drawParticles();

    const handleResize = () => {
      initParticles();
      if (!prefs.animations) drawParticles(); // Redraw once if static
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [prefs.accentColor, isLight, prefs.background, prefs.animations]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Aurora / Fluid Waves Mode - REMOVED */}

      {/* Network Particles Canvas */}
      {(prefs.background === "particles" || prefs.background === "polygons") && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block"
        />
      )}


    </div>
  );
};

export default AnimatedBackground;
