export default function LogoIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id="indigoGrad" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#312E81" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#D4A017" />
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodOpacity="0.12" />
        </filter>
      </defs>
      <rect x="48" y="32" width="120" height="160" rx="24" fill="url(#indigoGrad)" filter="url(#shadow)" />
      <rect x="76" y="72" width="64" height="8" rx="4" fill="#FFFFFF" opacity="0.6" />
      <rect x="76" y="96" width="48" height="8" rx="4" fill="#FFFFFF" opacity="0.6" />
      <circle cx="160" cy="160" r="56" fill="url(#goldGrad)" filter="url(#shadow)" />
      <path
        d="M142 160 L154 172 L182 144"
        stroke="#FFFFFF"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
