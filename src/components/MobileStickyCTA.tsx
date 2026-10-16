import React from 'react';
import { Phone, Heart, Camera, EyeOff, ShoppingBag } from 'lucide-react';
import { COMPANY_INFO } from '../data/products';

interface MobileStickyCTAProps {
  onOpenConsultation: () => void;
  onOpenOrderModal?: () => void;
  onOpenImageUpdater?: () => void;
  onOpenManageVisibility?: () => void;
  hiddenCount?: number;
  selectedCount: number;
  isAdmin?: boolean;
}

export const MobileStickyCTA: React.FC<MobileStickyCTAProps> = ({
  onOpenConsultation,
  onOpenOrderModal,
  onOpenImageUpdater,
  onOpenManageVisibility,
  hiddenCount = 0,
  selectedCount,
  isAdmin = false,
}) => {
  return (
    <aside
      aria-label="Thanh thao tác nhanh"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-3 py-2 shadow-lg"
    >
      <div className="flex items-center gap-2 max-w-md mx-auto">
        {/* ONLY visible to admin */}
        {isAdmin && onOpenManageVisibility && (
          <button
            type="button"
            onClick={onOpenManageVisibility}
            className="flex flex-col items-center justify-center min-w-[50px] h-11 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shrink-0 shadow-xs relative"
            title="Quyền Admin: Quản lý Ẩn/Hiện sản phẩm"
          >
            <EyeOff className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-bold mt-0.5">Ẩn/Hiện</span>
            {hiddenCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-amber-500 text-neutral-900 rounded-full text-[9px] font-black">
                {hiddenCount}
              </span>
            )}
          </button>
        )}

        {isAdmin && onOpenImageUpdater && (
          <button
            type="button"
            onClick={onOpenImageUpdater}
            className="flex flex-col items-center justify-center min-w-[50px] h-11 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors shrink-0 shadow-xs"
            title="Quyền Admin: Cập nhật / Đổi hình ảnh sản phẩm"
          >
            <Camera className="w-4 h-4 text-white" />
            <span className="text-[10px] font-bold mt-0.5">Đổi ảnh</span>
          </button>
        )}

        <a
          href={COMPANY_INFO.zaloLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center min-w-[58px] h-11 px-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 transition-colors shrink-0"
          title={`Nhắn Zalo KDT-89: ${COMPANY_INFO.hotline}`}
        >
          <div className="flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
            <span className="text-[11px] font-black tracking-tight text-sky-700">Zalo</span>
          </div>
          <span className="text-[9px] font-bold mt-0.5 text-sky-800 whitespace-nowrap">0397.017.013</span>
        </a>

        {selectedCount > 0 ? (
          <button
            type="button"
            onClick={onOpenOrderModal || onOpenConsultation}
            className="flex-1 h-11 px-3 rounded-xl bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 hover:from-rose-800 hover:to-amber-700 active:scale-[0.98] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span className="truncate">Đặt mua ({selectedCount} món)</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenConsultation}
            className="flex-1 h-11 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Heart className="w-4 h-4 fill-white/20 shrink-0" />
            <span className="truncate">Nhờ sale tư vấn</span>
          </button>
        )}
      </div>
    </aside>
  );
};
