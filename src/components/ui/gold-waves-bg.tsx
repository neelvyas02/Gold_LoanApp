import React from "react";

export function GoldWavesBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Soft Gold Radial Illumination */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,_rgba(212,175,55,0.08)_0%,_transparent_70%)] blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[radial-gradient(circle,_rgba(245,208,97,0.05)_0%,_transparent_70%)] blur-3xl" />

      {/* Abstract Golden Flowing Waves SVG */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30 mix-blend-screen motion-reduce:animate-none animate-pulse-slow"
        viewBox="0 0 1000 1000"
        fill="none"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="waveGold1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5D061" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#997A15" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="waveGold2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF4D0" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#D4AF37" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Wave Lines */}
        <path
          d="M-100 200 C 300 400, 400 100, 1100 500 C 1100 500, 700 800, -100 900 Z"
          fill="url(#waveGold1)"
        />
        <path
          d="M 0 600 C 400 200, 600 700, 1200 300"
          stroke="url(#waveGold1)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />
        <path
          d="M -200 400 C 200 800, 800 200, 1200 700"
          stroke="url(#waveGold2)"
          strokeWidth="1"
        />
        <path
          d="M 100 100 C 500 500, 300 900, 900 1000"
          stroke="url(#waveGold1)"
          strokeWidth="0.75"
          strokeOpacity="0.4"
        />
      </svg>

      {/* Grid Mesh lines for fintech texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
    </div>
  );
}
