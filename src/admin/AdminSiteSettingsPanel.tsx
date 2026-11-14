import React from 'react';
import { Type, Palette, Sliders, Camera, EyeOff, ArrowRight } from 'lucide-react';
import type { SiteDecorSettings } from '../lib/firebase';

interface AdminSiteSettingsPanelProps {
  customTexts: Record<string, string>;
  customSeo: { title?: string; description?: string };
  hiddenSections: string[];
  decorSettings: SiteDecorSettings;
  onOpenSiteTextEditor: () => void;
  onOpenDecorationModal: () => void;
  onOpenSectionVisibility: () => void;
  onOpenBrandingImages: (targetId: string) => void;
}

export const AdminSiteSettingsPanel: React.FC<AdminSiteSettingsPanelProps> = ({
  customTexts,
  customSeo,
  hiddenSections,
  decorSettings,
  onOpenSiteTextEditor,
  onOpenDecorationModal,
  onOpenSectionVisibility,
  onOpenBrandingImages,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Cài đặt nội dung website</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Chỉnh sửa tiêu đề, nội dung chương trình sale, SEO chia sẻ Zalo/Facebook, ẩn/hiện section và ảnh thương hiệu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Type className="w-4 h-4 text-blue-600" />
              <span>Nội dung chữ & SEO Zalo / Facebook</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tùy chỉnh tiêu đề Hero, thanh thông báo, thông tin liên hệ, hotline và thẻ chia sẻ mạng xã hội.
            </p>
            <div className="pt-2 text-xs text-slate-700 space-y-1">
              <div className="truncate">
                <span className="text-slate-400">Tiêu đề SEO:</span>{' '}
                <strong>{customSeo?.title || 'Mặc định'}</strong>
              </div>
              <div className="truncate">
                <span className="text-slate-400">Hotline:</span>{' '}
                <strong>{customTexts?.hotline || 'Mặc định'}</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSiteTextEditor}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Mở trình sửa nội dung & SEO</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Palette className="w-4 h-4 text-rose-600" />
              <span>Chương trình Sale & Đồng hồ đếm ngược</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Chỉnh ngày bắt đầu/kết thúc chiến dịch (11.11, Black Friday...), khung giờ Flash Sale và hiệu ứng trang trí.
            </p>
            <div className="pt-2 text-xs text-slate-700 space-y-1">
              <div>
                <span className="text-slate-400">Chiến dịch đang chọn:</span>{' '}
                <strong>{decorSettings?.megaSaleConfig?.title || 'Mặc định'}</strong>
              </div>
              <div>
                <span className="text-slate-400">Kết thúc lúc:</span>{' '}
                <strong className="font-mono">
                  {decorSettings?.megaSaleConfig?.endDate || '2026-11-13T23:59'}
                </strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenDecorationModal}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Chỉnh chiến dịch & Flash Sale</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Sliders className="w-4 h-4 text-purple-600" />
              <span>Bật / Tắt các khối giao diện trang chủ</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ẩn hoặc hiện từng khối trên trang khách hàng (Hero, Combo, Thiệp quà tặng, Bộ lọc giá, Đăng ký tư vấn...).
            </p>
            <div className="pt-2 text-xs text-slate-700 flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Đang ẩn <strong>{hiddenSections.length}</strong> phần trên trang chủ
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSectionVisibility}
            className="w-full py-2.5 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-900 text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Quản lý ẩn / hiện khối</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Camera className="w-4 h-4 text-amber-600" />
              <span>Logo thương hiệu & Ảnh bìa Hero</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Thay đổi logo ở Header/Footer, ảnh bìa Hero Banner đầu trang hoặc ảnh các gói Combo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onOpenBrandingImages('site-logo')}
              className="py-2.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-900 text-xs font-semibold cursor-pointer"
            >
              Đổi Logo KDT-89
            </button>
            <button
              type="button"
              onClick={() => onOpenBrandingImages('site-hero-image')}
              className="py-2.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-900 text-xs font-semibold cursor-pointer"
            >
              Đổi ảnh bìa Hero
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
