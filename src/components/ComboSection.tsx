import React, { useRef, useState, useEffect } from 'react';
import { Gift, Check, ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { COMBOS, ComboItem } from '../data/products';

interface ComboSectionProps {
  onSelectCombo: (combo: ComboItem) => void;
}

export const ComboSection: React.FC<ComboSectionProps> = ({ onSelectCombo }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const cardWidth = scrollRef.current.clientWidth * 0.85;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(Math.max(index, 0), COMBOS.length - 1));
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
    scrollToCombo(Math.min(COMBOS.length - 1, activeIndex + 1));
  };

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
              Các combo quà tặng 20/10 thiết thực được anh em chọn nhiều nhất
            </h2>
            <p className="mt-1.5 text-xs sm:text-base text-neutral-600">
              Đã phối sẵn tinh tế, thiết thực (Nồi cơm, Bếp điện, Smart Tivi, Máy lạnh) – anh chỉ việc chọn, KDT-89 lo đóng gói kèm thiệp và giao đến nơi.
            </p>
          </div>

          {/* Mobile Swipe Notice & Navigation Controls */}
          <div className="flex items-center justify-between md:justify-end gap-3 pt-1">
            <span className="md:hidden text-xs text-rose-700 font-semibold flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Vuốt ngang xem các combo ({COMBOS.length})</span>
            </span>

            {/* Prev/Next arrows for quick thumb tap on mobile & desktop */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={scrollPrev}
                disabled={activeIndex === 0}
                className="w-8 h-8 rounded-full border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-xs"
                title="Combo trước"
              >
                <ChevronLeft className="w-4 h-4 text-neutral-700" />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                disabled={activeIndex === COMBOS.length - 1}
                className="w-8 h-8 rounded-full border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-xs"
                title="Combo tiếp theo"
              >
                <ChevronRight className="w-4 h-4 text-neutral-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Container: Smooth Horizontal Scroll on mobile, 4-column responsive grid on lg+ */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex lg:grid lg:grid-cols-4 md:grid md:grid-cols-2 gap-4 sm:gap-6 overflow-x-auto lg:overflow-visible snap-x snap-mandatory no-scrollbar pb-3 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {COMBOS.map((combo, idx) => (
            <div
              key={combo.id}
              className="w-[84vw] max-w-[340px] md:w-auto shrink-0 snap-center md:shrink group flex flex-col rounded-2xl bg-neutral-50/80 hover:bg-white border border-neutral-200 hover:border-rose-300 transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md"
            >
              {/* Combo Image with Scrim & Tag */}
              <div className="relative aspect-[4/3] overflow-hidden bg-neutral-200">
                <img
                  src={combo.image}
                  alt={combo.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 bg-neutral-900/85 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-xs">
                  {combo.targetAudience}
                </div>
                <div className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                  Combo #{idx + 1}
                </div>
              </div>

              {/* Combo Content */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
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
                <div className="mt-4 pt-3.5 border-t border-neutral-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wide">Giá riêng đối tác:</div>
                    <div className="text-xs sm:text-sm font-bold text-rose-600 font-mono">
                      {combo.priceNote}
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectCombo(combo)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
                  >
                    <span>Chọn combo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Carousel Indicator Dots */}
        <div className="flex md:hidden items-center justify-center gap-2 mt-3 pt-1">
          {COMBOS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToCombo(idx)}
              className={`h-2 rounded-full transition-all ${
                activeIndex === idx ? 'w-6 bg-rose-600' : 'w-2 bg-neutral-300'
              }`}
              title={`Xem combo ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
