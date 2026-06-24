import React, { useState, useEffect } from "react";
import { ShieldCheck, Lock, Mail, KeySquare, HelpCircle, AlertCircle, Smartphone, Wifi, Battery, ChevronLeft, Inbox, Copy, Check } from "lucide-react";

interface AdminLoginProps {
  onLoginSuccess: (adminData: { token: string; email: string; name: string; role: string; ip: string }) => void;
  onClose: () => void;
}

export default function AdminLogin({ onLoginSuccess, onClose }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // 2FA Challenge variables
  const [mfaRequired, setMfaRequired] = useState(false);
  const [tempSessionId, setTempSessionId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [suggested2FACode, setSuggested2FACode] = useState(""); // Delivered on screen as simulated secure SMS/Email alerts
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [showEmailToast, setShowEmailToast] = useState(false);

  // Simulated physical smartphone state
  const [phoneState, setPhoneState] = useState<"locked" | "notification" | "email-open">("locked");
  const [isVibrating, setIsVibrating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [localTime, setLocalTime] = useState("14:38");
  const [phoneBattery, setPhoneBattery] = useState(88);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      setLocalTime(`${hrs}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setErrorMsg("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || "Authentication failed.");
        setLoading(false);
        if (data.attemptsRemaining !== undefined) {
          setAttemptsLeft(data.attemptsRemaining);
        }
        return;
      }

      if (data.mfaRequired) {
        setMfaRequired(true);
        setTempSessionId(data.tempSessionId);
        setSuggested2FACode(data.debugCode); // Show debug helper
        setShowEmailToast(true);
        setPhoneState("notification");
        setCopiedCode(false);
        setIsVibrating(true);
        setTimeout(() => setIsVibrating(false), 1200);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Unable to communicate with the administrative portal backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) return;

    setErrorMsg("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempSessionId, code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || "Failed to verified challenge.");
        setLoading(false);
        return;
      }

      // Success! Pass session credentials to Parent applet
      onLoginSuccess({
        token: data.token,
        email: data.email,
        name: data.name,
        role: data.role,
        ip: data.ip
      });
    } catch (err) {
      console.error(err);
      setErrorMsg("MFA verification connection timed out. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col justify-center items-center px-4 py-8 font-sans text-neutral-200 selection:bg-red-800 relative overflow-hidden" id="admin_login_view">
      
      {/* Vibrate Custom CSS Injection */}
      <style>{`
        @keyframes vibrate {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-2px, -1px) rotate(-0.5deg); }
          20% { transform: translate(2px, 1px) rotate(0.5deg); }
          30% { transform: translate(-1px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(0.5deg); }
          50% { transform: translate(-2px, 1px) rotate(-0.5deg); }
          60% { transform: translate(2px, 2px) rotate(0deg); }
          70% { transform: translate(-1px, -1px) rotate(0.5deg); }
          80% { transform: translate(1px, 1px) rotate(-0.5deg); }
          90% { transform: translate(-2px, 2px) rotate(0deg); }
        }
        .animate-vibrate {
          animation: vibrate 0.15s linear infinite;
        }
      `}</style>

      {/* Outgoing System Mail Alert Toast */}
      {showEmailToast && (
        <div 
          className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-neutral-950 border-l-4 border-red-600 border border-neutral-800 p-4 rounded-r-lg shadow-2xl z-50 animate-bounce cursor-pointer hover:bg-neutral-900 transition-all"
          onClick={() => {
            setVerificationCode(suggested2FACode);
            setPhoneState("email-open");
            setShowEmailToast(false);
          }}
          title="Click to automatically input verification code"
        >
          <div className="flex items-start gap-3">
            <div className="bg-red-950/50 p-2 rounded-full border border-red-900 text-red-500 shrink-0">
              <Mail size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono text-red-500 tracking-wider">SYSTEM MAILER [OUTGOING]</span>
                <span className="text-[9px] font-mono text-neutral-500">Just Now</span>
              </div>
              <p className="text-xs font-semibold text-neutral-200 mt-1">
                New Email delivered to <span className="text-red-400 font-mono">{email}</span>
              </p>
              <div className="bg-neutral-900/60 p-2 rounded border border-neutral-800 mt-2 text-[11px] font-mono text-neutral-300">
                <p className="text-neutral-400 font-sans">Message Content:</p>
                <p className="mt-1">Hello admin, your one-time Verification Code to unlock Admin Access is: <span className="text-red-400 font-bold tracking-widest text-sm">{suggested2FACode}</span></p>
                <p className="text-[9px] text-red-500/80 mt-1.5 font-sans">⚡ Click this notification card or check the smartphone preview to copy/auto-fill!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Dual-Pane Section */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 max-w-5xl w-full z-10 p-4">
        
        {/* Panel A: Desktop Admin Credentials & OTP Form */}
        <div className="w-full max-w-md bg-neutral-950 p-8 border border-neutral-800 rounded-lg shadow-2xl relative space-y-6">
          {/* Banner header logo */}
          <div className="text-center space-y-1 select-none">
            <div className="inline-flex items-center justify-center bg-red-800/20 text-red-600 p-2.5 rounded-full border border-red-800/40 mb-3 animate-pulse">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-xl font-mono tracking-widest text-red-500 font-extrabold uppercase">
              SECURE ADM GATEWAY
            </h2>
            <p className="text-xs text-neutral-500 uppercase tracking-widest font-mono">
              Fast Coverage Intranets
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-950/40 border border-red-900 text-red-400 p-3.5 text-xs rounded-md flex items-start gap-2 select-none">
              <AlertCircle className="shrink-0 mt-0.5" size={14} />
              <div className="space-y-1">
                <span className="font-bold font-mono">INTEGRITY VIOLATION</span>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {!mfaRequired ? (
            /* Segment 1: Email and password gateway */
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold font-mono tracking-wider uppercase text-neutral-400 flex items-center gap-1.5 select-none">
                  <Mail size={12} /> Admin Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="developer@fastcoverage.news"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded p-3 text-sm text-white focus:outline-none focus:border-red-600 focus:bg-neutral-900/40 hover:border-neutral-700 transition-colors font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold font-mono tracking-wider uppercase text-neutral-400 flex items-center gap-1.5 select-none">
                  <Lock size={12} /> Account Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded p-3 text-sm text-white focus:outline-none focus:border-red-600 focus:bg-neutral-900/40 hover:border-neutral-700 transition-colors font-mono"
                />
              </div>

              {attemptsLeft !== null && (
                <p className="text-[11px] font-mono text-amber-500 bg-amber-950/20 border border-amber-900/50 px-2 py-1 rounded select-none text-center">
                  Attention: {attemptsLeft} sliding verification attempts remaining before lockout.
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-700 hover:bg-red-800 disabled:bg-neutral-800 disabled:text-neutral-500 font-sans text-xs font-bold uppercase tracking-widest text-white py-3 rounded-md transition-all duration-150 shadow-md hover:shadow-red-900/10 active:scale-[0.98] cursor-pointer"
              >
                {loading ? "AUTHENTICATING..." : "INITIATE CHALLENGE"}
              </button>
            </form>
          ) : (
            /* Segment 2: 2FA Authentication layout */
            <form onSubmit={handleMfaSubmit} className="space-y-5">
              <div className="bg-neutral-900/80 border border-red-900/40 text-neutral-300 p-4 text-xs rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 font-bold font-mono text-red-500">
                  <KeySquare size={13} />
                  <span>EMAIL VERIFICATION SENT</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  A secure email verification code has been dispatched to your registered email address as configured on your mobile client:
                </p>
                <p className="font-bold text-red-400 font-mono bg-neutral-950 px-2.5 py-1.5 rounded border border-neutral-800 break-all select-all text-center text-xs">
                  {email}
                </p>
                <p className="text-[10px] text-neutral-400 mt-2">
                  Check your smartphone mockup on the right to open the Mail Inbox and copy the code.
                </p>
              </div>

              <div className="space-y-1 text-center">
                <label className="text-[10px] font-bold font-mono tracking-widest uppercase text-neutral-400 block mb-2 select-none">
                  INPUT VERIFICATION CODE
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  className="w-40 mx-auto bg-neutral-900 border border-neutral-800 rounded p-3 text-center text-xl font-bold font-mono text-white tracking-widest focus:outline-none focus:border-red-600 focus:bg-neutral-900/40"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-700 hover:bg-green-800 disabled:bg-neutral-800 text-white font-sans text-xs font-extrabold uppercase tracking-widest py-3 rounded-md transition-all duration-150 cursor-pointer"
              >
                {loading ? "UNLOCKING ACCESS..." : "VERIFY & UNLOCK ADMIN ACCESS"}
              </button>
            </form>
          )}

          <div className="flex items-center justify-between border-t border-neutral-800/50 pt-4 text-[10px] font-mono text-neutral-500">
            <button 
              onClick={onClose}
              type="button" 
              className="hover:text-neutral-300 cursor-pointer uppercase transition-colors"
            >
              &larr; Exit Gateway
            </button>
            
            <div className="flex items-center gap-1 select-none">
              <HelpCircle size={10} />
              <span>RSA-255 Hashing System</span>
            </div>
          </div>
        </div>

        {/* Panel B: Physical Smartphone Simulator representing "Admin's Registered Mobile Device" */}
        <div className={`transition-all duration-500 transform ${mfaRequired ? "opacity-100 scale-100 translate-y-0" : "opacity-40 scale-95 lg:translate-y-4 filter grayscale saturate-50"}`}>
          <div className="text-center mb-3 select-none">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 flex items-center justify-center gap-1.5 bg-neutral-950/60 px-3 py-1 rounded-full border border-neutral-800/50 inline-block">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1"></span>
              Admin registered device [Simulation Feed]
            </span>
          </div>

          <div 
            className={`relative w-[285px] h-[550px] bg-neutral-950 border-8 border-neutral-800 rounded-[42px] shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col ring-4 ring-neutral-900 transition-all duration-300 ${
              isVibrating ? "animate-vibrate border-red-900 ring-red-800" : ""
            }`}
          >
            {/* Camera notch / dynamic island */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-between px-3">
              <div className="w-1.5 h-1.5 bg-neutral-900 rounded-full"></div>
              <div className="w-8 h-1 bg-neutral-950 rounded-full"></div>
            </div>

            {/* Status Bar */}
            <div className="h-9 px-6 pt-3.5 flex items-center justify-between text-[10px] font-mono font-bold text-neutral-400 z-40 bg-transparent select-none">
              <span>{localTime}</span>
              <div className="flex items-center gap-1.5">
                <Wifi size={10} />
                <span className="text-[9px]">5G</span>
                <Battery size={11} />
                <span>{phoneBattery}%</span>
              </div>
            </div>

            {/* Smartphone Inner Screen Content */}
            <div className="flex-1 flex flex-col relative bg-gradient-to-br from-neutral-950 via-neutral-900 to-red-950/15 overflow-hidden text-left">
              
              {/* Scenario 1: Phone is Locked/Idle (No 2FA request has been made yet) */}
              {!mfaRequired && (
                <div className="flex-1 flex flex-col items-center justify-between p-6 pb-8 select-none text-center">
                  <div className="mt-8 space-y-1">
                    <p className="text-3xl font-extrabold tracking-tight text-white">{localTime}</p>
                    <p className="text-[11px] uppercase tracking-widest font-mono text-neutral-400">Wednesday, June 24</p>
                  </div>
                  
                  <div className="space-y-3 bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800/40 max-w-[210px] shadow-lg">
                    <Lock size={20} className="mx-auto text-neutral-500 animate-pulse" />
                    <p className="text-[11px] font-medium text-neutral-300 leading-relaxed">
                      Secured admin session offline. Once credentials match, your verification code delivers here.
                    </p>
                  </div>

                  <span className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest animate-pulse">
                    Swipe up to unlock
                  </span>
                </div>
              )}

              {/* Scenario 2: 2FA Request has been made and notification is active */}
              {mfaRequired && phoneState === "notification" && (
                <div className="flex-1 flex flex-col justify-between p-4 pb-8 relative z-10 select-none">
                  {/* Top Lock Info */}
                  <div className="text-center mt-6 space-y-1">
                    <Lock size={14} className="mx-auto text-red-500 mb-1" />
                    <p className="text-3xl font-extrabold tracking-tight text-white">{localTime}</p>
                    <p className="text-[10px] text-neutral-400">Wednesday, June 24</p>
                  </div>

                  {/* Pull-down Mail Notification banner */}
                  <div 
                    onClick={() => setPhoneState("email-open")}
                    className="bg-neutral-900/95 border border-neutral-800 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ring-1 ring-red-500/20 animate-bounce"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="bg-red-600 p-1 rounded-md text-white">
                          <Mail size={10} />
                        </div>
                        <span className="text-[9px] font-bold font-mono text-neutral-300 tracking-wider">MAIL APP</span>
                      </div>
                      <span className="text-[8px] text-neutral-500 font-mono">now</span>
                    </div>
                    
                    <p className="text-[11px] font-bold text-white">Fast Coverage SecOps</p>
                    <p className="text-[10px] text-neutral-300 leading-tight mt-0.5 truncate">
                      Admin OTP Code: {suggested2FACode}
                    </p>
                    <p className="text-[9px] text-red-500/85 mt-2 font-semibold font-mono flex items-center gap-1">
                      ⚡ Tap Notification to Open Mail
                    </p>
                  </div>

                  {/* Swipe suggestion helper */}
                  <div className="text-center space-y-1">
                    <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">
                      Secured with biometric ID
                    </p>
                    <div className="w-16 h-1 bg-neutral-800 rounded-full mx-auto"></div>
                  </div>
                </div>
              )}

              {/* Scenario 3: Mail App is opened displaying the actual message */}
              {mfaRequired && phoneState === "email-open" && (
                <div className="flex-1 flex flex-col bg-neutral-950 text-neutral-200 animate-phone-fade">
                  {/* Mail App Header Navigation */}
                  <div className="bg-neutral-900 border-b border-neutral-800/80 px-3 py-2 flex items-center justify-between z-10 select-none">
                    <button 
                      onClick={() => setPhoneState("notification")}
                      className="text-red-500 flex items-center gap-0.5 text-xs font-mono font-medium hover:text-red-400"
                    >
                      <ChevronLeft size={14} /> Back
                    </button>
                    <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-neutral-400">Inbox</span>
                    <div className="w-10"></div>
                  </div>

                  {/* Email Detail Panel */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Subject line */}
                    <div>
                      <h3 className="text-xs font-bold text-white tracking-tight leading-snug">
                        🔒 Administrative OTP Verification Challenge
                      </h3>
                      <div className="flex items-center gap-1.5 mt-2 text-[9px] font-mono text-neutral-500">
                        <span className="bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-400 border border-neutral-800">System Priority</span>
                        <span>• Today, {localTime}</span>
                      </div>
                    </div>

                    <div className="border-t border-neutral-900 pt-3 flex items-start gap-2">
                      <div className="bg-red-950/40 p-1.5 rounded-full border border-red-900/50 text-red-500 mt-0.5 shrink-0">
                        <Inbox size={12} />
                      </div>
                      <div className="text-[10px] space-y-0.5 min-w-0">
                        <p className="text-neutral-400 truncate"><span className="text-neutral-600 font-mono">From:</span> security@fastcoverage.news</p>
                        <p className="text-neutral-400 truncate"><span className="text-neutral-600 font-mono">To:</span> {email || "admin@fastcoverage.news"}</p>
                      </div>
                    </div>

                    {/* Email body card */}
                    <div className="bg-neutral-900/60 border border-neutral-900 p-3 rounded-xl space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-red-600/5 blur-xl rounded-full"></div>
                      
                      <p className="text-[10px] text-neutral-300 leading-relaxed">
                        A secure terminal session has initiated an admin authorization challenge. Enter this high-security code on your workstation:
                      </p>

                      <div className="bg-neutral-950 p-3 rounded border border-neutral-800 text-center space-y-1 select-all relative group">
                        <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-500 block">OTP Code</span>
                        <p className="text-2xl font-mono font-black text-red-500 tracking-widest leading-none my-1">
                          {suggested2FACode}
                        </p>
                        <span className="text-[7px] text-neutral-500 font-mono block">Expires in 3 minutes</span>
                      </div>

                      {/* Tap to auto-fill interactive trigger */}
                      <button
                        type="button"
                        onClick={() => {
                          setVerificationCode(suggested2FACode);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className={`w-full py-2 px-3 rounded-lg text-[9px] font-bold font-mono tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                          copiedCode 
                            ? "bg-green-800 hover:bg-green-900 text-white" 
                            : "bg-red-700 hover:bg-red-800 text-white hover:scale-[1.01]"
                        }`}
                      >
                        {copiedCode ? (
                          <>
                            <Check size={11} />
                            <span>COPIED & AUTO-FILLED!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>🚀 TAP TO AUTO-FILL CODE</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[8px] text-neutral-600 text-center font-sans leading-normal">
                      Security alert: If you did not trigger this session authentication, lock your terminal immediately.
                    </p>
                  </div>

                  {/* Mail footer bar */}
                  <div className="p-3 bg-neutral-900 border-t border-neutral-800/60 select-none">
                    <div className="w-20 h-1 bg-neutral-700 rounded-full mx-auto"></div>
                  </div>
                </div>
              )}

              {/* Bottom home bar indicator */}
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 bg-neutral-700 rounded-full z-40 select-none"></div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
