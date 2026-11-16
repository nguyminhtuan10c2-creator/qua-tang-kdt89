import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Truck,
  HeartHandshake,
  Camera,
  ShoppingBag,
  PhoneCall,
  ChevronLeft,
  ChevronRight,
  Images,
  Smartphone,
  Gift,
  ShoppingCart,
} from 'lucide-react';
import { HERO_IMAGE, COMPANY_INFO } from '../data/products';
import {
  resolveHeroSlides,
  HeroSlideAction,
  HeroSlideFit,
  HeroAspectRatio,
  DEFAULT_WELCOME_MASCOT_IMAGE,
} from '../data/heroSlides';
import type { SiteDecorSettings } from '../lib/firebase';
import type { CustomerAccount } from '../data/vouchers';

const ASPECT_CLASS_MAP: Record<HeroAspectRatio, string> = {
  '16/7': 'aspect-[16/7]',
  '2/1': 'aspect-[2/1]',
  '16/9': 'aspect-[16/9]',
};

const ASPECT_NUMERIC_MAP: Record<HeroAspectRatio, number> = {
  '16/7': 16 / 7,
  '2/1': 2,
  '16/9': 16 / 9,
};

interface HeroSlideImageProps {
  src: string;
  alt: string;
  fitMode?: HeroSlideFit;
  targetAspect: number;
  eager?: boolean;
}

const HeroSlideImage: React.FC<HeroSlideImageProps> = ({
  src,
  alt,
  fitMode = 'smart',
  targetAspect,
  eager = false,
}) => {
  const [naturalAspect, setNaturalAspect] = useState<number | null>(null);

  const shouldUseContain =
    fitMode === 'contain' ||
    (fitMode === 'smart' &&
      naturalAspect !== null &&
      naturalAspect < targetAspect * 0.8);

  if (shouldUseContain) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-slate-900 flex items-center justify-center">
        {/* Ambient blurred backdrop matching the uploaded poster edges */}
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-65 pointer-events-none select-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/15 pointer-events-none" />
        <img
          src={src}
          alt={alt}
          onLoad={(e) => {
            const { naturalWidth, naturalHeight } = e.currentTarget;
            if (naturalWidth > 0 && naturalHeight > 0) {
              setNaturalAspect(naturalWidth / naturalHeight);
            }
          }}
          className="relative z-10 w-full h-full object-contain"
          referrerPolicy="no-referrer"
          loading={eager ? 'eager' : 'lazy'}
        />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onLoad={(e) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        if (naturalWidth > 0 && naturalHeight > 0) {
          setNaturalAspect(naturalWidth / naturalHeight);
        }
      }}
      className="w-full h-full object-cover"
      referrerPolicy="no-referrer"
      loading={eager ? 'eager' : 'lazy'}
    />
  );
};

interface HeroProps {
  onOpenConsultation: (prefillNote?: string) => void;
  onExploreProducts: () => void;
  onOpenVoucherWallet?: () => void;
  onOpenWelcomeGuide?: () => void;
  onOpenCartDrawer?: () => void;
  onQuickPhoneContinue?: (phone: string, mode?: 'login' | 'register') => void;
  onOpenImageUpdater?: (targetId?: string) => void;
  onOpenSiteTextEditor?: () => void;
  onOpenHeroSlidesModal?: () => void;
  isAdmin?: boolean;
  customerAccount?: CustomerAccount | null;
  voucherTotalLabel?: string;
  customHeroImage?: string;
  customImages?: Record<string, string>;
  customTexts?: Record<string, string>;
  decorSettings?: SiteDecorSettings;
  visibleCategoryIds?: string[];
  onSelectCategoryChip?: (catId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenConsultation,
  onExploreProducts,
  onOpenVoucherWallet,
  onOpenWelcomeGuide,
  onOpenCartDrawer,
  onQuickPhoneContinue,
  onOpenImageUpdater,
  onOpenSiteTextEditor,
  onOpenHeroSlidesModal,
  isAdmin = false,
  customerAccount = null,
  voucherTotalLabel = '350K',
  customHeroImage,
  customImages = {},
  customTexts = {},
  decorSettings,
  visibleCategoryIds,
  onSelectCategoryChip,
}) => {
  const layoutMode = decorSettings?.heroLayoutMode || 'slider';
  const aspectKey: HeroAspectRatio = decorSettings?.heroAspectRatio || '16/7';
  const slideAspectClass = ASPECT_CLASS_MAP[aspectKey] || 'aspect-[16/7]';
  const slideAspectNumber = ASPECT_NUMERIC_MAP[aspectKey] || 16 / 7;

  const showMemberSlide = decorSettings?.showMemberHeroSlide !== false;
  const imageSlides = resolveHeroSlides(decorSettings?.heroSlides, customImages);
  const totalSlidesCount = (showMemberSlide ? 1 : 0) + imageSlides.length;

  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [quickPhone, setQuickPhone] = useState('');
  const [quickPhoneError, setQuickPhoneError] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (activeSlideIdx >= totalSlidesCount) {
      setActiveSlideIdx(0);
    }
  }, [totalSlidesCount, activeSlideIdx]);

  useEffect(() => {
    if (
      layoutMode !== 'slider' ||
      totalSlidesCount <= 1 ||
      isPaused ||
      isPhoneFocused ||
      quickPhone.trim().length > 0
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveSlideIdx((prev) => (prev + 1) % totalSlidesCount);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [layoutMode, totalSlidesCount, isPaused, isPhoneFocused, quickPhone]);

  const partnerBadge = customTexts.partnerBadge || 'Ưu đãi riêng cho đối tác & khách hàng KDT-89';
  const heroTitle =
    customTexts.heroTitle || 'Kho Điện Tử KDT-89 | Phân Phối Thiết Bị Điện Máy & Gia Dụng';
  const rawHeroSubtitle =
    customTexts.heroSubtitle || 'Giá sale tại kho – số lượng giới hạn – dùng được mỗi ngày.';
  const heroSubtitle = rawHeroSubtitle.replace(
    /^Giá rẻ nhất năm\b/i,
    'Giá sale tại kho – số lượng giới hạn'
  );
  const heroContext =
    customTexts.heroContext ||
    'Hàng sẵn tại kho 89-91 Đường số 1, giao nhanh tận tay, hỗ trợ lắp đặt chu đáo, kiểm tra máy ưng ý mới thanh toán.';
  const hasAirConditioners = visibleCategoryIds
    ? visibleCategoryIds.includes('air_conditioners')
    : false;
  const rawHighlights =
    customTexts.heroHighlights ||
    'Nồi cơm Cuckoo giá kho · Bếp từ đôi & đơn · Smart Tivi 32-55" · Máy tắm nóng';
  const heroHighlights = hasAirConditioners
    ? rawHighlights
    : rawHighlights
        .replace(/\s*·\s*Máy lạnh[^·]*/gi, '')
        .replace(/Máy lạnh[^·]*\s*·\s*/gi, '')
        .trim();

  const scrollToCategory = (catId: string) => {
    if (onSelectCategoryChip) {
      onSelectCategoryChip(catId);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kdt89:expand-catalog', { detail: { catId } }));
    }
    setTimeout(() => {
      const el = document.getElementById(`cat-${catId}`) || document.getElementById('products');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 80);
  };

  const quickCategoryChips = [
    { id: 'rice_cooker_appliances', label: 'Nồi cơm & Gia dụng', emoji: '🍚' },
    { id: 'cooling_fans', label: 'Quạt hơi nước', emoji: '💨' },
    { id: 'televisions', label: 'Smart Tivi', emoji: '📺' },
    { id: 'air_conditioners', label: 'Máy lạnh', emoji: '❄️' },
    { id: 'water_heaters', label: 'Nước nóng', emoji: '🚿' },
    { id: 'kitchen_stoves', label: 'Bếp điện từ', emoji: '🍳' },
  ].filter((chip) => !visibleCategoryIds || visibleCategoryIds.includes(chip.id));

  const handleSlideClick = (action: HeroSlideAction) => {
    switch (action) {
      case 'products':
        onExploreProducts();
        break;
      case 'voucher':
        if (onOpenVoucherWallet) onOpenVoucherWallet();
        else onExploreProducts();
        break;
      case 'welcome':
        if (onOpenWelcomeGuide) onOpenWelcomeGuide();
        else if (onOpenVoucherWallet) onOpenVoucherWallet();
        else onExploreProducts();
        break;
      case 'consult':
        onOpenConsultation('Nhờ sale KDT-89 tư vấn báo giá tại kho');
        break;
      case 'none':
      default:
        break;
    }
  };

  const handleQuickPhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = quickPhone.replace(/[^0-9]/g, '');
    if (cleaned.length < 9 || cleaned.length > 11 || !cleaned.startsWith('0')) {
      setQuickPhoneError('Vui lòng nhập SĐT hợp lệ (vd: 0912345678).');
      return;
    }
    setQuickPhoneError(null);
    if (onQuickPhoneContinue) {
      onQuickPhoneContinue(cleaned, 'login');
    } else if (onOpenWelcomeGuide) {
      onOpenWelcomeGuide();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || totalSlidesCount <= 1) {
      setIsPaused(false);
      return;
    }
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setActiveSlideIdx((prev) => (prev + 1) % totalSlidesCount);
      } else {
        setActiveSlideIdx((prev) => (prev - 1 + totalSlidesCount) % totalSlidesCount);
      }
    }
    touchStartX.current = null;
    setIsPaused(false);
  };

  const mascotSrc = customImages['site-welcome-mascot'] || DEFAULT_WELCOME_MASCOT_IMAGE;

  /* ============================================================================
     MODE 1 (DEFAULT): ĐMX-STYLE HERO CAROUSEL (ĐỒNG BỘ TỈ LỆ MOBILE & DESKTOP)
     ============================================================================ */
  if (layoutMode === 'slider') {
    return (
      <section id="hero" className="relative bg-neutral-50 pt-2.5 sm:pt-4 pb-2 sm:pb-3">
        <h1 className="sr-only">{heroTitle}</h1>

        <div className="max-w-6xl mx-auto px-2.5 sm:px-6">
          {/* Slider Frame */}
          <div
            className="relative rounded-2xl overflow-hidden bg-[#F4F7FB] shadow-sm border border-neutral-200/80 group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Horizontal Track */}
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${activeSlideIdx * 100}%)` }}
            >
              {/* SLIDE 1: Mascot & Quick Phone Login / Member Voucher Card (đồng bộ tỉ lệ ngang cả ĐT & PC) */}
              {showMemberSlide && (
                <div
                  className={`w-full shrink-0 ${slideAspectClass} bg-[#F4F7FB] px-2.5 sm:px-6 lg:px-8 py-2 sm:py-4 flex items-center overflow-hidden`}
                >
                  {/* DESKTOP & TABLET (md+): 2-Column Split with Zero-Overlap Layout */}
                  <div className="hidden md:grid md:grid-cols-12 gap-4 lg:gap-6 items-center w-full h-full">
                    {/* Left: Non-overlapping 3-part Grid (Left Bubbles | Center Mascot | Right Bubbles) */}
                    <div className="md:col-span-7 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 lg:gap-3 h-full">
                      {/* Left Column: 2 Benefit Bubbles */}
                      <div className="flex flex-col justify-center gap-3 lg:gap-5">
                        <div className="bg-[#FFE619] text-slate-900 rounded-xl px-2.5 py-2 shadow-sm border border-amber-300/70 -rotate-2">
                          <div className="text-[11px] lg:text-xs font-extrabold leading-tight">
                            Đăng nhập ngay
                          </div>
                          <div className="text-[10px] lg:text-[11px] font-medium text-slate-800 leading-tight mt-0.5">
                            Trải nghiệm mua sắm thuận tiện hơn
                          </div>
                        </div>

                        <div className="bg-[#0074E4] text-white rounded-xl px-2.5 py-2 shadow-sm rotate-1">
                          <div className="text-[11px] lg:text-xs font-extrabold leading-tight">
                            Nhận ưu đãi đúng gu
                          </div>
                          <div className="text-[10px] lg:text-[11px] text-sky-100 leading-tight mt-0.5">
                            Voucher {voucherTotalLabel} dành riêng cho bạn
                          </div>
                        </div>
                      </div>

                      {/* Center: Mascot Artwork (Never covered by bubbles) */}
                      <div className="flex items-center justify-center shrink-0">
                        <img
                          src={mascotSrc}
                          alt="Mascot KDT-89 hướng dẫn đăng nhập nhận ưu đãi"
                          className="h-[155px] lg:h-[225px] xl:h-[260px] w-auto object-contain mix-blend-multiply select-none pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Right Column: 2 Benefit Bubbles */}
                      <div className="flex flex-col justify-center gap-3 lg:gap-5">
                        <div className="bg-[#0074E4] text-white rounded-xl px-2.5 py-2 shadow-sm rotate-2">
                          <div className="text-[11px] lg:text-xs font-extrabold leading-tight">
                            Theo dõi đơn dễ dàng
                          </div>
                          <div className="text-[10px] lg:text-[11px] text-sky-100 leading-tight mt-0.5">
                            Cập nhật trạng thái mọi lúc mọi nơi
                          </div>
                        </div>

                        <div className="bg-[#FFE619] text-slate-900 rounded-xl px-2.5 py-2 shadow-sm border border-amber-300/70 -rotate-1">
                          <div className="text-[11px] lg:text-xs font-extrabold leading-tight">
                            Giỏ hàng riêng nhanh gọn
                          </div>
                          <div className="text-[10px] lg:text-[11px] font-medium text-slate-800 leading-tight mt-0.5">
                            Lưu sản phẩm &amp; giữ giá 24h vài giây
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Clean White Quick Login / Onboarding Card */}
                    <div className="md:col-span-5 flex items-center justify-center">
                      <div className="w-full max-w-[360px] bg-white rounded-2xl shadow-md border border-slate-200/80 p-4 lg:p-6">
                        {customerAccount ? (
                          <div className="text-center space-y-3">
                            <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-black text-base">
                              {customerAccount.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h2 className="text-base lg:text-lg font-extrabold text-slate-900 leading-tight">
                                Xin chào, {customerAccount.fullName.split(' ').pop() || customerAccount.fullName}!
                              </h2>
                              <p className="text-xs text-slate-500 mt-0.5">
                                SĐT <span className="font-mono font-bold text-slate-700">{customerAccount.phoneNumber}</span> · Ví Voucher {voucherTotalLabel} sẵn sàng
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              {onOpenVoucherWallet && (
                                <button
                                  type="button"
                                  onClick={onOpenVoucherWallet}
                                  className="py-2.5 px-3 rounded-xl bg-[#4A90E2] hover:bg-[#357ABD] text-white font-bold text-xs shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Gift className="w-3.5 h-3.5" />
                                  <span>Ví Voucher</span>
                                </button>
                              )}
                              {onOpenCartDrawer && (
                                <button
                                  type="button"
                                  onClick={onOpenCartDrawer}
                                  className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <ShoppingCart className="w-3.5 h-3.5" />
                                  <span>Giỏ hàng</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h2 className="text-lg lg:text-2xl font-bold text-slate-800 text-center">
                              Đăng nhập
                            </h2>
                            <p className="text-[11px] lg:text-xs text-slate-500 text-center mt-0.5 mb-3">
                              Mở Giỏ hàng riêng &amp; nhận bộ Voucher {voucherTotalLabel}
                            </p>

                            <form onSubmit={handleQuickPhoneSubmit} className="space-y-2.5">
                              <div className="relative">
                                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                  type="tel"
                                  value={quickPhone}
                                  onFocus={() => setIsPhoneFocused(true)}
                                  onBlur={() => setIsPhoneFocused(false)}
                                  onChange={(e) => {
                                    setQuickPhone(e.target.value);
                                    if (quickPhoneError) setQuickPhoneError(null);
                                  }}
                                  placeholder="Nhập số điện thoại mua hàng"
                                  className="w-full h-10 lg:h-11 pl-9 pr-3 rounded-xl border border-slate-300 text-xs lg:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                              </div>

                              {quickPhoneError && (
                                <p className="text-[11px] text-rose-600 font-medium leading-tight">
                                  {quickPhoneError}
                                </p>
                              )}

                              <button
                                type="submit"
                                className="w-full h-10 lg:h-11 rounded-xl bg-[#4A90E2] hover:bg-[#357ABD] active:scale-[0.99] text-white font-bold text-xs lg:text-sm tracking-wide uppercase shadow-xs transition-all cursor-pointer"
                              >
                                TIẾP TỤC
                              </button>
                            </form>

                            <div className="mt-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onQuickPhoneContinue) {
                                    onQuickPhoneContinue(quickPhone.replace(/[^0-9]/g, ''), 'register');
                                  } else if (onOpenWelcomeGuide) {
                                    onOpenWelcomeGuide();
                                  }
                                }}
                                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              >
                                Khách mới? Tạo tài khoản nhận {voucherTotalLabel} →
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* MOBILE & SMALL TABLET (< md): Horizontal 2-column layout matching desktop banner aspect */}
                  <div className="grid md:hidden grid-cols-12 gap-2 sm:gap-3 items-center w-full h-full">
                    {/* Left: Mascot + Badge */}
                    <div className="col-span-4 flex flex-col items-center justify-center text-center">
                      <img
                        src={mascotSrc}
                        alt="Mascot KDT-89"
                        className="h-20 sm:h-28 w-auto object-contain mix-blend-multiply"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[10px] sm:text-xs font-extrabold text-blue-700 leading-none">
                        Voucher {voucherTotalLabel}
                      </span>
                    </div>

                    {/* Right: White Quick Phone Login Card */}
                    <div className="col-span-8 bg-white rounded-xl p-2 sm:p-3 shadow-sm border border-slate-200/80">
                      {customerAccount ? (
                        <div className="space-y-1.5">
                          <div className="text-xs font-extrabold text-slate-900 truncate">
                            Chào {customerAccount.fullName.split(' ').pop() || customerAccount.fullName}!
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            Ví Voucher {voucherTotalLabel} · Giỏ hàng riêng
                          </div>
                          <div className="flex items-center gap-1.5">
                            {onOpenVoucherWallet && (
                              <button
                                type="button"
                                onClick={onOpenVoucherWallet}
                                className="flex-1 h-8 rounded-lg bg-[#4A90E2] text-white text-[10px] font-bold cursor-pointer"
                              >
                                Ví Voucher
                              </button>
                            )}
                            {onOpenCartDrawer && (
                              <button
                                type="button"
                                onClick={onOpenCartDrawer}
                                className="flex-1 h-8 rounded-lg bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Giỏ hàng
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-[11px] sm:text-xs font-extrabold text-slate-900 leading-tight truncate">
                            Đăng nhập · Giỏ hàng &amp; {voucherTotalLabel}
                          </div>
                          <form onSubmit={handleQuickPhoneSubmit} className="flex items-center gap-1">
                            <input
                              type="tel"
                              value={quickPhone}
                              onFocus={() => setIsPhoneFocused(true)}
                              onBlur={() => setIsPhoneFocused(false)}
                              onChange={(e) => {
                                setQuickPhone(e.target.value);
                                if (quickPhoneError) setQuickPhoneError(null);
                              }}
                              placeholder="Nhập SĐT..."
                              className="flex-1 min-w-0 h-8 sm:h-9 px-2 rounded-lg border border-slate-300 text-[11px] sm:text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
                            />
                            <button
                              type="submit"
                              className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg bg-[#4A90E2] hover:bg-[#357ABD] text-white text-[10px] sm:text-xs font-bold uppercase shrink-0 cursor-pointer"
                            >
                              Tiếp tục
                            </button>
                          </form>
                          <div className="flex items-center justify-between text-[9.5px] sm:text-[10px]">
                            <span className="text-rose-600 font-medium truncate">
                              {quickPhoneError || ''}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (onQuickPhoneContinue) {
                                  onQuickPhoneContinue(quickPhone.replace(/[^0-9]/g, ''), 'register');
                                } else if (onOpenWelcomeGuide) {
                                  onOpenWelcomeGuide();
                                }
                              }}
                              className="font-bold text-blue-600 hover:underline shrink-0 cursor-pointer"
                            >
                              Tạo TK mới →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PROMO IMAGE SLIDES (EXACT SAME ASPECT RATIO ACROSS ALL SCREEN SIZES + SMART FIT) */}
              {imageSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => handleSlideClick(slide.actionType)}
                  aria-label={slide.title || `Banner khuyến mãi ${index + 1}`}
                  className={`w-full shrink-0 relative ${slideAspectClass} bg-neutral-900 block overflow-hidden ${
                    slide.actionType === 'none' ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <HeroSlideImage
                    src={slide.imageSrc}
                    alt={slide.title || `Banner KDT-89 Slide ${index + 1}`}
                    fitMode={slide.fit || 'smart'}
                    targetAspect={slideAspectNumber}
                    eager={index === 0}
                  />
                </button>
              ))}
            </div>

            {/* Admin Quick Manage Button */}
            {isAdmin && (onOpenHeroSlidesModal || onOpenImageUpdater) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenHeroSlidesModal) {
                    onOpenHeroSlidesModal();
                  } else if (onOpenImageUpdater) {
                    onOpenImageUpdater(imageSlides[0]?.imageKey || 'site-hero-slide-1');
                  }
                }}
                className="absolute top-2.5 right-2.5 z-20 px-2.5 py-1.5 rounded-lg bg-black/70 hover:bg-black/85 backdrop-blur-xs text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md border border-white/25 cursor-pointer"
              >
                <Images className="w-3.5 h-3.5 text-amber-300" />
                <span>Chỉnh Slide ({totalSlidesCount})</span>
              </button>
            )}

            {/* Left / Right Arrows (shown when > 1 slide) */}
            {totalSlidesCount > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSlideIdx((prev) => (prev - 1 + totalSlidesCount) % totalSlidesCount);
                  }}
                  aria-label="Slide trước"
                  className="hidden sm:flex absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 hover:bg-black/60 text-white items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSlideIdx((prev) => (prev + 1) % totalSlidesCount);
                  }}
                  aria-label="Slide tiếp theo"
                  className="hidden sm:flex absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 hover:bg-black/60 text-white items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Slim ĐMX-style Indicator Bars */}
          {totalSlidesCount > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-2">
              {Array.from({ length: totalSlidesCount }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlideIdx(idx)}
                  aria-label={`Chuyển đến slide ${idx + 1}`}
                  className={`h-1 rounded-full transition-all duration-200 cursor-pointer ${
                    idx === activeSlideIdx
                      ? 'w-6 bg-neutral-900'
                      : 'w-2 bg-neutral-300 hover:bg-neutral-400'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Mobile & Tablet Fast-Jump Category Strip (Kiểu ĐMX ngay dưới Slide Ảnh) */}
          {quickCategoryChips.length > 0 && (
            <div className="mt-2.5 lg:hidden">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {quickCategoryChips.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => scrollToCategory(cat.id)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-neutral-200/90 text-neutral-800 text-xs font-semibold whitespace-nowrap shadow-2xs active:scale-95 transition-all shrink-0 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  /* ============================================================================
     MODE 2 (OPTIONAL FALLBACK): CLASSIC TEXT + IMAGE HERO
     ============================================================================ */
  return (
    <section
      id="hero"
      className="relative pt-3 pb-6 sm:pt-6 sm:pb-12 lg:pt-10 lg:pb-16 bg-gradient-to-b from-rose-50/70 via-stone-50/50 to-neutral-50 overflow-hidden"
    >
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-amber-100/30 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="inline-flex max-w-full items-center gap-1.5 sm:gap-2 mb-2.5 sm:mb-4 px-3 py-1 rounded-full bg-white border border-rose-200/70 shadow-xs text-[11px] sm:text-xs text-neutral-700 overflow-hidden">
          <span className="font-bold text-rose-800 whitespace-nowrap shrink-0">
            {COMPANY_INFO.name}
          </span>
          <span className="text-neutral-300 shrink-0">·</span>
          <span className="text-neutral-600 truncate min-w-0">{partnerBadge}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col justify-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 leading-tight text-balance">
              {heroTitle}
            </h1>

            <p className="mt-2.5 sm:mt-4 text-sm sm:text-lg text-neutral-800 font-medium leading-snug sm:leading-relaxed text-pretty">
              {heroSubtitle}
            </p>

            <p className="mt-2 text-xs sm:text-base text-neutral-600 leading-relaxed hidden sm:block">
              {heroContext}
            </p>

            <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-2xl bg-white/95 border border-orange-200 shadow-xs flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
              <span className="font-bold text-orange-700 bg-orange-50 px-2 py-0.5 sm:py-1 rounded-lg shrink-0 text-[11px] sm:text-xs">
                Kho sẵn:
              </span>
              <span className="text-neutral-700 font-medium text-[11px] sm:text-xs leading-tight">
                {heroHighlights}
              </span>
            </div>

            {isAdmin && (
              <div className="mt-3 sm:mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-300 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-amber-950 text-xs">
                    Admin: Tùy chỉnh nhanh nội dung đầu trang
                  </span>
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                  {onOpenSiteTextEditor && (
                    <button
                      type="button"
                      onClick={onOpenSiteTextEditor}
                      className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer"
                    >
                      Sửa chữ & SEO
                    </button>
                  )}
                  {onOpenImageUpdater && (
                    <button
                      type="button"
                      onClick={() => onOpenImageUpdater('site-hero-image')}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
                    >
                      Đổi ảnh bìa
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 sm:mt-6 flex flex-row items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onExploreProducts}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 hover:from-rose-800 hover:to-amber-700 active:scale-[0.98] text-white font-extrabold text-xs sm:text-base shadow-md transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span>Xem kho hàng & Đặt mua</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenConsultation('Nhờ sale KDT-89 tư vấn báo giá thợ')}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-3 rounded-xl bg-white hover:bg-neutral-100 active:scale-[0.98] text-neutral-800 font-bold text-xs sm:text-base border border-neutral-300 shadow-xs transition-all cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Nhờ tư vấn</span>
              </button>
            </div>

            {quickCategoryChips.length > 0 && (
              <div className="mt-3.5 pt-3 border-t border-rose-200/60 lg:hidden">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 -mx-2 px-2">
                  {quickCategoryChips.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => scrollToCategory(cat.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-rose-200 text-neutral-800 text-xs font-bold whitespace-nowrap shadow-xs active:scale-95 transition-all shrink-0 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 sm:mt-8 pt-3 sm:pt-6 border-t border-neutral-200/80 grid grid-cols-3 gap-2 sm:gap-4 text-[11px] sm:text-xs text-neutral-700">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="font-medium">Hàng sẵn kho</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium">Kiểm tra mới trả tiền</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-medium">Bảo hành chính hãng</span>
              </div>
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-neutral-200/90 shadow-lg bg-white group">
              <div className="aspect-[4/3] relative overflow-hidden bg-neutral-100">
                <img
                  src={customHeroImage || HERO_IMAGE}
                  alt="Thiết bị điện máy và gia dụng chính hãng KDT-89"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
                {isAdmin && onOpenImageUpdater && (
                  <button
                    type="button"
                    onClick={() => onOpenImageUpdater('site-hero-image')}
                    className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-xl bg-black/65 hover:bg-black/85 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer border border-white/30 active:scale-95"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-300" />
                    <span>Đổi ảnh bìa</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
