import React from 'react';
import {
  X,
  Eye,
  EyeOff,
  Sparkles,
  Package,
  HeartHandshake,
  LayoutGrid,
  ShieldCheck,
  Clock,
  PhoneCall,
  Building,
  Smartphone,
  RotateCcw,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

export interface SectionConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}

export const LANDING_PAGE_SECTIONS: SectionConfig[] = [
  {
    id: 'hero',
    name: 'Banner mở đầu & Tiêu đề chính (Hero Banner)',
    description: 'Tiêu đề KDT-89, lời chào, hàng sẵn kho & ảnh bìa trên máy tính',
    icon: <Sparkles className="w-4 h-4 text-amber-500" />,
  },
  {
    id: 'flash_sale',
    name: 'Thanh đồng hồ đếm ngược Flash Sale Giờ Vàng',
    description: 'Đồng hồ đếm lùi giờ, thanh % đã bán, nút Săn deal ngay',
    icon: <Clock className="w-4 h-4 text-red-500" />,
    badge: 'Kích cầu',
  },
  {
    id: 'combos',
    name: 'Gói Combo thiết bị gia đình (Combo Quà tặng)',
    description: 'Combo Quà cho mẹ, Căn bếp ấm, Nhà mát (có thể ẩn/hiện từng combo)',
    icon: <Package className="w-4 h-4 text-rose-500" />,
  },
  {
    id: 'gift_card',
    name: 'Bộ chọn quà tặng & Thiệp chúc mừng',
    description: 'Công cụ chọn người nhận (Mẹ, Vợ, Người thân) và viết lời chúc',
    icon: <HeartHandshake className="w-4 h-4 text-pink-500" />,
  },
  {
    id: 'product_catalog',
    name: 'Danh mục & Lưới toàn bộ sản phẩm (Product Catalog)',
    description: 'Danh mục sản phẩm điện tử, máy tắm, máy lạnh, tivi, nồi cơm, nút Mua ngay',
    icon: <LayoutGrid className="w-4 h-4 text-emerald-500" />,
    badge: 'Chủ lực',
  },
  {
    id: 'why_choose',
    name: 'Lý do chọn Kho Điện Tử KDT-89 (Cam kết & Dịch vụ)',
    description: '4 cam kết vàng: Hàng chính hãng, Giá thợ, Giao lắp chu đáo, Bảo hành tận tâm',
    icon: <ShieldCheck className="w-4 h-4 text-blue-500" />,
  },
  {
    id: 'order_steps',
    name: '4 Bước đặt hàng dễ dàng',
    description: 'Quy trình: Chọn sản phẩm -> Báo thông tin -> Kho giao lắp -> Kiểm tra thanh toán',
    icon: <Clock className="w-4 h-4 text-indigo-500" />,
  },
  {
    id: 'registration',
    name: 'Form đăng ký nhận tư vấn tại trang',
    description: 'Khung điền thông tin và nhu cầu tư vấn trực tiếp trên website',
    icon: <PhoneCall className="w-4 h-4 text-teal-500" />,
  },
  {
    id: 'gift_recipient',
    name: 'Mục chọn người nhận quà ("Anh muốn mua quà cho: Vợ / Mẹ / Người thân")',
    description: 'Bật khi chạy dịp lễ tặng quà (20/10, 8/3, Vu Lan...). Tắt khi chạy Black Friday, ngày đôi, xả kho...',
    icon: <HeartHandshake className="w-4 h-4 text-pink-500" />,
    badge: 'Tùy chọn Form',
  },
  {
    id: 'footer',
    name: 'Chân trang (Footer & Thông tin công ty)',
    description: 'Địa chỉ kho 89-91 Đường số 1, hotline, mã số thuế và thông tin liên hệ',
    icon: <Building className="w-4 h-4 text-neutral-600" />,
  },
  {
    id: 'mobile_cta',
    name: 'Thanh nút đặt hàng cố định dưới đáy Mobile (Sticky Bar)',
    description: 'Thanh nút "Mua ngay" và "Nhờ sale tư vấn" nổi ở cạnh dưới màn hình điện thoại',
    icon: <Smartphone className="w-4 h-4 text-orange-500" />,
  },
];

interface SectionVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  hiddenSections: string[];
  onToggleSection: (sectionId: string) => void;
  onShowAllSections: () => void;
}

export const SectionVisibilityModal: React.FC<SectionVisibilityModalProps> = ({
  isOpen,
  onClose,
  hiddenSections = [],
  onToggleSection,
  onShowAllSections,
}) => {
  if (!isOpen) return null;

  const hiddenCount = hiddenSections.length;
  const totalCount = LANDING_PAGE_SECTIONS.length;
  const visibleCount = totalCount - hiddenCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-850 to-rose-950 px-5 sm:px-6 py-4 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>Bật / Tắt các phần trên Landing Page</span>
              </h3>
              <p className="text-xs text-neutral-300">
                Tự do ẩn hoặc hiện bất kỳ khu vực nào theo chiến dịch bán hàng của anh
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-700">Trạng thái:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
              Đang hiện {visibleCount}/{totalCount} phần
            </span>
            {hiddenCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-200 animate-pulse">
                Đang ẩn {hiddenCount} phần với khách
              </span>
            )}
          </div>

          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={onShowAllSections}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 font-bold text-xs shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-600" />
              <span>Hiện tất cả các phần</span>
            </button>
          )}
        </div>

        {/* Section List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          <div className="text-xs text-neutral-500 mb-1">
            Gạt công tắc bên phải để <strong>Bật (Hiện)</strong> hoặc <strong>Tắt (Ẩn)</strong> khu vực trên website. Dữ liệu được lưu trữ và đồng bộ tức thì trên mọi thiết bị.
          </div>

          {LANDING_PAGE_SECTIONS.map((sec) => {
            const isHidden = hiddenSections.includes(sec.id);
            return (
              <div
                key={sec.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 sm:gap-4 ${
                  isHidden
                    ? 'bg-neutral-50 border-neutral-200/90 opacity-75'
                    : 'bg-white border-neutral-200 shadow-2xs hover:border-neutral-300'
                }`}
              >
                {/* Info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isHidden ? 'bg-neutral-200 text-neutral-400' : 'bg-neutral-100'
                  }`}>
                    {sec.icon}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-sm font-bold ${
                        isHidden ? 'text-neutral-500 line-through' : 'text-neutral-900'
                      }`}>
                        {sec.name}
                      </h4>
                      {sec.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          {sec.badge}
                        </span>
                      )}
                      {isHidden ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                          Đã ẩn
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Đang hiện
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                      {sec.description}
                    </p>
                  </div>
                </div>

                {/* Toggle Button */}
                <div className="shrink-0 flex items-center">
                  <button
                    type="button"
                    onClick={() => onToggleSection(sec.id)}
                    className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      !isHidden ? 'bg-emerald-600' : 'bg-neutral-300'
                    }`}
                    title={!isHidden ? 'Bấm để ẩn phần này' : 'Bấm để hiện phần này'}
                  >
                    <span className="sr-only">Bật tắt phần {sec.name}</span>
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[10px] font-bold ${
                        !isHidden ? 'translate-x-6 text-emerald-600' : 'translate-x-0 text-neutral-400'
                      }`}
                    >
                      {!isHidden ? <CheckCircle2 className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-neutral-500">
            * Thay đổi có hiệu lực ngay lập tức với khách hàng truy cập website.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            Đóng bảng điều khiển
          </button>
        </div>
      </div>
    </div>
  );
};
