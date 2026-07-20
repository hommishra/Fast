import React, { useState } from 'react';
import { WebsiteSettings } from '../types';
import { Facebook, Twitter, Instagram, Youtube, Rss, ArrowUpRight, Mail, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  settings: WebsiteSettings;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export default function Footer({ settings, onNavigate, currentPage }: FooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => {
      setSubscribed(false);
    }, 4000);
  };

  const menuLinks = [
    { name: 'Home', slug: 'home' },
    { name: 'Breaking News', slug: 'breaking-news' },
    { name: 'Latest News', slug: 'latest-news' },
    { name: 'Trending News', slug: 'trending-news' },
    { name: 'World News', slug: 'world-news' },
    { name: 'India News', slug: 'india-news' },
    { name: 'Politics', slug: 'politics' },
    { name: 'Sports', slug: 'sports' },
    { name: 'Technology', slug: 'technology' },
    { name: 'Business', slug: 'business' },
    { name: 'Entertainment', slug: 'entertainment' },
    { name: 'Education', slug: 'education' },
    { name: 'Health', slug: 'health' },
    { name: 'Crime', slug: 'crime' },
    { name: 'Science', slug: 'science' },
    { name: 'Lifestyle', slug: 'lifestyle' },
    { name: 'Opinion', slug: 'opinion' },
    { name: 'Editorial', slug: 'editorial' },
    { name: 'Fact Check', slug: 'fact-check' },
    { name: 'Live News', slug: 'live-news' },
    { name: 'Video News', slug: 'video-news' },
    { name: 'Photo Gallery', slug: 'photo-gallery' },
    { name: 'About Us', slug: 'about-us' },
    { name: 'Contact Us', slug: 'contact-us' },
    { name: 'Advertise With Us', slug: 'advertise-with-us' },
    { name: 'Careers', slug: 'careers' },
    { name: 'Privacy Policy', slug: 'privacy-policy' },
    { name: 'Terms and Conditions', slug: 'terms-and-conditions' },
    { name: 'Disclaimer', slug: 'disclaimer' },
    { name: 'RSS Feed', slug: 'rss-feed' },
    { name: 'Sitemap', slug: 'sitemap' }
  ];

  return (
    <footer id="global-news-footer" className="bg-editorial-dark text-editorial-text border-t border-white/10 pt-12 pb-8 px-6 font-sans selection:bg-editorial-accent shrink-0">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Top bar with newsletter & Branding */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8 border-b border-white/10">
          <div className="lg:col-span-1 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl font-black uppercase tracking-tighter">
                FAST <span className="text-editorial-accent">COVERAGES</span>
              </span>
            </div>
            <p className="text-xs text-editorial-text/40 font-black tracking-[0.25em] font-mono">
              {settings.tagline || "GLOBAL NEWS NETWORK"}
            </p>
            <p className="text-xs text-editorial-text/60 leading-relaxed max-w-sm">
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
                className="bg-editorial-accent hover:bg-red-700 text-white font-black text-xs uppercase px-5 py-3 rounded tracking-wider shrink-0 transition"
              >
                Subscribe
              </button>
            </form>
            {subscribed && (
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Subscription recorded! You are added to our global news ledger.</span>
              </div>
            )}
          </div>
        </div>

        {/* Directory links */}
        <div className="flex flex-col gap-4">
          <span className="text-xs font-black uppercase tracking-wider text-editorial-text/40 font-mono">Sitemap & Network Directory</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-2.5">
            {menuLinks.map((link) => (
              <button
                key={link.slug}
                onClick={() => onNavigate(link.slug)}
                className={`text-left text-xs font-semibold flex items-center justify-between hover:text-editorial-accent transition border-b border-white/5 pb-1 ${currentPage === link.slug ? 'text-editorial-accent' : 'text-editorial-text/60'}`}
              >
                <span>{link.name}</span>
                <ArrowUpRight className="w-3 h-3 text-editorial-text/30 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Bottom copyright details and Social Icons */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-white/10">
          <p className="text-[11px] text-editorial-text/40 text-center md:text-left max-w-2xl leading-relaxed tracking-wider font-bold font-mono uppercase">
            © {new Date().getFullYear()} FAST COVERAGES – GLOBAL NEWS NETWORK. ALL RIGHTS RESERVED.
          </p>

          <div className="flex items-center gap-4">
            {settings.facebookUrl && (
              <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-editorial-bg hover:bg-white/10 border border-white/10 rounded-full text-editorial-text/60 hover:text-white transition">
                <Facebook className="w-4 h-4" />
              </a>
            )}
            {settings.twitterUrl && (
              <a href={settings.twitterUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-editorial-bg hover:bg-white/10 border border-white/10 rounded-full text-editorial-text/60 hover:text-white transition">
                <Twitter className="w-4 h-4" />
              </a>
            )}
            {settings.instagramUrl && (
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-editorial-bg hover:bg-white/10 border border-white/10 rounded-full text-editorial-text/60 hover:text-white transition">
                <Instagram className="w-4 h-4" />
              </a>
            )}
            {settings.youtubeUrl && (
              <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-editorial-bg hover:bg-white/10 border border-white/10 rounded-full text-editorial-text/60 hover:text-white transition">
                <Youtube className="w-4 h-4" />
              </a>
            )}
            {settings.rssEnabled && (
              <button onClick={() => onNavigate('rss-feed')} className="p-2 bg-editorial-bg hover:bg-white/10 border border-white/10 rounded-full text-editorial-text/60 hover:text-white transition">
                <Rss className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
}
