import React from "react";

interface TaskPanelLogoProps {
  className?: string;
  size?: number;
}

export function TaskPanelLogo({ className = "h-9 w-9", size }: TaskPanelLogoProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      style={style}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="tpl-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="45%" stopColor="#0369A1" />
          <stop offset="100%" stopColor="#0B192C" />
        </linearGradient>

        <linearGradient id="tpl-back-card" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0077B6" stopOpacity="0.15" />
        </linearGradient>

        <linearGradient id="tpl-main-card" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F0F9FF" />
        </linearGradient>

        <linearGradient id="tpl-check-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="60%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        <filter id="tpl-card-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="16" stdDeviation="24" floodColor="#03071E" floodOpacity="0.35" />
        </filter>

        <filter id="tpl-check-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0284C7" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Background squircle */}
      <rect width="512" height="512" rx="128" fill="url(#tpl-bg)" />
      <rect x="4" y="4" width="504" height="504" rx="124" fill="none" stroke="#38BDF8" strokeWidth="3" strokeOpacity="0.3" />

      <g id="icon">
        {/* Layer 1: Background Secondary Panel */}
        <rect x="176" y="88" width="220" height="280" rx="40" fill="url(#tpl-back-card)" transform="rotate(8 286 228)" />

        {/* Layer 2: Main Floating TaskPanel Canvas */}
        <g filter="url(#tpl-card-shadow)">
          <rect x="116" y="104" width="280" height="324" rx="44" fill="url(#tpl-main-card)" />
          <rect x="117" y="105" width="278" height="322" rx="43" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeOpacity="0.8" />

          {/* Top Header Clip Pill */}
          <rect x="196" y="86" width="120" height="36" rx="18" fill="#0284C7" />
          <rect x="236" y="98" width="40" height="12" rx="6" fill="#BAE6FD" />

          {/* Minimal Lines */}
          <rect x="160" y="168" width="192" height="14" rx="7" fill="#E2E8F0" />
          <rect x="160" y="202" width="128" height="14" rx="7" fill="#E2E8F0" />
          <rect x="160" y="374" width="192" height="12" rx="6" fill="#F1F5F9" />
        </g>

        {/* Layer 3: Bold Geometric Vibrant Checkmark Leaping Forward */}
        <g filter="url(#tpl-check-shadow)">
          <path
            d="M 188 276 L 244 332 C 252 340 264 340 272 332 L 380 208 C 390 196 388 180 376 170 C 364 160 348 162 336 174 L 256 268 L 222 234 C 210 222 194 222 182 234 C 170 246 170 264 188 276 Z"
            fill="url(#tpl-check-grad)"
          />
        </g>

        {/* Sparkle dot */}
        <circle cx="376" cy="136" r="10" fill="#38BDF8" />
      </g>
    </svg>
  );
}

