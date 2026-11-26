import React, { useId } from 'react';
import type { SectionBgTheme } from '../lib/sectionTheme';

interface SectionThemeBackdropProps {
  theme: SectionBgTheme;
}

export const SectionThemeBackdrop: React.FC<SectionThemeBackdropProps> = ({ theme }) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const gradId = `sec-grad-${uid}`;
  const patternId = `sec-pat-${uid}`;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={theme.fromColor} />
          <stop offset="100%" stopColor={theme.toColor} />
        </linearGradient>

        {theme.pattern === 'diamonds' && (
          <pattern id={patternId} width="48" height="48" patternUnits="userSpaceOnUse">
            <path
              d="M24 4 L44 24 L24 44 L4 24 Z"
              fill="none"
              stroke="white"
              strokeWidth="1.2"
              strokeOpacity="0.65"
            />
            <circle cx="24" cy="24" r="2.2" fill="white" fillOpacity="0.7" />
            <path
              d="M12 0 L0 12 M48 36 L36 48"
              stroke="white"
              strokeWidth="1"
              strokeOpacity="0.45"
            />
          </pattern>
        )}

        {theme.pattern === 'sparkles' && (
          <pattern id={patternId} width="38" height="38" patternUnits="userSpaceOnUse">
            <circle cx="7" cy="7" r="1.4" fill="white" />
            <circle cx="28" cy="27" r="1.4" fill="white" />
            <path
              d="M19 5 L21 11 L27 13 L21 15 L19 21 L17 15 L11 13 L17 11 Z"
              fill="white"
              fillOpacity="0.5"
            />
          </pattern>
        )}

        {theme.pattern === 'waves' && (
          <pattern id={patternId} width="44" height="22" patternUnits="userSpaceOnUse">
            <path
              d="M0 11 Q11 2 22 11 T44 11"
              fill="none"
              stroke="white"
              strokeWidth="1.3"
              strokeOpacity="0.55"
            />
            <circle cx="22" cy="18" r="1.2" fill="white" fillOpacity="0.5" />
          </pattern>
        )}
      </defs>

      <rect width="100%" height="100%" fill={`url(#${gradId})`} />
      {theme.pattern !== 'none' && (
        <rect width="100%" height="100%" fill={`url(#${patternId})`} opacity="0.16" />
      )}
    </svg>
  );
};
