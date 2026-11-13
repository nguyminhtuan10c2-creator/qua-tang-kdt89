import React from 'react';
import { Heart, Camera, Gift, User } from 'lucide-react';
import { COMPANY_INFO } from '../data/products';
import { KDTLogo } from './KDTLogo';

import { CustomerAccount } from '../data/vouchers';

interface HeaderProps {
  onOpenConsultation: (prefillProduct?: string) => void;
  onOpenImageUpdater?: (targetId?: string) => void;
  onOpenManageVisibility?: () => void;
  hiddenCount?: number;
  isAdmin?: boolean;
  onOpenAdminLogin?: () => void;
  onLogoutAdmin?: () => void;
  customLogo?: string;
  customTexts?: Record<string, string>;
  customerAccount?: CustomerAccount | null;
  onOpenCustomerAuth?: () => void;
  onOpenVoucherWallet?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenConsultation,
  onOpenImageUpdater,
  isAdmin = false,
  onOpenAdminLogin,
  customLogo,
  customTexts = {},
  customerAccount,
  onOpenCustomerAuth,
  onOpenVoucherWallet,
}) => {
  const announcement = customTexts.headerAnnouncement;
  const navProducts = customTexts.navProducts || 'Sản phẩm';
  const consultBtn = customTexts.headerConsultationBtn || 'Nhờ sale tư vấn';
  const hotline = customTexts.hotline || COMPANY_INFO.hotlineDisplay;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-neutral-200">
      {announcement && (
        <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 text-white text-[11px] sm:text-xs leading-snug py-1.5 px-3 sm:px-4 text-center font-bold tracking-wide shadow-xs flex items-center justify-center overflow-hidden">
          <span className="truncate max-w-full">{announcement}</span>
        </div>
      )}
      <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Brand Wordmark with Official Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <a href="#hero" className="flex items-center gap-1.5 sm:gap-2 group shrink-0">
            <KDTLogo size="md" variant="full" customLogo={customLogo} />
          </a>
          {isAdmin && onOpenImageUpdater && (
            <button
              type="button"
              onClick={() => onOpenImageUpdater('site-logo')}
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-lg border border-amber-300 cursor-pointer transition-all whitespace-nowrap shrink-0"
              title="Quyền Admin: Bấm để đổi logo công ty"
            >
              <Camera className="w-3 h-3 text-amber-700 shrink-0" />
              <span className="hidden xl:inline">Đổi Logo</span>
            </button>
          )}
        </div>

        {/* Zone 2: Navigation Links (only visible at lg+ so tablet/small desktop never crowds or wraps) */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-[13px] xl:text-sm font-medium text-neutral-600 min-w-0">
          <a href="#combos" className="hover:text-rose-600 transition-colors whitespace-nowrap shrink-0">
            Combo gợi ý
          </a>
          <a href="#products" className="hover:text-rose-600 transition-colors whitespace-nowrap shrink-0">
            {navProducts}
          </a>
          <a href="#budget" className="hover:text-rose-600 transition-colors whitespace-nowrap shrink-0">
            Theo ngân sách
          </a>
          <a href="#why-kdt" className="hover:text-rose-600 transition-colors whitespace-nowrap shrink-0">
            Lợi thế KDT-89
          </a>
          <a href="#order-steps" className="hover:text-rose-600 transition-colors whitespace-nowrap shrink-0">
            Cách đặt hàng
          </a>
        </nav>

        {/* Zone 3: Primary Actions (Fits cleanly on mobile, tablet, and desktop without wrapping or clipping) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
          {/* Admin key on desktop only */}
          {!isAdmin && onOpenAdminLogin && (
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="hidden sm:inline-flex text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-xs shrink-0"
              title="Dành riêng cho Quản trị viên KDT-89 đăng nhập"
            >
              <span className="sr-only">Đăng nhập Admin</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </button>
          )}

          {/* Quick Zalo Chat / Call Button (Desktop xl+ or md before nav appears) */}
          <a
            href={COMPANY_INFO.zaloLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex lg:hidden xl:inline-flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-all cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
            title={`Bấm để mở Zalo KDT-89: ${hotline}`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shrink-0"></span>
            <span>Zalo: {hotline}</span>
          </a>

          {/* Customer Voucher Button */}
          {onOpenVoucherWallet && (
            <button
              type="button"
              onClick={onOpenVoucherWallet}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/90 rounded-lg sm:rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap shrink-0"
              title="Xem ví voucher giảm giá của bạn"
            >
              <Gift className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-red-600 shrink-0" />
              <span>Voucher</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shrink-0"></span>
            </button>
          )}

          {/* Customer Account / Login Button */}
          {onOpenCustomerAuth && (
            <button
              type="button"
              onClick={onOpenCustomerAuth}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 border whitespace-nowrap shrink-0 ${
                customerAccount
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
              }`}
              title={customerAccount ? `Tài khoản: ${customerAccount.fullName} (${customerAccount.phoneNumber})` : 'Đăng nhập hoặc Tạo tài khoản để nhận voucher'}
            >
              <User className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-neutral-600 shrink-0" />
              <span className="max-w-[68px] sm:max-w-[120px] truncate">
                {customerAccount ? (customerAccount.fullName.split(' ').pop() || customerAccount.fullName) : 'Đăng nhập'}
              </span>
            </button>
          )}

          {/* Desktop Consultation Button (Mobile has MobileStickyCTA) */}
          <button
            onClick={() => onOpenConsultation()}
            className="hidden sm:flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Heart className="w-4 h-4 fill-white/20 shrink-0" />
            <span>{consultBtn}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

