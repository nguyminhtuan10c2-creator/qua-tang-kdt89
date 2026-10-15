import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Truck, Clock, HeartHandshake, Camera } from 'lucide-react';
import { HERO_IMAGE, COMPANY_INFO } from '../data/products';

interface HeroProps {
  onOpenConsultation: (prefillNote?: string) => void;
  onExploreProducts: () => void;
  onOpenImageUpdater?: () => void;
  isAdmin?: boolean;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenConsultation,
  onExploreProducts,
  onOpenImageUpdater,
  isAdmin = false,
}) => {
  return (
    <section id="hero" className="relative pt-6 pb-12 sm:pt-10 sm:pb-16 bg-gradient-to-b from-rose-50/70 via-stone-50/50 to-neutral-50 overflow-hidden">
      {/* Subtle decorative warm background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-amber-100/30 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Partner Trust Banner */}
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-white border border-rose-200/70 shadow-xs text-xs text-neutral-700">
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          <span className="font-semibold text-rose-800">{COMPANY_INFO.name}</span>
          <span className="text-neutral-300">|</span>
          <span className="text-neutral-600">Ưu đãi riêng cho đối tác & anh em thợ</span>
        </div>

        {/* Hero Grid: Split on desktop, focused on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headings & CTAs */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900 leading-tight text-balance">
              Anh đã chuẩn bị quà 20/10 cho mẹ hoặc vợ chưa?
            </h1>

            <p className="mt-4 text-base sm:text-lg text-neutral-700 font-normal leading-relaxed text-pretty">
              Chọn món quà thiết thực – dùng được mỗi ngày – giá riêng cho anh em thợ và đối tác.
            </p>

            {/* Context paragraph highlighting sincerity and care */}
            <p className="mt-2 text-sm sm:text-base text-neutral-600 leading-relaxed">
              Những ngày công trình bận rộn, KDT-89 mong muốn chia sẻ cùng anh em món quà tinh tế, ấm áp cho người phụ nữ yêu thương trong gia đình. Hàng sẵn tại kho, giao nhanh tận tay, hỗ trợ lắp đặt chu đáo.
            </p>

            {/* Quick Special Highlights */}
            <div className="mt-4 p-3 rounded-2xl bg-white/90 border border-orange-200 shadow-xs flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg">
                🔥 Tiêu điểm thợ chọn:
              </span>
              <span className="text-neutral-700 font-medium">
                Nồi cơm Cuckoo giá rẻ rẻ · Bếp từ & Hồng ngoại · Smart Tivi 32-55" · Máy lạnh · Kho sẵn 89-91 Đường số 1
              </span>
            </div>

            {/* Quick Admin/Manager Banner for updating images - ONLY shown to Admin */}
            {isAdmin && onOpenImageUpdater && (
              <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-300 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-amber-950">
                      👑 Quyền Admin: Cập nhật hình ảnh sản phẩm
                    </div>
                    <div className="text-[11px] text-amber-800">
                      (Chỉ tài khoản admin của anh mới thấy khung này)
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenImageUpdater}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold whitespace-nowrap shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  Cập nhật hình
                </button>
              </div>
            )}

            {/* CTAs Group */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={onExploreProducts}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-semibold text-sm sm:text-base shadow-sm transition-all"
              >
                <span>Xem quà 20/10</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onOpenConsultation('Nhờ sale tư vấn quà 20/10')}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-neutral-100 active:scale-[0.98] text-neutral-800 font-semibold text-sm sm:text-base border border-neutral-300 shadow-xs transition-all"
              >
                <span>Nhờ sale tư vấn</span>
              </button>

              <button
                onClick={() => onOpenConsultation('Giữ hàng 20/10 cho tôi')}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] text-white font-semibold text-sm sm:text-base shadow-sm transition-all"
              >
                <span>Giữ hàng cho tôi</span>
              </button>
            </div>

            {/* Trust points strip */}
            <div className="mt-8 pt-6 border-t border-neutral-200/80 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-neutral-600">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Hàng có sẵn – giao nhanh</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Bảo hành hãng rõ ràng</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <HeartHandshake className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Chọn quà dễ hơn, thiết thực hơn</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Photo Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-neutral-200/90 shadow-lg bg-white">
              <div className="aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] relative overflow-hidden bg-neutral-100">
                <img
                  src={HERO_IMAGE}
                  alt="Món quà thiết thực 20/10 cho căn bếp gia đình"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="inline-block px-2.5 py-1 rounded bg-rose-600/90 text-[11px] font-semibold uppercase tracking-wider mb-1">
                    Ấm áp & Chân thành
                  </div>
                  <p className="text-sm font-medium leading-snug drop-shadow-sm">
                    Gói trọn tình cảm trong từng món gia dụng gia đình thiết thực
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
                    <strong className="text-neutral-900 block font-semibold mb-0.5">Dành riêng cho đối tác thân thiết</strong>
                    Không cần hoa đắt tiền tàn nhanh, một chiếc nồi cơm nấu dẻo hay căn bếp sạch khói là niềm vui mỗi ngày của người phụ nữ.
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
