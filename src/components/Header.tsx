import React from 'react';
import { PhoneCall, Heart, Camera, EyeOff } from 'lucide-react';
import { COMPANY_INFO } from '../data/products';
import { KDTLogo } from './KDTLogo';

interface HeaderProps {
  onOpenConsultation: (prefillProduct?: string) => void;
  onOpenImageUpdater?: (targetId?: string) => void;
  onOpenManageVisibility?: () => void;
  hiddenCount?: number;
  isAdmin?: boolean;
  onOpenAdminLogin?: () => void;
  onLogoutAdmin?: () => void;
  customLogo?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenConsultation,
  onOpenImageUpdater,
  onOpenManageVisibility,
  hiddenCount = 0,
  isAdmin = false,
  onOpenAdminLogin,
  onLogoutAdmin,
  customLogo,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark with Official Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <a href="#hero" className="flex items-center gap-2 group">
            <KDTLogo size="md" variant="full" customLogo={customLogo} />
          </a>
          {isAdmin && (
            <div className="flex items-center gap-1">
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500 text-white shadow-2xs">
                👑 Admin
              </span>
              {onOpenImageUpdater && (
                <button
                  type="button"
                  onClick={() => onOpenImageUpdater('site-logo')}
                  className="text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-md border border-amber-300 flex items-center gap-1 cursor-pointer transition-all"
                  title="Quyền Admin: Bấm để đổi logo công ty"
                >
                  <Camera className="w-3 h-3 text-amber-700" />
                  <span>Đổi Logo</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600">
          <a href="#combos" className="hover:text-rose-600 transition-colors whitespace-nowrap shrink-0">
            Combo gợi ý
          </a>
          <a href="#products" className="hover:text-rose-600 transition-colors whitespace-nowrap shrink-0">
            Quà 20/10
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

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          {/* ONLY Admin sees the Quản lý ẩn/hiện & Cập nhật hình button */}
          {isAdmin && (
            <div className="flex items-center gap-1.5">
              {onOpenManageVisibility && (
                <button
                  type="button"
                  onClick={onOpenManageVisibility}
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 text-xs font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 active:scale-95 border border-neutral-300 rounded-xl transition-all cursor-pointer shadow-2xs"
                  title="Quyền Admin: Bấm để quản lý Ẩn / Hiện các sản phẩm"
                >
                  <EyeOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="hidden sm:inline">Ẩn/Hiện</span>
                  {hiddenCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-black">
                      {hiddenCount}
                    </span>
                  )}
                </button>
              )}
              {onOpenImageUpdater && (
                <button
                  type="button"
                  onClick={() => onOpenImageUpdater()}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 active:scale-95 border border-amber-300 rounded-xl transition-all cursor-pointer shadow-2xs"
                  title="Quyền Admin: Bấm để mở bảng cập nhật / đổi hình ảnh cho các sản phẩm"
                >
                  <Camera className="w-4 h-4 text-amber-700 shrink-0 animate-pulse" />
                  <span className="hidden sm:inline">Cập nhật hình</span>
                </button>
              )}
            </div>
          )}

          {/* If not logged in as admin, provide a subtle key/login entry point for admin */}
          {!isAdmin && onOpenAdminLogin && (
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-xs"
              title="Dành riêng cho Quản trị viên KDT-89 đăng nhập"
            >
              <span className="sr-only">Đăng nhập Admin</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </button>
          )}

          {/* Quick Zalo Chat / Call Button: 0397017013 */}
          <a
            href={COMPANY_INFO.zaloLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Bấm để mở Zalo KDT-89: 0397.017.013"
          >
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
            <span>Zalo: 0397.017.013</span>
          </a>

          <button
            onClick={() => onOpenConsultation()}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Heart className="w-4 h-4 fill-white/20" />
            <span className="hidden xs:inline">Nhờ sale tư vấn</span>
            <span className="xs:hidden">Tư vấn</span>
          </button>
        </div>
      </div>
    </header>
  );
};

