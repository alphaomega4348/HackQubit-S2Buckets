import React from "react";
import "../styles/loading.css";
import logo from "../assets/logo.png";

export default function Loading({ label = "Connecting people · Sharing ideas" }) {
  return (
    <div className="loading-wrapper" role="status" aria-live="polite">
      <div className="loading-card">
        <div className="logo-mark" aria-hidden>
          <img src={logo} alt="Socialify" className="logo-svg" style={{ width: 72, height: 72 }} />
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
