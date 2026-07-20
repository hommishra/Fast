import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Globe, Radio, Play } from 'lucide-react';

interface OpeningAnimationProps {
  onComplete: () => void;
}

export default function OpeningAnimation({ onComplete }: OpeningAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Canvas-based 3D Globe vector animation (extremely lightweight & SEO friendly)
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let rotation = 0;

    const resizeCanvas = () => {
      canvas.width = 240;
      canvas.height = 240;
    };
    resizeCanvas();

    const drawGlobe = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = 100;

      // Draw outer atmosphere glow
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(225, 6, 0, 0.15)'; // Editorial accent glow
      ctx.lineWidth = 4;
      ctx.stroke();

      // Draw background sphere
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0a0a'; // Editorial dark
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw longitude/latitude lines with 3D rotation
      rotation += 0.015;

      ctx.strokeStyle = 'rgba(225, 6, 0, 0.3)'; // Editorial accent lines
      ctx.lineWidth = 1.5;

      // Latitude lines (horizontal rings)
      for (let lat = -75; lat <= 75; lat += 25) {
        const r = radius * Math.cos((lat * Math.PI) / 180);
        const y = cy + radius * Math.sin((lat * Math.PI) / 180);
        ctx.beginPath();
        ctx.ellipse(cx, y, r, r * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Longitude lines (vertical rings spinning)
      for (let lon = 0; lon < 180; lon += 30) {
        const currentRot = rotation + (lon * Math.PI) / 180;
        const widthFactor = Math.sin(currentRot);
        
        ctx.beginPath();
        // Draw the visible half of ellipse
        ctx.ellipse(cx, cy, radius * Math.abs(widthFactor), radius, 0, 0, Math.PI * 2);
        ctx.strokeStyle = widthFactor > 0 ? 'rgba(225, 6, 0, 0.45)' : 'rgba(225, 6, 0, 0.15)';
        ctx.stroke();
      }

      // Draw scanning satellite line
      const scanY = cy + Math.sin(rotation * 2) * radius;
      ctx.beginPath();
      ctx.moveTo(cx - radius, scanY);
      ctx.lineTo(cx + radius, scanY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw dots representing major city bureaus (Washington, London, New Delhi, Tokyo)
      const bureaus = [
        { lat: 38, lon: -77 }, // DC
        { lat: 51, lon: 0 },   // London
        { lat: 28, lon: 77 },  // New Delhi
        { lat: 35, lon: 139 }  // Tokyo
      ];

      bureaus.forEach((b) => {
        const radLat = (b.lat * Math.PI) / 180;
        const radLon = (b.lon * Math.PI) / 180 + rotation;
        
        if (Math.sin(radLon) > 0) { // On front side
          const x = cx + radius * Math.cos(radLat) * Math.cos(radLon);
          const y = cy - radius * Math.sin(radLat);
          
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          
          // Outer ping ring
          ctx.beginPath();
          ctx.arc(x, y, 8 + Math.sin(rotation * 5) * 4, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      animationId = requestAnimationFrame(drawGlobe);
    };

    drawGlobe();

    // Auto complete after 4.2 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 4200);

    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div id="opening-intro" className="fixed inset-0 bg-editorial-bg flex flex-col items-center justify-center z-50 overflow-hidden text-white font-sans selection:bg-editorial-accent">
      {/* Background CNN-style red/gray abstract bars */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-full h-8 bg-gradient-to-r from-editorial-accent to-transparent transform -skew-y-3"></div>
        <div className="absolute top-1/2 left-0 w-full h-12 bg-gradient-to-r from-slate-700 to-transparent transform skew-y-3"></div>
        <div className="absolute top-3/4 left-0 w-full h-16 bg-gradient-to-r from-editorial-accent to-transparent transform -skew-y-3"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6">
        {/* Animated Sound Waves / Signal indicators */}
        <div className="flex gap-1.5 items-end h-8 mb-4">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1.5 bg-editorial-accent rounded-full"
              animate={{ height: [8, 32, 8] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.12,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Dynamic Rotating 3D Globe Canvas */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-64 h-64 flex items-center justify-center mb-6"
        >
          <canvas ref={canvasRef} className="rounded-full shadow-2xl shadow-editorial-accent/20" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-editorial-bg pointer-events-none rounded-full"></div>
        </motion.div>

        {/* Title and Tagline */}
        <div className="text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex items-center justify-center gap-2 mb-1.5"
          >
            <div className="bg-editorial-accent text-white px-3 py-1 text-sm font-black uppercase tracking-wider rounded flex items-center gap-1.5 shadow-lg shadow-editorial-accent/30">
              <Radio className="w-4 h-4 animate-pulse" /> LIVE
            </div>
            <span className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
              FAST <span className="text-editorial-accent">COVERAGES</span>
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="text-xs tracking-[0.4em] uppercase text-slate-400 font-bold font-mono"
          >
            GLOBAL NEWS NETWORK
          </motion.p>
        </div>

        {/* Live Ticker Style News Headline Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.5 }}
          className="w-full mt-8 bg-editorial-dark border-l-4 border-editorial-accent px-4 py-2 text-xs flex items-center gap-3 rounded-r shadow-lg shadow-black/50"
        >
          <span className="text-editorial-accent font-black tracking-wider uppercase flex items-center gap-1 shrink-0 font-mono">
            <Play className="w-3 h-3 fill-current" /> UPDATE
          </span>
          <span className="text-slate-200 line-clamp-1 font-medium">
            Connecting to Geneva bureau... Historic Green Alliance Treaty Signed.
          </span>
        </motion.div>

        {/* Loading Ring Progress */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-editorial-accent to-red-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3.5, ease: "easeInOut" }}
            />
          </div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
            Optimizing GoDaddy Cloud Cache...
          </span>
        </div>
      </div>
    </div>
  );
}
