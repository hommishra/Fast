import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FCLogo from './FCLogo';

interface OpeningAnimationProps {
  onComplete: () => void;
}

export default function OpeningAnimation({ onComplete }: OpeningAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animation Stage States:
  // 1: 'F' enters from LEFT (0ms - 600ms)
  // 2: 'C' enters from RIGHT (500ms - 1100ms)
  // 3: Both move to center and meet (1100ms - 1600ms)
  // 4: Energy pulse burst & merge to form official FC logo (1600ms)
  // 5: 'FAST COVERAGES' cinematic text reveal (2000ms)
  // 6: 'GLOBAL NEWS NETWORK' elegant white glowing typography (2500ms)
  // Fade: Smooth screen fade out (3300ms - 3800ms)
  const [animStage, setAnimStage] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [showBurst, setShowBurst] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Precise 3 to 5 second sequence timeline
  useEffect(() => {
    // 0.5s: 'C' enters from right
    const t2 = setTimeout(() => setAnimStage(2), 500);

    // 1.1s: Both move to center
    const t3 = setTimeout(() => setAnimStage(3), 1100);

    // 1.6s: Meet in center -> Energy Burst & merge into FC Logo
    const t4 = setTimeout(() => {
      setAnimStage(4);
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 700);
    }, 1600);

    // 2.0s: 'FAST COVERAGES' text reveal
    const t5 = setTimeout(() => setAnimStage(5), 2000);

    // 2.5s: 'GLOBAL NEWS NETWORK' subtitle reveal
    const t6 = setTimeout(() => setAnimStage(6), 2500);

    // 3.3s: Start smooth fade out
    const tFade = setTimeout(() => setIsFadingOut(true), 3300);

    // 3.8s: Finish & transition seamlessly to homepage
    const tEnd = setTimeout(() => handleFinish(), 3800);

    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      clearTimeout(tFade);
      clearTimeout(tEnd);
    };
  }, []);

  // Web Audio API: Subtle News Broadcast Rise & Impact Chime
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();

        // Soft sub-bass riser at start
        const subOsc = audioCtx.createOscillator();
        const subGain = audioCtx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(50, audioCtx.currentTime);
        subOsc.frequency.exponentialRampToValueAtTime(160, audioCtx.currentTime + 1.2);
        subGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        subGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
        subOsc.connect(subGain);
        subGain.connect(audioCtx.destination);
        subOsc.start();
        subOsc.stop(audioCtx.currentTime + 1.2);

        // Collision Impact sound at 1.6s
        setTimeout(() => {
          if (!audioCtx) return;
          const impactOsc = audioCtx.createOscillator();
          const impactGain = audioCtx.createGain();
          impactOsc.type = 'triangle';
          impactOsc.frequency.setValueAtTime(220, audioCtx.currentTime);
          impactOsc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.4);
          impactGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          impactGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
          impactOsc.connect(impactGain);
          impactGain.connect(audioCtx.destination);
          impactOsc.start();
          impactOsc.stop(audioCtx.currentTime + 0.4);
        }, 1600);

        // Broadcast Chimes starting at 2.0s
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          if (!audioCtx) return;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const startTime = audioCtx.currentTime + 2.0 + idx * 0.18;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.08, startTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.4);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.4);
        });
      }
    } catch (e) {
      // Audio autoplay restrictions handled silently
    }

    return () => {
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close();
      }
    };
  }, []);

  // 60 FPS HTML5 Canvas Engine: 3D Rotating Digital Globe, Red Particles & Transmission Lines
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rotation = 0;

    // Red & Silver Light Particles
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      size: Math.random() * 2.2 + 0.6,
      alpha: Math.random() * 0.85 + 0.15,
      isRed: Math.random() > 0.35
    }));

    // Major Global News Cities
    const globalHubs = [
      { lat: 40.7128, lon: -74.0060 }, // New York
      { lat: 51.5074, lon: -0.1278 },  // London
      { lat: 35.6762, lon: 139.6503 }, // Tokyo
      { lat: 28.6139, lon: 77.2090 },  // New Delhi
      { lat: 48.8566, lon: 2.3522 },   // Paris
      { lat: -33.8688, lon: 151.2093 },// Sydney
      { lat: 25.2048, lon: 55.2708 }   // Dubai
    ];

    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let pulseProgress = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Sized proportionally to frame the logo inside the globe
      const isMobile = canvas.width < 640;
      const globeRadius = Math.min(cx, cy) * (isMobile ? 0.65 : 0.52);

      rotation += 0.025;
      pulseProgress = (pulseProgress + 0.02) % 1;

      // 1. Digital Red & Silver Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.isRed 
          ? `rgba(225, 6, 0, ${p.alpha * 0.85})` 
          : `rgba(255, 255, 255, ${p.alpha * 0.9})`;
        ctx.shadowColor = p.isRed ? '#E10600' : '#FFFFFF';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 2. Atmosphere Glow
      const bgGlow = ctx.createRadialGradient(cx, cy, globeRadius * 0.2, cx, cy, globeRadius * 1.3);
      bgGlow.addColorStop(0, 'rgba(225, 6, 0, 0.32)');
      bgGlow.addColorStop(0.6, 'rgba(225, 6, 0, 0.08)');
      bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, globeRadius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // 3. 3D Globe Sphere Base
      ctx.beginPath();
      ctx.arc(cx, cy, globeRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(8, 2, 2, 0.92)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(225, 6, 0, 0.85)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#E10600';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 4. Latitude Lines
      for (let lat = -60; lat <= 60; lat += 20) {
        const r = globeRadius * Math.cos((lat * Math.PI) / 180);
        const y = cy + globeRadius * Math.sin((lat * Math.PI) / 180);
        ctx.beginPath();
        ctx.ellipse(cx, y, r, r * 0.25, 0, 0, Math.PI * 2);
        ctx.strokeStyle = lat === 0 ? 'rgba(255, 255, 255, 0.75)' : 'rgba(225, 6, 0, 0.25)';
        ctx.lineWidth = lat === 0 ? 1.5 : 0.8;
        ctx.stroke();
      }

      // 5. Longitude 3D Rotating Ellipses
      for (let lon = 0; lon < 360; lon += 30) {
        const currentRot = rotation + (lon * Math.PI) / 180;
        const widthFactor = Math.sin(currentRot);

        ctx.beginPath();
        ctx.ellipse(cx, cy, globeRadius * Math.abs(widthFactor), globeRadius, 0, 0, Math.PI * 2);
        if (widthFactor > 0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1;
        } else {
          ctx.strokeStyle = 'rgba(225, 6, 0, 0.18)';
          ctx.lineWidth = 0.6;
        }
        ctx.stroke();
      }

      // 6. Global Transmission Nodes & Lines
      const projectedCoords: { x: number; y: number; visible: boolean }[] = [];

      globalHubs.forEach((hub) => {
        const radLat = (hub.lat * Math.PI) / 180;
        const radLon = (hub.lon * Math.PI) / 180 + rotation;
        const visible = Math.sin(radLon) > 0;

        const x = cx + globeRadius * Math.cos(radLat) * Math.cos(radLon);
        const y = cy - globeRadius * Math.sin(radLat);
        projectedCoords.push({ x, y, visible });

        if (visible) {
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(x, y, 5 + Math.sin(rotation * 5) * 2, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(225, 6, 0, 0.9)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // Arc Transmission Lines
      for (let i = 0; i < projectedCoords.length; i++) {
        for (let j = i + 1; j < projectedCoords.length; j++) {
          const h1 = projectedCoords[i];
          const h2 = projectedCoords[j];

          if (h1.visible && h2.visible) {
            ctx.beginPath();
            ctx.moveTo(h1.x, h1.y);
            const midX = (h1.x + h2.x) / 2 + Math.sin(rotation) * 15;
            const midY = (h1.y + h2.y) / 2 - 25;
            ctx.quadraticCurveTo(midX, midY, h2.x, h2.y);
            ctx.strokeStyle = 'rgba(225, 6, 0, 0.3)';
            ctx.lineWidth = 0.9;
            ctx.stroke();

            const pulseX = (1 - pulseProgress) * (1 - pulseProgress) * h1.x + 2 * (1 - pulseProgress) * pulseProgress * midX + pulseProgress * pulseProgress * h2.x;
            const pulseY = (1 - pulseProgress) * (1 - pulseProgress) * h1.y + 2 * (1 - pulseProgress) * pulseProgress * midY + pulseProgress * pulseProgress * h2.y;

            ctx.beginPath();
            ctx.arc(pulseX, pulseY, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const handleFinish = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fc_last_animation_time', Date.now().toString());
    }
    onComplete();
  };

  return (
    <div
      id="fast-coverages-opening-animation"
      className={`fixed inset-0 bg-black text-white z-50 flex items-center justify-center p-4 overflow-hidden select-none font-sans transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* 1. Cinematic Black Background with 3D Rotating Digital Globe & Transmission Canvas */}
      <div className="absolute inset-0 pointer-events-none">
        <canvas ref={canvasRef} className="w-full h-full opacity-90" />
        {/* Subtle grid pattern for depth */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      </div>

      {/* 2. CENTER STAGE: FC LOGO ANIMATION & TEXT REVEAL */}
      <div className="relative z-20 flex flex-col items-center justify-center max-w-4xl w-full text-center pointer-events-none">

        {/* Collision Light Burst / Energy Pulse Effect */}
        <AnimatePresence>
          {showBurst && (
            <motion.div
              initial={{ scale: 0.1, opacity: 1 }}
              animate={{ scale: 3.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              className="absolute z-40 w-40 h-40 rounded-full bg-gradient-to-r from-red-500 via-white to-red-600 blur-xl pointer-events-none shadow-[0_0_90px_#E10600]"
            />
          )}
        </AnimatePresence>

        {/* STAGES 1, 2, 3: Letter "F" from LEFT, Letter "C" from RIGHT meeting at Center */}
        {animStage < 4 && (
          <div className="relative flex items-center justify-center w-full h-40 sm:h-56 my-2">
            {/* STEP 1: Letter "F" - Metallic Silver Finish from LEFT */}
            <motion.div
              initial={{ x: '-100vw', opacity: 0, scale: 1.6, filter: 'blur(8px)' }}
              animate={{
                x: animStage === 1 ? '-60px' : animStage === 2 ? '-30px' : '0px',
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)'
              }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="absolute z-20 font-black text-7xl sm:text-9xl md:text-[10rem] uppercase tracking-tighter"
            >
              <span className="bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent filter drop-shadow-[0_0_35px_rgba(255,255,255,0.85)] relative">
                F
                {/* Light Motion Trail */}
                <span className="absolute right-full top-1/2 -translate-y-1/2 w-32 h-1 bg-gradient-to-l from-white/80 to-transparent pointer-events-none" />
              </span>
            </motion.div>

            {/* STEP 2: Letter "C" - Metallic Red Finish from RIGHT */}
            {animStage >= 2 && (
              <motion.div
                initial={{ x: '100vw', opacity: 0, scale: 1.6, filter: 'blur(8px)' }}
                animate={{
                  x: animStage === 2 ? '30px' : '0px',
                  opacity: 1,
                  scale: 1,
                  filter: 'blur(0px)'
                }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="absolute z-20 font-black text-7xl sm:text-9xl md:text-[10rem] uppercase tracking-tighter"
              >
                <span className="bg-gradient-to-b from-red-400 via-red-600 to-red-800 bg-clip-text text-transparent filter drop-shadow-[0_0_45px_rgba(225,6,0,0.95)] relative">
                  C
                  {/* Light Motion Trail */}
                  <span className="absolute left-full top-1/2 -translate-y-1/2 w-32 h-1 bg-gradient-to-r from-red-600/80 to-transparent pointer-events-none" />
                </span>
              </motion.div>
            )}
          </div>
        )}

        {/* STAGES 4, 5, 6: Official FC Logo Merged & Perfectly Centered inside Rotating Globe */}
        {animStage >= 4 && (
          <div className="flex flex-col items-center justify-center gap-4 my-2">
            {/* Completed FC Logo - Fixed in Center over Globe */}
            <motion.div
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-30 flex items-center justify-center"
            >
              <FCLogo size="xl" animatedGlobe={true} />
            </motion.div>

            {/* TEXT ANIMATION */}
            <div className="flex flex-col items-center gap-2 mt-1">
              {/* FAST COVERAGES - Premium Cinematic Text Reveal Animation */}
              {animStage >= 5 && (
                <motion.h1
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-none filter drop-shadow-[0_0_30px_rgba(0,0,0,0.9)]"
                >
                  <span className="bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(225,6,0,0.95)]">
                    FAST{' '}
                  </span>
                  <span className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(225,6,0,0.95)]">
                    COVERAGES
                  </span>
                </motion.h1>
              )}

              {/* GLOBAL NEWS NETWORK - Elegant White Glowing Typography */}
              {animStage >= 6 && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className="text-xs sm:text-sm md:text-base font-mono font-black uppercase tracking-[0.45em] text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.95)] mt-1 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block shrink-0 shadow-[0_0_10px_#E10600]" />
                  <span>GLOBAL NEWS NETWORK</span>
                </motion.p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
