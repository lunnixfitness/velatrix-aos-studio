import React from 'react';

interface VelatrixLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'horizontal' | 'icon-only' | 'capsule';
  showVersion?: boolean;
  versionText?: string;
  theme?: 'dark' | 'light';
  className?: string;
}

export const VelatrixLogo: React.FC<VelatrixLogoProps> = ({
  size = 'md',
  variant = 'full',
  showVersion = true,
  versionText = 'AOS v4.8',
  theme = 'dark',
  className = ''
}) => {
  // Dimensions map
  const iconDimensions = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }[size];

  const textSizes = {
    xs: { title: 'text-sm', slogan: 'text-[7px]', badge: 'text-[8px] px-1 py-0.5' },
    sm: { title: 'text-base', slogan: 'text-[8px]', badge: 'text-[9px] px-1.5 py-0.5' },
    md: { title: 'text-lg', slogan: 'text-[9px]', badge: 'text-[10px] px-2 py-0.5' },
    lg: { title: 'text-xl', slogan: 'text-[10px]', badge: 'text-[11px] px-2.5 py-1' },
    xl: { title: 'text-3xl', slogan: 'text-xs', badge: 'text-xs px-3 py-1' }
  }[size];

  const isLight = theme === 'light';
  const titleClass = isLight ? 'text-[#0A1628]' : 'text-[#FFFFFF]';
  const sloganClass = isLight ? 'text-[#5A6B7C]' : 'text-slate-400';
  const badgeClass = isLight
    ? 'bg-[#EEF6FB] text-[#0B4571] border border-[#D5DCE4]'
    : 'bg-amber-500/10 text-amber-400 border border-amber-500/40';

  // Cybernetic Brain Orb SVG Icon
  const BrainOrbRaw = (
    <div className={`relative ${iconDimensions} shrink-0 group`}>
      {/* Outer Amber Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[var(--vx-neon)]/40 via-[#FF7A00]/50 to-[#FF9E00]/40 rounded-full blur-[6px] opacity-75 group-hover:opacity-100 transition-opacity animate-pulse" />

      {/* Frame Container */}
      <div className="relative w-full h-full rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black p-0.5 border border-amber-500/40 shadow-inner flex items-center justify-center overflow-hidden">
        
        {/* Futuristic SVG Brain Hologram */}
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full drop-shadow-[0_0_8px_rgba(255,122,0,0.6)]"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Radial Ambient Gradient */}
          <circle cx="50" cy="50" r="46" fill="url(#bgRadial)" />
          <circle cx="50" cy="50" r="45" stroke="#FF7A00" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />

          {/* Left Cyan Synaptic Hemisphere */}
          <path 
            d="M48 24C37 24 28 32 28 44C28 50 31 55 33 58C30 62 31 68 34 71C38 75 44 76 48 76V24Z" 
            fill="url(#cyanGlow)" 
            opacity="0.9"
          />
          {/* Cyan Neural Traces */}
          <path d="M35 34C40 37 43 35 47 38" stroke="#00F2FF" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M30 46C37 46 41 49 46 50" stroke="#00F2FF" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M32 58C36 56 42 62 47 62" stroke="#00F2FF" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M37 68C41 68 44 71 47 73" stroke="#00F2FF" strokeWidth="1.5" strokeLinecap="round" />

          {/* Right Copper/Amber Synaptic Hemisphere */}
          <path 
            d="M52 24C63 24 72 32 72 44C72 50 69 55 67 58C70 62 69 68 66 71C62 75 56 76 52 76V24Z" 
            fill="url(#amberGlow)" 
            opacity="0.9"
          />
          {/* Amber Circuit Traces */}
          <path d="M65 34C60 37 57 35 53 38" stroke="#FF9E00" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M70 46C63 46 59 49 54 50" stroke="#FF9E00" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M68 58C64 56 58 62 53 62" stroke="#FF9E00" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M63 68C59 68 56 71 53 73" stroke="#FF9E00" strokeWidth="1.5" strokeLinecap="round" />

          {/* Central Microchip (AOS Processor Core) */}
          <rect x="39" y="42" width="22" height="16" rx="3" fill="#0A0F1D" stroke="#FF7A00" strokeWidth="1.2" />
          <text 
            x="50" 
            y="53.5" 
            textAnchor="middle" 
            fill="#FFFFFF" 
            fontSize="8" 
            fontFamily="monospace" 
            fontWeight="900"
            letterSpacing="0.5"
          >
            AOS
          </text>

          {/* Microchip Contact Pins */}
          <path d="M42 42V39 M46 42V39 M50 42V39 M54 42V39 M58 42V39" stroke="#FF7A00" strokeWidth="1" strokeLinecap="round" />
          <path d="M42 58V61 M46 58V61 M50 58V61 M54 58V61 M58 58V61" stroke="#00F2FF" strokeWidth="1" strokeLinecap="round" />

          {/* Orbital Satellite Node Dots */}
          <circle cx="16" cy="38" r="2" fill="#00F2FF" />
          <line x1="18" y1="39" x2="28" y2="44" stroke="#00F2FF" strokeWidth="0.6" strokeDasharray="1 1" />
          
          <circle cx="84" cy="38" r="2" fill="#FF7A00" />
          <line x1="82" y1="39" x2="72" y2="44" stroke="#FF7A00" strokeWidth="0.6" strokeDasharray="1 1" />

          <circle cx="20" cy="65" r="2" fill="#00E676" />
          <circle cx="80" cy="65" r="2" fill="#FF9E00" />

          {/* Gradients */}
          <defs>
            <radialGradient id="bgRadial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0B132B" />
              <stop offset="70%" stopColor="#050B14" />
              <stop offset="100%" stopColor="#020408" />
            </radialGradient>
            <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F2FF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0077B6" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="amberGlow" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#D97706" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Live Active Micro-Beacon in corner */}
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#FF7A00] animate-ping" />
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#FF7A00]" />
      </div>
    </div>
  );

  // If theme is light, place mark over dark tile #0A0F1D with branding preserved
  const BrainOrbIcon = isLight ? (
    <div className={`p-1 rounded-lg bg-[#0A0F1D] border border-[#1E293B] shadow-sm flex items-center justify-center shrink-0 ${variant === 'icon-only' ? className : ''}`}>
      {BrainOrbRaw}
    </div>
  ) : (
    <div className={`shrink-0 ${variant === 'icon-only' ? className : ''}`}>
      {BrainOrbRaw}
    </div>
  );

  // Variant: Capsule Pill (As seen in Landing Page header: 🟠 VELATRIX • SISTEMA OPERACIONAL AUTÔNOMO)
  if (variant === 'capsule') {
    return (
      <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-amber-500/40 shadow-[0_0_15px_rgba(255,122,0,0.15)] ${className}`}>
        <span className="w-2 h-2 rounded-full bg-[#FF7A00] animate-pulse" />
        <span className="text-white font-black tracking-wider text-xs font-sans">
          VELATRI<span className="text-[#FF7A00]">X</span>
        </span>
        <span className="text-slate-600 text-xs">•</span>
        <span className="text-amber-400 font-bold uppercase tracking-[0.2em] text-[10px] font-mono">
          SISTEMA OPERACIONAL AUTÔNOMO
        </span>
      </div>
    );
  }

  // Variant: Icon Only
  if (variant === 'icon-only') {
    return BrainOrbIcon;
  }

  // Variant: Horizontal (Header / Navbar single-line)
  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {BrainOrbIcon}
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className={`${titleClass} font-black tracking-tight font-sans ${textSizes.title}`}>
                VELATRI<span className="text-[#FF7A00]">X</span>
              </span>
              {showVersion && (
                <span className={`rounded-md font-mono font-bold uppercase tracking-wider ${badgeClass} ${textSizes.badge}`}>
                  {versionText}
                </span>
              )}
            </div>
            <span className={`${sloganClass} font-bold uppercase tracking-[0.22em] font-sans ${textSizes.slogan}`}>
              SISTEMA OPERACIONAL AUTÔNOMO
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Default Variant: Full (Brand + Slogan + Version)
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {BrainOrbIcon}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <span className={`${titleClass} font-black tracking-tight font-sans ${textSizes.title}`}>
            VELATRI<span className="text-[#FF7A00]">X</span>
          </span>
          {showVersion && (
            <span className={`rounded-md font-mono font-bold tracking-wider ${badgeClass} ${textSizes.badge}`}>
              {versionText}
            </span>
          )}
        </div>
        <span className={`${sloganClass} font-semibold uppercase tracking-[0.24em] font-sans ${textSizes.slogan}`}>
          SISTEMA OPERACIONAL AUTÔNOMO
        </span>
      </div>
    </div>
  );
};
