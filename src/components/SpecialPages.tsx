import React, { useState } from 'react';
import { 
  Mail, MapPin, Send, Briefcase, Award, CheckCircle2, 
  Play, Users, Heart, Eye, Megaphone, ShieldCheck, 
  HelpCircle, Sparkles, Video, Image, ExternalLink
} from 'lucide-react';
import { Article, CareerListing, User, WebsiteSettings, AdSlot } from '../types';

interface SpecialPagesProps {
  page: string;
  articles: Article[];
  careers: CareerListing[];
  users: User[];
  settings: WebsiteSettings;
  adSlots: AdSlot[];
  onNavigate: (page: string) => void;
  onViewArticle: (art: Article) => void;
  onUpdateCareers?: (careers: CareerListing[]) => void;
}

export default function SpecialPages({
  page,
  articles,
  careers,
  users,
  settings,
  adSlots,
  onNavigate,
  onViewArticle,
  onUpdateCareers
}: SpecialPagesProps) {
  switch (page) {
    case 'about-us':
      return <AboutUs users={users} settings={settings} onNavigate={onNavigate} />;
    case 'contact-us':
      return <ContactUs settings={settings} />;
    case 'advertise-with-us':
      return <AdvertiseWithUs adSlots={adSlots} />;
    case 'careers':
      return <Careers careers={careers} onUpdateCareers={onUpdateCareers} />;
    case 'privacy-policy':
      return <LegalPage title="Privacy Policy" lastUpdated="July 20, 2026" />;
    case 'terms-and-conditions':
      return <LegalPage title="Terms & Conditions" lastUpdated="July 20, 2026" />;
    case 'disclaimer':
      return <LegalPage title="Disclaimer & Editorial Guidelines" lastUpdated="July 20, 2026" />;
    case 'live-news':
      return <LiveNews articles={articles} onViewArticle={onViewArticle} />;
    case 'video-news':
      return <VideoNews articles={articles} onViewArticle={onViewArticle} />;
    case 'photo-gallery':
      return <PhotoGallery articles={articles} onViewArticle={onViewArticle} />;
    default:
      return (
        <div className="p-8 text-center bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 rounded-lg">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-2 animate-bounce" />
          <h3 className="text-lg font-black uppercase text-slate-950 dark:text-editorial-text font-mono tracking-widest mb-1">404 Desk Not Found</h3>
          <p className="text-xs text-slate-500 dark:text-editorial-text/60">This section has been retired or moved under cloud server re-indexing protocols.</p>
          <button 
            onClick={() => onNavigate('home')} 
            className="mt-4 bg-editorial-accent hover:bg-red-700 text-white font-black text-xs uppercase px-5 py-2.5 rounded font-mono tracking-widest cursor-pointer"
          >
            Return to News Desk
          </button>
        </div>
      );
  }
}

/* ================== ABOUT US ================== */
function AboutUs({ users, settings, onNavigate }: { users: User[]; settings: WebsiteSettings; onNavigate: (page: string) => void }) {
  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-6 md:p-8 rounded-lg shadow-sm">
        <h2 className="text-xs font-black uppercase text-editorial-accent tracking-[0.25em] font-mono mb-2">Our Mission</h2>
        <h1 className="text-2xl md:text-4xl font-black text-slate-950 dark:text-editorial-text leading-tight mb-4">
          FAST COVERAGES is the world's independent news broadcasting infrastructure.
        </h1>
        <p className="text-sm md:text-base text-slate-600 dark:text-editorial-text/75 leading-relaxed mb-6 font-serif">
          Established to break barriers of latency and corporate narrative limits, FAST COVERAGES provides real-time, dynamic bulletins synced instantly worldwide. Operating on Node.js clustering and Distributed Edge Cloud Hosting, our technology guarantees zero-downtime, extreme sitemap index speed, and reliable, fact-checked reporting.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-white/10">
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-black text-editorial-accent font-mono">1.8M+</span>
            <span className="text-xs font-bold text-slate-850 dark:text-editorial-text uppercase tracking-wider">Hourly Readers</span>
            <span className="text-[11px] text-slate-400">Vetted by audited Google News discover logs.</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-black text-editorial-accent font-mono">15+</span>
            <span className="text-xs font-bold text-slate-850 dark:text-editorial-text uppercase tracking-wider">News Bureaus</span>
            <span className="text-[11px] text-slate-400">Coordinating from London, Tokyo, Geneva and Mumbai.</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-black text-editorial-accent font-mono">0ms</span>
            <span className="text-xs font-bold text-slate-850 dark:text-editorial-text uppercase tracking-wider">Sync Latency</span>
            <span className="text-[11px] text-slate-400">Admins publish once, changes propagate instantly everywhere.</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-black uppercase text-slate-950 dark:text-editorial-text tracking-[0.2em] font-mono pb-2 border-b border-editorial-accent mb-6">Our Senior Editorial Board</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((u) => (
            <div key={u.id} className="bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-5 rounded-lg flex gap-4 shadow-sm">
              <img src={u.avatar} className="w-16 h-16 rounded-full border border-slate-200 dark:border-white/10 shrink-0 object-cover" alt={u.name} />
              <div className="flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-950 dark:text-editorial-text">{u.name}</h4>
                  <span className="text-[10px] uppercase font-mono font-black text-editorial-accent tracking-wider bg-editorial-accent/10 px-2 py-0.5 rounded">{u.role}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-editorial-text/60 leading-relaxed mt-2 line-clamp-2">{u.bio || "Senior expert at the FAST COVERAGES global news desk."}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================== CONTACT US ================== */
function ContactUs({ settings }: { settings: WebsiteSettings }) {
  const [sent, setSent] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      <div className="lg:col-span-2 bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-6 md:p-8 rounded-lg shadow-sm">
        <h2 className="text-xs font-black uppercase text-editorial-accent tracking-[0.25em] font-mono mb-2">Editorial Desk</h2>
        <h1 className="text-xl md:text-3xl font-black text-slate-950 dark:text-editorial-text leading-tight mb-4">Submit Tips & Feedback</h1>
        <p className="text-xs text-slate-500 dark:text-editorial-text/60 leading-relaxed mb-6">
          Do you have a secure leak, breaking bulletin tip, or general feedback about our articles? Fill out the encrypted registry below. All files are reviewed under Strict Journalist Privilege protocols.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 dark:text-editorial-text/40 font-mono">Your Identity / Alias *</label>
              <input type="text" required placeholder="John Doe or Anonymous" className="bg-slate-50 dark:bg-editorial-bg border border-slate-200 dark:border-white/10 text-xs p-3 rounded outline-none focus:border-editorial-accent dark:text-editorial-text" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 dark:text-editorial-text/40 font-mono">Secure Email Address *</label>
              <input type="email" required placeholder="alias@protonmail.com" className="bg-slate-50 dark:bg-editorial-bg border border-slate-200 dark:border-white/10 text-xs p-3 rounded outline-none focus:border-editorial-accent dark:text-editorial-text" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-editorial-text/40 font-mono">Inquiry Category *</label>
            <select className="bg-slate-50 dark:bg-editorial-bg border border-slate-200 dark:border-white/10 text-xs p-3 rounded outline-none focus:border-editorial-accent dark:text-editorial-text">
              <option>Breaking News Leak (Anonymous)</option>
              <option>Editorial Review Challenge</option>
              <option>Technical/Cloud Server Inquiry</option>
              <option>General Press Bulletin</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-editorial-text/40 font-mono">Secure Message Body *</label>
            <textarea rows={6} required placeholder="Describe the story, include dates, coordinates, or verified sources..." className="bg-slate-50 dark:bg-editorial-bg border border-slate-200 dark:border-white/10 text-xs p-3 rounded outline-none focus:border-editorial-accent dark:text-editorial-text" />
          </div>

          <button type="submit" className="bg-editorial-accent hover:bg-red-700 text-white font-black py-3 px-6 rounded text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer font-mono">
            <Send className="w-4 h-4" /> Send Secure Transmission
          </button>

          {sent && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400 rounded text-xs flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
              <span>Tip logged dynamically! Vetted in our administrative security workspace.</span>
            </div>
          )}
        </form>
      </div>

      <div className="flex flex-col gap-6">
        <div className="bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-5 rounded-lg shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-black uppercase text-slate-950 dark:text-editorial-text pb-2 border-b border-editorial-accent tracking-[0.2em] font-mono">Global Offices</h3>
          <div className="flex flex-col gap-4 text-xs">
            <div className="flex gap-3">
              <MapPin className="w-5 h-5 text-editorial-accent shrink-0" />
              <div>
                <p className="font-bold text-slate-900 dark:text-editorial-text">New York Headquarters</p>
                <p className="text-slate-400 mt-0.5 leading-relaxed">{settings.officeAddressNY || "Times Square News Tower, Floor 44, New York, NY 10036"}</p>
              </div>
            </div>
            <div className="flex gap-3 border-t border-slate-100 dark:border-white/5 pt-3">
              <MapPin className="w-5 h-5 text-editorial-accent shrink-0" />
              <div>
                <p className="font-bold text-slate-900 dark:text-editorial-text">London Bureau</p>
                <p className="text-slate-400 mt-0.5 leading-relaxed">{settings.officeAddressLondon || "Reuters Way, Westminster Hub, London EC4Y 0DY"}</p>
              </div>
            </div>
            <div className="flex gap-3 border-t border-slate-100 dark:border-white/5 pt-3">
              <MapPin className="w-5 h-5 text-editorial-accent shrink-0" />
              <div>
                <p className="font-bold text-slate-900 dark:text-editorial-text">New Delhi Hub</p>
                <p className="text-slate-400 mt-0.5 leading-relaxed">{settings.officeAddressDelhi || "Connaught Space Chambers, Sector 4, New Delhi 110001"}</p>
              </div>
            </div>
            <div className="flex gap-3 border-t border-slate-100 dark:border-white/5 pt-3">
              <Mail className="w-5 h-5 text-editorial-accent shrink-0" />
              <div>
                <p className="font-bold text-slate-900 dark:text-editorial-text">Secure Email Directory</p>
                <p className="text-slate-400 mt-0.5 leading-relaxed text-editorial-accent font-mono">{settings.contactEmail || "editorial@fastcoverages.com"}</p>
              </div>
            </div>
            <div className="flex gap-3 border-t border-slate-100 dark:border-white/5 pt-3">
              <Mail className="w-5 h-5 opacity-0 shrink-0" />
              <div>
                <p className="font-bold text-slate-900 dark:text-editorial-text">Telephone Desk</p>
                <p className="text-slate-400 mt-0.5 leading-relaxed font-mono">{settings.contactPhone || "+1 (212) 555-0199"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================== ADVERTISE WITH US ================== */
function AdvertiseWithUs({ adSlots }: { adSlots: AdSlot[] }) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      <div className="lg:col-span-2 bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-6 md:p-8 rounded-lg shadow-sm">
        <h2 className="text-xs font-black uppercase text-editorial-accent tracking-[0.25em] font-mono mb-2">Partnerships</h2>
        <h1 className="text-xl md:text-3xl font-black text-slate-950 dark:text-editorial-text leading-tight mb-4">Enterprise Commercial Banners</h1>
        <p className="text-xs text-slate-500 dark:text-editorial-text/60 leading-relaxed mb-6 font-serif">
          Partner with FAST COVERAGES to put your product in front of millions of highly engaged business, politics, and technology visitors globally. Our dynamic advertisement controller manages delivery seamlessly across devices with responsive tracking.
        </p>

        <h3 className="text-xs font-black uppercase text-slate-900 dark:text-editorial-text font-mono tracking-wider mb-3">Available High-Yield Ad Slots</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {adSlots.map((slot) => (
            <div key={slot.id} className="p-3 bg-slate-50 dark:bg-editorial-bg border border-slate-200 dark:border-white/10 rounded flex justify-between items-center text-xs">
              <div>
                <p className="font-black text-slate-900 dark:text-editorial-text">{slot.type} Slot</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{slot.label}</p>
              </div>
              <span className={`text-[9px] uppercase font-mono font-black px-2 py-0.5 rounded ${slot.active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {slot.active ? 'Active' : 'Unallocated'}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); setTimeout(() => setSubmitted(false), 5000); }} className="flex flex-col gap-4 border-t border-slate-100 dark:border-white/5 pt-5">
          <span className="text-[11px] font-black uppercase text-slate-400 dark:text-editorial-text/40 font-mono">Inquire For Advertising Placements</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" required placeholder="Company Name" className="bg-slate-50 dark:bg-editorial-bg border border-slate-200 dark:border-white/10 text-xs p-2.5 rounded outline-none focus:border-editorial-accent dark:text-editorial-text" />
            <input type="email" required placeholder="Partner Email" className="bg-slate-50 dark:bg-editorial-bg border border-slate-200 dark:border-white/10 text-xs p-2.5 rounded outline-none focus:border-editorial-accent dark:text-editorial-text" />
          </div>
          <button type="submit" className="bg-editorial-accent hover:bg-red-700 text-white font-black py-2.5 px-4 rounded text-xs uppercase tracking-widest transition flex items-center justify-center gap-1.5 cursor-pointer font-mono">
            <Megaphone className="w-3.5 h-3.5" /> Request Media Kit Rate-Card
          </button>
          {submitted && (
            <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Request logged! Our sales board will transmit the rates folder shortly.
            </p>
          )}
        </form>
      </div>

      <div className="flex flex-col gap-6">
        <div className="bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-5 rounded-lg shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-black uppercase text-slate-950 dark:text-editorial-text pb-2 border-b border-editorial-accent tracking-[0.2em] font-mono">Campaign Metrics</h3>
          <div className="flex flex-col gap-3.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-white/5">
              <span className="text-slate-400">Average Click CTR</span>
              <span className="font-mono font-bold text-slate-900 dark:text-editorial-text">3.41%</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-white/5">
              <span className="text-slate-400">Total Monthly Impressions</span>
              <span className="font-mono font-bold text-slate-900 dark:text-editorial-text">44,800,291</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-white/5">
              <span className="text-slate-400">Geographic Spread</span>
              <span className="font-mono font-bold text-slate-900 dark:text-editorial-text">US (42%), IN (28%), EU (20%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================== CAREERS ================== */
function Careers({ careers, onUpdateCareers }: { careers: CareerListing[]; onUpdateCareers?: (careers: CareerListing[]) => void }) {
  const [applied, setApplied] = useState<string | null>(null);

  const handleApply = (id: string) => {
    setApplied(id);
    setTimeout(() => setApplied(null), 5000);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-6 rounded-lg">
        <h2 className="text-xs font-black uppercase text-editorial-accent tracking-[0.25em] font-mono mb-2">Join Fast Coverages</h2>
        <h1 className="text-xl md:text-3xl font-black text-slate-950 dark:text-editorial-text mb-4">Available Positions & Fellowships</h1>
        <p className="text-xs text-slate-500 dark:text-editorial-text/60 leading-relaxed font-serif">
          Work at the bleeding edge of global reporting. We recruit elite journalists, tech architects, and newsroom coordinators committed to objective, rapid content indexation on Cloud Run and Distributed Server environments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {careers.map((c) => (
          <div key={c.id} className="bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-5 rounded-lg flex flex-col justify-between shadow-sm">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-red-100 dark:bg-red-950/40 text-editorial-accent font-black font-mono uppercase px-2 py-0.5 rounded tracking-wider">{c.type}</span>
                <span className="text-[10px] text-slate-400 font-mono">{c.location}</span>
              </div>
              <h3 className="text-base font-black text-slate-950 dark:text-editorial-text leading-tight">{c.title}</h3>
              <p className="text-[11px] text-slate-400 font-bold font-mono">{c.department}</p>
              <p className="text-xs text-slate-600 dark:text-editorial-text/70 leading-relaxed mt-1 font-serif">{c.description}</p>
              
              <div className="mt-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-editorial-text/40 font-mono block mb-1">Prerequisites:</span>
                <ul className="list-disc pl-4 text-xs text-slate-500 dark:text-editorial-text/60 space-y-0.5 leading-relaxed">
                  {c.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <button 
                onClick={() => handleApply(c.id)}
                className="w-full bg-editorial-accent hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest py-2.5 rounded transition cursor-pointer font-mono"
              >
                {applied === c.id ? '✓ Application Transmitted' : 'Submit Application Form'}
              </button>

              {sessionStorage.getItem('fc_admin_session') === 'active' && onUpdateCareers && (
                <button 
                  onClick={() => {
                    if (window.confirm("PERMANENT DELETE: Are you sure you want to permanently delete this career listing? This cannot be undone.")) {
                      const updated = careers.filter(item => item.id !== c.id);
                      onUpdateCareers(updated);
                    }
                  }}
                  className="w-full bg-red-650 hover:bg-red-750 text-white font-black text-xs uppercase tracking-widest py-2 rounded transition cursor-pointer font-mono"
                >
                  Delete Listing Permanently
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================== LEGAL PAGES (Privacy, Terms, Disclaimer) ================== */
function LegalPage({ title, lastUpdated }: { title: string; lastUpdated: string }) {
  return (
    <div className="bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-6 md:p-8 rounded-lg shadow-sm animate-fade-in">
      <h2 className="text-xs font-black uppercase text-editorial-accent tracking-[0.25em] font-mono mb-2">Legal Disclosure Desk</h2>
      <h1 className="text-xl md:text-3xl font-black text-slate-950 dark:text-editorial-text mb-2">{title}</h1>
      <p className="text-[11px] text-slate-400 font-mono mb-6">LAST REVISED: {lastUpdated} • GLOBAL AUDIT CODE #920311-A</p>

      <div className="text-sm text-slate-850 dark:text-editorial-text/80 leading-relaxed space-y-4 font-serif max-w-4xl">
        <p>
          Welcome to the legal documentation vault of <strong>FAST COVERAGES</strong>. Under standard global digital guidelines, all articles, image assets, sitemaps, and RSS outputs must conform to international licensing and metadata standards.
        </p>
        <h3 className="text-xs font-black uppercase text-slate-950 dark:text-editorial-text tracking-wider font-mono pt-3">1. Content Licensing & Copyright</h3>
        <p>
          All dynamic bulletins, videos, and images managed within our database are the exclusive property of FAST COVERAGES Global News Network. No scraping, automated LLM training ingestions, or secondary unlicensed mirror deployments on standard shared hosting are permitted without explicitly signed press API licenses.
        </p>
        <h3 className="text-xs font-black uppercase text-slate-950 dark:text-editorial-text tracking-wider font-mono pt-3">2. Performance Index & Data Security</h3>
        <p>
          To maintain extreme performance scores (Lighthouse 95+ and PageSpeed Mobile 90+), we do not track extensive cookie matrices. User sessions are verified cryptographically using securely encoded signatures. Any administrative access is monitored and safeguarded by multi-layered OTP logs.
        </p>
        <h3 className="text-xs font-black uppercase text-slate-950 dark:text-editorial-text tracking-wider font-mono pt-3">3. Editorial Guidelines and Accuracy Mandate</h3>
        <p>
          Our staff of reporters is held strictly to the Reuters and AP guidelines. In cases of unvalidated social media claims, our investigative fact-check division will append a highlighted review tag mapping the verified truth index. All updates are synchronized globally without manual file re-uploads or server reboots.
        </p>
      </div>
    </div>
  );
}

/* ================== LIVE NEWS ================== */
function LiveNews({ articles, onViewArticle }: { articles: Article[]; onViewArticle: (art: Article) => void }) {
  const liveArticles = articles.filter(a => a.category.toLowerCase().includes('live') || a.category.toLowerCase().includes('world') || a.isPinned);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Live Video Player and active broadcast room */}
      <div className="lg:col-span-2 bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-5 md:p-6 rounded-lg shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-editorial-accent animate-ping"></span>
            <h2 className="text-sm font-black uppercase tracking-widest text-editorial-accent font-mono">BUREAU STREAM 1 • LIVE NOW</h2>
          </div>
          <span className="text-[10px] bg-slate-150 dark:bg-white/10 text-slate-400 font-mono px-2 py-0.5 rounded">720p HD • low-latency</span>
        </div>

        {/* Video stream simulator container */}
        <div className="relative aspect-video bg-black rounded-md overflow-hidden group border border-white/5 shadow-2xl">
          <img 
            src="https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1200" 
            className="w-full h-full object-cover opacity-60 absolute" 
            alt="Live news background" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
          
          {/* Controls simulator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="bg-editorial-accent text-white p-5 rounded-full hover:scale-105 transition-transform duration-300 shadow-lg cursor-pointer">
              <Play className="w-8 h-8 fill-current ml-1" />
            </button>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white font-mono text-xs">
            <span className="bg-red-600 px-2 py-0.5 font-bold text-[10px] tracking-wider rounded uppercase">LIVE</span>
            <span>FAST COVERAGES GLOBAL SATELLITE FEED</span>
          </div>
        </div>

        <div>
          <h1 className="text-lg md:text-2xl font-black text-slate-950 dark:text-editorial-text leading-tight mt-2">
            Global News Desk Live Updates: Geopolitical shifting patterns and climate outcomes
          </h1>
          <p className="text-xs text-slate-500 dark:text-editorial-text/60 leading-relaxed mt-2 leading-relaxed">
            FAST COVERAGES news anchors are currently breaking bulletins from New York and Geneva. Turn on sound to listen to the live narration feed or read live blog bullets below.
          </p>
        </div>
      </div>

      {/* Live blog bullet timeline */}
      <div className="bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-4 rounded-lg flex flex-col gap-4 max-h-[600px] overflow-y-auto">
        <h3 className="text-xs font-black uppercase text-slate-950 dark:text-editorial-text pb-2 border-b border-editorial-accent tracking-[0.2em] font-mono">Real-time Blog Bullets</h3>
        <div className="flex flex-col gap-4">
          {liveArticles.map((art, idx) => (
            <div 
              key={art.id} 
              onClick={() => onViewArticle(art)}
              className="group cursor-pointer border-l-2 border-editorial-accent pl-3.5 py-1 flex flex-col gap-1 transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-editorial-accent font-mono uppercase">BULLETIN #{idx + 1}</span>
                <span className="text-[9px] text-slate-400 font-mono">{new Date(art.publishDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <h4 className="text-xs font-black text-slate-950 dark:text-editorial-text group-hover:text-editorial-accent transition line-clamp-2 leading-tight">
                {art.title}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-editorial-text/50 line-clamp-1">
                {art.summary}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================== VIDEO NEWS ================== */
function VideoNews({ articles, onViewArticle }: { articles: Article[]; onViewArticle: (art: Article) => void }) {
  const videoArticles = articles.filter(a => a.image && a.views > 2000);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-6 rounded-lg">
        <h2 className="text-xs font-black uppercase text-editorial-accent tracking-[0.25em] font-mono mb-2">Video Desk</h2>
        <h1 className="text-xl md:text-3xl font-black text-slate-950 dark:text-editorial-text mb-4">Latest Video Reports & Broadcasts</h1>
        <p className="text-xs text-slate-500 dark:text-editorial-text/60 leading-relaxed font-serif">
          Browse our high-speed, dynamic media archive, featuring correspondent briefings, raw investigative footages, and anchor breakdowns compiled inside custom low-latency video packages.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videoArticles.map((art) => (
          <div 
            key={art.id} 
            onClick={() => onViewArticle(art)}
            className="bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 rounded-lg overflow-hidden shadow-sm group cursor-pointer hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          >
            <div className="relative aspect-video overflow-hidden bg-black shrink-0">
              <img src={art.image} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 opacity-80" alt={art.title} referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="bg-editorial-accent text-white p-3.5 rounded-full shadow-lg transform group-hover:scale-105 transition-all">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
              </div>
              <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded font-black">
                Corresponded Video
              </span>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-editorial-accent uppercase tracking-wider font-mono">{art.category}</span>
                <h3 className="text-sm font-black text-slate-950 dark:text-editorial-text leading-snug group-hover:text-editorial-accent transition line-clamp-2">{art.title}</h3>
                <p className="text-xs text-slate-500 dark:text-editorial-text/60 line-clamp-2 leading-relaxed">{art.summary}</p>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-100 dark:border-white/5 pt-2">
                <span>By {art.author}</span>
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {art.views.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================== PHOTO GALLERY ================== */
function PhotoGallery({ articles, onViewArticle }: { articles: Article[]; onViewArticle: (art: Article) => void }) {
  const images = articles.filter(a => a.image);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-6 rounded-lg">
        <h2 className="text-xs font-black uppercase text-editorial-accent tracking-[0.25em] font-mono mb-2">Immersive Photo Desk</h2>
        <h1 className="text-xl md:text-3xl font-black text-slate-950 dark:text-editorial-text mb-4">Capturing Geopolitical Realities in High Definition</h1>
        <p className="text-xs text-slate-500 dark:text-editorial-text/60 leading-relaxed font-serif">
          Experience world events through the lenses of award-winning photojournalists. Click on any thumbnail card to explore the full documented background bulletin details.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {images.map((item) => (
          <div 
            key={item.id}
            onClick={() => onViewArticle(item)}
            className="group cursor-pointer bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 rounded-lg overflow-hidden hover:shadow-md transition-all flex flex-col"
          >
            <div className="overflow-hidden aspect-[4/3] relative bg-slate-950">
              <img src={item.image} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" alt={item.title} referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="text-[10px] text-white font-mono flex items-center gap-1">
                  <Image className="w-3.5 h-3.5" /> Explore documented details &rarr;
                </span>
              </div>
            </div>
            <div className="p-3.5 flex flex-col gap-1 flex-1 justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-editorial-accent font-black font-mono">{item.category}</span>
                <h4 className="text-xs font-black text-slate-950 dark:text-editorial-text mt-0.5 leading-snug line-clamp-2 group-hover:text-editorial-accent transition">{item.title}</h4>
              </div>
              <span className="text-[9px] text-slate-400 font-mono mt-2 self-start">Photo credit: {item.author}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
