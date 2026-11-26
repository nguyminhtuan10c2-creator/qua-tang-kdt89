export type SectionPatternType = 'diamonds' | 'sparkles' | 'waves' | 'none';

export interface SectionBgTheme {
  presetId?: string;
  fromColor: string;
  toColor: string;
  pattern: SectionPatternType;
}

export interface SectionThemePreset {
  id: string;
  label: string;
  fromColor: string;
  toColor: string;
}

export const SECTION_THEME_PRESETS: SectionThemePreset[] = [
  { id: 'red_orange', label: 'Đỏ – Cam', fromColor: '#dc2626', toColor: '#f97316' },
  { id: 'orange_amber', label: 'Cam – Vàng', fromColor: '#f97316', toColor: '#f59e0b' },
  { id: 'red_magenta', label: 'Đỏ – Magenta', fromColor: '#dc2626', toColor: '#c026d3' },
  { id: 'crimson_rose', label: 'Đỏ Cherry', fromColor: '#b91c1c', toColor: '#e11d48' },
  { id: 'royal_blue', label: 'Xanh Điện Máy', fromColor: '#1d4ed8', toColor: '#4338ca' },
  { id: 'emerald_teal', label: 'Xanh Ngọc', fromColor: '#059669', toColor: '#0d9488' },
  { id: 'violet_pink', label: 'Tím – Hồng', fromColor: '#7c3aed', toColor: '#db2777' },
  { id: 'dark_crimson', label: 'Đen – Đỏ Live', fromColor: '#171717', toColor: '#9f1239' },
];

export const SECTION_PATTERN_OPTIONS: Array<{ id: SectionPatternType; label: string }> = [
  { id: 'diamonds', label: 'Kim cương' },
  { id: 'sparkles', label: 'Sao lấp lánh' },
  { id: 'waves', label: 'Sóng chéo' },
  { id: 'none', label: 'Nền trơn' },
];

export const DEFAULT_FLASH_SALE_THEME: SectionBgTheme = {
  presetId: 'orange_amber',
  fromColor: '#f97316',
  toColor: '#f59e0b',
  pattern: 'diamonds',
};

export const DEFAULT_LIVESTREAM_THEME: SectionBgTheme = {
  presetId: 'red_orange',
  fromColor: '#dc2626',
  toColor: '#f97316',
  pattern: 'sparkles',
};

const VALID_HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function normalizeSectionTheme(
  partial: Partial<SectionBgTheme> | undefined | null,
  fallback: SectionBgTheme
): SectionBgTheme {
  if (!partial) return fallback;
  const fromColor = VALID_HEX_RE.test(partial.fromColor || '')
    ? (partial.fromColor as string)
    : fallback.fromColor;
  const toColor = VALID_HEX_RE.test(partial.toColor || '')
    ? (partial.toColor as string)
    : fallback.toColor;
  const pattern: SectionPatternType =
    partial.pattern === 'diamonds' ||
    partial.pattern === 'sparkles' ||
    partial.pattern === 'waves' ||
    partial.pattern === 'none'
      ? partial.pattern
      : fallback.pattern;

  return {
    presetId: partial.presetId || 'custom',
    fromColor,
    toColor,
    pattern,
  };
}

function hexLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return 0.3;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const linearize = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export function isLightGradient(fromHex: string, toHex: string): boolean {
  const avgLum = (hexLuminance(fromHex) + hexLuminance(toHex)) / 2;
  return avgLum > 0.56;
}
