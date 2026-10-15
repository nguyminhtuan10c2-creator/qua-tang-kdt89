import React, { useRef } from 'react';
import { ProductItem } from '../data/products';
import { ProductCard } from './ProductCard';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface CategorySectionProps {
  category: {
    id: string;
    name: string;
    subTitle: string;
    tagline: string;
  };
  products: ProductItem[];
  icon: React.ReactNode;
  selectedProductIds: string[];
  customImages?: Record<string, string>;
  onToggleProduct: (product: ProductItem) => void;
  onConsultProduct?: (product: ProductItem) => void;
  onOpenImageUpdater?: (product: ProductItem) => void;
  isAdmin?: boolean;
  hiddenProductIds?: string[];
  onToggleHideProduct?: (product: ProductItem) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  products,
  icon,
  selectedProductIds,
  customImages = {},
  onToggleProduct,
  onConsultProduct,
  onOpenImageUpdater,
  isAdmin = false,
  hiddenProductIds = [],
  onToggleHideProduct,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  const visibleProducts = products.filter((p) => !hiddenProductIds.includes(p.id));
  const hiddenCount = products.length - visibleProducts.length;

  // If customer view and all products in this category are hidden, do not display empty section
  if (!isAdmin && visibleProducts.length === 0) {
    return null;
  }

  const productsToRender = isAdmin ? products : visibleProducts;

  return (
    <div className="scroll-mt-24">
      {/* Category Header */}
      <div className="mb-3.5 p-3.5 sm:p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg text-neutral-900">
                  {category.name}
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60">
                  {isAdmin ? (
                    hiddenCount > 0 ? (
                      <span>Khách thấy {visibleProducts.length}/{products.length} món ({hiddenCount} đã ẩn)</span>
                    ) : (
                      <span>{products.length} món sẵn kho</span>
                    )
                  ) : (
                    <span>{visibleProducts.length} món sẵn kho</span>
                  )}
                </span>
              </div>
              <p className="text-xs text-rose-700 font-medium">
                {category.subTitle}
              </p>
            </div>
          </div>

          {/* Navigation Controls on Mobile & Desktop */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-1 sm:pt-0">
            {/* Mobile swipe hint */}
            <span className="sm:hidden text-[11px] text-neutral-500 font-medium flex items-center gap-1">
              <span>👉 Vuốt ngang xem tiếp</span>
            </span>

            {/* Quick left/right arrows for thumb navigation */}
            <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
              <button
                type="button"
                onClick={scrollLeft}
                className="w-7 h-7 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 flex items-center justify-center transition-colors shadow-2xs"
                title="Xem sản phẩm trước"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-neutral-600" />
              </button>
              <button
                type="button"
                onClick={scrollRight}
                className="w-7 h-7 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 flex items-center justify-center transition-colors shadow-2xs"
                title="Xem sản phẩm kế tiếp"
              >
                <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Specific note for Category 1 */}
        {category.id === 'rice_cooker_appliances' && (
          <div className="mt-2.5 pt-2 border-t border-neutral-150 flex flex-wrap gap-1.5 text-[11px] text-neutral-500">
            <span className="font-semibold text-neutral-700">Mức ngân sách:</span>
            <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">Dưới 1tr (Cuckoo 1001, Cuckoo 0671, Sunhouse)</span>
            <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">1 – 2tr (Cuckoo 1021, Toshiba, Lò vi sóng)</span>
            <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">2 – 4tr (Nồi chiên Toshiba cao cấp)</span>
          </div>
        )}
      </div>

      {/* Product List: Horizontal Snap Scroll on Mobile (-mx-4 for full edge swipe), Responsive Grid on Desktop */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-3 pt-1 gap-3.5 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5 sm:overflow-visible"
      >
        {productsToRender.map((product) => (
          <div
            key={product.id}
            className="w-[80vw] max-w-[295px] shrink-0 snap-center sm:w-auto sm:shrink sm:snap-align-none flex flex-col"
          >
            <ProductCard
              product={product}
              customImage={customImages[product.id]}
              onSelect={onToggleProduct}
              onConsultProduct={onConsultProduct}
              onOpenImageUpdater={onOpenImageUpdater}
              isSelected={selectedProductIds.includes(product.id)}
              isAdmin={isAdmin}
              isHidden={hiddenProductIds.includes(product.id)}
              onToggleHide={onToggleHideProduct}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
