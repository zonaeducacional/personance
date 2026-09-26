import React from 'react';

interface RippleLogoProps {
  className?: string;
  size?: number;
}

export const RippleLogo: React.FC<RippleLogoProps> = ({ className = 'w-6 h-6', size = 24 }) => {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <radialGradient id="rippleCenterGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="25%" stopColor="#22d3ee" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rippleWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a5f3fc" />
          <stop offset="40%" stopColor="#22d3ee" />
          <stop offset="75%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>

      {/* Outer ambient wave 4 */}
      <circle
        cx="24"
        cy="24"
        r="21"
        stroke="url(#rippleWaveGrad)"
        strokeWidth="1.2"
        strokeOpacity="0.25"
        strokeDasharray="2 2"
      />

      {/* Ripple wave 3 */}
      <circle
        cx="24"
        cy="24"
        r="16.5"
        stroke="url(#rippleWaveGrad)"
        strokeWidth="1.8"
        strokeOpacity="0.45"
      />

      {/* Ripple wave 2 */}
      <circle
        cx="24"
        cy="24"
        r="11.5"
        stroke="url(#rippleWaveGrad)"
        strokeWidth="2.2"
        strokeOpacity="0.75"
      />

      {/* Ripple wave 1 (tight impact crest) */}
      <circle
        cx="24"
        cy="24"
        r="6.5"
        stroke="#ffffff"
        strokeWidth="2"
        strokeOpacity="0.95"
      />

      {/* Central water drop / impact stone point */}
      <circle cx="24" cy="24" r="2.8" fill="#ffffff" />
      <circle cx="24" cy="24" r="5" fill="url(#rippleCenterGlow)" />

      {/* Droplet specular glance */}
      <circle cx="22.8" cy="22.8" r="0.9" fill="#ffffff" />
    </svg>
  );
};
