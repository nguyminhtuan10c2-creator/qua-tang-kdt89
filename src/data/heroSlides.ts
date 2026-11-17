import heroSlideMegaSale from '../assets/images/hero_slide_mega_sale_1794802647191.jpg';
import heroSlideVoucherCombo from '../assets/images/hero_slide_voucher_combo_1794802647794.jpg';
import kdtMascotWelcome from '../assets/images/kdt_mascot_welcome_1794803049679.jpg';

export type HeroSlideAction = 'products' | 'voucher' | 'welcome' | 'consult' | 'none';
export type HeroAspectRatio = '5/1' | '16/7' | '2/1' | '16/9';
export type HeroMobileAspectRatio = '16/9' | '2/1' | '4/3';
export type HeroSlideFit = 'smart' | 'contain' | 'cover';

export const DEFAULT_WELCOME_MASCOT_IMAGE = kdtMascotWelcome;
export const DEFAULT_MEMBER_SLIDE_IMAGE = heroSlideVoucherCombo;

export interface HeroSlideConfig {
  id: string;
  imageKey: string;
  mobileImageKey?: string;
  fallbackImage?: string;
  mobileFallbackImage?: string;
  title?: string;
  actionType: HeroSlideAction;
  fit?: HeroSlideFit;
  mobileFit?: HeroSlideFit;
  syncMobileWithPc?: boolean;
}

export interface ResolvedHeroSlide extends HeroSlideConfig {
  imageSrc: string;
  mobileImageSrc: string;
  hasCustomMobileImage: boolean;
  hasCustomPcImage: boolean;
}

export const DEFAULT_HERO_SLIDES: HeroSlideConfig[] = [
  {
    id: 'slide-1',
    imageKey: 'site-hero-slide-1',
    mobileImageKey: 'site-hero-slide-1-mobile',
    fallbackImage: heroSlideMegaSale,
    mobileFallbackImage: heroSlideMegaSale,
    title: 'Kho Điện Tử KDT-89 — Giá Sale Tại Kho Chính Hãng',
    actionType: 'products',
    syncMobileWithPc: false,
  },
  {
    id: 'slide-2',
    imageKey: 'site-hero-slide-2',
    mobileImageKey: 'site-hero-slide-2-mobile',
    fallbackImage: heroSlideVoucherCombo,
    mobileFallbackImage: heroSlideVoucherCombo,
    title: 'Gia Dụng & Nhà Bếp Chính Hãng — Nhận Ngay Voucher Thành Viên',
    actionType: 'voucher',
    syncMobileWithPc: false,
  },
];

export const HERO_SLIDE_FALLBACK_MAP: Record<string, string> = {
  'site-hero-slide-1': heroSlideMegaSale,
  'site-hero-slide-2': heroSlideVoucherCombo,
};

export function resolveHeroSlides(
  customSlides?: HeroSlideConfig[],
  customImages: Record<string, string> = {}
): ResolvedHeroSlide[] {
  const source =
    Array.isArray(customSlides) && customSlides.length > 0
      ? customSlides
      : DEFAULT_HERO_SLIDES;

  const resolved = source
    .map((slide, idx) => {
      const legacyHeroFallback =
        idx === 0 && slide.imageKey === 'site-hero-slide-1'
          ? customImages['site-hero-image']
          : undefined;
      const customPc = customImages[slide.imageKey];
      const defaultSlideFallback =
        slide.fallbackImage || HERO_SLIDE_FALLBACK_MAP[slide.imageKey] || '';
      const imageSrc = customPc || legacyHeroFallback || defaultSlideFallback;

      const resolvedMobileKey = slide.mobileImageKey || `${slide.imageKey}-mobile`;
      const customMobile = customImages[resolvedMobileKey];
      const mobileDefaultFallback =
        slide.mobileFallbackImage ||
        (slide.syncMobileWithPc ? imageSrc : defaultSlideFallback);
      const mobileImageSrc = customMobile || mobileDefaultFallback || '';

      return {
        ...slide,
        mobileImageKey: resolvedMobileKey,
        imageSrc,
        mobileImageSrc,
        hasCustomMobileImage: Boolean(customMobile),
        hasCustomPcImage: Boolean(customPc),
      };
    })
    .filter((s) => Boolean(s.imageSrc || s.mobileImageSrc));

  if (resolved.length === 0) {
    return DEFAULT_HERO_SLIDES.map((s) => ({
      ...s,
      imageSrc: s.fallbackImage || '',
      mobileImageSrc: s.mobileFallbackImage || s.fallbackImage || '',
      hasCustomMobileImage: false,
      hasCustomPcImage: false,
    }));
  }

  return resolved;
}
