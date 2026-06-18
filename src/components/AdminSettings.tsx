import React, { useState, useEffect } from "react";
import { WebSettings } from "../types";
import { Save, Globe, Info, CreditCard, Code, CheckCircle2, Phone, Mail, PlusCircle, Trash2 } from "lucide-react";

interface AdminSettingsProps {
  settings: WebSettings;
  onSaveSettings: (settings: WebSettings) => Promise<void>;
  onTriggerSeed: () => Promise<void>;
}

export default function AdminSettings({
  settings,
  onSaveSettings,
  onTriggerSeed,
}: AdminSettingsProps) {
  const [logoText, setLogoText] = useState("");
  const [siteTitle, setSiteTitle] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [securityEmail, setSecurityEmail] = useState("");
  const [aboutText, setAboutText] = useState("");
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialTwitter, setSocialTwitter] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [adSenseCode, setAdSenseCode] = useState("");
  const [analyticsCode, setAnalyticsCode] = useState("");

  // Lists of mobile numbers and gmail IDs
  const [mobileNumbers, setMobileNumbers] = useState<string[]>([]);
  const [gmailIds, setGmailIds] = useState<string[]>([]);
  const [newMobile, setNewMobile] = useState("");
  const [newGmail, setNewGmail] = useState("");

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (settings) {
      setLogoText(settings.logoText || "");
      setSiteTitle(settings.siteTitle || "");
      setContactEmail(settings.contactEmail || "");
      setSecurityEmail(settings.securityEmail || "");
      setAboutText(settings.aboutText || "");
      setSocialFacebook(settings.socialFacebook || "");
      setSocialTwitter(settings.socialTwitter || "");
      setSocialInstagram(settings.socialInstagram || "");
      setSocialYoutube(settings.socialYoutube || "");
      setSeoDescription(settings.seoDescription || "");
      setAdSenseCode(settings.adSenseCode || "");
      setAnalyticsCode(settings.analyticsCode || "");
      setMobileNumbers(settings.mobileNumbers || []);
      setGmailIds(settings.gmailIds || []);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg("");

    try {
      await onSaveSettings({
        logoText,
        siteTitle,
        contactEmail,
        securityEmail,
        aboutText,
        socialFacebook,
        socialTwitter,
        socialInstagram,
        socialYoutube,
        seoDescription,
        adSenseCode,
        analyticsCode,
        mobileNumbers,
        gmailIds,
      });

      setStatusMsg("Website global settings successfully updated in Firestore!");
      setTimeout(() => setStatusMsg(""), 5000);
    } catch (e) {
      console.error(e);
      setStatusMsg("Error modifying configurations database.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddMobile = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newMobile.trim();
    if (!val) return;
    if (mobileNumbers.includes(val)) {
      alert("This mobile number already exists!");
      return;
    }
    setMobileNumbers(prev => [...prev, val]);
    setNewMobile("");
  };

  const handleDeleteMobile = (num: string) => {
    setMobileNumbers(prev => prev.filter(n => n !== num));
  };

  const handleAddGmail = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newGmail.trim();
    if (!val) return;
    if (gmailIds.includes(val)) {
      alert("This Gmail ID already exists!");
      return;
    }
    setGmailIds(prev => [...prev, val]);
    setNewGmail("");
  };

  const handleDeleteGmail = (id: string) => {
    setGmailIds(prev => prev.filter(g => g !== id));
  };

  const handleSeedAction = async () => {
    setSeeding(true);
    setStatusMsg("");
    try {
      await onTriggerSeed();
      setStatusMsg("Success: Firestore database populated with CNN-style global news datasets! Refresh the app.");
      setShowSeedConfirm(false);
    } catch (err) {
      console.error(err);
      setStatusMsg("Seeding failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-neutral-800" id="admin_settings_panel">
      {statusMsg && (
        <div className="bg-green-150 border border-green-300 text-green-800 p-4 rounded-lg flex items-center gap-2 font-sans text-sm select-none">
          <CheckCircle2 size={16} />
          <span>{statusMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Brand definitions */}
          <div className="bg-white border border-neutral-200 p-6 rounded-lg space-y-4 shadow-xs">
            <h3 className="text-sm font-mono tracking-widest text-neutral-500 uppercase border-b border-neutral-100 pb-3 select-none flex items-center gap-1.5 font-bold">
              <Info size={14} className="text-red-700" />
              General Brand Profiles
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">Logo Text Label</label>
                <input
                  type="text"
                  required
                  value={logoText}
                  onChange={(e) => setLogoText(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded p-2.5 text-sm font-sans focus:outline-none focus:border-red-655"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">Contact Desk Email</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded p-2.5 text-sm font-sans focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">Security Ops Email</label>
                <input
                  type="email"
                  required
                  value={securityEmail}
                  onChange={(e) => setSecurityEmail(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded p-2.5 text-sm font-sans focus:outline-none focus:border-red-655"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">SEO Site Title</label>
              <input
                type="text"
                required
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded p-2.5 text-sm font-sans focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">Editorial Summary / About</label>
              <textarea
                rows={3}
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded p-2.5 text-sm font-sans focus:outline-none"
              />
            </div>
          </div>

          {/* Social connections */}
          <div className="bg-white border border-neutral-200 p-6 rounded-lg space-y-4 shadow-xs">
            <h3 className="text-sm font-mono tracking-widest text-neutral-500 uppercase border-b border-neutral-100 pb-3 select-none flex items-center gap-1.5 font-bold">
              <Globe size={14} className="text-red-700" />
              Social Network Placements
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">Facebook Page</label>
                <input
                  type="text"
                  value={socialFacebook}
                  onChange={(e) => setSocialFacebook(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded p-2.5 text-xs text-neutral-600 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">Twitter Handle / X</label>
                <input
                  type="text"
                  value={socialTwitter}
                  onChange={(e) => setSocialTwitter(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded p-2.5 text-xs text-neutral-600 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">Instagram Page</label>
                <input
                  type="text"
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded p-2.5 text-xs text-neutral-600 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">YouTube Broadcast link</label>
                <input
                  type="text"
                  value={socialYoutube}
                  onChange={(e) => setSocialYoutube(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded p-2.5 text-xs text-neutral-600 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">Base Metadata Description</label>
              <input
                type="text"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded p-2.5 text-xs text-neutral-600 focus:outline-none font-sans"
              />
            </div>
          </div>
        </div>

        {/* Contact Registries (Mobile & Gmail) - NEW FEATURE REQUEST */}
        <div className="bg-white border border-neutral-200 p-6 rounded-lg space-y-6 shadow-xs" id="admin_settings_contacts_section">
          <div>
            <h3 className="text-sm font-mono tracking-widest text-neutral-500 uppercase border-b border-neutral-100 pb-3 select-none flex items-center gap-1.5 font-bold">
              <Phone size={14} className="text-red-700" />
              Custom Contact Registries (Mobile Numbers & Gmail Addresses)
            </h3>
            <p className="text-xs text-neutral-400 mt-1 select-none">
              Easily append, catalog, or delete live contact parameters shown on the website footer and contact channels.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* MOBILE NUMBERS PANEL */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
                <Phone size={15} className="text-neutral-500 shrink-0" />
                <h4 className="text-xs font-bold text-neutral-700 uppercase font-mono tracking-wider">Mobile Contact Directory</h4>
              </div>

              {/* Add form */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. +1 (555) 123-4567"
                  value={newMobile}
                  onChange={(e) => setNewMobile(e.target.value)}
                  className="flex-1 bg-white border border-neutral-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-red-700"
                />
                <button
                  type="button"
                  onClick={handleAddMobile}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white rounded p-2 px-3.5 text-xs font-bold cursor-pointer transition flex items-center justify-center shrink-0"
                  title="Add Mobile Number"
                >
                  <PlusCircle size={14} className="mr-1" /> Add
                </button>
              </div>

              {/* Display list */}
              {mobileNumbers.length === 0 ? (
                <div className="text-xs text-neutral-400 font-mono py-4 text-center border border-dashed border-neutral-200 rounded-lg select-none">
                  No mobile numbers registered. Click to add.
                </div>
              ) : (
                <div className="border border-neutral-200 rounded-lg overflow-hidden divide-y divide-neutral-100 max-h-48 overflow-y-auto">
                  {mobileNumbers.map((num, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-neutral-50 hover:bg-white transition-colors">
                      <span className="text-xs font-mono font-medium text-neutral-800">{num}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteMobile(num)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 rounded transition cursor-pointer"
                        title="Delete Mobile Number"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GMAIL IDS PANEL */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
                <Mail size={15} className="text-neutral-500 shrink-0" />
                <h4 className="text-xs font-bold text-neutral-700 uppercase font-mono tracking-wider">Gmail / Mail Directory</h4>
              </div>

              {/* Add form */}
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  placeholder="e.g. support@gmail.com"
                  value={newGmail}
                  onChange={(e) => setNewGmail(e.target.value)}
                  className="flex-1 bg-white border border-neutral-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-red-700"
                />
                <button
                  type="button"
                  onClick={handleAddGmail}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white rounded p-2 px-3.5 text-xs font-bold cursor-pointer transition flex items-center justify-center shrink-0"
                  title="Add Gmail ID"
                >
                  <PlusCircle size={14} className="mr-1" /> Add
                </button>
              </div>

              {/* Display list */}
              {gmailIds.length === 0 ? (
                <div className="text-xs text-neutral-400 font-mono py-4 text-center border border-dashed border-neutral-200 rounded-lg select-none">
                  No Gmail IDs registered. Click to add.
                </div>
              ) : (
                <div className="border border-neutral-200 rounded-lg overflow-hidden divide-y divide-neutral-100 max-h-48 overflow-y-auto">
                  {gmailIds.map((gmail, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-neutral-50 hover:bg-white transition-colors">
                      <span className="text-xs font-mono font-medium text-neutral-800">{gmail}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteGmail(gmail)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 rounded transition cursor-pointer"
                        title="Delete Gmail ID"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ads and tracking integrations */}
        <div className="bg-white border border-neutral-200 p-6 rounded-lg space-y-4 shadow-xs">
          <h3 className="text-sm font-mono tracking-widest text-neutral-500 uppercase border-b border-neutral-100 pb-3 mb-1 select-none flex items-center gap-1.5 font-bold">
            <Code size={14} className="text-red-700" />
            External Code Integrations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 mb-1 select-none">
                <CreditCard size={13} className="text-muted-foreground" />
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider font-mono">Google AdSense ID Code</label>
              </div>
              <p className="text-[11px] text-neutral-400 mb-2 leading-relaxed">
                Applies monetization indexes automatically on all news slots.
              </p>
              <input
                type="text"
                placeholder="e.g. ca-pub-xxxxxxxxxxxxxxxx"
                value={adSenseCode}
                onChange={(e) => setAdSenseCode(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded p-2.5 text-xs text-neutral-600 focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 mb-1 select-none">
                <Code size={13} className="text-muted-foreground" />
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider font-mono">Google Analytics Tracking ID</label>
              </div>
              <p className="text-[11px] text-neutral-400 mb-2 leading-relaxed">
                Audits global page view records to compute active news reports.
              </p>
              <input
                type="text"
                placeholder="e.g. G-xxxxxxxxxx"
                value={analyticsCode}
                onChange={(e) => setAnalyticsCode(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded p-2.5 text-xs text-neutral-600 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Database seed & triggers */}
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-900 uppercase font-mono">ADMINISTRATIVE FACTORY RESET TOOL</h4>
            <p className="text-xs text-amber-700 leading-relaxed max-w-xl">
              If your database behaves inconsistently or you would like to restore the original beautifully written CNN-style global news templates, click to run the initial seeding logic.
            </p>
          </div>
          {!showSeedConfirm ? (
            <button
              type="button"
              onClick={() => setShowSeedConfirm(true)}
              className="shrink-0 bg-amber-700 hover:bg-amber-800 text-white font-sans text-xs uppercase tracking-wider font-bold py-2.5 px-4 rounded transition cursor-pointer font-mono"
            >
              Re-Seed Datasets
            </button>
          ) : (
            <div className="bg-white border border-amber-300 p-2.5 rounded-lg flex items-center gap-2 text-xs">
              <span className="font-bold text-amber-900">Confirm Reset?</span>
              <button
                type="button"
                disabled={seeding}
                onClick={handleSeedAction}
                className="bg-amber-700 hover:bg-amber-800 text-white px-2.5 py-1.5 rounded uppercase font-extrabold cursor-pointer transition select-none"
              >
                {seeding ? "Seeding..." : "Yes, Reset"}
              </button>
              <button
                type="button"
                disabled={seeding}
                onClick={() => setShowSeedConfirm(false)}
                className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 px-2.5 py-1.5 rounded uppercase font-extrabold cursor-pointer transition select-none"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Save button block */}
        <div className="text-right select-none">
          <button
            type="submit"
            disabled={saving}
            className="bg-red-700 hover:bg-red-800 disabled:bg-neutral-300 text-white font-sans text-xs uppercase tracking-widest font-bold px-6 py-3.5 rounded flex items-center justify-center gap-1.5 ml-auto cursor-pointer transition shadow"
          >
            <Save size={14} /> {saving ? "PRESERVING SETTINGS..." : "Save Settings Dossier"}
          </button>
        </div>
      </form>
    </div>
  );
}
