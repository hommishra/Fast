import React, { useState } from "react";
import { 
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { auth } from "../firebase";
import { X, AlertCircle, Sparkles } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Sign In using Google Popup (Native and works out-of-the-box!)
  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      setSuccessMsg(`Welcome, ${result.user.displayName || result.user.email}! Signed in successfully.`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("Google login error:", err);
      let friendlyMessage = "Failed to sign in with Google Popup. Check your network or browser settings.";
      if (err.code === "auth/popup-blocked") {
        friendlyMessage = "The Google login popup was blocked by your browser. Please allow popups for this site.";
      } else if (err.message) {
        friendlyMessage = err.message;
      }
      setErrorMsg(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      id="custom_reader_auth_modal"
    >
      <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden font-sans">
        
        {/* CNN Style Banner Strip */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-950">
          <div className="flex items-center gap-2">
            <span className="bg-red-650 text-white text-[9.5px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
              FC NETWORK
            </span>
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-350 uppercase">
              Reader Access Gate
            </span>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close Gate"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Form */}
        <div className="p-6 space-y-6">
          {/* Section Heading */}
          <div className="text-center space-y-2 select-none">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
              Sign In to Fast Coverage
            </h3>
            <p className="text-[11px] text-slate-450 leading-relaxed font-medium">
              Join our active subscriber network to save custom bulletins, participate in real-time user commentaries, and verify your read history instantly.
            </p>
          </div>

          {/* Success / Error Banners */}
          {errorMsg && (
            <div className="flex items-start gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-xs animate-fade-in">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <p className="font-medium text-[10.5px]">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2 bg-emerald-50 text-emerald-700 border border-emerald-250 rounded-lg p-3 text-xs animate-fade-in">
              <Sparkles size={15} className="shrink-0 mt-0.5 text-emerald-600 animate-pulse" />
              <p className="font-semibold text-[10.5px]">{successMsg}</p>
            </div>
          )}

          {/* Google Sign In Option (Zero Config & Works Instantly) */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-sans text-xs uppercase tracking-widest font-black py-3 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg cursor-pointer select-none border border-slate-950"
            >
              <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#ffffff"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  className="opacity-95"
                />
                <path
                  fill="#ffffff"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  className="opacity-90"
                />
                <path
                  fill="#ffffff"
                  d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.08H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.92l2.85-2.22-.03-.6z"
                  className="opacity-90"
                />
                <path
                  fill="#ffffff"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.08l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z"
                  className="opacity-95"
                />
              </svg>
              <span>{loading ? "Signing in..." : "Continue with Google"}</span>
            </button>
            <p className="text-[10px] text-center text-slate-400 font-mono">
              Secure Auth &bull; 1-Click Connection
            </p>
          </div>

          {/* Institutional Note */}
          <div className="pt-2 select-none border-t border-slate-100 text-center">
            <span className="text-[9.5px] uppercase font-mono font-bold text-slate-400 tracking-wider">
              FAST COVERAGE STANDARDS DIRECTIVE
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
