import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Zap,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Search,
  RotateCcw,
  Check,
  Eye,
  EyeOff,
  Tag,
  Sparkles,
} from 'lucide-react';
import {
  CategoryItem,
  DEFAULT_FLAGSHIP_PRODUCT_IDS,
  ProductItem,
} from '../data/products';
import type { ResolvedAdminProduct } from '../lib/productImportExport';
import type { SiteDecorSettings } from '../lib/firebase';

interface FlashSaleShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ResolvedAdminProduct[];
  categories: CategoryItem[];
  deletedCategoryIds: string[];
  customTexts: Record<string, string>;
  decorSettings: SiteDecorSettings;
  onSaveShowcase: (params: {
    flagshipBadge: string;
    flagshipTitle: string;
    flagshipHint: string;
    showFlagshipDeals: boolean;
    flagshipProductIds: string[];
  }) => Promise<void>;
  onEditPrice?: (product: ProductItem) => void;
}

const DEFAULT_BADGE = 'Ưu tiên chốt nhanh hôm nay';
const DEFAULT_TITLE = '6 Deal Chủ Lực Giá Sale Tại Kho';
const DEFAULT_HINT = 'Bấm "Đặt giữ giá 24h" để sale giữ suất ngay';

export const FlashSaleShowcaseModal: React.FC<FlashSaleShowcaseModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  deletedCategoryIds,
  customTexts,
  decorSettings,
  onSaveShowcase,
  onEditPrice,
}) => {
  const [badgeText, setBadgeText] = useState(DEFAULT_BADGE);
  const [titleText, setTitleText] = useState(DEFAULT_TITLE);
  const [hintText, setHintText] = useState(DEFAULT_HINT);
  const [showSection, setShowSection] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const activeProducts = useMemo(
    () => products.filter((p) => !p.isDeleted),
    [products]
  );

  const activeCategories = useMemo(
    () => categories.filter((c) => !deletedCategoryIds.includes(c.id)),
    [categories, deletedCategoryIds]
  );

  const resolveDefaultIds = useMemo(() => {
    const visibleIds = activeProducts.filter((p) => !p.isHidden).map((p) => p.id);
    const validDefaults = DEFAULT_FLAGSHIP_PRODUCT_IDS.filter((id) =>
      visibleIds.includes(id)
    );
    return validDefaults.length > 0 ? validDefaults : visibleIds.slice(0, 6);
  }, [activeProducts]);

  useEffect(() => {
    if (isOpen) {
      setBadgeText(customTexts.flagshipBadge || DEFAULT_BADGE);
      setTitleText(customTexts.flagshipTitle || DEFAULT_TITLE);
      setHintText(customTexts.flagshipHint || DEFAULT_HINT);
      setShowSection(decorSettings?.showFlagshipDeals !== false);

      const configured = decorSettings?.flagshipProductIds;
      if (Array.isArray(configured) && configured.length > 0) {
        setSelectedIds(
          configured.filter((id) => activeProducts.some((p) => p.id === id))
        );
      } else {
        setSelectedIds(resolveDefaultIds);
      }
      setSearchQuery('');
      setCategoryFilter('all');
      setSavedSuccess(false);
    }
  }, [isOpen, customTexts, decorSettings, activeProducts, resolveDefaultIds]);

  const selectedProducts = useMemo(() => {
    return selectedIds
      .map((id) => activeProducts.find((p) => p.id === id))
      .filter((p): p is ResolvedAdminProduct => Boolean(p));
  }, [selectedIds, activeProducts]);

  const catalogSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activeProducts.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.modelCode || '').toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    });
  }, [activeProducts, searchQuery, categoryFilter]);

  if (!isOpen) return null;

  const handleMove = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= selectedIds.length) return;
    setSelectedIds((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  const handleToggleProduct = (productId: string) => {
    setSelectedIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handlePickDiscountedDeals = () => {
    const discounted = activeProducts
      .filter(
        (p) =>
          !p.isHidden &&
          ((p.referencePrice &&
            p.effectiveProgramPrice &&
            p.referencePrice !== p.effectiveProgramPrice &&
            !p.effectiveProgramPrice.includes('Liên hệ')) ||
            (p.highlightTag || '').toLowerCase().includes('sale'))
      )
      .slice(0, 8)
      .map((p) => p.id);

    if (discounted.length > 0) {
      setSelectedIds(discounted);
    }
  };

  const handleResetDefault = () => {
    setBadgeText(DEFAULT_BADGE);
    setTitleText(DEFAULT_TITLE);
    setHintText(DEFAULT_HINT);
    setShowSection(true);
    setSelectedIds(resolveDefaultIds);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveShowcase({
        flagshipBadge: badgeText.trim() || DEFAULT_BADGE,
        flagshipTitle: titleText.trim() || DEFAULT_TITLE,
        flagshipHint: hintText.trim() || DEFAULT_HINT,
        showFlagshipDeals: showSection,
        flagshipProductIds: selectedIds,
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 px-5 sm:px-6 py-4 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-yellow-200 fill-yellow-200" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                Chỉnh Tiêu Đề & Sản Phẩm Khung Deal Chủ Lực / Flash Sale
              </h3>
              <p className="text-xs text-slate-300">
                Tùy chỉnh thanh banner đỏ cam và chọn đúng các sản phẩm hiển thị nổi bật đầu danh mục.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Live Preview Banner */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Xem trước thanh tiêu đề trên trang khách:
              </span>
              <button
                type="button"
                onClick={() => setShowSection((v) => !v)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border cursor-pointer transition-colors ${
                  showSection
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {showSection ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{showSection ? 'Đang HIỆN khối này' : 'Đang ẨN khối này'}</span>
              </button>
            </div>

            <div
              className={`p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-opacity ${
                showSection ? 'opacity-100' : 'opacity-45'
              }`}
            >
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-yellow-200">
                  <Zap className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
                  <span>{badgeText || DEFAULT_BADGE}</span>
                </div>
                <div className="text-base sm:text-xl font-black tracking-tight">
                  {titleText || DEFAULT_TITLE}
                </div>
              </div>
              <span className="text-xs text-rose-50 font-medium">
                {hintText || DEFAULT_HINT}
              </span>
            </div>
          </div>

          {/* Banner Title Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                1. Dòng chữ nhỏ phía trên:
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder={DEFAULT_BADGE}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                2. Tiêu đề chính lớn:
              </label>
              <input
                type="text"
                value={titleText}
                onChange={(e) => setTitleText(e.target.value)}
                placeholder={DEFAULT_TITLE}
                className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3. Ghi chú bên phải:
              </label>
              <input
                type="text"
                value={hintText}
                onChange={(e) => setHintText(e.target.value)}
                placeholder={DEFAULT_HINT}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              />
            </div>
          </div>

          {/* Product Picker & Ordering */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Currently Featured Flash Sale Products */}
            <div className="lg:col-span-6 border border-slate-200 rounded-xl flex flex-col overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Sản phẩm đang hiển thị ({selectedProducts.length})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Bấm mũi tên để đổi thứ tự xuất hiện trên trang khách.
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePickDiscountedDeals}
                    className="px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                    title="Chọn nhanh các sản phẩm đang có giá sale"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Chọn SP đang sale</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds(resolveDefaultIds)}
                    className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold cursor-pointer"
                  >
                    Mặc định (6 món)
                  </button>
                </div>
              </div>

              <div className="p-3 space-y-2 max-h-[340px] overflow-y-auto divide-y divide-slate-100">
                {selectedProducts.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-500">
                    Chưa chọn sản phẩm nào. Hãy bấm <strong>+ Thêm</strong> ở cột bên phải (nếu để trống khi lưu sẽ tự dùng 6 món mặc định).
                  </div>
                ) : (
                  selectedProducts.map((p, idx) => (
                    <div
                      key={p.id}
                      className="pt-2 first:pt-0 flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded bg-slate-100 text-slate-600 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="w-10 h-10 rounded-lg border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                          {p.resolvedImageUrl ? (
                            <img
                              src={p.resolvedImageUrl}
                              alt={p.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-400">No img</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate">
                            {p.name}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-rose-600 tabular-nums">
                              {p.effectiveProgramPrice}
                            </span>
                            {p.isHidden && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">
                                Đang ẩn
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {onEditPrice && (
                          <button
                            type="button"
                            onClick={() => onEditPrice(p)}
                            title="Sửa giá sản phẩm này"
                            className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleMove(idx, -1)}
                          disabled={idx === 0}
                          title="Đưa lên trước"
                          className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(idx, 1)}
                          disabled={idx === selectedProducts.length - 1}
                          title="Đưa xuống sau"
                          className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleProduct(p.id)}
                          title="Bỏ khỏi danh sách này"
                          className="p-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Search & Pick Products */}
            <div className="lg:col-span-6 border border-slate-200 rounded-xl flex flex-col overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2">
                <div className="text-sm font-bold text-slate-900">
                  Chọn sản phẩm từ kho ({catalogSearchResults.length})
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm tên, mã model (vd: NT8800, Cuckoo)..."
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none"
                  >
                    <option value="all">Tất cả danh mục</option>
                    {activeCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                {catalogSearchResults.map((p) => {
                  const isPicked = selectedIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className="pt-2 first:pt-0 flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                          {p.resolvedImageUrl ? (
                            <img
                              src={p.resolvedImageUrl}
                              alt={p.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-[9px] text-slate-400">Img</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate">
                            {p.name}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <span className="font-medium text-rose-600 tabular-nums">
                              {p.effectiveProgramPrice}
                            </span>
                            {p.modelCode && (
                              <span className="font-mono text-slate-400">
                                · {p.modelCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleProduct(p.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors ${
                          isPicked
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {isPicked ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã chọn</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Thêm</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetDefault}
              className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục mặc định ban đầu</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
              >
                <Check className="w-4 h-4" />
                <span>
                  {savedSuccess
                    ? 'Đã lưu đồng bộ!'
                    : isSaving
                    ? 'Đang lưu...'
                    : 'Lưu thay đổi ngay'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
