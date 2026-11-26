import React, { useEffect, useMemo, useState } from 'react';
import { Radio, ArrowDown, PhoneCall, Zap } from 'lucide-react';
import { ProductItem } from '../data/products';
import type { SiteDecorSettings } from '../lib/firebase';
import { ProductCard } from './ProductCard';
import {
  type EffectiveCustomPrice,
  getFlashSaleWindowStatus,
  getLivestreamWindowStatus,
} from '../lib/flashSalePricing';
import {
  DEFAULT_FLASH_SALE_THEME,
  DEFAULT_LIVESTREAM_THEME,
  isLightGradient,
  normalizeSectionTheme,
} from '../lib/sectionTheme';
import { SectionThemeBackdrop } from './SectionThemeBackdrop';

interface LivestreamFlashSaleSectionProps {
  variant?: 'livestream' | 'flash_sale';
  deals: ProductItem[];
  selectedProductIds: string[];
  customImages?: Record<string, string>;
  customPrices?: Record<string, EffectiveCustomPrice>;
  customTexts?: Record<string, string>;
  decorSettings?: SiteDecorSettings;
  hiddenProductIds?: string[];
  isAdmin?: boolean;
  onToggleProduct: (product: ProductItem) => void;
  onBuyProduct: (product: ProductItem) => void;
  onConsultProduct: (product: ProductItem) => void;
  onExploreFullCatalog: () => void;
  onOpenConsultation: (note?: string) => void;
  onOpenImageUpdater?: (product: ProductItem) => void;
  onOpenPriceEditor?: (product: ProductItem) => void;
  onEditProduct?: (product: ProductItem) => void;
  onDeleteProduct?: (productId: string) => void;
  onToggleHideProduct?: (productId: string) => void;
}

const formatDuration = (diffMs: number) => {
  const diff = Math.max(0, diffMs);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
};

export const LivestreamFlashSaleSection: React.FC<LivestreamFlashSaleSectionProps> = ({
  variant = 'flash_sale',
  deals,
  selectedProductIds,
  customImages = {},
  customPrices = {},
  customTexts = {},
  decorSettings,
  hiddenProductIds = [],
  isAdmin = false,
  onToggleProduct,
  onBuyProduct,
  onConsultProduct,
  onExploreFullCatalog,
  onOpenConsultation,
  onOpenImageUpdater,
  onOpenPriceEditor,
  onEditProduct,
  onDeleteProduct,
  onToggleHideProduct,
}) => {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const isLiveVariant = variant === 'livestream';

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const flashWindowStatus = useMemo(
    () => getFlashSaleWindowStatus(decorSettings, [], nowMs),
    [decorSettings, nowMs]
  );

  const liveWindowStatus = useMemo(
    () => getLivestreamWindowStatus(decorSettings, nowMs),
    [decorSettings, nowMs]
  );

  const activeTargetMs = useMemo(() => {
    if (isLiveVariant) {
      return liveWindowStatus.targetEndMs;
    }
    if (flashWindowStatus.targetEndMs !== null) {
      return flashWindowStatus.targetEndMs;
    }
    const endOfDay = new Date(nowMs);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay.getTime();
  }, [isLiveVariant, liveWindowStatus.targetEndMs, flashWindowStatus.targetEndMs, nowMs]);

  const timeLeft = useMemo(() => {
    if (activeTargetMs === null) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    if (!isLiveVariant && flashWindowStatus.mode === 'custom_timer' && flashWindowStatus.isExpired) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    return formatDuration(activeTargetMs - nowMs);
  }, [activeTargetMs, nowMs, isLiveVariant, flashWindowStatus]);

  if (deals.length === 0) return null;

  const scrollToCard = (productId: string) => {
    const el = document.getElementById(`${variant}-deal-${productId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (isLiveVariant) {
    const showDealNumbers = decorSettings?.livestreamShowDealNumbers !== false;
    const badgeText =
      decorSettings?.livestreamBadge?.trim() || 'Đang phát Livestream · Chốt giá trực tiếp trên Live';
    const titleText =
      decorSettings?.livestreamTitle?.trim() || 'Khu Giá Trên Live · Săn Ngay Trong Phiên';
    const hintText =
      decorSettings?.livestreamHint?.trim() ||
      'Giá ưu đãi chỉ áp dụng khi đang phát Live · Bấm đúng mã Deal hoặc "Đặt giữ giá 24h"';

    const liveTheme = normalizeSectionTheme(
      decorSettings?.livestreamTheme,
      DEFAULT_LIVESTREAM_THEME
    );
    const liveIsLight = isLightGradient(liveTheme.fromColor, liveTheme.toColor);

    return (
      <section
        id="livestream-deals"
        aria-labelledby="livestream-only-heading"
        className="py-5 sm:py-7 scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl sm:rounded-3xl border-2 border-yellow-300/85 shadow-2xl shadow-red-950/20 overflow-hidden">
            {/* Customizable Gradient + Hoa văn Backdrop */}
            <SectionThemeBackdrop theme={liveTheme} />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 -left-16 w-72 h-72 rounded-full bg-yellow-300/20 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-white/15 blur-3xl"
            />

            {/* Vibrant On-Air Live Header */}
            <div
              className={`relative z-10 px-4 py-5 sm:px-7 sm:py-6 border-b ${
                liveIsLight
                  ? 'border-neutral-900/15 bg-white/25'
                  : 'border-white/25 bg-black/15'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div
                    className={`flex items-center gap-2 text-xs font-bold flex-wrap ${
                      liveIsLight ? 'text-neutral-900' : 'text-white'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-yellow-300 text-red-950 font-black uppercase tracking-wider text-[10px] shadow-xs">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-700" />
                      </span>
                      LIVE
                    </span>
                    <Radio
                      className={`w-4 h-4 shrink-0 ${
                        liveIsLight ? 'text-red-700' : 'text-yellow-300'
                      }`}
                    />
                    <span>{badgeText}</span>
                    <span
                      aria-hidden="true"
                      className={liveIsLight ? 'text-neutral-500' : 'text-white/50'}
                    >
                      ·
                    </span>
                    <span
                      className={`tabular-nums font-extrabold ${
                        liveIsLight ? 'text-red-700' : 'text-yellow-300'
                      }`}
                    >
                      {deals.length} mã trên Live
                    </span>
                  </div>

                  <h2
                    id="livestream-only-heading"
                    className={`text-xl sm:text-3xl font-black tracking-tight text-balance drop-shadow-xs ${
                      liveIsLight ? 'text-neutral-950' : 'text-white'
                    }`}
                  >
                    {titleText}
                  </h2>

                  <p
                    className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${
                      liveIsLight ? 'text-neutral-800' : 'text-white/95'
                    }`}
                  >
                    {hintText}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end xl:items-center gap-3 shrink-0">
                  {activeTargetMs !== null ? (
                    <div className="flex items-center gap-2.5 bg-black/25 backdrop-blur-xs border border-white/30 rounded-xl px-3.5 py-2">
                      <span className="text-[11px] font-semibold text-white whitespace-nowrap">
                        Kết thúc Live sau
                      </span>
                      <div className="flex items-center gap-1 font-mono font-black text-sm sm:text-base tabular-nums">
                        {timeLeft.days > 0 && (
                          <>
                            <span className="bg-white text-red-700 px-2 py-0.5 rounded-md min-w-[34px] text-center shadow-2xs">
                              {timeLeft.days}d
                            </span>
                            <span className="text-yellow-300">:</span>
                          </>
                        )}
                        <span className="bg-white text-red-700 px-2 py-0.5 rounded-md min-w-[34px] text-center shadow-2xs">
                          {String(timeLeft.hours).padStart(2, '0')}
                        </span>
                        <span className="text-yellow-300">:</span>
                        <span className="bg-white text-red-700 px-2 py-0.5 rounded-md min-w-[34px] text-center shadow-2xs">
                          {String(timeLeft.minutes).padStart(2, '0')}
                        </span>
                        <span className="text-yellow-300">:</span>
                        <span className="bg-yellow-300 text-red-950 px-2 py-0.5 rounded-md min-w-[34px] text-center shadow-2xs">
                          {String(timeLeft.seconds).padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-black/25 backdrop-blur-xs border border-white/30 rounded-xl px-3.5 py-2 text-xs font-bold text-yellow-200 whitespace-nowrap">
                      <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
                      <span>Đang mở giá trực tiếp trên Live</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenConsultation('Khách xem Livestream cần chốt nhanh đơn giá trên Live')
                      }
                      className="py-2.5 px-4 rounded-xl bg-yellow-300 hover:bg-yellow-200 text-red-950 text-xs sm:text-sm font-black inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-lg"
                    >
                      <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                      <span>Chốt đơn trên Live</span>
                    </button>
                  </div>
                </div>
              </div>

              {showDealNumbers && deals.length > 1 && (
                <div
                  className={`mt-4 pt-3.5 border-t flex items-center gap-2 overflow-x-auto no-scrollbar ${
                    liveIsLight ? 'border-neutral-900/15' : 'border-white/25'
                  }`}
                >
                  <span
                    className={`text-[11px] font-semibold whitespace-nowrap shrink-0 ${
                      liveIsLight ? 'text-neutral-800' : 'text-white/90'
                    }`}
                  >
                    Nhảy nhanh mã Live:
                  </span>
                  {deals.map((deal, idx) => (
                    <button
                      key={`jump-live-${deal.id}`}
                      type="button"
                      onClick={() => scrollToCard(deal.id)}
                      className="group px-2.5 py-1 rounded-lg bg-black/20 hover:bg-white text-white hover:text-rose-900 border border-white/30 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <span className="font-mono font-bold text-yellow-300 group-hover:text-red-600 tabular-nums">
                        #{String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="max-w-[140px] truncate">{deal.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cards Grid on Customized Live Backdrop */}
            <div className="relative z-10 p-3 sm:p-5 lg:p-6 bg-black/10">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 items-stretch">
                {deals.map((product, idx) => (
                  <div
                    key={`livestream-deal-${product.id}`}
                    id={`livestream-deal-${product.id}`}
                    className="w-full flex flex-col"
                  >
                    <ProductCard
                      product={product}
                      customImage={customImages[product.id]}
                      customPrice={customPrices[product.id]}
                      onSelect={onToggleProduct}
                      onBuyProduct={onBuyProduct}
                      onConsultProduct={onConsultProduct}
                      onOpenImageUpdater={onOpenImageUpdater}
                      onOpenPriceEditor={onOpenPriceEditor}
                      onEditProduct={onEditProduct}
                      onDeleteProduct={onDeleteProduct}
                      isSelected={selectedProductIds.includes(product.id)}
                      isAdmin={isAdmin}
                      isHidden={hiddenProductIds.includes(product.id)}
                      onToggleHide={(p) => onToggleHideProduct?.(p.id)}
                      liveOrderNumber={showDealNumbers ? idx + 1 : undefined}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Flash Sale Showcase Variant (Customizable Gradient + Pattern - independent from Livestream)
  const isFlashExpired =
    flashWindowStatus.mode === 'custom_timer' && flashWindowStatus.isExpired;
  const badgeText =
    customTexts.flagshipBadge?.trim() || 'Ưu đãi giá kho · Tự về giá thường khi hết giờ';
  const titleText =
    customTexts.flagshipTitle?.trim() || 'Flash Sale Giá Sốc Hôm Nay';
  const hintText =
    customTexts.flagshipHint?.trim() ||
    'Săn deal giá tốt trong khung giờ Flash Sale · Bấm "Đặt giữ giá 24h" để chốt suất';

  const flashTheme = normalizeSectionTheme(
    decorSettings?.flashSaleTheme,
    DEFAULT_FLASH_SALE_THEME
  );
  const flashIsLight = isLightGradient(flashTheme.fromColor, flashTheme.toColor);

  return (
    <section
      id="top-deals"
      aria-labelledby="flash-sale-showcase-heading"
      className="py-5 sm:py-7 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl sm:rounded-3xl border border-black/10 shadow-lg shadow-orange-950/15 overflow-hidden">
          {/* Customizable Gradient + Hoa văn Backdrop */}
          <SectionThemeBackdrop theme={flashTheme} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-yellow-300/20 blur-3xl"
          />

          {/* Patterned Flash Sale Header */}
          <div
            className={`relative z-10 px-4 py-5 sm:px-7 sm:py-6 border-b ${
              flashIsLight
                ? 'border-neutral-900/15 bg-white/25'
                : 'border-white/20 bg-black/10'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div
                  className={`flex items-center gap-2 text-xs font-bold flex-wrap ${
                    flashIsLight ? 'text-neutral-900' : 'text-white'
                  }`}
                >
                  <Zap
                    className={`w-4 h-4 shrink-0 ${
                      flashIsLight
                        ? 'text-orange-600 fill-amber-400'
                        : 'text-yellow-300 fill-yellow-300'
                    }`}
                  />
                  <span>{badgeText}</span>
                  <span
                    aria-hidden="true"
                    className={flashIsLight ? 'text-neutral-400' : 'text-white/50'}
                  >
                    ·
                  </span>
                  <span
                    className={`tabular-nums ${
                      flashIsLight ? 'text-orange-700' : 'text-yellow-200'
                    }`}
                  >
                    {deals.length} deal nổi bật
                  </span>
                </div>

                <h2
                  id="flash-sale-showcase-heading"
                  className={`text-xl sm:text-3xl font-black tracking-tight text-balance drop-shadow-2xs ${
                    flashIsLight ? 'text-neutral-950' : 'text-white'
                  }`}
                >
                  {titleText}
                </h2>

                <p
                  className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${
                    flashIsLight ? 'text-neutral-800' : 'text-white/95'
                  }`}
                >
                  {hintText}
                </p>
              </div>

              {/* Right: Flash Sale Countdown + Single-line Actions */}
              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end xl:items-center gap-3 shrink-0">
                <div className="flex items-center gap-2.5 bg-black/20 backdrop-blur-xs border border-white/25 rounded-xl px-3.5 py-2">
                  <span className="text-[11px] font-semibold text-white whitespace-nowrap">
                    {isFlashExpired
                      ? 'Đã hết giờ Flash Sale · Đang hiện giá thường'
                      : 'Kết thúc Flash Sale'}
                  </span>
                  {!isFlashExpired && (
                    <div className="flex items-center gap-1 font-mono font-black text-sm sm:text-base tabular-nums">
                      {timeLeft.days > 0 && (
                        <>
                          <span className="bg-white text-orange-700 px-2 py-0.5 rounded-md min-w-[34px] text-center shadow-2xs">
                            {timeLeft.days}d
                          </span>
                          <span className="text-yellow-200">:</span>
                        </>
                      )}
                      <span className="bg-white text-orange-700 px-2 py-0.5 rounded-md min-w-[34px] text-center shadow-2xs">
                        {String(timeLeft.hours).padStart(2, '0')}
                      </span>
                      <span className="text-yellow-200">:</span>
                      <span className="bg-white text-orange-700 px-2 py-0.5 rounded-md min-w-[34px] text-center shadow-2xs">
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-yellow-200">:</span>
                      <span className="bg-red-600 text-white px-2 py-0.5 rounded-md min-w-[34px] text-center shadow-2xs">
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onOpenConsultation('Khách cần tư vấn chốt nhanh deal Flash Sale')}
                    className="py-2.5 px-4 rounded-xl bg-white hover:bg-orange-50 text-orange-700 text-xs sm:text-sm font-extrabold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
                  >
                    <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                    <span>Nhờ sale chốt đơn</span>
                  </button>

                  <button
                    type="button"
                    onClick={onExploreFullCatalog}
                    className="py-2.5 px-4 rounded-xl bg-black/25 hover:bg-black/35 border border-white/30 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span>Xem toàn bộ kho</span>
                    <ArrowDown className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Crisp Cards Grid letting the Patterned Backdrop show through */}
          <div className="relative z-10 p-3 sm:p-5 lg:p-6 bg-black/10">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 items-stretch">
              {deals.map((product) => (
                <div
                  key={`flash-deal-${product.id}`}
                  id={`flash_sale-deal-${product.id}`}
                  className="w-full flex flex-col"
                >
                  <ProductCard
                    product={product}
                    customImage={customImages[product.id]}
                    customPrice={customPrices[product.id]}
                    onSelect={onToggleProduct}
                    onBuyProduct={onBuyProduct}
                    onConsultProduct={onConsultProduct}
                    onOpenImageUpdater={onOpenImageUpdater}
                    onOpenPriceEditor={onOpenPriceEditor}
                    onEditProduct={onEditProduct}
                    onDeleteProduct={onDeleteProduct}
                    isSelected={selectedProductIds.includes(product.id)}
                    isAdmin={isAdmin}
                    isHidden={hiddenProductIds.includes(product.id)}
                    onToggleHide={(p) => onToggleHideProduct?.(p.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
