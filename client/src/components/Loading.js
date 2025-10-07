import React from "react";
import "../styles/loading.css";

export default function Loading({ label = "Connecting people · Sharing ideas" }) {
  return (
    <div className="loading-wrapper" role="status" aria-live="polite">
      <div className="loading-card">
        <div className="logo-mark" aria-hidden>
          <svg viewBox="0 0 100 100" className="logo-svg" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g" x1="0" x2="1">
                <stop offset="0" stopColor="#19c37d" />
                <stop offset="1" stopColor="#0ea95b" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#g)" />
            <text x="50%" y="56%" textAnchor="middle" fill="#fff" fontSize="46" fontWeight="700" fontFamily="Inter, Rubik, sans-serif">S</text>
          </svg>
        </div>

        <h1 className="loading-title">Socialify</h1>
        <div className="loading-sub">{label}</div>

        <div className="loading-spinner" aria-hidden>
          <span className="dot dot1" />
          <span className="dot dot2" />
          <span className="dot dot3" />
        </div>
      </div>
    </div>
  );
}
