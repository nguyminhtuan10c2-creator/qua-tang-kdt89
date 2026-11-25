import React from 'react';
import { Type, Palette, Sliders, Camera, EyeOff, ArrowRight, Zap, UserPlus, Ticket, Images, FileSpreadsheet } from 'lucide-react';
import type { SiteDecorSettings } from '../lib/firebase';
import { resolveVouchers, getTotalVoucherAmount } from '../data/vouchers';
import { DEFAULT_HERO_SLIDES } from '../data/heroSlides';

interface AdminSiteSettingsPanelProps {
  customTexts: Record<string, string>;
  customSeo: { title?: string; description?: string };
  hiddenSections: string[];
  decorSettings: SiteDecorSettings;
  onOpenSiteTextEditor: () => void;
  onOpenDecorationModal: () => void;
  onOpenSectionVisibility: () => void;
  onOpenFlashSaleShowcase: () => void;
  onOpenBrandingImages: (targetId: string) => void;
  onToggleWelcomePopup?: () => void;
  onOpenVoucherEditor?: () => void;
  onOpenHeroSlidesModal?: () => void;
  onOpenGoogleSheetsModal?: () => void;
}

export const AdminSiteSettingsPanel: React.FC<AdminSiteSettingsPanelProps> = ({
  customTexts,
  customSeo,
  hiddenSections,
  decorSettings,
  onOpenSiteTextEditor,
  onOpenDecorationModal,
  onOpenSectionVisibility,
  onOpenFlashSaleShowcase,
  onOpenBrandingImages,
  onToggleWelcomePopup,
  onOpenVoucherEditor,
  onOpenHeroSlidesModal,
  onOpenGoogleSheetsModal,
}) => {
  const isWelcomePopupEnabled =
    decorSettings?.showWelcomePopup !== false && !hiddenSections.includes('welcome_popup');
  const activeVouchers = resolveVouchers(decorSettings?.customVouchers);
  const totalVoucherAmount = getTotalVoucherAmount(activeVouchers);
  const heroSlidesCount =
    decorSettings?.heroSlides && decorSettings.heroSlides.length > 0
      ? decorSettings.heroSlides.length
      : DEFAULT_HERO_SLIDES.length;
  const heroModeLabel =
    decorSettings?.heroLayoutMode === 'classic'
      ? 'Chữ + Ảnh truyền thống'
      : 'Slide Ảnh Banner (kiểu ĐMX)';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Cài đặt nội dung website</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Chỉnh sửa tiêu đề, nội dung chương trình sale, SEO chia sẻ Zalo/Facebook, ẩn/hiện section và ảnh thương hiệu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border-2 border-blue-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:col-span-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 flex-wrap">
              <Images className="w-4 h-4 text-blue-600" />
              <span>Slide Ảnh Banner Đầu Trang (kiểu Điện Máy Xanh)</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                {heroModeLabel} · {heroSlidesCount} slide
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Thay thế phần chữ dài đầu trang bằng thanh trượt ảnh banner ngang (lướt ngang trên Mobile &amp; PC). Tải ảnh banner riêng, sắp xếp thứ tự hoặc đổi sang dạng chữ cũ bất cứ lúc nào.
            </p>
          </div>
          {onOpenHeroSlidesModal && (
            <button
              type="button"
              onClick={onOpenHeroSlidesModal}
              className="py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Images className="w-3.5 h-3.5" />
              <span>Đổi ảnh &amp; Quản lý Slide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="bg-white border-2 border-emerald-200 rounded-xl p-5 flex flex-col justify-between gap-4 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 flex-wrap">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>Pop-up Slide Chào Mừng Khách Mới (Hướng dẫn Giỏ hàng &amp; Thu First Data)</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    isWelcomePopupEnabled
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isWelcomePopupEnabled ? 'Đang BẬT' : 'Đang TẮT'}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Khi khách mới vào trang lần đầu, pop-up 2 slide tự động hiện lên hướng dẫn tạo tài khoản nhận bộ Voucher 350.000đ, giới thiệu chức năng Giỏ hàng riêng và lưu SĐT vào tab Khách hàng đăng ký.
              </p>
              <div className="pt-1 text-xs text-slate-700 truncate">
                <span className="text-slate-400">Tiêu đề pop-up:</span>{' '}
                <strong>
                  {customTexts?.welcomePopupTitle ||
                    'Đăng Ký Thành Viên KDT-89 — Nhận Ngay Bộ Voucher 350.000đ'}
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {onToggleWelcomePopup && (
                <button
                  type="button"
                  onClick={onToggleWelcomePopup}
                  className={`py-2.5 px-4 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    isWelcomePopupEnabled
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isWelcomePopupEnabled ? 'Tạm tắt Mascot & Pop-up' : 'Bật lại Mascot & Pop-up'}
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenBrandingImages('site-welcome-mascot')}
                className="py-2.5 px-4 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Đổi ảnh con Mascot</span>
              </button>
              {onOpenVoucherEditor && (
                <button
                  type="button"
                  onClick={onOpenVoucherEditor}
                  className="py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>
                    Chỉnh giá trị Voucher ({totalVoucherAmount.toLocaleString('vi-VN')}đ)
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={onOpenSiteTextEditor}
                className="py-2.5 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Sửa tiêu đề Pop-up</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            <span className="font-semibold text-slate-500">Các mức voucher đang bật:</span>
            {activeVouchers.map((v) => (
              <span
                key={v.code}
                className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 font-mono font-bold"
              >
                {v.code}: -{v.discountAmount.toLocaleString('vi-VN')}đ (từ {v.minOrderAmount.toLocaleString('vi-VN')}đ)
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white border-2 border-rose-200 rounded-xl p-5 flex flex-col justify-between gap-4 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Zap className="w-4 h-4 text-rose-600 fill-rose-600" />
                <span>Tiêu đề &amp; Sản phẩm Khung Deal Chủ Lực / Flash Sale (Banner đỏ cam)</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sửa trực tiếp tiêu đề (&quot;6 Deal Chủ Lực Giá Sale Tại Kho&quot;), dòng chữ nhỏ, ghi chú và chọn/sắp xếp các sản phẩm hiển thị trong khối Flash Sale đầu danh mục.
              </p>
              <div className="pt-1 text-xs text-slate-700 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>
                  <span className="text-slate-400">Tiêu đề hiện tại:</span>{' '}
                  <strong>{customTexts?.flagshipTitle || '6 Deal Chủ Lực Giá Sale Tại Kho'}</strong>
                </span>
                <span>
                  <span className="text-slate-400">Số SP đang chọn:</span>{' '}
                  <strong>
                    {decorSettings?.flagshipProductIds?.length
                      ? `${decorSettings.flagshipProductIds.length} SP tùy chọn`
                      : '6 SP mặc định'}
                  </strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenFlashSaleShowcase}
              className="py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Sửa tiêu đề &amp; chọn SP Flash Sale</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

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
              onClick={() =>
                onOpenHeroSlidesModal
                  ? onOpenHeroSlidesModal()
                  : onOpenBrandingImages('site-hero-slide-1')
              }
              className="py-2.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-900 text-xs font-semibold cursor-pointer"
            >
              Quản lý Slide Banner
            </button>
          </div>
        </div>

        {onOpenGoogleSheetsModal && (
          <div className="bg-white border-2 border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:col-span-2">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 flex-wrap">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Google Sheets Kho &amp; Nhận đơn Livestream tự động</span>
                {decorSettings?.googleSheetWebhookUrl && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    Webhook 24/7 Đang BẬT
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tạo hoặc liên kết bảng tính Google Sheet để đồng bộ đơn hàng &amp; danh sách khách hàng sau livestream, hoặc cài Webhook nhận đơn 24/7 ngay khi khách bấm Giữ giá 24h.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenGoogleSheetsModal}
              className="py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Cài đặt Google Sheets Kho</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
