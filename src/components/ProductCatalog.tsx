import React, { useState, useMemo, useRef } from 'react';
import { CATEGORIES, PRODUCTS, ProductItem } from '../data/products';
import { ProductCard } from './ProductCard';
import { CategorySection } from './CategorySection';
import { BudgetFilter } from './BudgetFilter';
import { Search, Sparkles, Flame, Droplets, Wind, UtensilsCrossed, LayoutGrid, Columns, ChevronLeft, ChevronRight, Camera, Tv, Eye, EyeOff, Plus } from 'lucide-react';

interface ProductCatalogProps {
  selectedProductIds: string[];
  allProducts?: ProductItem[];
  customImages?: Record<string, string>;
  customPrices?: Record<string, { programPrice?: string; referencePrice?: string }>;
  onToggleProduct: (product: ProductItem) => void;
  onConsultProduct?: (product: ProductItem) => void;
  onOpenImageUpdater?: (product: ProductItem) => void;
  onOpenPriceEditor?: (product: ProductItem) => void;
  onOpenAddProduct?: (categoryId?: string) => void;
  onEditProduct?: (product: ProductItem) => void;
  onDeleteProduct?: (productId: string) => void;
  onOpenConsultation: () => void;
  isAdmin?: boolean;
  hiddenProductIds?: string[];
  onToggleHideProduct?: (productId: string) => void;
  onOpenManageVisibility?: () => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  selectedProductIds,
  allProducts = PRODUCTS,
  customImages = {},
  customPrices = {},
  onToggleProduct,
  onConsultProduct,
  onOpenImageUpdater,
  onOpenPriceEditor,
  onOpenAddProduct,
  onEditProduct,
  onDeleteProduct,
  onOpenConsultation,
  isAdmin = false,
  hiddenProductIds = [],
  onToggleHideProduct,
  onOpenManageVisibility,
}) => {
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');
  const [selectedBudget, setSelectedBudget] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileLayout, setMobileLayout] = useState<'horizontal' | 'grid'>('horizontal');

  const filteredScrollRef = useRef<HTMLDivElement>(null);

  // Category icons mapping
  const categoryIcons: Record<string, React.ReactNode> = {
    rice_cooker_appliances: <UtensilsCrossed className="w-4 h-4 text-amber-600" />,
    kitchen_stoves: <Flame className="w-4 h-4 text-rose-600" />,
    water_heaters: <Droplets className="w-4 h-4 text-sky-600" />,
    air_conditioners: <Wind className="w-4 h-4 text-teal-600" />,
    televisions: <Tv className="w-4 h-4 text-indigo-600" />,
  };

  // Filter products: For regular customers, completely hide products marked as hidden
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      if (!isAdmin && hiddenProductIds.includes(p.id)) {
        return false;
      }
      const matchCategory =
        activeCategoryTab === 'all' || p.category === activeCategoryTab;
      const matchBudget =
        selectedBudget === 'all' || p.budgetTier === selectedBudget;
      const matchSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.practicalValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.modelCode && p.modelCode.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCategory && matchBudget && matchSearch;
    });
  }, [activeCategoryTab, selectedBudget, searchQuery, isAdmin, hiddenProductIds]);

  const scrollFilteredLeft = () => {
    if (filteredScrollRef.current) {
      filteredScrollRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const scrollFilteredRight = () => {
    if (filteredScrollRef.current) {
      filteredScrollRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  const isDefaultFullView = activeCategoryTab === 'all' && selectedBudget === 'all' && !searchQuery;

  return (
    <section id="products" className="py-10 sm:py-16 bg-neutral-50 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Danh mục sản phẩm có sẵn tại kho</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              Quà 20/10 thiết thực cho mẹ và vợ
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-neutral-600">
              Ưu đãi riêng cho đối tác – Hàng chính hãng 100% – Hỗ trợ giao tận nơi & lắp đặt
            </p>
          </div>

          {/* Action Row: Quick Search, Image Updater & Visibility Manager */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Admin Add New Product Button */}
            {isAdmin && onOpenAddProduct && (
              <button
                type="button"
                onClick={() => onOpenAddProduct()}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all shrink-0 cursor-pointer active:scale-95"
                title="Quyền Admin: Thêm máy lạnh, tivi hoặc sản phẩm mới vào kho"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm sản phẩm</span>
              </button>
            )}

            {/* Admin Visibility Manager button */}
            {isAdmin && onOpenManageVisibility && (
              <button
                type="button"
                onClick={onOpenManageVisibility}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-all shrink-0 cursor-pointer active:scale-95"
                title="Quyền Admin: Quản lý ẩn/hiện sản phẩm với khách hàng"
              >
                <EyeOff className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Ẩn/Hiện sản phẩm</span>
                {hiddenProductIds.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-neutral-950 font-black text-[10px]">
                    {hiddenProductIds.length} ẩn
                  </span>
                )}
              </button>
            )}

            {/* Only Admin sees the quick image updater button */}
            {isAdmin && onOpenImageUpdater && (
              <button
                type="button"
                onClick={() => onOpenImageUpdater(allProducts[0] || PRODUCTS[0])}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold border-2 border-amber-600 shadow-xs transition-all shrink-0 cursor-pointer active:scale-95"
                title="Quyền Admin: Bấm để mở bảng tải ảnh hoặc dán link ảnh mới"
              >
                <Camera className="w-4 h-4 text-white shrink-0" />
                <span>Cập nhật hình ({Object.keys(customImages).length > 0 ? `${Object.keys(customImages).length} đã đổi` : 'Chọn ảnh'})</span>
              </button>
            )}

            {/* Quick Search */}
            <div className="w-full sm:w-64 md:w-72 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm nhanh model: CR-1021, Casper..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-neutral-300 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-xs"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-xs text-neutral-400 hover:text-neutral-600"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Budget Filter Bar */}
        <div className="mb-5">
          <BudgetFilter
            selectedBudget={selectedBudget}
            onSelectBudget={setSelectedBudget}
            activeCount={filteredProducts.length}
          />
        </div>

        {/* Category Tabs (Segmented control) with Mobile View Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-2 border-b border-neutral-200">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setActiveCategoryTab('all')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                activeCategoryTab === 'all'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200'
              }`}
            >
              Tất cả các nhóm quà ({isAdmin ? PRODUCTS.length : PRODUCTS.filter(p => !hiddenProductIds.includes(p.id)).length})
            </button>

            {CATEGORIES.map((cat) => {
              const count = PRODUCTS.filter((p) => p.category === cat.id && (isAdmin ? true : !hiddenProductIds.includes(p.id))).length;
              const isActive = activeCategoryTab === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryTab(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200'
                  }`}
                >
                  {categoryIcons[cat.id]}
                  <span>{cat.name}</span>
                  <span className={`text-[11px] px-1.5 py-0.2 rounded-md ${isActive ? 'bg-rose-700/60 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mobile Display Toggle: Horizontal Swipe vs 2-Column Grid */}
          <div className="flex sm:hidden items-center justify-between gap-2 pt-1 border-t border-neutral-150">
            <span className="text-[11px] font-medium text-neutral-500">
              Kiểu xem điện thoại:
            </span>
            <div className="flex items-center gap-1 p-0.5 bg-neutral-200/80 rounded-lg">
              <button
                type="button"
                onClick={() => setMobileLayout('horizontal')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  mobileLayout === 'horizontal'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-neutral-600'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Trượt ngang</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileLayout('grid')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  mobileLayout === 'grid'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-neutral-600'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Lưới</span>
              </button>
            </div>
          </div>
        </div>

        {/* Product Display */}
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-neutral-200">
            <p className="text-sm font-medium text-neutral-600">
              Không tìm thấy sản phẩm nào phù hợp với bộ lọc hiện tại.
            </p>
            <button
              onClick={() => {
                setActiveCategoryTab('all');
                setSelectedBudget('all');
                setSearchQuery('');
              }}
              className="mt-3 px-4 py-2 rounded-lg bg-neutral-900 text-white text-xs font-semibold"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : isDefaultFullView ? (
          // Full 5 groups with dedicated horizontal swipe per category
          <div className="space-y-10">
            {CATEGORIES.map((category) => {
              const catProducts = allProducts.filter((p) => p.category === category.id);
              return (
                <CategorySection
                  key={category.id}
                  category={category}
                  products={catProducts}
                  icon={categoryIcons[category.id]}
                  selectedProductIds={selectedProductIds}
                  customImages={customImages}
                  customPrices={customPrices}
                  onToggleProduct={onToggleProduct}
                  onConsultProduct={onConsultProduct}
                  onOpenImageUpdater={onOpenImageUpdater}
                  onOpenPriceEditor={onOpenPriceEditor}
                  onEditProduct={onEditProduct}
                  onDeleteProduct={onDeleteProduct}
                  onAddProductToCategory={onOpenAddProduct}
                  isAdmin={isAdmin}
                  hiddenProductIds={hiddenProductIds}
                  onToggleHideProduct={(product) => onToggleHideProduct?.(product.id)}
                />
              );
            })}
          </div>
        ) : (
          // Filtered list: supports both mobile horizontal swipe & grid
          <div>
            {/* Filtered Results Header with Navigation Controls */}
            <div className="mb-3.5 flex items-center justify-between">
              <div className="text-xs text-neutral-600 font-medium">
                Tìm thấy <strong className="text-rose-600 font-semibold">{filteredProducts.length}</strong> sản phẩm phù hợp
              </div>

              {mobileLayout === 'horizontal' && (
                <div className="flex items-center gap-1.5 sm:hidden">
                  <button
                    type="button"
                    onClick={scrollFilteredLeft}
                    className="w-7 h-7 rounded-lg border border-neutral-200 bg-white flex items-center justify-center shadow-2xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-neutral-600" />
                  </button>
                  <button
                    type="button"
                    onClick={scrollFilteredRight}
                    className="w-7 h-7 rounded-lg border border-neutral-200 bg-white flex items-center justify-center shadow-2xs"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
                  </button>
                </div>
              )}
            </div>

            {/* Container */}
            <div
              ref={filteredScrollRef}
              className={
                mobileLayout === 'horizontal'
                  ? 'flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-3 pt-1 gap-3.5 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5 sm:overflow-visible'
                  : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5'
              }
            >
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={
                    mobileLayout === 'horizontal'
                      ? 'w-[80vw] max-w-[295px] shrink-0 snap-center sm:w-auto sm:shrink sm:snap-align-none flex flex-col'
                      : 'flex flex-col'
                  }
                >
                  <ProductCard
                    product={product}
                    customImage={customImages[product.id]}
                    customPrice={customPrices[product.id]}
                    onSelect={onToggleProduct}
                    onConsultProduct={onConsultProduct}
                    onOpenImageUpdater={onOpenImageUpdater}
                    onOpenPriceEditor={onOpenPriceEditor}
                    onEditProduct={onEditProduct}
                    onDeleteProduct={onDeleteProduct}
                    isSelected={selectedProductIds.includes(product.id)}
                    isAdmin={isAdmin}
                    isHidden={hiddenProductIds.includes(product.id)}
                    onToggleHide={(p) => onToggleHideProduct?.(p.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Items Tray Banner */}
        {selectedProductIds.length > 0 && (
          <div className="mt-10 p-4 rounded-2xl bg-neutral-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center font-bold">
                {selectedProductIds.length}
              </div>
              <div>
                <div className="text-sm font-semibold">
                  Anh đã chọn {selectedProductIds.length} món quà ưng ý
                </div>
                <div className="text-xs text-neutral-400">
                  Sale KDT-89 sẽ gửi báo giá đối tác và hỗ trợ giữ hàng ngay khi anh bấm tiếp tục.
                </div>
              </div>
            </div>

            <button
              onClick={onOpenConsultation}
              className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shadow-sm"
            >
              Gửi danh sách cho Sale tư vấn & giữ hàng
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
