import React, { useState, useEffect } from "react";
import "./SplashScreen.css";

interface SplashScreenProps {
  onComplete: () => void;
  durationMs?: number; // default: 2600ms
}

export default function SplashScreen({ onComplete, durationMs = 2600 }: SplashScreenProps) {
  const [isFading, setIsFading] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Determine if user has requested reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Check if splash has already been shown in this browser session
    const hasBeenShown = sessionStorage.getItem("fc_splash_shown");

    if (hasBeenShown === "true") {
      // Skip splash if already shown in this session
      setShouldRender(false);
      onComplete();
      return;
    }

    if (prefersReducedMotion) {
      // Immediately skip or complete instantly
      sessionStorage.setItem("fc_splash_shown", "true");
      setShouldRender(false);
      onComplete();
      return;
    }

    // Set timer to start fade-out effect as loading bar finishes
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, durationMs);

    // Wait for fade-out CSS transitions to finish before notifying complete and unmounting
    const completeTimer = setTimeout(() => {
      sessionStorage.setItem("fc_splash_shown", "true");
      setShouldRender(false);
      onComplete();
    }, durationMs + 600); // 600ms corresponds to transition duration in CSS

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [durationMs, onComplete]);

  if (!shouldRender) {
    return null;
  }

  const brandName = "FAST COVERAGE";

  return (
    <div 
      className={`splash-overlay ${isFading ? "splash-fade-out" : ""}`}
      id="splash_screen_viewport"
    >
      <div className="splash-content" id="splash_content_wrapper">
        {/* Animated FC logo with moving glow and outer circular ring */}
        <div className="logo-container" id="splash_logo_ring_container">
          <div className="light-sweep-ring"></div>
          <div className="splash-logo-badge" id="splash_logo_icon">
            FC
          </div>
        </div>

        {/* Typing Headline text */}
        <div className="splash-title-container" id="splash_title_wrapper">
          <h1 className="splash-title-text">
            {brandName.split("").map((letter, idx) => (
              <span
                key={idx}
                className="splash-letter"
                style={{
                  animationDelay: `${idx * 40 + 200}ms`,
                  // Add extra spacing for spaces
                  marginRight: letter === " " ? "0.45em" : "0.02em",
                }}
              >
                {letter === " " ? "\u00A0" : letter}
              </span>
            ))}
          </h1>
        </div>

        {/* Tagline Subtitle */}
        <p className="splash-subtitle" id="splash_tagline">
          Breaking News • Live Updates • Global Coverage
        </p>
      </div>

      {/* Loading indicator progress line */}
      <div className="loading-bar-container" id="splash_progress_bar">
        <div 
          className="loading-bar-fill" 
          style={{ animationDuration: `${durationMs}ms` }}
        ></div>
      </div>
    </div>
  );
}
