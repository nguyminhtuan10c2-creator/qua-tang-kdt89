import React, { useState, useMemo, useRef } from 'react';
import { CATEGORIES, PRODUCTS, ProductItem, CategoryItem, MAX_CATALOG_PRICE, isProductInPriceRange } from '../data/products';
import { ProductCard } from './ProductCard';
import { CategorySection } from './CategorySection';
import { BudgetFilter } from './BudgetFilter';
import { BulkProductImportModal } from './BulkProductImportModal';
import { FlashSaleTimeSlots } from './FlashSaleTimeSlots';
import {
  Search,
  Sparkles,
  Flame,
  Droplets,
  Wind,
  UtensilsCrossed,
  LayoutGrid,
  Columns,
  ChevronLeft,
  ChevronRight,
  Camera,
  Tv,
  Eye,
  EyeOff,
  Plus,
  Pencil,
  Layers,
  Zap,
  Sliders,
  FileSpreadsheet,
} from 'lucide-react';

import type { CategoryOverride, SiteDecorSettings } from '../lib/firebase';

interface ProductCatalogProps {
  selectedProductIds: string[];
  allProducts?: ProductItem[];
  allCategories?: CategoryItem[];
  deletedCategoryIds?: string[];
  customImages?: Record<string, string>;
  customPrices?: Record<string, { programPrice?: string; referencePrice?: string }>;
  customCategories?: Record<string, CategoryOverride>;
  decorSettings?: SiteDecorSettings;
  onOpenDecorationModal?: () => void;
  showBudgetFilter?: boolean;
  onToggleBudgetFilter?: (show: boolean) => void;
  onImportBulkProducts?: (products: ProductItem[]) => void;
  onToggleProduct: (product: ProductItem) => void;
  onConsultProduct?: (product: ProductItem) => void;
  onOpenImageUpdater?: (product: ProductItem) => void;
  onOpenPriceEditor?: (product: ProductItem) => void;
  onOpenAddProduct?: (categoryId?: string) => void;
  onOpenCategoryEditor?: (categoryId?: string) => void;
  onOpenCategoryManager?: (categoryId?: string) => void;
  onEditProduct?: (product: ProductItem) => void;
  onDeleteProduct?: (productId: string) => void;
  onBuyProduct?: (product: ProductItem) => void;
  onOpenOrderModal?: () => void;
  onOpenConsultation: () => void;
  isAdmin?: boolean;
  hiddenProductIds?: string[];
  onToggleHideProduct?: (productId: string) => void;
  onOpenManageVisibility?: () => void;
  customTexts?: Record<string, string>;
  onOpenVoucherWallet?: () => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  selectedProductIds,
  allProducts = PRODUCTS,
  allCategories = CATEGORIES,
  deletedCategoryIds = [],
  customImages = {},
  customPrices = {},
  customCategories = {},
  customTexts = {},
  decorSettings,
  onOpenDecorationModal,
  showBudgetFilter = false,
  onToggleBudgetFilter,
  onImportBulkProducts,
  onToggleProduct,
  onBuyProduct,
  onOpenOrderModal,
  onConsultProduct,
  onOpenImageUpdater,
  onOpenPriceEditor,
  onOpenAddProduct,
  onOpenCategoryEditor,
  onOpenCategoryManager,
  onEditProduct,
  onDeleteProduct,
  onOpenConsultation,
  isAdmin = false,
  hiddenProductIds = [],
  onToggleHideProduct,
  onOpenManageVisibility,
  onOpenVoucherWallet,
}) => {
  const [activeDealFilter, setActiveDealFilter] = useState<'all' | 'flash_deal' | 'best_seller' | 'deep_discount' | 'new_arrival'>('all');
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, MAX_CATALOG_PRICE]);
  const [selectedBudget, setSelectedBudget] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileLayout, setMobileLayout] = useState<'horizontal' | 'grid'>('grid');
  const [isBulkImportOpen, setIsBulkImportOpen] = useState<boolean>(false);

  const filteredScrollRef = useRef<HTMLDivElement>(null);

  // Category icons mapping
  const categoryIcons: Record<string, React.ReactNode> = {
    rice_cooker_appliances: <UtensilsCrossed className="w-4 h-4 text-amber-600" />,
    kitchen_stoves: <Flame className="w-4 h-4 text-rose-600" />,
    water_heaters: <Droplets className="w-4 h-4 text-sky-600" />,
    air_conditioners: <Wind className="w-4 h-4 text-teal-600" />,
    televisions: <Tv className="w-4 h-4 text-indigo-600" />,
  };

  // Dynamically computed categories based on allCategories + customCategories - deletedCategoryIds
  const displayedCategories = useMemo(() => {
    const baseList = allCategories && allCategories.length > 0 ? allCategories : CATEGORIES;
    return baseList
      .filter((cat) => !deletedCategoryIds.includes(cat.id))
      .map((cat) => {
        const override = customCategories[cat.id];
        if (override) {
          return {
            ...cat,
            name: override.name !== undefined && override.name !== '' ? override.name : cat.name,
            subTitle: override.subTitle !== undefined && override.subTitle !== '' ? override.subTitle : cat.subTitle,
            tagline: override.tagline !== undefined && override.tagline !== '' ? override.tagline : cat.tagline,
          };
        }
        return cat;
      });
  }, [allCategories, deletedCategoryIds, customCategories]);

  // Filter products: For regular customers, completely hide products marked as hidden
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      if (!isAdmin && hiddenProductIds.includes(p.id)) {
        return false;
      }
      const matchCategory =
        activeCategoryTab === 'all' || p.category === activeCategoryTab;

      // Price range filter
      const customPrice = customPrices[p.id];
      const matchPrice =
        !showBudgetFilter && priceRange[0] === 0 && priceRange[1] >= MAX_CATALOG_PRICE
          ? true
          : isProductInPriceRange(p, priceRange[0], priceRange[1], customPrice);

      const matchSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.practicalValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.modelCode && p.modelCode.toLowerCase().includes(searchQuery.toLowerCase()));

      // Quick Deal Tabs filter like Điện Máy Xanh
      let matchDeal = true;
      if (activeDealFilter === 'flash_deal') {
        matchDeal =
          Boolean(p.highlightTag?.toLowerCase().includes('sale')) ||
          Boolean(p.highlightTag?.toLowerCase().includes('giảm')) ||
          Boolean(p.highlightTag?.toLowerCase().includes('deal')) ||
          Boolean(p.highlightTag?.toLowerCase().includes('hot')) ||
          Boolean(p.referencePrice && p.programPrice !== p.referencePrice);
      } else if (activeDealFilter === 'best_seller') {
        matchDeal =
          Boolean(p.highlightTag?.toLowerCase().includes('chạy')) ||
          p.name.includes('Cuckoo') ||
          p.name.includes('Casper') ||
          p.name.includes('Ariston') ||
          p.name.includes('Sunhouse') ||
          Boolean(p.stockStatus?.includes('1')) ||
          Boolean(p.stockStatus?.includes('2'));
      } else if (activeDealFilter === 'deep_discount') {
        matchDeal = Boolean(p.referencePrice && p.referencePrice.length > 0);
      } else if (activeDealFilter === 'new_arrival') {
        matchDeal =
          p.id.startsWith('custom-') ||
          p.id.startsWith('import-') ||
          Boolean(p.highlightTag?.toLowerCase().includes('mới')) ||
          Boolean(p.stockStatus?.includes('Sẵn'));
      }

      return matchCategory && matchPrice && matchSearch && matchDeal;
    });
  }, [
    allProducts,
    activeCategoryTab,
    priceRange,
    customPrices,
    searchQuery,
    isAdmin,
    hiddenProductIds,
    showBudgetFilter,
    activeDealFilter,
  ]);

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

  const isDefaultFullView =
    activeDealFilter === 'all' &&
    activeCategoryTab === 'all' &&
    (!showBudgetFilter || (priceRange[0] === 0 && priceRange[1] >= MAX_CATALOG_PRICE)) &&
    !searchQuery;

  return (
    <section id="products" className="py-10 sm:py-16 bg-neutral-50 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{customTexts.catalogBadge || 'Danh mục sản phẩm có sẵn tại kho'}</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              {customTexts.catalogTitle || 'Thiết bị điện máy & gia dụng giá tốt tại kho'}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-neutral-600">
              {customTexts.catalogSubtitle || 'Ưu đãi riêng cho đối tác – Hàng chính hãng 100% – Hỗ trợ giao tận nơi & lắp đặt chu đáo'}
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

            {/* Admin Category Manager Button */}
            {isAdmin && (onOpenCategoryManager || onOpenCategoryEditor) && (
              <button
                type="button"
                onClick={() => (onOpenCategoryManager ? onOpenCategoryManager() : onOpenCategoryEditor?.())}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs sm:text-sm font-bold shadow-xs transition-all shrink-0 cursor-pointer active:scale-95"
                title="Quyền Admin: Thêm bớt và sửa đề mục các nhóm danh mục sản phẩm"
              >
                <Layers className="w-4 h-4 text-rose-600" />
                <span>Quản lý danh mục</span>
                <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-900 border border-rose-300 font-bold text-[10px]">
                  {displayedCategories.length} nhóm
                </span>
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

            {/* Admin Bulk Import Button */}
            {isAdmin && onImportBulkProducts && (
              <button
                type="button"
                onClick={() => setIsBulkImportOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-all shrink-0 cursor-pointer active:scale-95"
                title="Quyền Admin: Nhập bảng giá từ file Excel/CSV hoặc dán từ Zalo/bảng tính"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Nhập File / Bảng giá</span>
              </button>
            )}

            {/* Admin Toggle Budget Filter Button */}
            {isAdmin && onToggleBudgetFilter && (
              <button
                type="button"
                onClick={() => onToggleBudgetFilter(!showBudgetFilter)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-bold shadow-xs transition-all shrink-0 cursor-pointer active:scale-95 ${
                  showBudgetFilter
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100'
                }`}
                title="Quyền Admin: Bật hoặc tắt bảng giá ngân sách (Thanh kéo giá) trên toàn website"
              >
                {showBudgetFilter ? (
                  <Sliders className="w-4 h-4 text-emerald-600" />
                ) : (
                  <EyeOff className="w-4 h-4 text-neutral-400" />
                )}
                <span>Bảng giá ngân sách: {showBudgetFilter ? 'ĐANG BẬT' : 'ĐANG TẮT (Ẩn)'}</span>
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

        {/* Điện Máy Xanh style Quick Deal Filter Pills ("các tab nhỏ chuyển đổi về các sản phẩm đang sale tốt") */}
        <div className="mb-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1.5">
            <button
              type="button"
              onClick={() => setActiveDealFilter('all')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                activeDealFilter === 'all'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 shadow-2xs'
              }`}
            >
              <span>🔥 Tất cả sản phẩm</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeDealFilter === 'all' ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-100 text-neutral-600'}`}>
                {isAdmin ? allProducts.length : allProducts.filter(p => !hiddenProductIds.includes(p.id)).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDealFilter('flash_deal')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                activeDealFilter === 'flash_deal'
                  ? 'bg-red-600 text-white shadow-xs ring-2 ring-red-400/30'
                  : 'bg-white hover:bg-red-50 text-red-700 border border-red-200 shadow-2xs'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
              <span>⚡ Deal Sốc Hôm Nay</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDealFilter('best_seller')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                activeDealFilter === 'best_seller'
                  ? 'bg-amber-500 text-neutral-950 shadow-xs ring-2 ring-amber-400/30'
                  : 'bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs'
              }`}
            >
              <span>👑 Bán Chạy Nhất</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDealFilter('deep_discount')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                activeDealFilter === 'deep_discount'
                  ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-400/30'
                  : 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs'
              }`}
            >
              <span>💎 Giảm Sâu &gt; 20%</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDealFilter('new_arrival')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                activeDealFilter === 'new_arrival'
                  ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400/30'
                  : 'bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
              }`}
            >
              <span>⭐ Hàng Mới Về</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            KHUNG GIỜ SĂN SALE CHUẨN ĐIỆN MÁY XANH (HIỂN THỊ KHI CHỌN DEAL SỐC HOẶC TẤT CẢ)
            Phân biệt rõ ràng: Đếm ngược ĐẾN NGÀY SALE vs Trong THỜI GIAN SALE
           ========================================================================= */}
        {(activeDealFilter === 'flash_deal' || activeDealFilter === 'all') && (
          <FlashSaleTimeSlots
            decorSettings={decorSettings}
            activeCategoryTab={activeCategoryTab}
            onSelectCategoryTab={(catId) => {
              if (catId === 'flash_deal') {
                setActiveDealFilter('flash_deal');
                setActiveCategoryTab('all');
              } else if (catId === 'discount_50') {
                setActiveDealFilter('deep_discount');
              } else {
                setActiveCategoryTab(catId);
                setActiveDealFilter('flash_deal');
              }
            }}
            isAdmin={isAdmin}
            onOpenDecorationModal={onOpenDecorationModal}
            onOpenConsultation={onOpenConsultation}
            onOpenVoucherWallet={onOpenVoucherWallet}
          />
        )}

        {/* Budget Filter Bar with Range Slider - Bật/Tắt theo nhu cầu của Admin */}
        {(showBudgetFilter || isAdmin) && (
          <div className="mb-5">
            {isAdmin && !showBudgetFilter && (
              <div className="mb-2 p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold">
                  <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                  <span>Bảng giá ngân sách đang ẨN với khách hàng (Trang web đang rất gọn gàng)</span>
                </span>
                {onToggleBudgetFilter && (
                  <button
                    type="button"
                    onClick={() => onToggleBudgetFilter(true)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                  >
                    Bật hiện lại
                  </button>
                )}
              </div>
            )}
            {showBudgetFilter && (
              <BudgetFilter
                priceRange={priceRange}
                onPriceRangeChange={setPriceRange}
                selectedBudget={selectedBudget}
                onSelectBudget={setSelectedBudget}
                activeCount={filteredProducts.length}
              />
            )}
          </div>
        )}

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
              Tất cả các nhóm quà ({isAdmin ? allProducts.length : allProducts.filter(p => !hiddenProductIds.includes(p.id)).length})
            </button>

            {displayedCategories.map((cat) => {
              const count = allProducts.filter((p) => p.category === cat.id && (isAdmin ? true : !hiddenProductIds.includes(p.id))).length;
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
                setPriceRange([0, MAX_CATALOG_PRICE]);
                setSelectedBudget('all');
                setSearchQuery('');
              }}
              className="mt-3 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : isDefaultFullView ? (
          // Full 5 groups with dedicated horizontal swipe per category
          <div className="space-y-10">
            {displayedCategories.map((category) => {
              const catProducts = allProducts.filter((p) => p.category === category.id);
              return (
                <CategorySection
                  key={category.id}
                  category={category}
                  products={catProducts}
                  icon={categoryIcons[category.id] || <Sparkles className="w-4 h-4 text-rose-600" />}
                  selectedProductIds={selectedProductIds}
                  customImages={customImages}
                  customPrices={customPrices}
                  onToggleProduct={onToggleProduct}
                  onBuyProduct={onBuyProduct}
                  onConsultProduct={onConsultProduct}
                  onOpenImageUpdater={onOpenImageUpdater}
                  onOpenPriceEditor={onOpenPriceEditor}
                  onEditProduct={onEditProduct}
                  onDeleteProduct={onDeleteProduct}
                  onAddProductToCategory={onOpenAddProduct}
                  onOpenCategoryEditor={onOpenCategoryManager || onOpenCategoryEditor}
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

            {/* Container - Điện Máy Xanh style 2-column grid on mobile */}
            <div
              ref={filteredScrollRef}
              className={
                mobileLayout === 'horizontal'
                  ? 'flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-3 pt-1 gap-3.5 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5 sm:overflow-visible'
                  : 'grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4'
              }
            >
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={
                    mobileLayout === 'horizontal'
                      ? 'w-[80vw] max-w-[295px] shrink-0 snap-center sm:w-auto sm:shrink sm:snap-align-none flex flex-col'
                      : 'w-full flex flex-col'
                  }
                >
                  <ProductCard
                    product={product}
                    customImage={customImages[product.id]}
                    customPrice={customPrices[product.id]}
                    onSelect={onToggleProduct}
                    onBuyProduct={onBuyProduct}
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
                  KDT-89 giao hàng tận nơi, kiểm tra máy chính hãng mới thanh toán.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenOrderModal && (
                <button
                  type="button"
                  onClick={onOpenOrderModal}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <span>Đặt mua ngay ({selectedProductIds.length} món)</span>
                </button>
              )}
              <button
                type="button"
                onClick={onOpenConsultation}
                className="px-4 py-3 rounded-xl bg-white/15 hover:bg-white/25 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer"
              >
                Nhờ tư vấn
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin Bulk Product Import Modal */}
      {isAdmin && onImportBulkProducts && (
        <BulkProductImportModal
          isOpen={isBulkImportOpen}
          onClose={() => setIsBulkImportOpen(false)}
          categories={displayedCategories}
          onImportProducts={(imported) => {
            onImportBulkProducts(imported);
          }}
        />
      )}
    </section>
  );
};
