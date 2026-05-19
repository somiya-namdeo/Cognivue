import { useEffect, useRef } from 'react';

export const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      fadeDirection: number;
    }> = [];

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Sparse, research-grade bokeh particles (14 total)
    const particleCount = 14;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 1.2, // Slightly larger size so the blur filter turns them into beautiful bokeh
        speedX: (Math.random() - 0.5) * 0.03, // Almost static
        speedY: -Math.random() * 0.06 - 0.01, // Crawls upward slowly
        opacity: Math.random() * 0.12 + 0.02, // Faint, nearly invisible
        fadeDirection: Math.random() > 0.5 ? 1 : -1,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;

        // Faint breathing opacity transitions
        p.opacity += p.fadeDirection * 0.0006;
        if (p.opacity > 0.18) {
          p.fadeDirection = -1;
        } else if (p.opacity < 0.02) {
          p.fadeDirection = 1;
        }

        // Seamless wrap boundaries
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) {
          p.x = canvas.width + 10;
        } else if (p.x > canvas.width + 10) {
          p.x = -10;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        // Muted cyan/violet color tones
        const color = p.x % 2 === 0 ? 'rgba(6, 182, 212,' : 'rgba(139, 92, 246,';
        ctx.fillStyle = `${color} ${p.opacity})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1] bg-transparent">
      
      {/* 1. Subtler Grid Overlay - Reduced opacity, edge-faded */}
      <div className="grid-background opacity-[0.05] pointer-events-none" />

      {/* 2. Soft Vignette Backdrop - Darkens edges to create premium focus */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#03030b_95%)] opacity-90 pointer-events-none" />

      {/* 3. GPU CSS-blurred Bokeh Emitter Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full opacity-60 blur-[2px] pointer-events-none" 
      />

      {/* 4. Large Cinematic Glow Gradients - Soft, layered blurs positioned strategically */}
      
      {/* Behind Hero Section (Top Center) */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[5%] w-[1100px] h-[550px] bg-gradient-to-r from-cyan-500/[0.045] to-violet-500/[0.045] blur-[150px] rounded-full pointer-events-none animate-pulse-slow" />

      {/* Behind Capabilities/How it Works (Middle) */}
      <div className="absolute left-[5%] top-[35%] w-[850px] h-[650px] bg-indigo-500/[0.04] blur-[160px] rounded-full pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />
      <div className="absolute right-[5%] top-[50%] w-[900px] h-[600px] bg-cyan-500/[0.035] blur-[165px] rounded-full pointer-events-none animate-pulse-slow" style={{ animationDelay: '4s' }} />

      {/* Behind final CTA (Bottom Center) */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[5%] w-[1200px] h-[600px] bg-gradient-to-tr from-cyan-500/[0.04] via-indigo-500/[0.035] to-violet-500/[0.04] blur-[170px] rounded-full pointer-events-none animate-pulse-slow" style={{ animationDelay: '1s' }} />

    </div>
  );
};
