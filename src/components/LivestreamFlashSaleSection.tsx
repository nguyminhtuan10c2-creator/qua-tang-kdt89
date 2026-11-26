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

    return (
      <section
        id="livestream-deals"
        aria-labelledby="livestream-only-heading"
        className="py-5 sm:py-7 scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-rose-600 via-fuchsia-600 to-violet-700 border border-fuchsia-400/70 shadow-xl shadow-fuchsia-950/20 overflow-hidden">
            {/* Vibrant On-Air Live Header */}
            <div className="px-4 py-5 sm:px-7 sm:py-6 border-b border-white/20 bg-gradient-to-r from-rose-700/70 via-fuchsia-700/60 to-violet-800/70">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-white flex-wrap">
                    <Radio className="w-4 h-4 text-yellow-300 shrink-0 animate-pulse" />
                    <span>{badgeText}</span>
                    <span aria-hidden="true" className="text-white/50">
                      ·
                    </span>
                    <span className="text-yellow-300 tabular-nums">
                      {deals.length} mã trên Live
                    </span>
                  </div>

                  <h2
                    id="livestream-only-heading"
                    className="text-xl sm:text-3xl font-black text-white tracking-tight text-balance drop-shadow-2xs"
                  >
                    {titleText}
                  </h2>

                  <p className="text-xs sm:text-sm text-rose-50/95 max-w-2xl leading-relaxed">
                    {hintText}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end xl:items-center gap-3 shrink-0">
                  {activeTargetMs !== null ? (
                    <div className="flex items-center gap-2.5 bg-black/25 backdrop-blur-xs border border-white/25 rounded-xl px-3.5 py-2">
                      <span className="text-[11px] font-semibold text-rose-50 whitespace-nowrap">
                        Kết thúc Live sau
                      </span>
                      <div className="flex items-center gap-1 font-mono font-black text-sm sm:text-base tabular-nums">
                        {timeLeft.days > 0 && (
                          <>
                            <span className="bg-white text-fuchsia-950 px-2 py-0.5 rounded-md min-w-[34px] text-center shadow-2xs">
                              {timeLeft.days}d
                            </span>
                            <span className="text-yellow-300">:</span>
                          </>
                        )}
                        <span className="bg-white text-fuchsia-950 px-2 py-0.5 rounded-md min-w-[34px] text-center shadow-2xs">
                          {String(timeLeft.hours).padStart(2, '0')}
                        </span>
                        <span className="text-yellow-300">:</span>
                        <span className="bg-white text-fuchsia-950 px-2 py-0.5 rounded-md min-w-[34px] text-center shadow-2xs">
                          {String(timeLeft.minutes).padStart(2, '0')}
                        </span>
                        <span className="text-yellow-300">:</span>
                        <span className="bg-yellow-300 text-rose-950 px-2 py-0.5 rounded-md min-w-[34px] text-center shadow-2xs">
                          {String(timeLeft.seconds).padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-black/25 backdrop-blur-xs border border-white/25 rounded-xl px-3.5 py-2 text-xs font-bold text-yellow-200 whitespace-nowrap">
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
                      className="py-2.5 px-4 rounded-xl bg-yellow-300 hover:bg-yellow-200 text-rose-950 text-xs sm:text-sm font-black inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-md"
                    >
                      <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                      <span>Chốt đơn trên Live</span>
                    </button>
                  </div>
                </div>
              </div>

              {showDealNumbers && deals.length > 1 && (
                <div className="mt-4 pt-3.5 border-t border-white/20 flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <span className="text-[11px] font-semibold text-rose-100 whitespace-nowrap shrink-0">
                    Nhảy nhanh mã Live:
                  </span>
                  {deals.map((deal, idx) => (
                    <button
                      key={`jump-live-${deal.id}`}
                      type="button"
                      onClick={() => scrollToCard(deal.id)}
                      className="group px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white text-white hover:text-fuchsia-950 border border-white/25 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <span className="font-mono font-bold text-yellow-300 group-hover:text-fuchsia-700 tabular-nums">
                        #{String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="max-w-[140px] truncate">{deal.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cards Grid on Vivid Live Backdrop */}
            <div className="p-3 sm:p-5 lg:p-6 bg-gradient-to-b from-fuchsia-700/20 via-purple-800/20 to-indigo-900/25">
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

  // Flash Sale Showcase Variant (Orange Theme - independent from Livestream)
  const isFlashExpired =
    flashWindowStatus.mode === 'custom_timer' && flashWindowStatus.isExpired;
  const badgeText =
    customTexts.flagshipBadge?.trim() || 'Ưu đãi giá kho · Tự về giá thường khi hết giờ';
  const titleText =
    customTexts.flagshipTitle?.trim() || 'Flash Sale Giá Sốc Hôm Nay';
  const hintText =
    customTexts.flagshipHint?.trim() ||
    'Săn deal giá tốt trong khung giờ Flash Sale · Bấm "Đặt giữ giá 24h" để chốt suất';

  return (
    <section
      id="top-deals"
      aria-labelledby="flash-sale-showcase-heading"
      className="py-5 sm:py-7 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 border border-orange-400 shadow-lg shadow-orange-900/15 overflow-hidden">
          {/* Vibrant Orange Flash Sale Header */}
          <div className="px-4 py-5 sm:px-7 sm:py-6 border-b border-white/20 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-50 flex-wrap">
                  <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300 shrink-0" />
                  <span>{badgeText}</span>
                  <span aria-hidden="true" className="text-white/50">
                    ·
                  </span>
                  <span className="text-yellow-200 tabular-nums">
                    {deals.length} deal nổi bật
                  </span>
                </div>

                <h2
                  id="flash-sale-showcase-heading"
                  className="text-xl sm:text-3xl font-black text-white tracking-tight text-balance drop-shadow-2xs"
                >
                  {titleText}
                </h2>

                <p className="text-xs sm:text-sm text-orange-50/95 max-w-2xl leading-relaxed">
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
                    className="py-2.5 px-4 rounded-xl bg-orange-700/60 hover:bg-orange-700/80 border border-white/30 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span>Xem toàn bộ kho</span>
                    <ArrowDown className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Crisp Cards Grid on Orange Background */}
          <div className="p-3 sm:p-5 lg:p-6 bg-gradient-to-b from-orange-500/95 to-orange-600/95">
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
