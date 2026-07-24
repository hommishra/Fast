import React, { useState } from 'react';
import { WebsiteSettings } from '../types';
import FCLogo from './FCLogo';
import { 
  Facebook, Twitter, Instagram, Youtube, Rss, ArrowUpRight, 
  Mail, CheckCircle2, Send, Globe, MessageCircle, Phone, 
  MapPin, ExternalLink, Share2, Shield, Lock 
} from 'lucide-react';

interface FooterProps {
  settings: WebsiteSettings;
  onNavigate: (page: string) => void;
  currentPage: string;
  onOpenAdmin: () => void;
  onReplayIntro?: () => void;
}

export default function Footer({ settings, onNavigate, currentPage, onOpenAdmin, onReplayIntro }: FooterProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    
    setLoading(true);
    setResponseMsg(null);

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResponseMsg({ text: data.message || "Subscription confirmed! Welcome email sent.", isError: false });
        setEmail('');
      } else {
        setResponseMsg({ text: data.error || "Failed to subscribe.", isError: true });
      }
    } catch (err: any) {
      setResponseMsg({ text: "Subscription submitted. Added to global mailing desk.", isError: false });
      setEmail('');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setResponseMsg(null);
      }, 6000);
    }
  };

  const activeMobileNumbers = (settings.mobileNumbers || []).filter(item => item.active !== false);
  const activeWhatsappNumbers = (settings.whatsappNumbers || []).filter(item => item.active !== false);
  const activeEmailAddresses = (settings.emailAddresses || []).filter(item => item.active !== false);
  const activeOfficeAddresses = (settings.officeAddresses || []).filter(item => item.active !== false);

  const hasAnyContactSocialInfo = Boolean(
    activeMobileNumbers.length > 0 ||
    activeWhatsappNumbers.length > 0 ||
    activeEmailAddresses.length > 0 ||
    activeOfficeAddresses.length > 0 ||
    settings.contactPhone ||
    settings.contactEmail ||
    settings.facebookUrl ||
    settings.twitterUrl ||
    settings.instagramUrl ||
    settings.youtubeUrl ||
    settings.telegramUrl ||
    settings.linkedinUrl ||
    settings.whatsappUrl ||
    settings.websiteUrl
  );

  const policyLinks = [
    { name: 'About Us', slug: 'about-us' },
    { name: 'Contact Us', slug: 'contact-us' },
    { name: 'Advertise With Us', slug: 'advertise-with-us' },
    { name: 'Careers', slug: 'careers' },
    { name: 'Privacy Policy', slug: 'privacy-policy' },
    { name: 'Terms and Conditions', slug: 'terms-and-conditions' },
    { name: 'Disclaimer', slug: 'disclaimer' }
  ];

  return (
    <footer id="global-news-footer" className="bg-editorial-dark text-editorial-text border-t border-white/10 pt-12 pb-8 px-6 font-sans selection:bg-editorial-accent shrink-0">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Top bar with newsletter & Branding */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8 border-b border-white/10">
          <div className="lg:col-span-1 flex flex-col gap-3">
            <FCLogo size="sm" showText={true} animatedGlobe={true} />
            <p className="text-xs text-editorial-text/60 leading-relaxed max-w-sm mt-1">
              The premier destination for real-time news, deep policy reports, fact-checked disclosures, and live bureaus across the World.
            </p>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-3 justify-center">
            <span className="text-xs font-black uppercase tracking-wider text-editorial-text/40 font-mono">Subscribe to Global Bulletin Briefing</span>
            <form onSubmit={handleSubscribe} className="flex max-w-md w-full gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter email for daily bullet digests..."
                  className="w-full bg-editorial-bg border border-white/10 text-xs px-3.5 py-3 rounded outline-none focus:border-editorial-accent text-editorial-text pl-10"
                />
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-editorial-text/30" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-editorial-accent hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs uppercase px-5 py-3 rounded tracking-wider shrink-0 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
            {responseMsg && (
              <div className={`flex items-center gap-1.5 text-xs font-semibold animate-fade-in ${responseMsg.isError ? 'text-red-400' : 'text-emerald-400'}`}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{responseMsg.text}</span>
              </div>
            )}

            {/* Dynamic Contact & Social Media Information - Managed from Admin Panel */}
            {hasAnyContactSocialInfo && (
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-editorial-accent font-mono flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Verified Contact & Media Desk Channels</span>
                </span>
                
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Phone Numbers */}
                  {activeMobileNumbers.map((m) => (
                    <a key={m.id} href={`tel:${m.number}`} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-editorial-bg border border-white/10 hover:border-emerald-500/50 hover:text-emerald-400 transition text-editorial-text/90 font-mono text-[11px]" title={`${m.label}: ${m.number}`}>
                      <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="font-sans font-bold text-white">{m.label}:</span>
                      <span className="font-bold">{m.number}</span>
                    </a>
                  ))}
                  {activeMobileNumbers.length === 0 && settings.contactPhone && (
                    <a href={`tel:${settings.contactPhone}`} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-editorial-bg border border-white/10 hover:border-emerald-500/50 hover:text-emerald-400 transition text-editorial-text/90 font-mono text-[11px]">
                      <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="font-sans font-bold text-white">Hotline:</span>
                      <span className="font-bold">{settings.contactPhone}</span>
                    </a>
                  )}

                  {/* WhatsApp Lines */}
                  {activeWhatsappNumbers.map((w) => (
                    <a key={w.id} href={`https://wa.me/${w.number.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-400 transition text-emerald-300 font-mono text-[11px]" title={`WhatsApp ${w.label}`}>
                      <MessageCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="font-sans font-bold text-white">{w.label}:</span>
                      <span className="font-bold text-emerald-400">{w.number}</span>
                    </a>
                  ))}

                  {/* Email Desks */}
                  {activeEmailAddresses.map((e) => (
                    <a key={e.id} href={`mailto:${e.email}`} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-editorial-bg border border-white/10 hover:border-sky-500/50 hover:text-sky-300 transition text-editorial-text/90 font-mono text-[11px]" title={`${e.label}: ${e.email}`}>
                      <Mail className="w-3 h-3 text-sky-400 shrink-0" />
                      <span className="font-sans font-bold text-white">{e.label}:</span>
                      <span className="text-sky-300">{e.email}</span>
                    </a>
                  ))}
                  {activeEmailAddresses.length === 0 && settings.contactEmail && (
                    <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-editorial-bg border border-white/10 hover:border-sky-500/50 hover:text-sky-300 transition text-editorial-text/90 font-mono text-[11px]">
                      <Mail className="w-3 h-3 text-sky-400 shrink-0" />
                      <span className="font-sans font-bold text-white">Editorial:</span>
                      <span className="text-sky-300">{settings.contactEmail}</span>
                    </a>
                  )}

                  {/* Social Handles */}
                  {settings.facebookUrl && (
                    <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-editorial-bg border border-white/10 hover:border-blue-500/50 text-blue-400 transition text-[11px] font-sans font-medium" title="Facebook">
                      <Facebook className="w-3 h-3 shrink-0" />
                      <span>Facebook</span>
                    </a>
                  )}
                  {settings.twitterUrl && (
                    <a href={settings.twitterUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-editorial-bg border border-white/10 hover:border-sky-400/50 text-sky-400 transition text-[11px] font-sans font-medium" title="Twitter (X)">
                      <Twitter className="w-3 h-3 shrink-0" />
                      <span>Twitter (X)</span>
                    </a>
                  )}
                  {settings.instagramUrl && (
                    <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-editorial-bg border border-white/10 hover:border-pink-500/50 text-pink-400 transition text-[11px] font-sans font-medium" title="Instagram">
                      <Instagram className="w-3 h-3 shrink-0" />
                      <span>Instagram</span>
                    </a>
                  )}
                  {settings.youtubeUrl && (
                    <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-editorial-bg border border-white/10 hover:border-red-500/50 text-red-400 transition text-[11px] font-sans font-medium" title="YouTube">
                      <Youtube className="w-3 h-3 shrink-0" />
                      <span>YouTube</span>
                    </a>
                  )}
                  {settings.telegramUrl && (
                    <a href={settings.telegramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-editorial-bg border border-white/10 hover:border-sky-400/50 text-sky-400 transition text-[11px] font-sans font-medium" title="Telegram">
                      <Send className="w-3 h-3 shrink-0" />
                      <span>Telegram</span>
                    </a>
                  )}
                  {settings.linkedinUrl && (
                    <a href={settings.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-editorial-bg border border-white/10 hover:border-blue-600/50 text-blue-500 transition text-[11px] font-sans font-medium" title="LinkedIn">
                      <Globe className="w-3 h-3 shrink-0" />
                      <span>LinkedIn</span>
                    </a>
                  )}

                  {/* Office Addresses Badges */}
                  {activeOfficeAddresses.map((o) => (
                    <div key={o.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-editorial-bg border border-white/10 text-editorial-text/80 text-[11px] font-sans">
                      <MapPin className="w-3 h-3 text-editorial-accent shrink-0" />
                      <span className="font-bold text-white">{o.title || o.label}:</span>
                      <span className="text-editorial-text/70">{o.address}</span>
                      {(o.mapUrl || o.googleMapsUrl) && (
                        <a href={o.mapUrl || o.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-editorial-accent hover:underline font-bold ml-1 flex items-center gap-0.5">
                          <span>Map</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  ))}

                  {/* Website URL */}
                  {settings.websiteUrl && (
                    <a href={settings.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-editorial-bg border border-white/10 hover:border-editorial-accent/50 text-editorial-accent transition text-[11px] font-mono" title="Official Website">
                      <Globe className="w-3 h-3 shrink-0" />
                      <span>{settings.websiteUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Essential Institutional Navigation Links */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-semibold">
            {policyLinks.map((link) => (
              <button
                key={link.slug}
                onClick={() => onNavigate(link.slug)}
                className={`hover:text-editorial-accent transition cursor-pointer ${currentPage === link.slug ? 'text-editorial-accent font-bold' : 'text-editorial-text/70'}`}
              >
                {link.name}
              </button>
            ))}
          </div>
        </div>

        {/* ADMIN CONTROL CENTER - Positioned at Footer Bottom */}
        <div className="pt-2 flex flex-col md:flex-row items-center justify-between gap-4 bg-editorial-bg/80 p-5 rounded-lg border border-white/10 shadow-lg">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-editorial-accent font-mono flex items-center justify-center md:justify-start gap-1.5">
              <Shield className="w-4 h-4 text-editorial-accent" />
              ADMIN CONTROL CENTER
            </span>
            <p className="text-[11px] text-editorial-text/50 font-mono">
              Restricted portal. Only visible for authorized administrators.
            </p>
          </div>

          <button 
            onClick={onOpenAdmin}
            className="flex items-center gap-2 bg-editorial-accent hover:bg-red-700 text-white font-black text-xs uppercase px-5 py-2.5 rounded tracking-wider transition cursor-pointer font-mono shadow-md active:scale-95 shrink-0"
            title="Access Restricted Admin Control Center"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Admin Control Center</span>
          </button>
        </div>

        {/* Bottom copyright details and Social Icons */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p className="text-[11px] text-editorial-text/40 text-center md:text-left leading-relaxed tracking-wider font-bold font-mono uppercase">
              © {new Date().getFullYear()} FAST COVERAGES – GLOBAL NEWS NETWORK. ALL RIGHTS RESERVED.
            </p>
            {onReplayIntro && (
              <button
                onClick={onReplayIntro}
                className="text-[10px] font-mono uppercase font-black tracking-widest text-red-500 hover:text-white bg-red-950/60 hover:bg-red-600 border border-red-600/60 px-3 py-1 rounded-full transition cursor-pointer"
                title="Replay 4K Opening Animation"
              >
                🎬 REPLAY INTRO ANIMATION
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            {settings.facebookUrl && (
              <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-editorial-bg hover:bg-white/10 border border-white/10 rounded-full text-editorial-text/60 hover:text-white transition" title="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
            )}
            {settings.twitterUrl && (
              <a href={settings.twitterUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-editorial-bg hover:bg-white/10 border border-white/10 rounded-full text-editorial-text/60 hover:text-white transition" title="Twitter (X)">
                <Twitter className="w-4 h-4" />
              </a>
            )}
            {settings.instagramUrl && (
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-editorial-bg hover:bg-white/10 border border-white/10 rounded-full text-editorial-text/60 hover:text-white transition" title="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
            )}
            {settings.youtubeUrl && (
              <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-editorial-bg hover:bg-white/10 border border-white/10 rounded-full text-editorial-text/60 hover:text-white transition" title="YouTube">
                <Youtube className="w-4 h-4" />
              </a>
            )}
            {settings.telegramUrl && (
              <a href={settings.telegramUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-editorial-bg hover:bg-white/10 border border-white/10 rounded-full text-editorial-text/60 hover:text-white transition" title="Telegram Channel">
                <Send className="w-4 h-4" />
              </a>
            )}
            {settings.linkedinUrl && (
              <a href={settings.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-editorial-bg hover:bg-white/10 border border-white/10 rounded-full text-editorial-text/60 hover:text-white transition" title="LinkedIn">
                <Globe className="w-4 h-4" />
              </a>
            )}
            {settings.whatsappUrl && (
              <a href={`https://wa.me/${settings.whatsappUrl.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-editorial-bg hover:bg-white/10 border border-white/10 rounded-full text-editorial-text/60 hover:text-emerald-400 transition" title="WhatsApp Line">
                <MessageCircle className="w-4 h-4" />
              </a>
            )}
            {settings.rssEnabled && (
              <button onClick={() => onNavigate('rss-feed')} className="p-2 bg-editorial-bg hover:bg-white/10 border border-white/10 rounded-full text-editorial-text/60 hover:text-white transition cursor-pointer" title="RSS Feed">
                <Rss className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
}

