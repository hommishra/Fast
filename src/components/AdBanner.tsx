import { AdSlot } from '../types';
import { ExternalLink } from 'lucide-react';

interface AdBannerProps {
  slot: AdSlot | undefined;
  className?: string;
}

export default function AdBanner({ slot, className = "" }: AdBannerProps) {
  if (!slot || !slot.active) return null;

  return (
    <div id={`ad-container-${slot.id}`} className={`w-full flex flex-col items-center justify-center bg-white dark:bg-editorial-dark border border-slate-200 dark:border-white/5 p-2 text-center rounded-lg transition-all duration-300 ${className}`}>
      {/* Tiny commercial tag */}
      <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400 dark:text-editorial-text/30 font-mono font-black mb-1">
        Sponsored Advertisement
      </span>

      {slot.imageUrl ? (
        <a
          href={slot.targetUrl || 'https://godaddy.com'}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block group overflow-hidden rounded max-w-full"
        >
          <img
            src={slot.imageUrl}
            alt={slot.label}
            className="max-w-full h-auto object-cover border border-slate-200 dark:border-white/10 hover:opacity-95 transition-opacity"
            referrerPolicy="no-referrer"
          />
          {/* Subtle hover icon overlay */}
          <div className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        </a>
      ) : (
        <div className="w-full min-h-[90px] bg-[#fcfbf9] dark:bg-editorial-bg border border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center p-3 rounded">
          {slot.code ? (
            <div 
              className="text-xs text-slate-500 dark:text-editorial-text/60 font-mono text-center max-w-md line-clamp-3 overflow-hidden bg-white dark:bg-editorial-dark p-2 rounded border border-slate-200 dark:border-white/5"
              dangerouslySetInnerHTML={{ __html: slot.code }}
            />
          ) : (
            <div className="text-center p-4">
              <span className="text-xs font-black text-slate-400 dark:text-editorial-text/40 font-mono tracking-wider">
                {slot.label}
              </span>
              <p className="text-[10px] text-slate-400 dark:text-editorial-text/30 mt-1">Configure AdSense code or Upload banner in the Premium Admin Control Center</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
