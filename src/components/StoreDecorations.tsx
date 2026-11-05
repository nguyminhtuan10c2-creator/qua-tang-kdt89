import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, X, Flame, ShoppingBag, CheckCircle, Percent, ArrowRight } from 'lucide-react';
import { SiteDecorSettings } from '../lib/firebase';

interface StoreDecorationsProps {
  decorSettings?: SiteDecorSettings;
  onExploreProducts: () => void;
  onOpenOrderModal: () => void;
}

const SAMPLE_RECENT_ORDERS = [
  { name: 'Anh Hùng', location: 'Quận 12, TP.HCM', product: 'Smart Tivi Casper 43 inch', time: '2 phút trước' },
  { name: 'Chị Mai Lan', location: 'Bình Tân, TP.HCM', product: 'Nồi cơm điện Cuckoo 1.8L', time: '5 phút trước' },
  { name: 'Anh Thắng (Thợ)', location: 'Tân Phú, TP.HCM', product: 'Bếp điện từ đôi Sunhouse', time: '8 phút trước' },
  { name: 'Anh Tuấn', location: 'Bình Chánh, TP.HCM', product: 'Máy tắm nước nóng Ariston', time: '12 phút trước' },
  { name: 'Anh Minh', location: 'Quận 6, TP.HCM', product: 'Combo Căn bếp gia đình', time: '15 phút trước' },
  { name: 'Chị Ngọc', location: 'Hóc Môn, TP.HCM', product: 'Máy lạnh Casper Inverter 1HP', time: '22 phút trước' },
];

export const StoreDecorations: React.FC<StoreDecorationsProps> = ({
  decorSettings,
  onExploreProducts,
  onOpenOrderModal,
}) => {
  const effectType = decorSettings?.fallingEffect || 'none';
  const showTicker = decorSettings?.showLiveOrderTicker ?? true;
  const showCorner = decorSettings?.showCornerRibbon ?? true;
  const ribbonText = decorSettings?.cornerRibbonText || '🔥 DEAL SỐC HÔM NAY';

  // Live order ticker state
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [isTickerVisible, setIsTickerVisible] = useState(true);
  const [isTickerDismissed, setIsTickerDismissed] = useState(false);

  // Surprise Voucher Modal
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);

  // Cycle recent order notification gently: visible for 5.5s, then pauses for 12.5s
  useEffect(() => {
    if (!showTicker || isTickerDismissed) return;

    let hideTimeout: ReturnType<typeof setTimeout>;

    // Hide after initial 5 seconds
    hideTimeout = setTimeout(() => {
      setIsTickerVisible(false);
    }, 5500);

    const interval = setInterval(() => {
      setCurrentOrderIndex((prev) => (prev + 1) % SAMPLE_RECENT_ORDERS.length);
      setIsTickerVisible(true);

      hideTimeout = setTimeout(() => {
        setIsTickerVisible(false);
      }, 5500);
    }, 18000);

    return () => {
      clearTimeout(hideTimeout);
      clearInterval(interval);
    };
  }, [showTicker, isTickerDismissed]);

  // Particle characters based on effect
  const getParticleIcon = (index: number) => {
    switch (effectType) {
      case 'sakura':
        return ['🌸', '🌺', '💮', '🌸'][index % 4];
      case 'red_envelope':
        return ['🧧', '🪙', '💰', '🧧', '✨'][index % 5];
      case 'snow':
        return ['❄️', '❅', '❆', '✨'][index % 4];
      case 'hearts':
        return ['🌹', '💖', '💐', '💕', '❤️'][index % 5];
      case 'stars':
        return ['✨', '⭐', '🌟', '💫'][index % 4];
      case 'confetti':
      default:
        return ['🎉', '🎊', '✨', '🎈', '⭐'][index % 5];
    }
  };

  const currentOrder = SAMPLE_RECENT_ORDERS[currentOrderIndex];

  return (
    <>
      {/* 1. Falling Particles Layer */}
      {effectType !== 'none' && (
        <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, i) => {
            const leftPos = (i * 5.5 + (i % 3) * 3) % 96;
            const duration = 7 + (i % 5) * 1.8;
            const delay = (i * 0.7) % 6;
            const size = 16 + (i % 4) * 6;
            const opacity = 0.55 + (i % 3) * 0.15;

            return (
              <div
                key={i}
                className="absolute text-center select-none"
                style={{
                  left: `${leftPos}%`,
                  top: '-40px',
                  fontSize: `${size}px`,
                  opacity,
                  animation: `fallingPetal ${duration}s linear infinite`,
                  animationDelay: `${delay}s`,
                }}
              >
                {getParticleIcon(i)}
              </div>
            );
          })}

          <style>{`
            @keyframes fallingPetal {
              0% {
                transform: translateY(0) rotate(0deg) translateX(0);
                opacity: 0;
              }
              10% {
                opacity: 0.8;
              }
              90% {
                opacity: 0.8;
              }
              100% {
                transform: translateY(105vh) rotate(360deg) translateX(40px);
                opacity: 0;
              }
            }
          `}</style>
        </div>
      )}

      {/* 2. Live Social Proof Toast (Bottom Left) - Siêu gọn gàng, tinh tế không che màn hình */}
      {showTicker && !isTickerDismissed && (
        <div
          className={`fixed bottom-16 sm:bottom-5 left-2.5 sm:left-5 z-40 transition-all duration-400 max-w-[270px] sm:max-w-[320px] pointer-events-auto ${
            isTickerVisible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
          }`}
        >
          <div className="bg-white/95 backdrop-blur-md border border-neutral-200/90 hover:border-rose-300 rounded-full sm:rounded-2xl py-1.5 px-2.5 sm:py-2 sm:px-3 shadow-md hover:shadow-lg flex items-center gap-2 sm:gap-2.5 relative group transition-all">
            <button
              type="button"
              onClick={() => setIsTickerDismissed(true)}
              className="absolute -top-1 -right-1 sm:top-1 sm:right-1 w-4 h-4 rounded-full bg-neutral-200/80 hover:bg-neutral-300 text-neutral-600 flex items-center justify-center text-[9px] cursor-pointer transition-colors shadow-2xs opacity-75 group-hover:opacity-100"
              title="Đóng thông báo"
            >
              <X className="w-2.5 h-2.5" />
            </button>

            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-rose-50 border border-rose-200/70 text-rose-600 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>

            <div className="min-w-0 pr-3 sm:pr-4 flex-1">
              <div className="flex items-center gap-1 text-[10px] text-neutral-500 leading-tight">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-bold text-neutral-800 truncate">{currentOrder.name}</span>
                <span className="text-neutral-400 text-[9px] truncate">({currentOrder.location.split(',')[0]})</span>
                <span className="text-[9px] text-neutral-400 shrink-0 ml-auto">• {currentOrder.time}</span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-rose-600 truncate leading-tight mt-0.5">
                Vừa mua {currentOrder.product}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Floating Hot Deal Ribbon / Pulsing Button (Bottom Right) */}
      {showCorner && (
        <div className="fixed top-24 right-3 z-30 hidden sm:block">
          <button
            type="button"
            onClick={() => setIsGiftModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-black text-xs shadow-xl active:scale-95 transition-all cursor-pointer border-2 border-white animate-bounce"
            title="Bấm để nhận ưu đãi & quà tặng độc quyền"
          >
            <Gift className="w-4 h-4 text-yellow-200 animate-pulse" />
            <span>{ribbonText}</span>
          </button>
        </div>
      )}

      {/* 4. Surprise Voucher & Gift Popup Modal */}
      {isGiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-rose-200 overflow-hidden text-center p-6 sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsGiftModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3 ring-8 ring-rose-50">
              <Gift className="w-8 h-8" />
            </div>

            <span className="inline-block px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold uppercase tracking-wider mb-2">
              🎁 ĐẶC QUYỀN KHÁCH HÀNG KDT-89
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Quà Tặng & Ưu Đãi Độc Quyền
            </h3>

            <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Áp dụng trực tiếp cho tất cả đơn hàng đặt hôm nay tại Kho KDT-89:
            </p>

            <div className="mt-4 space-y-2 text-left">
              <div className="p-3 rounded-2xl bg-rose-50/80 border border-rose-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                  <Percent className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <strong className="text-rose-950 block font-bold">Giảm thêm giá sỉ trực tiếp tại kho</strong>
                  <span className="text-neutral-600">Áp dụng giá thợ cho cả khách lẻ mua dịp này</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <strong className="text-amber-950 block font-bold">Miễn phí thiệp chúc mừng & đóng gói</strong>
                  <span className="text-neutral-600">Viết tay lời chúc chu đáo gửi kèm thùng hàng</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <strong className="text-emerald-950 block font-bold">Hỗ trợ giao nhanh & kiểm tra mới trả tiền</strong>
                  <span className="text-neutral-600">Giao tận nơi, hướng dẫn lắp đặt chu đáo</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsGiftModalOpen(false);
                  onOpenOrderModal();
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Đặt Mua Áp Dụng Ưu Đãi Ngay</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsGiftModalOpen(false);
                  onExploreProducts();
                }}
                className="w-full py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs transition-colors cursor-pointer"
              >
                Xem toàn bộ sản phẩm tại kho
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
