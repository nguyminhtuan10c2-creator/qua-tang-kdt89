import React from 'react';

interface KDTLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
}

export const KDTLogo: React.FC<KDTLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
}) => {
  const iconSize = size === 'sm' ? 32 : size === 'lg' ? 48 : 40;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Exact SVG recreation of the KDT emblem from the uploaded logo image:
          - Orange KDT bold letters in center
          - Grey dynamic elliptical swoosh rings wrapping around top-right and bottom-left */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-xs"
      >
        {/* Top-right metallic grey orbital swoosh arcs */}
        <path
          d="M 50 38 C 65 20, 85 18, 98 25 C 93 18, 75 16, 56 32 Z"
          fill="#8A9098"
        />
        <path
          d="M 44 44 C 62 26, 84 25, 96 33 C 91 26, 73 24, 49 40 Z"
          fill="#9CA3AF"
        />
        <path
          d="M 39 49 C 58 33, 83 31, 95 40 C 90 34, 71 31, 45 46 Z"
          fill="#B0B7C3"
        />

        {/* Bottom-left metallic grey orbital swoosh arcs */}
        <path
          d="M 70 82 C 55 100, 35 102, 22 95 C 27 102, 45 104, 64 88 Z"
          fill="#8A9098"
        />
        <path
          d="M 76 76 C 58 94, 36 95, 24 87 C 29 94, 47 96, 71 80 Z"
          fill="#9CA3AF"
        />
        <path
          d="M 81 71 C 62 87, 37 89, 25 80 C 30 86, 49 89, 75 74 Z"
          fill="#B0B7C3"
        />

        {/* Central KDT Stylized Bold Orange Glyph Group */}
        <g fill="#F25A24">
          {/* Letter K */}
          <path d="M 20 43 L 34 43 L 34 77 L 20 77 Z" />
          <path d="M 28 58 L 43 43 L 53 43 L 37 60 L 54 77 L 43 77 Z" />

          {/* Letter D (Bold connected curve) */}
          <path d="M 48 43 L 64 43 C 75 43, 82 49, 82 60 C 82 71, 75 77, 64 77 L 48 77 Z M 58 52 L 58 68 L 64 68 C 69 68, 72 65, 72 60 C 72 55, 69 52, 64 52 Z" />

          {/* Letter T (Integrated top bar and stem) */}
          <path d="M 78 43 L 100 43 L 96 50 L 89 50 L 80 77 L 72 77 L 81 50 L 78 50 Z" />
        </g>
      </svg>

      {variant === 'full' && (
        <div className="flex flex-col text-left">
          <span className="font-extrabold text-base sm:text-lg text-neutral-900 tracking-tight leading-tight flex items-center gap-1.5">
            <span className="text-[#F25A24]">KDT</span>
            <span className="text-neutral-800">-89</span>
          </span>
          <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-500 uppercase tracking-wider leading-none">
            Điện máy & Gia dụng
          </span>
        </div>
      )}
    </div>
  );
};
