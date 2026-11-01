import React, { useState, useEffect } from 'react';
import { Flame, Clock, Sparkles, ArrowRight, Zap, ShoppingBag } from 'lucide-react';
import { SiteDecorSettings } from '../lib/firebase';

interface FlashSaleCountdownProps {
  decorSettings?: SiteDecorSettings;
  onExploreProducts: () => void;
  onOpenOrderModal?: () => void;
  isAdmin?: boolean;
  onOpenDecorationModal?: () => void;
}

export const FlashSaleCountdown: React.FC<FlashSaleCountdownProps> = ({
  decorSettings,
  onExploreProducts,
  onOpenOrderModal,
  isAdmin = false,
  onOpenDecorationModal,
}) => {
  // If explicitly turned off, don't show (unless admin)
  const isEnabled = decorSettings?.showCountdown ?? true;

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const title = decorSettings?.countdownTitle || 'SIÊU FLASH SALE GIỜ VÀNG GIÁ SỈ TẬN KHO';
  const subtitle =
    decorSettings?.countdownSubtitle ||
    'Áp dụng số lượng có hạn cho đối tác & khách hàng KDT-89 – Kiểm tra máy ưng ý mới thanh toán';
  const badge = decorSettings?.countdownBadge || '⚡ GIÁ GỐC CHẠM ĐÁY';
  const soldPercent = Math.min(95, Math.max(10, decorSettings?.countdownSoldPercent ?? 82));
  const buttonText = decorSettings?.countdownButtonText || 'Săn deal ngay';

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      let target: Date;

      if (decorSettings?.countdownMode === 'target_date' && decorSettings.countdownTargetDate) {
        target = new Date(decorSettings.countdownTargetDate);
      } else {
        // Daily reset: end of today (23:59:59)
        target = new Date(now);
        target.setHours(23, 59, 59, 999);
      }

      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        // Reset to next 24h if reached
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [decorSettings?.countdownMode, decorSettings?.countdownTargetDate]);

  if (!isEnabled && !isAdmin) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-red-700 via-rose-700 to-amber-600 text-white shadow-lg border-y border-red-500/50">
      {/* Background Animated Glow Elements */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-yellow-400/20 rounded-full blur-2xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-red-500/30 rounded-full blur-3xl pointer-events-none" />

      {/* Admin Notice if hidden to visitors */}
      {!isEnabled && isAdmin && (
        <div className="bg-neutral-900/90 text-amber-300 text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2 border-b border-amber-500/30">
          <span>⚠️ Thanh Đếm Ngược Flash Sale đang <strong>TẮT</strong> với khách hàng.</span>
          {onOpenDecorationModal && (
            <button
              type="button"
              onClick={onOpenDecorationModal}
              className="px-2.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold ml-2 transition-colors cursor-pointer text-[11px]"
            >
              Mở tùy chỉnh bật lại
            </button>
          )}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          {/* Left Column: Heading, Badge & Urgency Subtitle */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-black uppercase tracking-wider animate-pulse shadow-xs">
                <Flame className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                <span>{badge}</span>
              </span>
              <span className="text-yellow-200 text-xs font-bold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                <span>Số lượng có hạn tại kho</span>
              </span>
            </div>

            <h2 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight leading-snug drop-shadow-sm flex items-center gap-2">
              <span>{title}</span>
            </h2>

            <p className="text-xs sm:text-sm text-rose-100 font-medium leading-relaxed max-w-xl">
              {subtitle}
            </p>

            {/* Sold Progress Urgency Bar */}
            <div className="pt-1 max-w-md">
              <div className="flex items-center justify-between text-[11px] font-bold text-yellow-200 mb-1">
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-yellow-300 fill-yellow-300 inline" />
                  <span>Đã bán: {soldPercent}% suất ưu đãi</span>
                </span>
                <span className="text-white/90">Chỉ còn ít suất tại kho!</span>
              </div>
              <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-red-400 transition-all duration-1000 shadow-sm animate-pulse"
                  style={{ width: `${soldPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Countdown Clocks & Fast CTAs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 shrink-0">
            {/* Countdown Blocks */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {timeLeft.days > 0 && (
                <>
                  <div className="flex flex-col items-center bg-black/45 backdrop-blur-md border border-white/25 rounded-2xl p-2 sm:p-2.5 min-w-[52px] sm:min-w-[62px] shadow-inner text-center">
                    <span className="text-lg sm:text-2xl font-black font-mono tracking-tight text-white leading-none">
                      {String(timeLeft.days).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-yellow-300 mt-1">Ngày</span>
                  </div>
                  <span className="text-lg sm:text-xl font-bold text-yellow-300 leading-none">:</span>
                </>
              )}

              <div className="flex flex-col items-center bg-black/45 backdrop-blur-md border border-white/25 rounded-2xl p-2 sm:p-2.5 min-w-[52px] sm:min-w-[62px] shadow-inner text-center">
                <span className="text-lg sm:text-2xl font-black font-mono tracking-tight text-white leading-none">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-bold uppercase text-yellow-300 mt-1">Giờ</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-yellow-300 leading-none">:</span>

              <div className="flex flex-col items-center bg-black/45 backdrop-blur-md border border-white/25 rounded-2xl p-2 sm:p-2.5 min-w-[52px] sm:min-w-[62px] shadow-inner text-center">
                <span className="text-lg sm:text-2xl font-black font-mono tracking-tight text-white leading-none">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-bold uppercase text-yellow-300 mt-1">Phút</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-yellow-300 leading-none">:</span>

              <div className="flex flex-col items-center bg-black/45 backdrop-blur-md border border-white/25 rounded-2xl p-2 sm:p-2.5 min-w-[52px] sm:min-w-[62px] shadow-inner text-center ring-1 ring-yellow-400/50">
                <span className="text-lg sm:text-2xl font-black font-mono tracking-tight text-yellow-300 leading-none animate-pulse">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-bold uppercase text-yellow-300 mt-1">Giây</span>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onExploreProducts}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-neutral-950 font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                <ShoppingBag className="w-4 h-4 text-neutral-900" />
                <span>{buttonText}</span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-900" />
              </button>

              {isAdmin && onOpenDecorationModal && (
                <button
                  type="button"
                  onClick={onOpenDecorationModal}
                  className="px-2.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer border border-white/30"
                  title="Quyền Admin: Cài đặt đồng hồ đếm ngược Flash sale"
                >
                  <Clock className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
