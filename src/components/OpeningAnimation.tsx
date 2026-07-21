import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, ChevronRight, Zap, Globe2, ShieldCheck, Play } from 'lucide-react';

interface OpeningAnimationProps {
  onComplete: () => void;
}

export default function OpeningAnimation({ onComplete }: OpeningAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [activeHeadlineIdx, setActiveHeadlineIdx] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const headlines = [
    'BREAKING NEWS',
    'LIVE BROADCAST',
    'WORLD NEWS DESK',
    'BUSINESS & FINANCE',
    'GLOBAL MARKETS LIVE',
    'POLITICS & DIPLOMACY',
    'ADVANCED TECHNOLOGY',
    'SPORTS WIRE',
    'INTERNATIONAL COVERAGE',
    'REAL-TIME UPDATES'
  ];

  // Precise Timeline Control: 0s -> 6.2s total experience
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(2), 700);    // Phase 2: Globe & Transmission Lines (0.7s)
    const t2 = setTimeout(() => setPhase(3), 2200);   // Phase 3: FC Logo Emergence & Lasers (2.2s)
    const t3 = setTimeout(() => setPhase(4), 4200);   // Phase 4: Logo Moves Beside Title (4.2s)
    const t4 = setTimeout(() => {
      setIsFadingOut(true);
      setPhase(5);
    }, 5800);                                         // Phase 5: Smooth Fade Transition (5.8s)
    const tEnd = setTimeout(() => {
      handleFinish();
    }, 6300);                                         // Complete at 6.3s

    const headlineInterval = setInterval(() => {
      setActiveHeadlineIdx((prev) => (prev + 1) % headlines.length);
    }, 900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tEnd);
      clearInterval(headlineInterval);
    };
  }, []);

  // Web Audio API: International News Broadcast Chime & Audio Flare
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();

        // 1. Sub-bass riser
        const subOsc = audioCtx.createOscillator();
        const subGain = audioCtx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(50, audioCtx.currentTime);
        subOsc.frequency.exponentialRampToValueAtTime(160, audioCtx.currentTime + 1.2);
        subGain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        subGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
        subOsc.connect(subGain);
        subGain.connect(audioCtx.destination);
        subOsc.start();
        subOsc.stop(audioCtx.currentTime + 1.2);

        // 2. Broadcast Chime Sequence (C5 -> E5 -> G5 -> C6)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          if (!audioCtx) return;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const startTime = audioCtx.currentTime + 0.3 + idx * 0.18;
          osc.type = 'triangle';
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
      console.log('Autoplay handled by browser', e);
    }

    return () => {
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close();
      }
    };
  }, []);

  // Canvas 60 FPS Engine: Red Digital Particles, 3D Rotating Globe, World Transmission Arcs
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rotation = 0;

    // High Speed Red & Metallic Digital Light Particles
    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      size: Math.random() * 2.8 + 0.8,
      alpha: Math.random() * 0.8 + 0.2,
      isRed: Math.random() > 0.35
    }));

    // Major Global News Hub Cities for Transmission Lines
    const globalHubs = [
      { name: 'New York', lat: 40.7128, lon: -74.0060 },
      { name: 'London', lat: 51.5074, lon: -0.1278 },
      { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
      { name: 'New Delhi', lat: 28.6139, lon: 77.2090 },
      { name: 'Paris', lat: 48.8566, lon: 2.3522 },
      { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
      { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
      { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
      { name: 'Beijing', lat: 39.9042, lon: 116.4074 }
    ];

    const resizeCanvas = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
      const globeRadius = Math.min(cx, cy) * 0.65;

      rotation += 0.025;
      pulseProgress = (pulseProgress + 0.02) % 1;

      // 1. High Speed Red & Silver Digital Light Particles
      particles.forEach((p) => {
        p.x += p.vx * 1.8;
        p.y += p.vy * 1.8;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.isRed 
          ? `rgba(225, 6, 0, ${p.alpha * 0.8})` 
          : `rgba(255, 255, 255, ${p.alpha * 0.9})`;
        ctx.shadowColor = p.isRed ? '#E10600' : '#FFFFFF';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 2. Globe Atmosphere Outer Radial Glow
      const bgGlow = ctx.createRadialGradient(cx, cy, globeRadius * 0.3, cx, cy, globeRadius * 1.4);
      bgGlow.addColorStop(0, 'rgba(225, 6, 0, 0.28)');
      bgGlow.addColorStop(0.5, 'rgba(225, 6, 0, 0.08)');
      bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, globeRadius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // 3. 3D Wireframe Globe Sphere Base
      ctx.beginPath();
      ctx.arc(cx, cy, globeRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(5, 5, 5, 0.92)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(225, 6, 0, 0.75)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 4. Latitude Ellipses
      for (let lat = -70; lat <= 70; lat += 20) {
        const r = globeRadius * Math.cos((lat * Math.PI) / 180);
        const y = cy + globeRadius * Math.sin((lat * Math.PI) / 180);
        ctx.beginPath();
        ctx.ellipse(cx, y, r, r * 0.25, 0, 0, Math.PI * 2);
        ctx.strokeStyle = lat === 0 ? 'rgba(255, 255, 255, 0.7)' : 'rgba(225, 6, 0, 0.22)';
        ctx.lineWidth = lat === 0 ? 1.8 : 0.8;
        ctx.stroke();
      }

      // 5. Longitude Rotating Ellipses (3D Orbit Rotation)
      for (let lon = 0; lon < 360; lon += 30) {
        const currentRot = rotation + (lon * Math.PI) / 180;
        const widthFactor = Math.sin(currentRot);

        ctx.beginPath();
        ctx.ellipse(cx, cy, globeRadius * Math.abs(widthFactor), globeRadius, 0, 0, Math.PI * 2);
        if (widthFactor > 0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1.1;
        } else {
          ctx.strokeStyle = 'rgba(225, 6, 0, 0.18)';
          ctx.lineWidth = 0.7;
        }
        ctx.stroke();
      }

      // 6. Global Transmission Hub Nodes & Inter-City Arc Lines
      const projectedCoords: { x: number; y: number; visible: boolean; name: string }[] = [];

      globalHubs.forEach((hub) => {
        const radLat = (hub.lat * Math.PI) / 180;
        const radLon = (hub.lon * Math.PI) / 180 + rotation;
        const visible = Math.sin(radLon) > 0;

        const x = cx + globeRadius * Math.cos(radLat) * Math.cos(radLon);
        const y = cy - globeRadius * Math.sin(radLat);
        projectedCoords.push({ x, y, visible, name: hub.name });

        if (visible) {
          // Hub Node Point
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

          // Hub Pulsing Rings
          ctx.beginPath();
          ctx.arc(x, y, 6 + Math.sin(rotation * 6) * 3, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(225, 6, 0, 0.9)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      });

      // Draw World Transmission Lines between visible hubs
      for (let i = 0; i < projectedCoords.length; i++) {
        for (let j = i + 1; j < projectedCoords.length; j++) {
          const h1 = projectedCoords[i];
          const h2 = projectedCoords[j];

          if (h1.visible && h2.visible) {
            ctx.beginPath();
            ctx.moveTo(h1.x, h1.y);
            const midX = (h1.x + h2.x) / 2 + (Math.sin(rotation) * 20);
            const midY = (h1.y + h2.y) / 2 - 30;
            ctx.quadraticCurveTo(midX, midY, h2.x, h2.y);
            ctx.strokeStyle = 'rgba(225, 6, 0, 0.35)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Traveling Pulse on Arc Line
            const pulseX = (1 - pulseProgress) * (1 - pulseProgress) * h1.x + 2 * (1 - pulseProgress) * pulseProgress * midX + pulseProgress * pulseProgress * h2.x;
            const pulseY = (1 - pulseProgress) * (1 - pulseProgress) * h1.y + 2 * (1 - pulseProgress) * pulseProgress * midY + pulseProgress * pulseProgress * h2.y;

            ctx.beginPath();
            ctx.arc(pulseX, pulseY, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      // 7. Radar Beam Scan
      const scanAngle = rotation * 2.2;
      const scanX = cx + Math.cos(scanAngle) * globeRadius;
      const scanY = cy + Math.sin(scanAngle) * globeRadius;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(scanX, scanY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

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
      id="cinematic-website-opening-animation"
      className={`fixed inset-0 bg-black text-white z-50 flex flex-col items-center justify-between p-4 md:p-8 overflow-hidden select-none font-sans transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* 1. Background Digital Transmission Canvas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full opacity-80" />

        {/* Laser Sweep Beam Lines */}
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent animate-laser-sweep pointer-events-none shadow-[0_0_20px_#E10600]" />

        {/* High-tech Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        {/* Background Scrolling News Categories Stream */}
        <div className="absolute inset-0 flex flex-col justify-around opacity-15 pointer-events-none select-none overflow-hidden font-mono text-[10px] md:text-xs tracking-[0.4em] font-black text-white/50">
          <div className="animate-marquee whitespace-nowrap">
            BREAKING NEWS WIRE • LIVE TRANSMISSION • GLOBAL MARKETS • INTERNATIONAL HEADLINES • POLITICS • TECHNOLOGY • WORLD DESK •
          </div>
          <div className="animate-marquee whitespace-nowrap" style={{ animationDirection: 'reverse' }}>
            SPORTS WIRE • BUSINESS INTELLIGENCE • REAL-TIME NEWS • CNN REUTERS BBC STYLE • FAST COVERAGES NETWORK •
          </div>
        </div>
      </div>

      {/* 2. Top Status Control Bar */}
      <div className="relative z-30 w-full max-w-6xl flex items-center justify-between">
        <div className="flex items-center gap-2.5 bg-black/70 border border-red-600/50 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(225,6,0,0.3)]">
          <Radio className="w-3.5 h-3.5 text-red-500 animate-ping" />
          <span className="text-[10px] md:text-xs font-mono font-black uppercase tracking-widest text-red-400">
            PHASE {phase}/5 • 4K 60FPS LIVE TRANSMISSION
          </span>
        </div>

        <button
          onClick={handleFinish}
          className="bg-white/10 hover:bg-red-600 hover:text-white border border-white/20 text-white font-mono font-black text-xs px-4 py-1.5 rounded-full backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 group"
          title="Skip to Homepage"
        >
          <span>ENTER NETWORK</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 3. Main Stage: FC Logo & Title Experience */}
      <div className="relative z-20 flex flex-col items-center justify-center my-auto max-w-5xl w-full text-center">

        <motion.div
          layout
          className={`flex flex-col items-center justify-center gap-6 md:gap-10 transition-all duration-700 ${
            phase >= 4 ? 'md:flex-row md:items-center' : ''
          }`}
        >
          {/* Official FC Logo Container with Metallic Shine & 3D Rotating Orbit Ring */}
          <motion.div
            initial={{ scale: 0.15, opacity: 0, rotate: -20 }}
            animate={{
              scale: phase === 1 ? 0.3 : phase === 2 ? 0.85 : phase === 3 ? 1.15 : 0.9,
              opacity: phase === 1 ? 0.4 : 1,
              rotate: 0
            }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-20 w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 flex items-center justify-center shrink-0"
          >
            {/* Continuously Rotating Orbit Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-red-600/90 animate-spin-slow pointer-events-none" />

            {/* Red Aura Pulse Glow */}
            <div className="absolute inset-0 rounded-full bg-red-600/30 blur-2xl animate-red-pulse pointer-events-none" />

            {/* FC Logo Image Frame */}
            <div className="relative w-40 h-40 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-full border-4 border-red-600/90 shadow-[0_0_60px_rgba(225,6,0,0.95)] overflow-hidden bg-black group">
              {/* Uploaded FC Logo Image */}
              <img
                src="/fast_coverages_logo.jpg"
                alt="FAST COVERAGES Logo"
                className="w-full h-full object-cover transform transition duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />

              {/* Diagonal Light Sweep Effect across Logo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-light-sweep pointer-events-none" />
            </div>
          </motion.div>

          {/* Typography Section (FAST COVERAGES - GLOBAL NEWS NETWORK) */}
          <motion.div
            layout
            className="flex flex-col items-center md:items-start text-center md:text-left gap-1"
          >
            <AnimatePresence mode="wait">
              {phase <= 2 ? (
                <motion.div
                  key="initializing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="font-mono text-xs md:text-sm text-red-500 tracking-[0.5em] uppercase font-black animate-pulse"
                >
                  [ GLOBAL TRANSMISSION INITIALIZING ]
                </motion.div>
              ) : (
                <motion.div
                  key="official-brand"
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="flex flex-col items-center md:items-start gap-1"
                >
                  {/* Title Typography: FAST (Metallic Silver) + COVERAGES (Red Gradient) */}
                  <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight leading-none filter drop-shadow-[0_0_30px_rgba(0,0,0,0.9)]">
                    <span className="bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(255,255,255,0.6)]">
                      FAST{' '}
                    </span>
                    <span className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(225,6,0,0.95)]">
                      COVERAGES
                    </span>
                  </h1>

                  {/* Tagline: GLOBAL NEWS NETWORK in Elegant White Glowing Typography */}
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg font-mono font-black uppercase tracking-[0.45em] text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.85)] mt-2 flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping inline-block shrink-0 shadow-[0_0_10px_#E10600]" />
                    <span>GLOBAL NEWS NETWORK</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Live Bulletins Tag */}
            <div className="h-10 my-3 flex items-center justify-center md:justify-start overflow-hidden w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeHeadlineIdx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="inline-flex items-center gap-2 bg-red-950/80 border border-red-600/80 px-4 py-1.5 rounded-full text-xs md:text-sm font-mono font-black text-red-100 uppercase tracking-wider shadow-[0_0_20px_rgba(225,6,0,0.5)]"
                >
                  <Zap className="w-4 h-4 text-red-500 animate-bounce" />
                  <span>{headlines[activeHeadlineIdx]}</span>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>

        {/* Tagline Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 3 ? 1 : 0 }}
          transition={{ duration: 0.6 }}
          className="mt-6 bg-black/80 border-y-2 border-red-600/80 py-2.5 px-6 w-full shadow-2xl backdrop-blur-md"
        >
          <p className="text-xs md:text-sm font-serif italic text-white/90 font-semibold tracking-wide">
            "The Premier Destination For Real-Time International News & Global Intelligence"
          </p>
        </motion.div>

      </div>

      {/* 4. Bottom Broadcast Progress Bar */}
      <div className="relative z-30 w-full max-w-md flex flex-col items-center gap-2 mb-1">
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-red-600 via-white to-red-600 shadow-[0_0_10px_#E10600]"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 6.0, ease: 'linear' }}
          />
        </div>
        <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED INTEL
          </span>
          <span className="flex items-center gap-1">
            <Globe2 className="w-3.5 h-3.5 text-red-500 animate-spin" /> 60 FPS BROADCAST
          </span>
        </div>
      </div>
    </div>
  );
}
