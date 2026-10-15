import React from 'react';
import { Phone, Heart, Camera, EyeOff } from 'lucide-react';
import { COMPANY_INFO } from '../data/products';

interface MobileStickyCTAProps {
  onOpenConsultation: () => void;
  onOpenImageUpdater?: () => void;
  onOpenManageVisibility?: () => void;
  hiddenCount?: number;
  selectedCount: number;
  isAdmin?: boolean;
}

export const MobileStickyCTA: React.FC<MobileStickyCTAProps> = ({
  onOpenConsultation,
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
          href="tel:[Điền số điện thoại]"
          className="flex flex-col items-center justify-center min-w-[48px] h-11 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors shrink-0"
          title="Gọi Hotline KDT-89"
        >
          <Phone className="w-4 h-4 text-rose-600" />
          <span className="text-[10px] font-semibold mt-0.5">Hotline</span>
        </a>

        <button
          onClick={onOpenConsultation}
          className="flex-1 h-11 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
        >
          <Heart className="w-4 h-4 fill-white/20 shrink-0" />
          <span className="truncate">
            {selectedCount > 0 ? `Giữ ${selectedCount} món đã chọn` : 'Nhờ sale tư vấn & Giữ hàng'}
          </span>
        </button>
      </div>
    </aside>
  );
};
