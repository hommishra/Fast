import React, { useState } from 'react';
import { 
  Mail, MapPin, Send, Briefcase, Award, CheckCircle2, 
  Play, Users, Heart, Eye, Megaphone, ShieldCheck, 
  HelpCircle, Sparkles, Video, Image, ExternalLink, Phone, MessageCircle, Globe, Facebook, Twitter, Instagram, Youtube, Share2, Map,
  Paperclip, Trash2, Upload, Shield, FileText, AlertCircle, Loader2
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

/* ================== CONTACT US & TIPS SUBMISSION ================== */
function ContactUs({ settings }: { settings: WebsiteSettings }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'Breaking News Tip',
    message: '',
    honeypot: '',
    captchaInput: ''
  });

  const [files, setFiles] = useState<{ name: string; url: string; size?: string; type?: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<{ id: string; msg: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Security captcha state: simple math calculation
  const [numA] = useState(() => Math.floor(Math.random() * 8) + 2);
  const [numB] = useState(() => Math.floor(Math.random() * 8) + 1);

  const categories = [
    'Breaking News Tip',
    'Anonymous News Tip',
    'Business Inquiry',
    'Advertisement Inquiry',
    'Editorial Inquiry',
    'Partnership Proposal',
    'Technical Support',
    'General Feedback',
    'Other'
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    setErrorMsg(null);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        // Check 100MB limit
        if (file.size > 100 * 1024 * 1024) {
          setErrorMsg(`File "${file.name}" exceeds the 100MB size limit.`);
          continue;
        }

        const reader = new FileReader();
        const uploadPromise = new Promise<{ name: string; url: string; size?: string; type?: string }>((resolve, reject) => {
          reader.onload = async () => {
            try {
              const res = await fetch('/api/inquiries/upload-attachment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: file.name,
                  base64: reader.result as string,
                  size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                  type: file.type
                })
              });
              const data = await res.json();
              if (data.success && data.file) {
                resolve(data.file);
              } else {
                reject(new Error(data.error || 'Upload failed'));
              }
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = () => reject(new Error('Failed reading file'));
          reader.readAsDataURL(file);
        });

        const uploadedFile = await uploadPromise;
        setFiles(prev => [...prev, uploadedFile]);
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      setErrorMsg(err.message || 'Error uploading file attachment.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitSuccess(null);

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMsg('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }

    // CAPTCHA verification
    if (parseInt(formData.captchaInput.trim(), 10) !== (numA + numB)) {
      setErrorMsg(`Security verification answer is incorrect (${numA} + ${numB} = ${numA + numB}). Please re-enter.`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Auto capture client metadata
      const userAgent = navigator.userAgent;
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Global Client';

      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          category: formData.category,
          message: formData.message,
          files: files,
          deviceInfo: userAgent,
          country: timeZone,
          website_hp: formData.honeypot
        })
      });

      const result = await response.json();

      if (result.success) {
        setSubmitSuccess({
          id: result.inquiryId,
          msg: result.message || 'Transmission received and logged securely in newsroom desk.'
        });
        // Reset form
        setFormData({
          name: '',
          email: '',
          category: 'Breaking News Tip',
          message: '',
          honeypot: '',
          captchaInput: ''
        });
        setFiles([]);
      } else {
        setErrorMsg(result.error || 'Failed to submit inquiry transmission.');
      }
    } catch (err: any) {
      console.error('Submit Inquiry Error:', err);
      setErrorMsg('Network error while connecting to newsroom server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeMobileNumbers = (settings.mobileNumbers || []).filter(item => item.active !== false);
  const activeWhatsappNumbers = (settings.whatsappNumbers || []).filter(item => item.active !== false);
  const activeEmailAddresses = (settings.emailAddresses || []).filter(item => item.active !== false);
  const activeOfficeAddresses = (settings.officeAddresses || []).filter(item => item.active !== false);

  const hasSocials = Boolean(
    settings.facebookUrl || settings.twitterUrl || settings.instagramUrl || 
    settings.youtubeUrl || settings.telegramUrl || settings.linkedinUrl || settings.websiteUrl
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      <div className="lg:col-span-2 bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-6 md:p-8 rounded-lg shadow-sm flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-editorial-accent" />
            <h2 className="text-xs font-black uppercase text-editorial-accent tracking-[0.25em] font-mono">Encrypted Newsroom Desk</h2>
          </div>
          <h1 className="text-xl md:text-3xl font-black text-slate-950 dark:text-editorial-text leading-tight mb-3">Submit Tips & Direct Inquiries</h1>
          <p className="text-xs text-slate-500 dark:text-editorial-text/60 leading-relaxed font-serif">
            Do you have a secure leak, breaking bulletin tip, business proposal, or editorial feedback? Submit your transmission below. All submissions are automatically saved into our central newsroom registry and synchronized live to senior editors.
          </p>
        </div>

        {submitSuccess ? (
          <div className="p-6 bg-emerald-950/20 border-2 border-emerald-500/60 rounded-xl flex flex-col gap-4 animate-fade-in text-emerald-900 dark:text-emerald-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 rounded-full text-emerald-500 shrink-0">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-mono font-black text-sm uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  TRANSMISSION CONFIRMED & LOGGED
                </h3>
                <p className="text-xs font-mono font-bold text-slate-800 dark:text-emerald-200 mt-0.5">
                  Unique Inquiry ID: <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-700 dark:text-emerald-300 select-all font-black">{submitSuccess.id}</span>
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-emerald-300/80 leading-relaxed font-sans">
              {submitSuccess.msg} Your message and attached documents are now logged in our editorial database. An editor will review and follow up if required.
            </p>
            <button
              type="button"
              onClick={() => setSubmitSuccess(null)}
              className="self-start bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 rounded transition cursor-pointer"
            >
              Submit Another Transmission
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Anti-Spam Honeypot Field (Hidden from normal humans) */}
            <input
              type="text"
              name="website_hp"
              value={formData.honeypot}
              onChange={e => setFormData({ ...formData, honeypot: e.target.value })}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            {errorMsg && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/40 text-red-600 dark:text-red-400 rounded-lg text-xs flex items-center gap-2.5 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-editorial-text/40 font-mono">
                  Full Name / Alias *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe or Confidential Whistleblower"
                  className="bg-slate-50 dark:bg-editorial-bg border border-slate-200 dark:border-white/10 text-xs p-3 rounded outline-none focus:border-editorial-accent dark:text-editorial-text font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-editorial-text/40 font-mono">
                  Contact Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. reporter@domain.com"
                  className="bg-slate-50 dark:bg-editorial-bg border border-slate-200 dark:border-white/10 text-xs p-3 rounded outline-none focus:border-editorial-accent dark:text-editorial-text font-sans"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 dark:text-editorial-text/40 font-mono">
                Inquiry Category *
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="bg-slate-50 dark:bg-editorial-bg border border-slate-200 dark:border-white/10 text-xs p-3 rounded outline-none focus:border-editorial-accent dark:text-editorial-text font-sans font-medium"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 dark:text-editorial-text/40 font-mono">
                Message / Transmission Details *
              </label>
              <textarea
                rows={6}
                required
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                placeholder="Provide comprehensive details, timeline events, verified quotes or reference documents..."
                className="bg-slate-50 dark:bg-editorial-bg border border-slate-200 dark:border-white/10 text-xs p-3 rounded outline-none focus:border-editorial-accent dark:text-editorial-text font-sans leading-relaxed"
              />
            </div>

            {/* File Upload Option */}
            <div className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-editorial-bg/60 border border-slate-200 dark:border-white/10 rounded-lg">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 font-mono flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-editorial-accent" />
                  <span>Attach Documents, Images, PDFs, or Videos (Optional)</span>
                </label>
                <span className="text-[10px] font-mono text-slate-400">Max 100MB per file</span>
              </div>

              <div className="flex items-center gap-3">
                <label className="bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-slate-200 px-3 py-2 rounded text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition shrink-0">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading File...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose Files</span>
                    </>
                  )}
                  <input
                    type="file"
                    multiple
                    disabled={isUploading}
                    accept="image/*,video/*,application/pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                  Supports Images, PDFs, DOCX, and MP4/WebM videos.
                </span>
              </div>

              {files.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-slate-200 dark:border-white/10">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Attached Files ({files.length}):</span>
                  <div className="flex flex-wrap gap-2">
                    {files.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-white dark:bg-editorial-dark border border-slate-200 dark:border-white/10 text-xs px-2.5 py-1.5 rounded shadow-sm text-slate-800 dark:text-slate-200 font-mono"
                      >
                        <FileText className="w-3.5 h-3.5 text-editorial-accent shrink-0" />
                        <span className="truncate max-w-[160px]">{file.name}</span>
                        {file.size && <span className="text-[10px] text-slate-400">({file.size})</span>}
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-red-500 hover:text-red-700 ml-1 p-0.5 rounded cursor-pointer"
                          title="Remove file"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CAPTCHA Security Verification */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  Security Check: What is <span className="text-editorial-accent font-black text-sm">{numA} + {numB}</span> ?
                </span>
              </div>
              <input
                type="number"
                required
                value={formData.captchaInput}
                onChange={e => setFormData({ ...formData, captchaInput: e.target.value })}
                placeholder="Answer"
                className="w-24 bg-white dark:bg-editorial-bg border border-slate-300 dark:border-white/20 text-xs font-mono font-bold p-2 rounded text-center outline-none focus:border-editorial-accent dark:text-editorial-text"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="bg-editorial-accent hover:bg-red-700 disabled:opacity-50 text-white font-black py-3.5 px-6 rounded text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer font-mono shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transmitting Data to Server...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Transmission</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Embedded Google Map if present */}
        {settings.googleMapsEmbedUrl && (
          <div className="border-t border-slate-100 dark:border-white/10 pt-5 flex flex-col gap-2">
            <h3 className="text-xs font-black uppercase text-slate-900 dark:text-editorial-text font-mono flex items-center gap-2">
              <Map className="w-4 h-4 text-editorial-accent" />
              <span>Interactive Map Location</span>
            </h3>
            <div className="w-full h-64 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-editorial-bg">
              <iframe
                src={settings.googleMapsEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps Location"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {/* Contact Numbers & Emails */}
        <div className="bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-5 rounded-lg shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-black uppercase text-slate-950 dark:text-editorial-text pb-2 border-b border-editorial-accent tracking-[0.2em] font-mono">Contact Information</h3>

          {/* Phone Numbers */}
          {(activeMobileNumbers.length > 0 || settings.contactPhone) && (
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-bold uppercase text-slate-400 dark:text-editorial-text/40 font-mono flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-editorial-accent" />
                <span>Phone / Hotline Numbers</span>
              </div>
              <div className="flex flex-col gap-1.5 pl-5">
                {activeMobileNumbers.length > 0 ? (
                  activeMobileNumbers.map((p) => (
                    <a key={p.id} href={`tel:${p.number}`} className="text-xs font-mono font-bold text-slate-800 dark:text-editorial-text hover:text-editorial-accent transition flex justify-between items-center bg-slate-50 dark:bg-editorial-bg/60 p-2 rounded border border-slate-100 dark:border-white/5">
                      <span>{p.label}: {p.number}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                    </a>
                  ))
                ) : (
                  <a href={`tel:${settings.contactPhone}`} className="text-xs font-mono font-bold text-slate-800 dark:text-editorial-text hover:text-editorial-accent transition bg-slate-50 dark:bg-editorial-bg/60 p-2 rounded border border-slate-100 dark:border-white/5">
                    {settings.contactPhone}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* WhatsApp Lines */}
          {activeWhatsappNumbers.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <div className="text-[11px] font-bold uppercase text-slate-400 dark:text-editorial-text/40 font-mono flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>WhatsApp Lines</span>
              </div>
              <div className="flex flex-col gap-1.5 pl-5">
                {activeWhatsappNumbers.map((w) => (
                  <a key={w.id} href={`https://wa.me/${w.number.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline transition flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded border border-emerald-100 dark:border-emerald-900/30">
                    <span>{w.label}: {w.number}</span>
                    <ExternalLink className="w-3 h-3 text-emerald-500 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Emails */}
          {(activeEmailAddresses.length > 0 || settings.contactEmail) && (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <div className="text-[11px] font-bold uppercase text-slate-400 dark:text-editorial-text/40 font-mono flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-editorial-accent" />
                <span>Email Desks</span>
              </div>
              <div className="flex flex-col gap-1.5 pl-5">
                {activeEmailAddresses.length > 0 ? (
                  activeEmailAddresses.map((m) => (
                    <a key={m.id} href={`mailto:${m.email}`} className="text-xs font-mono font-bold text-slate-800 dark:text-editorial-text hover:text-editorial-accent transition flex justify-between items-center bg-slate-50 dark:bg-editorial-bg/60 p-2 rounded border border-slate-100 dark:border-white/5">
                      <span>{m.label}: {m.email}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                    </a>
                  ))
                ) : (
                  <a href={`mailto:${settings.contactEmail}`} className="text-xs font-mono font-bold text-slate-800 dark:text-editorial-text hover:text-editorial-accent transition bg-slate-50 dark:bg-editorial-bg/60 p-2 rounded border border-slate-100 dark:border-white/5">
                    {settings.contactEmail}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Global Offices */}
        {(activeOfficeAddresses.length > 0 || settings.officeAddressNY || settings.officeAddressLondon || settings.officeAddressDelhi || settings.officeAddress) && (
          <div className="bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-5 rounded-lg shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-black uppercase text-slate-950 dark:text-editorial-text pb-2 border-b border-editorial-accent tracking-[0.2em] font-mono">Office Locations</h3>
            <div className="flex flex-col gap-3 text-xs">
              {activeOfficeAddresses.length > 0 ? (
                activeOfficeAddresses.map((o) => (
                  <div key={o.id} className="flex gap-3 pb-3 border-b border-slate-100 dark:border-white/5 last:border-0 last:pb-0">
                    <MapPin className="w-4 h-4 text-editorial-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-editorial-text">{o.title || o.label}</p>
                      <p className="text-slate-500 dark:text-editorial-text/60 mt-0.5 leading-relaxed">{o.address}</p>
                      {(o.googleMapsUrl || o.mapUrl) && (
                        <a href={o.googleMapsUrl || o.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-editorial-accent font-semibold mt-1 hover:underline">
                          <span>View on Google Maps</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {settings.officeAddressNY && (
                    <div className="flex gap-3">
                      <MapPin className="w-4 h-4 text-editorial-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-editorial-text">New York Headquarters</p>
                        <p className="text-slate-500 dark:text-editorial-text/60 mt-0.5 leading-relaxed">{settings.officeAddressNY}</p>
                      </div>
                    </div>
                  )}
                  {settings.officeAddressLondon && (
                    <div className="flex gap-3 border-t border-slate-100 dark:border-white/5 pt-3">
                      <MapPin className="w-4 h-4 text-editorial-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-editorial-text">London Bureau</p>
                        <p className="text-slate-500 dark:text-editorial-text/60 mt-0.5 leading-relaxed">{settings.officeAddressLondon}</p>
                      </div>
                    </div>
                  )}
                  {settings.officeAddressDelhi && (
                    <div className="flex gap-3 border-t border-slate-100 dark:border-white/5 pt-3">
                      <MapPin className="w-4 h-4 text-editorial-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-editorial-text">New Delhi Hub</p>
                        <p className="text-slate-500 dark:text-editorial-text/60 mt-0.5 leading-relaxed">{settings.officeAddressDelhi}</p>
                      </div>
                    </div>
                  )}
                  {!settings.officeAddressNY && !settings.officeAddressLondon && !settings.officeAddressDelhi && settings.officeAddress && (
                    <div className="flex gap-3">
                      <MapPin className="w-4 h-4 text-editorial-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-editorial-text">Head Office</p>
                        <p className="text-slate-500 dark:text-editorial-text/60 mt-0.5 leading-relaxed">{settings.officeAddress}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Social Networks */}
        {hasSocials && (
          <div className="bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-5 rounded-lg shadow-sm flex flex-col gap-3">
            <h3 className="text-xs font-black uppercase text-slate-950 dark:text-editorial-text pb-2 border-b border-editorial-accent tracking-[0.2em] font-mono flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-editorial-accent" />
              <span>Connect On Socials</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {settings.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded bg-slate-50 dark:bg-editorial-bg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-editorial-text font-medium transition">
                  <Facebook className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">Facebook</span>
                </a>
              )}
              {settings.twitterUrl && (
                <a href={settings.twitterUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded bg-slate-50 dark:bg-editorial-bg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-editorial-text font-medium transition">
                  <Twitter className="w-4 h-4 text-sky-500 shrink-0" />
                  <span className="truncate">Twitter (X)</span>
                </a>
              )}
              {settings.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded bg-slate-50 dark:bg-editorial-bg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-editorial-text font-medium transition">
                  <Instagram className="w-4 h-4 text-pink-600 shrink-0" />
                  <span className="truncate">Instagram</span>
                </a>
              )}
              {settings.youtubeUrl && (
                <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded bg-slate-50 dark:bg-editorial-bg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-editorial-text font-medium transition">
                  <Youtube className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="truncate">YouTube</span>
                </a>
              )}
              {settings.telegramUrl && (
                <a href={settings.telegramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded bg-slate-50 dark:bg-editorial-bg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-editorial-text font-medium transition">
                  <Send className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="truncate">Telegram</span>
                </a>
              )}
              {settings.linkedinUrl && (
                <a href={settings.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded bg-slate-50 dark:bg-editorial-bg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-editorial-text font-medium transition">
                  <Globe className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="truncate">LinkedIn</span>
                </a>
              )}
              {settings.websiteUrl && (
                <a href={settings.websiteUrl} target="_blank" rel="noopener noreferrer" className="col-span-2 flex items-center gap-2 p-2 rounded bg-slate-50 dark:bg-editorial-bg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-editorial-text font-medium transition">
                  <Globe className="w-4 h-4 text-editorial-accent shrink-0" />
                  <span className="truncate">Official Website ({settings.websiteUrl})</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================== ADVERTISE WITH US ================== */
function AdvertiseWithUs({ adSlots }: { adSlots: AdSlot[] }) {
  const [formData, setFormData] = useState({
    companyName: '',
    partnerEmail: '',
    mobileNumber: '',
    companyWebsite: '',
    advertisingRequirement: 'Homepage Top Banner (728x90)',
    message: '',
    website_hp: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!formData.companyName.trim()) {
      setErrorMessage('Company Name is required.');
      return;
    }
    if (!formData.partnerEmail.trim()) {
      setErrorMessage('Partner Email is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/ad-inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Browser'
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to record advertising inquiry.');
      }

      setSuccessMessage('Your advertising inquiry has been submitted successfully. Our team will contact you soon.');
      setFormData({
        companyName: '',
        partnerEmail: '',
        mobileNumber: '',
        companyWebsite: '',
        advertisingRequirement: 'Homepage Top Banner (728x90)',
        message: '',
        website_hp: ''
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting advertising inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      <div className="lg:col-span-2 bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-6 md:p-8 rounded-lg shadow-sm">
        <h2 className="text-xs font-black uppercase text-editorial-accent tracking-[0.25em] font-mono mb-2">Partnerships & Sponsorships</h2>
        <h1 className="text-xl md:text-3xl font-black text-slate-950 dark:text-editorial-text leading-tight mb-4">Enterprise Commercial Banners</h1>
        <p className="text-xs text-slate-500 dark:text-editorial-text/60 leading-relaxed mb-6 font-serif">
          Partner with FAST COVERAGES to put your product in front of millions of highly engaged business, politics, and technology decision-makers globally. Our dynamic advertisement server manages delivery seamlessly across desktop, tablet, and mobile devices.
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 border-t border-slate-200 dark:border-white/10 pt-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-900 dark:text-editorial-text font-mono tracking-wider">Inquire For Enterprise Commercial Placements</span>
            <span className="text-[10px] font-mono text-slate-400">* Required Fields</span>
          </div>

          {/* Honeypot field for spam prevention */}
          <input
            type="text"
            name="website_hp"
            value={formData.website_hp}
            onChange={(e) => setFormData({ ...formData, website_hp: e.target.value })}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-mono font-bold text-slate-500 dark:text-editorial-text/60 mb-1">Company Name *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Apex Global Energy Corp" 
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-editorial-bg border border-slate-200 dark:border-white/10 text-xs p-2.5 rounded outline-none focus:border-editorial-accent dark:text-editorial-text" 
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono font-bold text-slate-500 dark:text-editorial-text/60 mb-1">Partner Email *</label>
              <input 
                type="email" 
                required 
                placeholder="e.g. marketing@company.com" 
                value={formData.partnerEmail}
                onChange={(e) => setFormData({ ...formData, partnerEmail: e.target.value })}
                className="w-full bg-slate-50 dark:bg-editorial-bg border border-slate-200 dark:border-white/10 text-xs p-2.5 rounded outline-none focus:border-editorial-accent dark:text-editorial-text" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-mono font-bold text-slate-500 dark:text-editorial-text/60 mb-1">Mobile Number (Optional)</label>
              <input 
                type="tel" 
                placeholder="e.g. +1 (555) 019-2834" 
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                className="w-full bg-slate-50 dark:bg-editorial-bg border border-slate-200 dark:border-white/10 text-xs p-2.5 rounded outline-none focus:border-editorial-accent dark:text-editorial-text" 
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono font-bold text-slate-500 dark:text-editorial-text/60 mb-1">Company Website (Optional)</label>
              <input 
                type="url" 
                placeholder="e.g. https://company.com" 
                value={formData.companyWebsite}
                onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                className="w-full bg-slate-50 dark:bg-editorial-bg border border-slate-200 dark:border-white/10 text-xs p-2.5 rounded outline-none focus:border-editorial-accent dark:text-editorial-text" 
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono font-bold text-slate-500 dark:text-editorial-text/60 mb-1">Advertising Requirement (Optional)</label>
            <select
              value={formData.advertisingRequirement}
              onChange={(e) => setFormData({ ...formData, advertisingRequirement: e.target.value })}
              className="w-full bg-slate-50 dark:bg-editorial-bg border border-slate-200 dark:border-white/10 text-xs p-2.5 rounded outline-none focus:border-editorial-accent dark:text-editorial-text"
            >
              <option value="Homepage Top Banner (728x90)">Homepage Top Banner (728x90)</option>
              <option value="Sidebar Sticky Rectangle (300x600)">Sidebar Sticky Rectangle (300x600)</option>
              <option value="In-Article Mid Banner (728x90)">In-Article Mid Banner (728x90)</option>
              <option value="Video Pre-Roll Commercial">Video Pre-Roll Commercial</option>
              <option value="Full Website Takeover & Header Sponsorship">Full Website Takeover & Header Sponsorship</option>
              <option value="Custom Enterprise Media Package">Custom Enterprise Media Package</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono font-bold text-slate-500 dark:text-editorial-text/60 mb-1">Message / Notes (Optional)</label>
            <textarea
              rows={3}
              placeholder="Provide campaign duration, target geo, budget range, or specific advertising objectives..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full bg-slate-50 dark:bg-editorial-bg border border-slate-200 dark:border-white/10 text-xs p-2.5 rounded outline-none focus:border-editorial-accent dark:text-editorial-text resize-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-editorial-accent hover:bg-red-700 text-white font-black py-3 px-5 rounded text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer font-mono disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Transmitting Inquiry...
              </>
            ) : (
              <>
                <Megaphone className="w-4 h-4" /> REQUEST MEDIA KIT RATE-CARD
              </>
            )}
          </button>

          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded text-xs font-mono text-emerald-700 dark:text-emerald-300 flex items-start gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded text-xs font-mono text-red-700 dark:text-red-300 flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
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
