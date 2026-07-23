import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radio, Play, Pause, Volume2, VolumeX, Maximize2, 
  Share2, Eye, Clock, Calendar, Sparkles, Check, 
  ExternalLink, Layers, AlertCircle, RefreshCw
} from 'lucide-react';
import { VideoItem, LiveBroadcastState } from '../types';

interface LiveNewsSectionProps {
  liveBroadcast: LiveBroadcastState;
  videos: VideoItem[];
  onPlayVideo: (video: VideoItem) => void;
  isDarkMode?: boolean;
}

export default function LiveNewsSection({
  liveBroadcast,
  videos,
  onPlayVideo,
  isDarkMode = false
}: LiveNewsSectionProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [copiedShare, setCopiedShare] = useState(false);
  const [viewers, setViewers] = useState(liveBroadcast?.viewerCount || 0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync viewers with liveBroadcast prop from real server state
  useEffect(() => {
    if (liveBroadcast?.viewerCount !== undefined) {
      setViewers(liveBroadcast.viewerCount);
    }
  }, [liveBroadcast?.viewerCount]);

  // Sync playback properties
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [isMuted, playbackSpeed]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const liveReplays = videos.filter(v => 
    v.isLiveRecording || 
    v.category?.toLowerCase().includes('live') || 
    v.category?.toLowerCase().includes('world') ||
    v.category?.toLowerCase().includes('breaking')
  );

  const isLiveActive = liveBroadcast && liveBroadcast.enabled !== false && (liveBroadcast.isLive || liveBroadcast.isPinned);

  return (
    <section className="w-full bg-slate-950 text-white border-y border-red-900/40 shadow-2xl overflow-hidden my-6">
      {/* Network Header Bar */}
      <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-950 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono font-bold tracking-wider border-b border-red-500/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/40 px-2.5 py-0.5 rounded text-white border border-white/20">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${liveBroadcast.isLive ? 'bg-red-400' : 'bg-slate-500'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${liveBroadcast.isLive ? 'bg-red-500' : 'bg-slate-400'}`}></span>
            </span>
            <span className={`${liveBroadcast.isLive ? 'text-red-400' : 'text-slate-300'} font-black tracking-widest uppercase`}>
              {liveBroadcast.isLive ? 'LIVE' : 'LIVE HUB'}
            </span>
          </div>
          {liveBroadcast.isLive && liveBroadcast.title && (
            <span className="text-white font-bold tracking-wider uppercase hidden sm:inline-block line-clamp-1 max-w-md">
              {liveBroadcast.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-[11px] text-red-100">
          {liveBroadcast.isLive && (
            <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-0.5 rounded border border-white/10">
              <Eye className="w-3.5 h-3.5 text-red-400" />
              <span className="font-mono text-white font-bold">{viewers.toLocaleString()}</span>
            </div>
          )}
          {liveBroadcast.isLive && liveBroadcast.author && (
            <div className="hidden md:flex items-center gap-1 text-[10px] text-red-200 uppercase tracking-widest font-mono">
              <span>{liveBroadcast.author}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-6 flex flex-col gap-8">
        {/* Active Live Broadcast Container */}
        {isLiveActive ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Live Player Window */}
            <div 
              ref={containerRef}
              className="lg:col-span-8 bg-black rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative group flex flex-col"
            >
              <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                <video
                  ref={videoRef}
                  src={liveBroadcast.streamUrl}
                  poster={liveBroadcast.thumbnailUrl}
                  autoPlay
                  loop
                  playsInline
                  muted={isMuted}
                  className="w-full h-full object-cover"
                />

                {/* Top Overlay Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-600 text-white font-black text-[11px] px-2.5 py-1 rounded shadow-md font-mono tracking-widest flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                      LIVE
                    </span>
                    <span className="bg-slate-900/90 text-slate-200 text-[10px] font-mono font-bold px-2 py-1 rounded backdrop-blur-md border border-slate-700">
                      {liveBroadcast.category || 'BREAKING NEWS'}
                    </span>
                  </div>

                  <div className="bg-slate-950/80 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded backdrop-blur-md border border-slate-700/80 flex items-center gap-1.5 shadow">
                    <Eye className="w-3 h-3 text-red-500 animate-pulse" />
                    <span>{viewers.toLocaleString()} LIVE VIEWERS</span>
                  </div>
                </div>

                {/* News Channel Lower-Third Graphic Overlay */}
                <div className="absolute bottom-12 left-0 right-0 bg-gradient-to-r from-red-950/90 via-slate-950/90 to-red-950/90 p-3 border-y border-red-600/50 backdrop-blur-md flex flex-col gap-0.5 shadow-2xl pointer-events-none">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-600 text-white text-[9px] font-black font-mono px-1.5 py-0.5 uppercase tracking-widest shrink-0">
                      LIVE REPORT
                    </span>
                    <span className="text-white font-black text-sm md:text-base font-sans line-clamp-1 drop-shadow-md">
                      {liveBroadcast.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-1 font-serif hidden sm:block">
                    {liveBroadcast.description}
                  </p>
                </div>

                {/* Interactive Player Controls Overlay Bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-slate-950/90 border-t border-slate-800 p-2.5 flex items-center justify-between gap-3 text-xs font-mono backdrop-blur-md z-20">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="p-1.5 rounded hover:bg-white/10 text-white transition cursor-pointer"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4 text-red-500" /> : <Play className="w-4 h-4 text-emerald-400" />}
                    </button>

                    <button
                      type="button"
                      onClick={toggleMute}
                      className="p-1.5 rounded hover:bg-white/10 text-white transition cursor-pointer flex items-center gap-1.5"
                      title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-emerald-400" />
                      )}
                      <span className="text-[10px] text-slate-300 hidden sm:inline">
                        {isMuted ? 'UNMUTE SOUND' : 'AUDIO ON'}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-[11px]">
                    {/* Playback Speed Switcher */}
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-slate-300">
                      <span className="text-[9px] text-slate-500 uppercase font-bold mr-1">Speed</span>
                      {[0.5, 1, 1.25, 1.5, 2].map(speed => (
                        <button
                          key={speed}
                          type="button"
                          onClick={() => setPlaybackSpeed(speed)}
                          className={`px-1 rounded text-[10px] font-bold transition cursor-pointer ${playbackSpeed === speed ? 'bg-red-600 text-white' : 'hover:text-white text-slate-400'}`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleShare}
                      className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1"
                      title="Share Stream"
                    >
                      {copiedShare ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                      <span className="text-[10px] hidden md:inline">{copiedShare ? 'COPIED!' : 'SHARE'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                      title="Toggle Fullscreen"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Broadcast Details & Info Column */}
            <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-6 shadow-xl">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-mono font-black uppercase text-red-500 flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                    LIVE NETWORK FEED
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    WORLDWIDE
                  </span>
                </div>

                <h2 className="text-lg lg:text-xl font-black text-white leading-snug font-sans">
                  {liveBroadcast.title}
                </h2>

                <p className="text-xs text-slate-300 leading-relaxed font-serif">
                  {liveBroadcast.description}
                </p>

                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded flex flex-col gap-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Anchor / Bureau:</span>
                    <span className="text-white font-bold">{liveBroadcast.author || 'Editorial Desk'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Signal Status:</span>
                    <span className={`font-bold flex items-center gap-1 ${liveBroadcast.isLive ? 'text-emerald-400' : 'text-slate-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${liveBroadcast.isLive ? 'bg-emerald-500 animate-ping' : 'bg-slate-500'}`}></span>
                      {liveBroadcast.isLive ? 'Active Stream' : 'Offline'}
                    </span>
                  </div>
                  {liveBroadcast.category && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Category:</span>
                      <span className="text-red-400 font-bold uppercase">{liveBroadcast.category}</span>
                    </div>
                  )}
                  {liveBroadcast.startTime && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Stream Started:</span>
                      <span className="text-slate-200">{new Date(liveBroadcast.startTime).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Share & Interactive Actions */}
              <div className="flex flex-col gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-mono font-black text-xs uppercase tracking-wider rounded shadow flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {copiedShare ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  <span>{copiedShare ? 'LIVE LINK COPIED TO CLIPBOARD' : 'SHARE LIVE BROADCAST STREAM'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 shadow-xl my-2">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-red-500">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="text-base md:text-lg font-bold font-sans text-slate-200">
              No LIVE broadcast is currently available.
            </h3>
            <p className="text-xs text-slate-400 max-w-md font-serif">
              The broadcast studio is currently in standby. When the admin starts a live transmission from the Admin Panel, it will appear here instantly.
            </p>
          </div>
        )}

        {/* REPLAY OF PREVIOUS LIVE BROADCASTS & LIVE NEWS VIDEOS */}
        <div className="flex flex-col gap-4 border-t border-slate-800/80 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-5 bg-red-600 rounded-full"></div>
              <h3 className="text-sm md:text-base font-black uppercase tracking-wider text-white font-mono">
                LIVE NEWS VIDEOS & RECORDED BROADCASTS
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {videos.length} Verified Video Broadcasts Available
            </span>
          </div>

          {videos.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400 font-serif italic text-xs">
              No recorded live video broadcasts available at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {videos.map((vid) => (
                <div
                  key={vid.id}
                  onClick={() => onPlayVideo(vid)}
                  className="group bg-slate-900 border border-slate-800 hover:border-red-600/60 rounded-xl overflow-hidden flex flex-col justify-between transition duration-200 cursor-pointer shadow-lg hover:shadow-red-950/30"
                >
                  <div>
                    {/* Thumbnail Viewport */}
                    <div className="relative aspect-video bg-slate-950 overflow-hidden">
                      <img
                        src={vid.thumbnailUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=800'}
                        alt={vid.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/10 transition duration-200 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition duration-200 border border-white/20">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                      </div>

                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className="bg-red-600 text-white text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded shadow">
                          {vid.category || 'LIVE REPORT'}
                        </span>
                        {vid.fileSize && (
                          <span className="bg-slate-950/80 text-emerald-400 border border-emerald-800/80 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded backdrop-blur">
                            {vid.fileSize}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-3.5 flex flex-col gap-1.5">
                      <h4 className="text-xs font-bold text-white group-hover:text-red-400 transition line-clamp-2 leading-snug font-sans">
                        {vid.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 font-serif leading-relaxed">
                        {vid.description}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-3.5 pt-0 flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-800/60 mt-2">
                    <span className="truncate max-w-[120px]">By {vid.author || 'Fast Coverages'}</span>
                    <span className="text-slate-500">{new Date(vid.publishDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
