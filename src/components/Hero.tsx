import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Truck, Clock, HeartHandshake, Camera, ShoppingBag, PhoneCall } from 'lucide-react';
import { HERO_IMAGE, COMPANY_INFO } from '../data/products';

interface HeroProps {
  onOpenConsultation: (prefillNote?: string) => void;
  onExploreProducts: () => void;
  onOpenImageUpdater?: (targetId?: string) => void;
  onOpenSiteTextEditor?: () => void;
  isAdmin?: boolean;
  customHeroImage?: string;
  customTexts?: Record<string, string>;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenConsultation,
  onExploreProducts,
  onOpenImageUpdater,
  onOpenSiteTextEditor,
  isAdmin = false,
  customHeroImage,
  customTexts = {},
}) => {
  const partnerBadge = customTexts.partnerBadge || 'Ưu đãi riêng cho đối tác & khách hàng KDT-89';
  const heroTitle = customTexts.heroTitle || 'Kho Điện Tử KDT-89 | Phân Phối Thiết Bị Điện Máy & Gia Dụng';
  const heroSubtitle = customTexts.heroSubtitle || 'Chọn món quà thiết thực – dùng được mỗi ngày – giá riêng cho anh em thợ và đối tác.';
  const heroContext = customTexts.heroContext || 'Hàng sẵn tại kho 89-91 Đường số 1, giao nhanh tận tay, hỗ trợ lắp đặt chu đáo, kiểm tra máy ưng ý mới thanh toán.';
  const heroHighlights = customTexts.heroHighlights || 'Nồi cơm Cuckoo giá rẻ rẻ · Bếp từ đôi & đơn · Smart Tivi 32-55" · Máy lạnh · Máy nước nóng';

  const scrollToCategory = (catId: string) => {
    const el = document.getElementById(`cat-${catId}`) || document.getElementById('products');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="relative pt-3 pb-6 sm:pt-6 sm:pb-12 lg:pt-10 lg:pb-16 bg-gradient-to-b from-rose-50/70 via-stone-50/50 to-neutral-50 overflow-hidden">
      {/* Subtle decorative warm background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-amber-100/30 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Partner Trust Banner */}
        <div className="inline-flex items-center gap-2 mb-2 sm:mb-4 px-3 py-1 rounded-full bg-white border border-rose-200/70 shadow-xs text-xs text-neutral-700">
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          <span className="font-semibold text-rose-800">{COMPANY_INFO.name}</span>
          <span className="text-neutral-300">|</span>
          <span className="text-neutral-600 truncate">{partnerBadge}</span>
        </div>

        {/* Hero Grid: Split on desktop, focused on mobile WITHOUT the big banner image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
          {/* Left Column: Headings & CTAs */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 leading-tight text-balance">
              {heroTitle}
            </h1>

            <p className="mt-2.5 sm:mt-4 text-sm sm:text-lg text-neutral-800 font-medium leading-snug sm:leading-relaxed text-pretty">
              {heroSubtitle}
            </p>

            {/* Context paragraph highlighting sincerity and care (hidden on very small phones to keep it short & fast) */}
            <p className="mt-2 text-xs sm:text-base text-neutral-600 leading-relaxed hidden sm:block">
              {heroContext}
            </p>

            {/* Quick Special Highlights */}
            <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-2xl bg-white/95 border border-orange-200 shadow-xs flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
              <span className="font-bold text-orange-700 bg-orange-50 px-2 py-0.5 sm:py-1 rounded-lg shrink-0 text-[11px] sm:text-xs">
                🔥 Kho sẵn:
              </span>
              <span className="text-neutral-700 font-medium text-[11px] sm:text-xs leading-tight">
                {heroHighlights}
              </span>
            </div>

            {/* Quick Admin/Manager Banner for updating images & site texts - ONLY shown to Admin */}
            {isAdmin && (
              <div className="mt-3 sm:mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-300 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-amber-950 block text-xs">
                      👑 Admin: Tùy chỉnh nhanh nội dung đầu trang
                    </span>
                    <span className="text-[11px] text-amber-800 hidden sm:inline">
                      Ảnh bìa chỉ hiển thị trên máy tính, đã tối ưu ẩn hoàn toàn trên điện thoại để khách chốt đơn nhanh!
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                  {onOpenSiteTextEditor && (
                    <button
                      type="button"
                      onClick={onOpenSiteTextEditor}
                      className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer"
                    >
                      Sửa chữ & SEO
                    </button>
                  )}
                  {onOpenImageUpdater && (
                    <button
                      type="button"
                      onClick={() => onOpenImageUpdater('site-hero-image')}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
                    >
                      Đổi ảnh bìa PC
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* CTAs Group - High Conversion Buttons */}
            <div className="mt-4 sm:mt-6 flex flex-row items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onExploreProducts}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 hover:from-rose-800 hover:to-amber-700 active:scale-[0.98] text-white font-extrabold text-xs sm:text-base shadow-md transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span>Xem kho hàng & Đặt mua</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenConsultation('Nhờ sale KDT-89 tư vấn báo giá thợ')}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-3 rounded-xl bg-white hover:bg-neutral-100 active:scale-[0.98] text-neutral-800 font-bold text-xs sm:text-base border border-neutral-300 shadow-xs transition-all cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Nhờ tư vấn</span>
              </button>
            </div>

            {/* Mobile Fast-Jump Category Chips: ONLY ON MOBILE (< lg) */}
            <div className="mt-3.5 pt-3 border-t border-rose-200/60 lg:hidden">
              <div className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>⚡ Chọn nhanh danh mục:</span>
                <span className="text-rose-600 font-normal lowercase">chạm để đến ngay</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 -mx-2 px-2">
                {[
                  { id: 'rice_cooker_appliances', label: '🍚 Nồi cơm & Gia dụng' },
                  { id: 'smart_tvs', label: '📺 Smart Tivi' },
                  { id: 'air_conditioners', label: '❄️ Máy lạnh' },
                  { id: 'water_heaters', label: '🚿 Nước nóng' },
                  { id: 'induction_stoves', label: '🍳 Bếp điện từ' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => scrollToCategory(cat.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-rose-200 text-neutral-800 text-xs font-bold whitespace-nowrap shadow-xs active:scale-95 transition-all shrink-0 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Trust points strip */}
            <div className="mt-4 sm:mt-8 pt-3 sm:pt-6 border-t border-neutral-200/80 grid grid-cols-3 gap-2 sm:gap-4 text-[11px] sm:text-xs text-neutral-700">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="font-medium">Hàng sẵn kho</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium">Kiểm tra mới trả tiền</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-medium">Bảo hành chính hãng</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Photo Card - HIDDEN ON MOBILE (hidden lg:block) AS REQUESTED BY USER */}
          <div className="hidden lg:block lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-neutral-200/90 shadow-lg bg-white group">
              <div className="aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] relative overflow-hidden bg-neutral-100">
                <img
                  src={customHeroImage || HERO_IMAGE}
                  alt="Thiết bị điện máy và gia dụng chính hãng KDT-89"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                
                {/* Admin Quick Action Button on Hero Image */}
                {isAdmin && onOpenImageUpdater && (
                  <button
                    type="button"
                    onClick={() => onOpenImageUpdater('site-hero-image')}
                    className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-xl bg-black/65 hover:bg-black/85 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer border border-white/30 active:scale-95"
                    title="Quyền Admin: Bấm để đổi ảnh bìa chính đầu trang (chỉ hiển thị trên máy tính)"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-300" />
                    <span>Đổi ảnh bìa</span>
                  </button>
                )}

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="inline-block px-2.5 py-1 rounded bg-rose-600/90 text-[11px] font-semibold uppercase tracking-wider mb-1">
                    Chính hãng 100%
                  </div>
                  <p className="text-sm font-medium leading-snug drop-shadow-sm">
                    Kho phân phối thiết bị gia dụng và điện máy chính hãng KDT-89
                  </p>
                </div>
              </div>

              {/* Quick Partner Quote Box */}
              <div className="p-4 bg-white">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-neutral-600 leading-relaxed">
                    <strong className="text-neutral-900 block font-semibold mb-0.5">Kho điện máy trực tiếp</strong>
                    Hàng sẵn tại 89-91 Đường số 1, giao lắp tận nơi, hỗ trợ kỹ thuật và giá riêng cho anh em thợ.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
