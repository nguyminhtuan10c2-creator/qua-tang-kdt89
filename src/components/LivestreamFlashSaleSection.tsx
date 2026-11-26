import React, { useEffect, useMemo, useState } from 'react';
import { Radio, ArrowDown, PhoneCall, Zap } from 'lucide-react';
import { ProductItem } from '../data/products';
import type { SiteDecorSettings } from '../lib/firebase';
import { ProductCard } from './ProductCard';
import {
  type EffectiveCustomPrice,
  getFlashSaleWindowStatus,
} from '../lib/flashSalePricing';

interface LivestreamFlashSaleSectionProps {
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

export const LivestreamFlashSaleSection: React.FC<LivestreamFlashSaleSectionProps> = ({
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

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const windowStatus = useMemo(
    () => getFlashSaleWindowStatus(decorSettings, [], nowMs),
    [decorSettings, nowMs]
  );

  const isCustomTimerExpired =
    windowStatus.mode === 'custom_timer' && windowStatus.isExpired;

  const targetMs = useMemo(() => {
    if (windowStatus.targetEndMs !== null) {
      return windowStatus.targetEndMs;
    }
    const endOfDay = new Date(nowMs);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay.getTime();
  }, [windowStatus.targetEndMs, nowMs]);

  const timeLeft = useMemo(() => {
    if (isCustomTimerExpired) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    const diff = Math.max(0, targetMs - nowMs);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days, hours, minutes, seconds };
  }, [targetMs, nowMs, isCustomTimerExpired]);

  if (deals.length === 0) return null;

  const showDealNumbers = decorSettings?.livestreamShowDealNumbers !== false;
  const isLivestreamActive = decorSettings?.livestreamMode !== false;

  const badgeText =
    customTexts.flagshipBadge ||
    (isLivestreamActive
      ? 'Đang phát Livestream · Chốt giá tại kho'
      : 'Ưu tiên chốt nhanh hôm nay');
  const titleText =
    customTexts.flagshipTitle ||
    (isLivestreamActive
      ? 'Flash Sale Phiên Live Hôm Nay'
      : 'Deal Chủ Lực Giá Sale Tại Kho');
  const hintText =
    customTexts.flagshipHint ||
    'Chọn đúng mã số Deal trên Live · Bấm "Đặt giữ giá 24h" để giữ suất ngay';

  const scrollToCard = (productId: string) => {
    const el = document.getElementById(`live-deal-${productId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <section
      id="top-deals"
      aria-labelledby="livestream-flash-sale-heading"
      className="py-5 sm:py-7 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="rounded-2xl sm:rounded-3xl bg-neutral-950 border border-rose-500/30 shadow-xl overflow-hidden">
          {/* Top Stage Header */}
          <div className="px-4 py-5 sm:px-7 sm:py-6 border-b border-white/10 bg-gradient-to-br from-rose-950/90 via-neutral-950 to-neutral-950">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-300 flex-wrap">
                  {isLivestreamActive ? (
                    <Radio className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span>{badgeText}</span>
                  <span aria-hidden="true" className="text-neutral-500">
                    ·
                  </span>
                  <span className="text-amber-300 tabular-nums">
                    {deals.length} mã đang lên sóng
                  </span>
                </div>

                <h2
                  id="livestream-flash-sale-heading"
                  className="text-xl sm:text-3xl font-black text-white tracking-tight text-balance"
                >
                  {titleText}
                </h2>

                <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
                  {hintText}
                </p>
              </div>

              {/* Right: Live Countdown + Single-line Actions */}
              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end xl:items-center gap-3 shrink-0">
                <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2">
                  <span className="text-[11px] font-semibold text-neutral-300 whitespace-nowrap">
                    {isCustomTimerExpired ? 'Đã hết giờ Live · Đang hiện giá thường' : 'Kết thúc sau'}
                  </span>
                  {!isCustomTimerExpired && (
                    <div className="flex items-center gap-1 font-mono font-black text-sm sm:text-base tabular-nums">
                      {timeLeft.days > 0 && (
                        <>
                          <span className="bg-white text-neutral-950 px-2 py-0.5 rounded-md min-w-[34px] text-center">
                            {timeLeft.days}d
                          </span>
                          <span className="text-rose-400">:</span>
                        </>
                      )}
                      <span className="bg-white text-neutral-950 px-2 py-0.5 rounded-md min-w-[34px] text-center">
                        {String(timeLeft.hours).padStart(2, '0')}
                      </span>
                      <span className="text-rose-400">:</span>
                      <span className="bg-white text-neutral-950 px-2 py-0.5 rounded-md min-w-[34px] text-center">
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-rose-400">:</span>
                      <span className="bg-rose-600 text-white px-2 py-0.5 rounded-md min-w-[34px] text-center">
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenConsultation(
                        'Khách xem Livestream cần chốt nhanh đơn Flash Sale'
                      )
                    }
                    className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                    <span>Nhờ sale chốt đơn</span>
                  </button>

                  <button
                    type="button"
                    onClick={onExploreFullCatalog}
                    className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span>Xem toàn bộ kho</span>
                    <ArrowDown className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Live Deal Index Bar (#01, #02, #03...) */}
            {showDealNumbers && deals.length > 1 && (
              <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-semibold text-neutral-400 whitespace-nowrap shrink-0">
                  Nhảy nhanh mã Live:
                </span>
                {deals.map((deal, idx) => (
                  <button
                    key={`jump-${deal.id}`}
                    type="button"
                    onClick={() => scrollToCard(deal.id)}
                    className="px-2.5 py-1 rounded-lg bg-white/8 hover:bg-rose-600 text-neutral-100 hover:text-white border border-white/10 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span className="font-mono font-bold text-amber-300 tabular-nums">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="max-w-[140px] truncate">{deal.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Crisp White Product Cards inside the Dark Stage */}
          <div className="p-3 sm:p-5 lg:p-6 bg-neutral-900/60">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 items-stretch">
              {deals.map((product, idx) => (
                <div
                  key={`livestream-deal-${product.id}`}
                  id={`live-deal-${product.id}`}
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
};
