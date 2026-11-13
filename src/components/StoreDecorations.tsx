import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, X, Flame, ShoppingBag, CheckCircle, Percent, ArrowRight } from 'lucide-react';
import { SiteDecorSettings } from '../lib/firebase';

interface StoreDecorationsProps {
  decorSettings?: SiteDecorSettings;
  onExploreProducts: () => void;
  onOpenOrderModal: () => void;
}

export const StoreDecorations: React.FC<StoreDecorationsProps> = ({
  decorSettings,
  onExploreProducts,
  onOpenOrderModal,
}) => {
  const effectType = decorSettings?.fallingEffect || 'none';
  const showCorner = decorSettings?.showCornerRibbon ?? true;
  const ribbonText = decorSettings?.cornerRibbonText || '🔥 DEAL SỐC HÔM NAY';

  // Surprise Voucher Modal
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);

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
