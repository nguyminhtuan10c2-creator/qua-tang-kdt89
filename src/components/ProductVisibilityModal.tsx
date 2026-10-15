import React, { useState, useMemo } from 'react';
import {
  X,
  Eye,
  EyeOff,
  Search,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Package,
  Layers,
  Sparkles,
  Filter,
} from 'lucide-react';
import { PRODUCTS, CATEGORIES, ProductItem } from '../data/products';

interface ProductVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  hiddenProductIds: string[];
  onToggleHideProduct: (productId: string) => void;
  onUnhideAllProducts: () => void;
  customImages?: Record<string, string>;
}

export const ProductVisibilityModal: React.FC<ProductVisibilityModalProps> = ({
  isOpen,
  onClose,
  hiddenProductIds,
  onToggleHideProduct,
  onUnhideAllProducts,
  customImages = {},
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'hidden' | 'visible'>('all');

  const totalCount = PRODUCTS.length;
  const hiddenCount = hiddenProductIds.length;
  const visibleCount = Math.max(0, totalCount - hiddenCount);

  // Filtered product list
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const isHidden = hiddenProductIds.includes(p.id);

      // Status filter
      if (statusFilter === 'hidden' && !isHidden) return false;
      if (statusFilter === 'visible' && isHidden) return false;

      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(query);
        const matchModel = p.modelCode?.toLowerCase().includes(query);
        const matchDesc = p.practicalValue.toLowerCase().includes(query);
        return matchName || matchModel || matchDesc;
      }

      return true;
    });
  }, [hiddenProductIds, statusFilter, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg leading-tight">
                  Quản lý Ẩn / Hiện sản phẩm
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                  Quyền Admin
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Ẩn các sản phẩm hết hàng hoặc chưa muốn khách thấy. Khách hàng và thợ sẽ không thấy món bị ẩn.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Đóng bảng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Dashboard & Quick Action Bar */}
        <div className="bg-neutral-50 px-5 sm:px-6 py-3.5 border-b border-neutral-200 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Quick stats pills */}
            <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
              <span className="px-3 py-1.5 rounded-xl bg-white border border-neutral-200 text-neutral-700 shadow-2xs">
                Tổng: <strong className="text-neutral-900">{totalCount}</strong> món
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-2xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Khách thấy: <strong>{visibleCount}</strong></span>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 shadow-2xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Đang ẩn: <strong>{hiddenCount}</strong></span>
              </span>
            </div>

            {/* Quick Reset All button */}
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={onUnhideAllProducts}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                title="Khôi phục hiển thị tất cả các món cho khách hàng"
              >
                <RotateCcw className="w-3.5 h-3.5 text-neutral-600" />
                <span>Hiện lại tất cả ({hiddenCount} món đang ẩn)</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 bg-white space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã model (CR-1021, Casper...) hoặc tên sản phẩm..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-neutral-50 border border-neutral-300 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-neutral-400 hover:text-neutral-600"
                >
                  Xóa
                </button>
              )}
            </div>

            {/* Status Filter Segmented Control */}
            <div className="flex items-center p-1 bg-neutral-100 rounded-xl shrink-0 gap-1">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Tất cả ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('visible')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'visible'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Đang hiện ({visibleCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('hidden')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'hidden'
                    ? 'bg-white text-amber-800 shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Đang ẩn ({hiddenCount})
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
              }`}
            >
              Tất cả nhóm
            </button>
            {CATEGORIES.map((cat) => {
              const catTotal = PRODUCTS.filter((p) => p.category === cat.id).length;
              const catHidden = PRODUCTS.filter(
                (p) => p.category === cat.id && hiddenProductIds.includes(p.id)
              ).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-75">
                    ({catTotal - catHidden}/{catTotal})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 divide-y divide-neutral-100">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <Package className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
              <p className="text-sm font-semibold text-neutral-700">
                Không tìm thấy sản phẩm nào
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Thử thay đổi từ khóa tìm kiếm hoặc bấm &quot;Tất cả nhóm&quot;.
              </p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isHidden = hiddenProductIds.includes(product.id);
              const customImg = customImages[product.id];
              const displayImg = customImg || product.imageUrl;

              return (
                <div
                  key={product.id}
                  className={`pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl transition-all ${
                    isHidden
                      ? 'bg-amber-50/70 border border-amber-200'
                      : 'bg-white hover:bg-neutral-50/80 border border-transparent'
                  }`}
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                      {displayImg ? (
                        <img
                          src={displayImg}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400 text-xs font-bold">
                          KDT
                        </div>
                      )}
                      {isHidden && (
                        <div className="absolute inset-0 bg-neutral-900/60 flex items-center justify-center">
                          <EyeOff className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600">
                          {product.categoryLabel}
                        </span>
                        {product.modelCode && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-neutral-200/80 text-neutral-800">
                            Mã: {product.modelCode}
                          </span>
                        )}
                        {/* Status Badge */}
                        {isHidden ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                            <EyeOff className="w-3 h-3 text-amber-700" />
                            <span>ĐÃ ẨN VỚI KHÁCH</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Đang hiển thị bình thường</span>
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-neutral-900 truncate mt-1">
                        {product.name}
                      </h4>
                      <p className="text-xs text-neutral-500 truncate mt-0.5">
                        {product.practicalValue}
                      </p>
                    </div>
                  </div>

                  {/* Right: Toggle Button */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => onToggleHideProduct(product.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                        isHidden
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-neutral-100 hover:bg-amber-100 text-neutral-700 hover:text-amber-900 border border-neutral-300 hover:border-amber-400'
                      }`}
                      title={
                        isHidden
                          ? 'Bấm để khôi phục cho khách thấy sản phẩm này'
                          : 'Bấm để ẩn sản phẩm này khỏi khách hàng'
                      }
                    >
                      {isHidden ? (
                        <>
                          <Eye className="w-4 h-4 text-white" />
                          <span>Bật hiển thị lại</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4 text-neutral-500" />
                          <span>Ẩn món này</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-neutral-50 px-5 sm:px-6 py-3.5 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-500 shrink-0">
          <div>
            💡 <strong>Mẹo:</strong> Trạng thái ẩn/hiện được lưu trực tiếp trên trình duyệt của anh. Khi khách bình thường vào xem sẽ không nhìn thấy bất kỳ sản phẩm nào anh đã ẩn.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs shrink-0 cursor-pointer"
          >
            Đã xong & Đóng bảng
          </button>
        </div>
      </div>
    </div>
  );
};
