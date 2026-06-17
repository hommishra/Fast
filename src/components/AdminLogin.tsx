import React, { useState } from "react";
import { ShieldCheck, Lock, Mail, KeySquare, HelpCircle, AlertCircle } from "lucide-react";

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
    <div className="min-h-screen bg-neutral-900 flex flex-col justify-center items-center px-4 font-sans text-neutral-200 selection:bg-red-800" id="admin_login_view">
      <div className="w-full max-w-md bg-neutral-950 p-8 border border-neutral-800 rounded-lg shadow-2xl relative space-y-6">
        {/* Banner header logo */}
        <div className="text-center space-y-1 select-none">
          <div className="inline-flex items-center justify-center bg-red-800/20 text-red-600 p-2.5 rounded-full border border-red-800/40 mb-3 animate-pulse">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-xl font-mono tracking-widest text-red-500 font-extrabold uppercase uppercase-title">
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
            <div className="bg-amber-950/30 border border-amber-800/40 text-amber-300 p-4 text-xs rounded-lg space-y-1">
              <div className="flex items-center gap-1.5 font-bold font-mono">
                <KeySquare size={13} className="text-amber-500" />
                <span>2FA TRANSMISSION ALERT</span>
              </div>
              <p className="mb-2">
                A secure login authorization request is being completed. Input the generated OTP code to authorize:
              </p>
              <div className="font-mono text-center text-lg tracking-widest bg-amber-950/80 text-amber-400 p-2.5 rounded border border-amber-900 select-all">
                {suggested2FACode}
              </div>
            </div>

            <div className="space-y-1 text-center">
              <label className="text-[10px] font-bold font-mono tracking-widest uppercase text-neutral-400 block mb-2 select-none">
                INPUT 2-FACTOR OTP CODE
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                className="w-40 mx-auto bg-neutral-900 border border-neutral-800 rounded p-3 text-center text-xl font-bold font-mono text-white tracking-widest focus:outline-none focus:border-red-650"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 disabled:bg-neutral-800 text-white font-sans text-xs font-extrabold uppercase tracking-widest py-3 rounded-md transition-all duration-150 cursor-pointer"
            >
              {loading ? "AUTHORIZING SIGNATURE..." : "VERIFY & GRANT SESSION"}
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
            <span>RSA-256 Hashing System</span>
          </div>
        </div>
      </div>
    </div>
  );
}
