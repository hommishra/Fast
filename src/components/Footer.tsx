import React from "react";
import { Globe, ArrowUp } from "lucide-react";

interface FooterProps {
  logoText: string;
  aboutText: string;
  contactEmail: string;
  securityEmail?: string;
  mobileNumbers?: string[];
  gmailIds?: string[];
  socials: {
    facebook: string;
    twitter: string;
    instagram: string;
    youtube: string;
  };
}

export default function Footer({ logoText, aboutText, contactEmail, securityEmail, mobileNumbers = [], gmailIds = [], socials }: FooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-slate-950 text-slate-400 mt-16 border-t font-sans border-slate-900" id="main_website_footer">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-red-650 text-white font-sans font-black text-lg px-2 py-0.5 rounded tracking-tighter">
                FC
              </span>
              <span className="font-sans font-black text-md tracking-tight text-white uppercase">
                {logoText || "FAST COVERAGE"}
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              {aboutText || "Bringing fast, accurate, and multi-dimensional news reports from the frontlines of politics, technology, economy, and metropolitan lifestyles with certified integrity."}
            </p>
          </div>

          {/* Quick links & Contact */}
          <div>
            <h4 className="text-slate-200 text-[10px] font-bold tracking-widest uppercase mb-3.5 font-sans select-none border-l-2 border-blue-500 pl-2">Contact Desk</h4>
            <ul className="space-y-3.5 text-xs">
              <li>
                <span className="text-slate-500 block text-[9px] uppercase font-mono">General Inquiries</span>
                <a href={`mailto:${contactEmail}`} className="text-slate-300 hover:text-blue-500 transition-colors">
                  {contactEmail || "press@fastcoverage.news"}
                </a>
              </li>
              <li>
                <span className="text-slate-500 block text-[9px] uppercase font-mono">Security Ops</span>
                {securityEmail ? (
                  <a href={`mailto:${securityEmail}`} className="text-slate-300 hover:text-blue-500 transition-colors">
                    {securityEmail}
                  </a>
                ) : (
                  <span className="text-slate-300">fastcoveragenews@gmail.com</span>
                )}
              </li>

              {/* Dynamic Mobile Registries managed via settings */}
              {mobileNumbers && mobileNumbers.length > 0 && (
                <li>
                  <span className="text-slate-500 block text-[9px] uppercase font-mono">Mobile Hotlines</span>
                  <div className="flex flex-col space-y-1 mt-1 font-mono text-[11px]">
                    {mobileNumbers.map((num, idx) => (
                      <a key={idx} href={`tel:${num}`} className="text-slate-300 hover:text-blue-500 transition-colors">
                        {num}
                      </a>
                    ))}
                  </div>
                </li>
              )}

              {/* Dynamic Gmail Registries managed via settings */}
              {gmailIds && gmailIds.length > 0 && (
                <li>
                  <span className="text-slate-500 block text-[9px] uppercase font-mono">Gmail Helpdesk</span>
                  <div className="flex flex-col space-y-1 mt-1 font-mono text-[11px]">
                    {gmailIds.map((gmail, idx) => (
                      <a key={idx} href={`mailto:${gmail}`} className="text-slate-300 hover:text-blue-500 transition-colors">
                        {gmail}
                      </a>
                    ))}
                  </div>
                </li>
              )}
            </ul>
          </div>

          {/* Social connections */}
          <div>
            <h4 className="text-slate-200 text-[10px] font-bold tracking-widest uppercase mb-3.5 font-sans select-none border-l-2 border-blue-500 pl-2">Connect Online</h4>
            <div className="flex flex-col space-y-1.5 text-xs">
              <a href={socials.facebook} target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-all">
                Facebook Live Feed
              </a>
              <a href={socials.twitter} target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-all">
                X Bulletin (Twitter)
              </a>
              <a href={socials.instagram} target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-all">
                Instagram Insights
              </a>
              <a href={socials.youtube} target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-all">
                YouTube Live Broadcasts
              </a>
            </div>
          </div>
        </div>

        {/* Footer Base */}
        <div className="border-t border-slate-900 mt-10 pt-5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px]">
          <div className="flex items-center gap-2 text-slate-500">
            <Globe size={12} className="text-slate-500" />
            <span>&copy; {new Date().getFullYear()} {logoText || "Fast Coverage"}. All rights preserved.</span>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 hover:text-white transition-all bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded hover:bg-slate-800 font-mono text-[10px]"
          >
            Back to Top <ArrowUp size={11} />
          </button>
        </div>
      </div>
    </footer>
  );
}
