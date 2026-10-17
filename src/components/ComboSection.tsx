import React, { useRef, useState } from 'react';
import { Gift, Check, ArrowRight, ChevronLeft, ChevronRight, Sparkles, Eye, EyeOff, Plus, Trash2, Camera } from 'lucide-react';
import { COMBOS, ComboItem } from '../data/products';

interface ComboSectionProps {
  onSelectCombo: (combo: ComboItem) => void;
  onBuyCombo?: (combo: ComboItem) => void;
  isAdmin?: boolean;
  hiddenComboIds?: string[];
  onToggleHideCombo?: (comboId: string) => void;
  customCombos?: ComboItem[];
  deletedComboIds?: string[];
  onOpenAddCombo?: () => void;
  onDeleteCombo?: (comboId: string) => void;
  customImages?: Record<string, string>;
  onOpenImageUpdater?: (targetId: string) => void;
  customTexts?: Record<string, string>;
}

export const ComboSection: React.FC<ComboSectionProps> = ({
  onSelectCombo,
  onBuyCombo,
  isAdmin = false,
  hiddenComboIds = [],
  onToggleHideCombo,
  customCombos = [],
  deletedComboIds = [],
  onOpenAddCombo,
  onDeleteCombo,
  customImages = {},
  onOpenImageUpdater,
  customTexts = {},
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Combine default combos with custom combos, excluding deleted combos
  const allCombos = [...COMBOS, ...customCombos].filter(
    (c) => !deletedComboIds.includes(c.id)
  );

  // Filter for regular users: hide combos in hiddenComboIds
  const displayedCombos = isAdmin
    ? allCombos
    : allCombos.filter((c) => !hiddenComboIds.includes(c.id));

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const cardWidth = scrollRef.current.clientWidth * 0.85;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(Math.max(index, 0), displayedCombos.length - 1));
    }
  };

  const scrollToCombo = (index: number) => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.clientWidth * 0.85;
      scrollRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth',
      });
      setActiveIndex(index);
    }
  };

  const scrollPrev = () => {
    scrollToCombo(Math.max(0, activeIndex - 1));
  };

  const scrollNext = () => {
    scrollToCombo(Math.min(displayedCombos.length - 1, activeIndex + 1));
  };

  // If regular user and all combos are hidden, do not render section
  if (displayedCombos.length === 0 && !isAdmin) {
    return null;
  }

  const hiddenCount = allCombos.filter((c) => hiddenComboIds.includes(c.id)).length;

  return (
    <section id="combos" className="py-10 sm:py-16 bg-white border-b border-neutral-200 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 mb-2.5">
              <Gift className="w-3.5 h-3.5" />
              <span>Gợi ý chuẩn bị quà nhanh</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-neutral-900 text-balance">
              {customTexts.comboTitle || 'Các combo quà tặng thiết thực được chọn nhiều nhất'}
            </h2>
            <p className="mt-1.5 text-xs sm:text-base text-neutral-600">
              {customTexts.comboSubtitle || 'Đã phối sẵn tinh tế, thiết thực (Nồi cơm, Bếp điện, Smart Tivi) – anh chỉ việc chọn, KDT-89 lo đóng gói kèm thiệp và giao đến nơi.'}
            </p>

            {/* Admin status pill */}
            {isAdmin && (
              <div className="mt-2.5 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                  <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                  <span>
                    Quản lý combo: {hiddenCount > 0 ? `${hiddenCount} combo đang ẩn với khách` : 'Tất cả combo đang hiển thị'}
                  </span>
                </span>
                {hiddenCount > 0 && onToggleHideCombo && (
                  <span className="text-[11px] text-neutral-500 italic">
                    (Bấm nút "Hiện lại" trên combo để mở lại)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Navigation Controls & Mobile indicator */}
          <div className="flex items-center justify-between md:justify-end gap-3 pt-1">
            <span className="md:hidden text-xs text-rose-700 font-semibold flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Vuốt ngang xem các combo ({displayedCombos.length})</span>
            </span>

            {/* Prev/Next arrows for quick thumb tap on mobile & desktop */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={scrollPrev}
                disabled={activeIndex === 0}
                className="w-8 h-8 rounded-full border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-xs cursor-pointer"
                title="Combo trước"
              >
                <ChevronLeft className="w-4 h-4 text-neutral-700" />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                disabled={activeIndex === displayedCombos.length - 1}
                className="w-8 h-8 rounded-full border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-xs cursor-pointer"
                title="Combo tiếp theo"
              >
                <ChevronRight className="w-4 h-4 text-neutral-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex lg:grid lg:grid-cols-4 md:grid md:grid-cols-2 gap-4 sm:gap-6 overflow-x-auto lg:overflow-visible snap-x snap-mandatory no-scrollbar pb-3 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {displayedCombos.map((combo, idx) => {
            const isHidden = hiddenComboIds.includes(combo.id);

            return (
              <div
                key={combo.id}
                className={`w-[84vw] max-w-[340px] md:w-auto shrink-0 snap-center md:shrink group flex flex-col rounded-2xl bg-neutral-50/80 hover:bg-white border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md relative ${
                  isHidden ? 'border-amber-400 bg-amber-50/20 opacity-80' : 'border-neutral-200 hover:border-rose-300'
                }`}
              >
                {/* Admin quick toggle hide button */}
                {isAdmin && onToggleHideCombo && (
                  <div className="absolute top-3 right-3 z-30">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleHideCombo(combo.id);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold shadow-md flex items-center gap-1 transition-all cursor-pointer ${
                        isHidden
                          ? 'bg-amber-500 hover:bg-emerald-600 text-neutral-950 hover:text-white'
                          : 'bg-neutral-900/85 hover:bg-rose-600 text-white'
                      }`}
                      title={isHidden ? 'Combo đang ẩn với khách. Bấm để HIỆN LẠI' : 'Bấm để ẨN combo này với khách'}
                    >
                      {isHidden ? (
                        <>
                          <Eye className="w-3 h-3 text-emerald-300" />
                          <span>Đang ẩn · Bấm Hiện</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3 text-amber-300" />
                          <span>Ẩn combo</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Combo Image with Scrim & Tag */}
                <div className="relative aspect-[4/3] overflow-hidden bg-neutral-200">
                  <img
                    src={customImages[combo.id] || combo.image}
                    alt={combo.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 bg-neutral-900/85 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-xs">
                    {combo.targetAudience}
                  </div>
                  {!isAdmin && (
                    <div className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                      Combo #{idx + 1}
                    </div>
                  )}

                  {/* Admin Quick Change Photo Button for Combo */}
                  {isAdmin && onOpenImageUpdater && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenImageUpdater(combo.id);
                      }}
                      className="absolute bottom-2.5 right-2.5 z-20 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-black/90 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1 shadow-md border border-white/20 transition-all cursor-pointer"
                      title="Quyền Admin: Bấm để đổi ảnh cho combo này"
                    >
                      <Camera className="w-3 h-3 text-amber-300" />
                      <span>Đổi ảnh combo</span>
                    </button>
                  )}
                </div>

                {/* Combo Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {isAdmin && isHidden && (
                      <div className="mb-2 p-1.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold flex items-center gap-1">
                        <EyeOff className="w-3 h-3 text-amber-700" />
                        <span>Đã ẩn combo này khỏi khách hàng</span>
                      </div>
                    )}

                    <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
                      {combo.name}
                    </h3>
                    <p className="text-xs font-semibold text-rose-700 mt-0.5">
                      {combo.subtitle}
                    </p>

                    <p className="mt-2.5 text-xs text-neutral-600 leading-relaxed">
                      {combo.description}
                    </p>

                    {/* Included Items Checklist */}
                    <div className="mt-3.5 pt-3 border-t border-neutral-200/80">
                      <div className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                        Gói quà gồm có:
                      </div>
                      <ul className="space-y-1.5 text-xs text-neutral-700">
                        {combo.itemsIncluded.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Condition note */}
                    <div className="mt-3 p-2.5 rounded-lg bg-white border border-neutral-200/70 text-[11px] text-neutral-600 leading-tight">
                      <span className="font-semibold text-neutral-800">Giao nhận: </span>
                      {combo.deliveryCondition}
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="mt-4 pt-3.5 border-t border-neutral-200 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-neutral-500 uppercase tracking-wide">Giá riêng đối tác:</div>
                        <div className="text-xs sm:text-sm font-bold text-rose-600 font-mono">
                          {combo.priceNote}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (onBuyCombo) {
                            onBuyCombo(combo);
                          } else {
                            onSelectCombo(combo);
                          }
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 hover:from-rose-800 hover:to-amber-700 active:scale-[0.98] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                        title="Đặt mua combo này ngay"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>Mua ngay combo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectCombo(combo)}
                        className="inline-flex items-center justify-center px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
                        title="Nhờ sale tư vấn chi tiết về combo"
                      >
                        <span>Tư vấn</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Carousel Indicator Dots */}
        {displayedCombos.length > 1 && (
          <div className="flex md:hidden items-center justify-center gap-2 mt-3 pt-1">
            {displayedCombos.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToCombo(idx)}
                className={`h-2 rounded-full transition-all ${
                  activeIndex === idx ? 'w-6 bg-rose-600' : 'w-2 bg-neutral-300'
                }`}
                title={`Xem combo ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
