import React, { useState, useEffect, useRef } from 'react';
import { X, Gift, Sparkles, ChevronLeft } from 'lucide-react';
import { DEFAULT_WELCOME_MASCOT_IMAGE } from '../data/heroSlides';
import {
  CustomerAccount,
  DEFAULT_VOUCHERS,
  VoucherItem,
  formatShortVnd,
  getTotalVoucherAmount,
} from '../data/vouchers';

interface FloatingWelcomeMascotProps {
  onOpenWelcome: () => void;
  onOpenVoucherWallet: () => void;
  customerAccount?: CustomerAccount | null;
  customMascotImage?: string;
  customTexts?: Record<string, string>;
  enabled?: boolean;
  vouchers?: VoucherItem[];
}

export const FloatingWelcomeMascot: React.FC<FloatingWelcomeMascotProps> = ({
  onOpenWelcome,
  onOpenVoucherWallet,
  customerAccount,
  customMascotImage,
  customTexts = {},
  enabled = true,
  vouchers = DEFAULT_VOUCHERS,
}) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [isScrolledPastTop, setIsScrolledPastTop] = useState(false);
  const [isBubbleDismissed, setIsBubbleDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kdt89_mascot_bubble_closed') === '1';
    } catch {
      return false;
    }
  });
  const scrollTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      setIsScrolledPastTop(y > 120);
      setIsScrolling(true);

      if (scrollTimerRef.current) {
        window.clearTimeout(scrollTimerRef.current);
      }
      scrollTimerRef.current = window.setTimeout(() => {
        setIsScrolling(false);
      }, 900);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimerRef.current) {
        window.clearTimeout(scrollTimerRef.current);
      }
    };
  }, []);

  if (!enabled) return null;

  const activeVouchers = vouchers.length > 0 ? vouchers : DEFAULT_VOUCHERS;
  const totalVoucherLabel = formatShortVnd(getTotalVoucherAmount(activeVouchers));

  // Khi đang lướt (scroll) trên mobile -> tụt vào cạnh phải màn hình để không che sản phẩm
  // Khi đã kéo xuống sâu & thu gọn bong bóng -> cũng tụt gọn nhẹ vào mép phải, chạm để mở lại
  const isTucked = isScrolling || (isScrolledPastTop && isBubbleDismissed);
  const showBubble = !isScrolling && !isScrolledPastTop && !isBubbleDismissed;

  const bubbleGreeting =
    customTexts.mascotGreetingTitle || 'Kho KDT-89 chào Anh/Chị!';
  const bubbleSubtitle = customerAccount
    ? `Ví Voucher của ${customerAccount.fullName.split(' ').pop() || 'bạn'} đã sẵn sàng 🎁`
    : customTexts.mascotGreetingSubtitle ||
      `Nhận ngay Voucher ${totalVoucherLabel} & mở Giỏ hàng riêng!`;

  const handleMascotClick = () => {
    if (customerAccount) {
      onOpenVoucherWallet();
    } else {
      onOpenWelcome();
    }
  };

  const handleDismissBubble = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBubbleDismissed(true);
    try {
      localStorage.setItem('kdt89_mascot_bubble_closed', '1');
    } catch {
      // Ignore storage error
    }
  };

  return (
    <div
      className={`fixed right-0 bottom-[66px] md:bottom-6 z-40 flex flex-col items-end pointer-events-none transition-transform duration-300 ease-out ${
        isTucked
          ? 'translate-x-[54%] sm:translate-x-[42%] opacity-90'
          : 'translate-x-0 pr-2 sm:pr-4 opacity-100'
      }`}
    >
      {/* Greeting Speech Bubble (chỉ hiện khi đứng yên ở đầu trang & chưa đóng) */}
      {showBubble && (
        <div
          onClick={handleMascotClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleMascotClick();
          }}
          className="pointer-events-auto relative mb-2 mr-1 max-w-[235px] sm:max-w-[265px] bg-white rounded-2xl rounded-br-sm p-3 shadow-xl border border-rose-200 cursor-pointer hover:border-rose-300 transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <button
            type="button"
            onClick={handleDismissBubble}
            aria-label="Thu gọn lời chào"
            className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-neutral-700 hover:bg-neutral-900 text-white flex items-center justify-center shadow-xs cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>

          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
              <Gift className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-neutral-900 leading-tight">
                {bubbleGreeting}
              </div>
              <div className="text-[11px] text-neutral-600 mt-0.5 leading-snug">
                {bubbleSubtitle}
              </div>
              <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-black text-rose-600 uppercase tracking-tight">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>
                  {customerAccount ? 'Mở Ví Voucher ngay →' : `Bấm nhận ${totalVoucherLabel} ngay →`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mascot Dock / Button */}
      <button
        type="button"
        onClick={handleMascotClick}
        aria-label={
          customerAccount ? 'Mở Ví Voucher KDT-89' : `Đăng ký nhận Voucher ${totalVoucherLabel}`
        }
        title={
          customerAccount
            ? 'Xem Ví Voucher của bạn'
            : `Bấm để đăng ký nhận Voucher ${totalVoucherLabel} & xem hướng dẫn Giỏ hàng riêng`
        }
        className={`pointer-events-auto group relative flex items-center gap-1.5 cursor-pointer transition-all duration-300 active:scale-95 ${
          isTucked
            ? 'bg-white/95 backdrop-blur-xs pl-1.5 pr-4 py-1.5 rounded-l-full shadow-lg border border-r-0 border-rose-200 hover:translate-x-[-40%]'
            : 'p-1 rounded-full bg-white shadow-xl border-2 border-rose-400 hover:border-rose-500'
        }`}
      >
        {isTucked && (
          <ChevronLeft className="w-3.5 h-3.5 text-rose-600 shrink-0 animate-pulse" />
        )}

        {/* Top-left voucher tag when untucked */}
        {!isTucked && !customerAccount && (
          <span className="absolute -top-2 -left-3 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-amber-500 text-white text-[9px] font-black shadow-sm border border-white whitespace-nowrap">
            {totalVoucherLabel}
          </span>
        )}

        {/* Mascot Image (Admin custom upload or default friendly KDT-89 vector mascot) */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-[#F4F7FB] flex items-center justify-center shrink-0 shadow-inner">
          <img
            src={customMascotImage || DEFAULT_WELCOME_MASCOT_IMAGE}
            alt="Mascot KDT-89"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </button>
    </div>
  );
};
