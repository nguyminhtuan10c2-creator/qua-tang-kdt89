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
  Radio,
  Clock,
  Copy,
} from 'lucide-react';
import {
  CategoryItem,
  DEFAULT_FLAGSHIP_PRODUCT_IDS,
  ProductItem,
} from '../data/products';
import type { ResolvedAdminProduct } from '../lib/productImportExport';
import type { SiteDecorSettings } from '../lib/firebase';
import { parseLivestreamEndMs } from '../lib/flashSalePricing';

export type ShowcaseModalTab = 'flash_sale' | 'livestream';

interface FlashSaleShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: ShowcaseModalTab;
  products: ResolvedAdminProduct[];
  categories: CategoryItem[];
  deletedCategoryIds: string[];
  customTexts: Record<string, string>;
  decorSettings: SiteDecorSettings;
  onSaveShowcase: (params: {
    // Flash Sale Showcase
    flagshipBadge: string;
    flagshipTitle: string;
    flagshipHint: string;
    showFlagshipDeals: boolean;
    flagshipProductIds: string[];
    flashSaleEndTime: string;
    flashSalePrices: Record<string, string>;
    flashSalePricesEnabled: boolean;
    // Livestream-only Showcase
    livestreamActive: boolean;
    livestreamProductIds: string[];
    livestreamPrices: Record<string, string>;
    livestreamSessionEndTime: string;
    livestreamShowDealNumbers: boolean;
    livestreamBadge: string;
    livestreamTitle: string;
    livestreamHint: string;
  }) => Promise<void>;
  onEditPrice?: (product: ProductItem) => void;
}

const DEFAULT_FLASH_BADGE = 'Ưu đãi giá kho · Tự về giá thường khi hết giờ';
const DEFAULT_FLASH_TITLE = 'Flash Sale Giá Sốc Hôm Nay';
const DEFAULT_FLASH_HINT =
  'Săn deal giá tốt trong khung giờ Flash Sale · Bấm "Đặt giữ giá 24h" để chốt suất';

const DEFAULT_LIVE_BADGE = 'Đang phát Livestream · Chốt giá trực tiếp trên Live';
const DEFAULT_LIVE_TITLE = 'Khu Giá Trên Live · Săn Ngay Trong Phiên';
const DEFAULT_LIVE_HINT =
  'Giá ưu đãi chỉ áp dụng khi đang phát Live · Bấm đúng mã Deal hoặc "Đặt giữ giá 24h"';

const formatLocalDatetimeOffset = (hoursFromNow: number): string => {
  const d = new Date(Date.now() + hoursFromNow * 3600 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

export const FlashSaleShowcaseModal: React.FC<FlashSaleShowcaseModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'flash_sale',
  products,
  categories,
  deletedCategoryIds,
  customTexts,
  decorSettings,
  onSaveShowcase,
  onEditPrice,
}) => {
  const [activeTab, setActiveTab] = useState<ShowcaseModalTab>(initialTab);

  // Tab 1: Flash Sale state
  const [badgeText, setBadgeText] = useState(DEFAULT_FLASH_BADGE);
  const [titleText, setTitleText] = useState(DEFAULT_FLASH_TITLE);
  const [hintText, setHintText] = useState(DEFAULT_FLASH_HINT);
  const [showSection, setShowSection] = useState(true);
  const [flashSaleEndTime, setFlashSaleEndTime] = useState('');
  const [flashSalePricesEnabled, setFlashSalePricesEnabled] = useState(true);
  const [flashSalePricesMap, setFlashSalePricesMap] = useState<Record<string, string>>({});
  const [selectedFlashIds, setSelectedFlashIds] = useState<string[]>([]);

  // Tab 2: Livestream-only state
  const [livestreamActive, setLivestreamActive] = useState(false);
  const [liveBadgeText, setLiveBadgeText] = useState(DEFAULT_LIVE_BADGE);
  const [liveTitleText, setLiveTitleText] = useState(DEFAULT_LIVE_TITLE);
  const [liveHintText, setLiveHintText] = useState(DEFAULT_LIVE_HINT);
  const [showDealNumbers, setShowDealNumbers] = useState(true);
  const [livestreamSessionEndTime, setLivestreamSessionEndTime] = useState('');
  const [livestreamPricesMap, setLivestreamPricesMap] = useState<Record<string, string>>({});
  const [selectedLiveIds, setSelectedLiveIds] = useState<string[]>([]);

  // Shared search & saving state
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
      setActiveTab(initialTab);

      // Flash Sale init
      setBadgeText(customTexts.flagshipBadge || DEFAULT_FLASH_BADGE);
      setTitleText(customTexts.flagshipTitle || DEFAULT_FLASH_TITLE);
      setHintText(customTexts.flagshipHint || DEFAULT_FLASH_HINT);
      setShowSection(decorSettings?.showFlagshipDeals !== false);
      const initialFlashEnd =
        decorSettings?.flashSaleEndTime !== undefined
          ? decorSettings.flashSaleEndTime
          : decorSettings?.livestreamEndTime || '';
      setFlashSaleEndTime(initialFlashEnd);
      setFlashSalePricesEnabled(decorSettings?.flashSalePricesEnabled !== false);
      setFlashSalePricesMap(decorSettings?.flashSalePrices || {});

      const configuredFlash = decorSettings?.flagshipProductIds;
      const resolvedFlash =
        Array.isArray(configuredFlash) && configuredFlash.length > 0
          ? configuredFlash.filter((id) => activeProducts.some((p) => p.id === id))
          : resolveDefaultIds;
      setSelectedFlashIds(resolvedFlash);

      // Livestream-only init
      setLivestreamActive(decorSettings?.livestreamActive === true);
      setLiveBadgeText(decorSettings?.livestreamBadge || DEFAULT_LIVE_BADGE);
      setLiveTitleText(decorSettings?.livestreamTitle || DEFAULT_LIVE_TITLE);
      setLiveHintText(decorSettings?.livestreamHint || DEFAULT_LIVE_HINT);
      setShowDealNumbers(decorSettings?.livestreamShowDealNumbers !== false);
      setLivestreamSessionEndTime(decorSettings?.livestreamSessionEndTime || '');
      setLivestreamPricesMap(decorSettings?.livestreamPrices || {});

      const configuredLive = decorSettings?.livestreamProductIds;
      if (Array.isArray(configuredLive) && configuredLive.length > 0) {
        setSelectedLiveIds(
          configuredLive.filter((id) => activeProducts.some((p) => p.id === id))
        );
      } else {
        const pricedLiveIds = Object.entries(decorSettings?.livestreamPrices || {})
          .filter(([, val]) => Boolean((val || '').trim()))
          .map(([id]) => id)
          .filter((id) => activeProducts.some((p) => p.id === id));
        setSelectedLiveIds(pricedLiveIds.length > 0 ? pricedLiveIds : resolvedFlash);
      }

      setSearchQuery('');
      setCategoryFilter('all');
      setSavedSuccess(false);
    }
  }, [isOpen, initialTab, customTexts, decorSettings, activeProducts, resolveDefaultIds]);

  const isLiveTab = activeTab === 'livestream';
  const currentSelectedIds = isLiveTab ? selectedLiveIds : selectedFlashIds;
  const setCurrentSelectedIds = isLiveTab ? setSelectedLiveIds : setSelectedFlashIds;

  const selectedProducts = useMemo(() => {
    return currentSelectedIds
      .map((id) => activeProducts.find((p) => p.id === id))
      .filter((p): p is ResolvedAdminProduct => Boolean(p));
  }, [currentSelectedIds, activeProducts]);

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
    if (targetIdx < 0 || targetIdx >= currentSelectedIds.length) return;
    setCurrentSelectedIds((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  const handleToggleProduct = (productId: string) => {
    setCurrentSelectedIds((prev) =>
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
      setCurrentSelectedIds(discounted);
    }
  };

  const handlePickPricedLiveProducts = () => {
    const priced = Object.entries(livestreamPricesMap)
      .filter(([, val]) => Boolean((val || '').trim()))
      .map(([id]) => id)
      .filter((id) => activeProducts.some((p) => p.id === id));
    if (priced.length > 0) {
      setSelectedLiveIds(priced);
    }
  };

  const handleResetTabDefaults = () => {
    if (isLiveTab) {
      setLiveBadgeText(DEFAULT_LIVE_BADGE);
      setLiveTitleText(DEFAULT_LIVE_TITLE);
      setLiveHintText(DEFAULT_LIVE_HINT);
      setShowDealNumbers(true);
      setLivestreamSessionEndTime('');
      setSelectedLiveIds(selectedFlashIds.length > 0 ? selectedFlashIds : resolveDefaultIds);
    } else {
      setBadgeText(DEFAULT_FLASH_BADGE);
      setTitleText(DEFAULT_FLASH_TITLE);
      setHintText(DEFAULT_FLASH_HINT);
      setShowSection(true);
      setFlashSaleEndTime('');
      setFlashSalePricesEnabled(true);
      setSelectedFlashIds(resolveDefaultIds);
    }
  };

  const parsedFlashEndMs = parseLivestreamEndMs(flashSaleEndTime);
  const isFlashEndExpired = parsedFlashEndMs !== null && Date.now() > parsedFlashEndMs;
  const isFlashWindowRunning = showSection && flashSalePricesEnabled && !isFlashEndExpired;

  const parsedLiveEndMs = parseLivestreamEndMs(livestreamSessionEndTime);
  const isLiveEndExpired = parsedLiveEndMs !== null && Date.now() > parsedLiveEndMs;
  const isLiveWindowRunning = livestreamActive && !isLiveEndExpired;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const cleanPriceRecord = (src: Record<string, string>) => {
        const out: Record<string, string> = {};
        for (const [pid, val] of Object.entries(src)) {
          const trimmed = (val || '').trim();
          if (trimmed) out[pid] = trimmed;
        }
        return out;
      };

      await onSaveShowcase({
        flagshipBadge: badgeText.trim() || DEFAULT_FLASH_BADGE,
        flagshipTitle: titleText.trim() || DEFAULT_FLASH_TITLE,
        flagshipHint: hintText.trim() || DEFAULT_FLASH_HINT,
        showFlagshipDeals: showSection,
        flagshipProductIds: selectedFlashIds,
        flashSaleEndTime: flashSaleEndTime.trim(),
        flashSalePrices: cleanPriceRecord(flashSalePricesMap),
        flashSalePricesEnabled,
        livestreamActive,
        livestreamProductIds: selectedLiveIds,
        livestreamPrices: cleanPriceRecord(livestreamPricesMap),
        livestreamSessionEndTime: livestreamSessionEndTime.trim(),
        livestreamShowDealNumbers: showDealNumbers,
        livestreamBadge: liveBadgeText.trim() || DEFAULT_LIVE_BADGE,
        livestreamTitle: liveTitleText.trim() || DEFAULT_LIVE_TITLE,
        livestreamHint: liveHintText.trim() || DEFAULT_LIVE_HINT,
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

  const livePriceCount = Object.values(livestreamPricesMap).filter((v) =>
    Boolean((v || '').trim())
  ).length;
  const flashPriceCount = Object.values(flashSalePricesMap).filter((v) =>
    Boolean((v || '').trim())
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 px-5 sm:px-6 py-4 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                isLiveTab
                  ? 'bg-rose-600 text-white'
                  : 'bg-amber-500 text-slate-950'
              }`}
            >
              {isLiveTab ? <Radio className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base sm:text-lg truncate">
                Quản lý Khu Flash Sale &amp; Khu Giá Trên Live
              </h3>
              <p className="text-xs text-slate-300 truncate">
                Tách riêng giá Flash Sale và giá Livestream — Khu Giá Trên Live chỉ hiện với khách khi bạn bật.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Mode Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="inline-flex p-1 rounded-xl bg-white border border-slate-200 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('flash_sale')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                !isLiveTab
                  ? 'bg-amber-500 text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>1. Khu Flash Sale</span>
              <span className="px-1.5 py-0.5 rounded bg-black/10 text-[10px] font-mono tabular-nums">
                {selectedFlashIds.length} SP · {flashPriceCount} giá
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('livestream')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                isLiveTab
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>2. Khu Giá Trên Live</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
                  livestreamActive
                    ? isLiveTab
                      ? 'bg-emerald-400 text-slate-950 font-black'
                      : 'bg-emerald-100 text-emerald-800'
                    : isLiveTab
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {livestreamActive ? 'ĐANG BẬT' : 'Đang tắt'} · {livePriceCount} giá
              </span>
            </button>
          </div>

          {/* Quick visibility summary on right */}
          {isLiveTab ? (
            <button
              type="button"
              onClick={() => setLivestreamActive((v) => !v)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 border cursor-pointer transition-colors ${
                livestreamActive
                  ? 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-rose-50 hover:border-rose-300'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>
                {livestreamActive
                  ? 'Khu Giá Trên Live: ĐANG BẬT (Bấm để tắt)'
                  : 'Khu Giá Trên Live: ĐANG TẮT (Bấm để bật)'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowSection((v) => !v)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border cursor-pointer transition-colors ${
                showSection
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {showSection ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showSection ? 'Khu Flash Sale: Đang HIỆN' : 'Khu Flash Sale: Đang ẨN'}</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Preview + Specific Zone Controls */}
          {isLiveTab ? (
            <>
              {/* Master Switch Callout */}
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  livestreamActive
                    ? 'bg-rose-50/70 border-rose-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Radio
                      className={`w-4 h-4 ${
                        livestreamActive ? 'text-rose-600' : 'text-slate-400'
                      }`}
                    />
                    <span>
                      {livestreamActive
                        ? 'Khách đang THẤY Khu Giá Trên Live & Giá Livestream trên trang chủ'
                        : 'Khu Giá Trên Live đang TẮT — Khách chỉ thấy Khu Flash Sale & giá thường'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Khi bạn kết thúc buổi Live và gạt TẮT, toàn bộ Khu Giá Trên Live sẽ ẩn ngay lập tức và giá sản phẩm tự động trở về Giá Flash Sale (nếu đang chạy) hoặc Giá sale thường.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setLivestreamActive((v) => !v)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-colors ${
                    livestreamActive
                      ? 'bg-slate-900 hover:bg-slate-800 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                  }`}
                >
                  {livestreamActive ? 'Tắt Khu Giá Trên Live' : 'Bật Khu Giá Trên Live ngay'}
                </button>
              </div>

              {/* Preview Stage Banner */}
              <div
                className={`p-4 rounded-2xl bg-neutral-950 border border-rose-500/40 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-opacity ${
                  livestreamActive ? 'opacity-100' : 'opacity-50'
                }`}
              >
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300">
                    <Radio className="w-3.5 h-3.5 text-rose-400" />
                    <span>{liveBadgeText || DEFAULT_LIVE_BADGE}</span>
                    <span className="text-neutral-500">·</span>
                    <span className="text-amber-300 tabular-nums">
                      {selectedProducts.length} mã trên Live
                    </span>
                  </div>
                  <div className="text-base sm:text-xl font-black tracking-tight mt-0.5">
                    {liveTitleText || DEFAULT_LIVE_TITLE}
                  </div>
                  <div className="text-xs text-neutral-300 mt-0.5">
                    {liveHintText || DEFAULT_LIVE_HINT}
                  </div>
                </div>
                <div className="text-xs font-semibold text-rose-200 bg-rose-600/25 border border-rose-400/30 rounded-xl px-3 py-1.5 shrink-0 whitespace-nowrap">
                  {livestreamSessionEndTime ? 'Có hẹn giờ tự tắt' : 'Chạy đến khi tắt tay'}
                </div>
              </div>

              {/* Livestream Texts & Timer */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      1. Nhãn trạng thái trên Live:
                    </label>
                    <input
                      type="text"
                      value={liveBadgeText}
                      onChange={(e) => setLiveBadgeText(e.target.value)}
                      placeholder={DEFAULT_LIVE_BADGE}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      2. Tiêu đề lớn Khu Giá Trên Live:
                    </label>
                    <input
                      type="text"
                      value={liveTitleText}
                      onChange={(e) => setLiveTitleText(e.target.value)}
                      placeholder={DEFAULT_LIVE_TITLE}
                      className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      3. Hướng dẫn khách chốt đơn Live:
                    </label>
                    <input
                      type="text"
                      value={liveHintText}
                      onChange={(e) => setLiveHintText(e.target.value)}
                      placeholder={DEFAULT_LIVE_HINT}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3.5 items-center">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showDealNumbers}
                      onChange={(e) => setShowDealNumbers(e.target.checked)}
                      className="w-4 h-4 accent-rose-600"
                    />
                    <span>Hiện mã số Deal (#01, #02, #03...) để khách bấm đúng mã trên Live</span>
                  </label>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                      <span>Tự ẩn Khu Live lúc (tùy chọn · để trống = bật/tắt thủ công):</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <input
                        type="datetime-local"
                        value={livestreamSessionEndTime}
                        onChange={(e) => setLivestreamSessionEndTime(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setLivestreamSessionEndTime(formatLocalDatetimeOffset(1))}
                        className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 text-[11px] font-semibold text-slate-700 cursor-pointer"
                      >
                        +1 giờ
                      </button>
                      <button
                        type="button"
                        onClick={() => setLivestreamSessionEndTime(formatLocalDatetimeOffset(2))}
                        className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 text-[11px] font-semibold text-slate-700 cursor-pointer"
                      >
                        +2 giờ
                      </button>
                      {livestreamSessionEndTime && (
                        <button
                          type="button"
                          onClick={() => setLivestreamSessionEndTime('')}
                          className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[11px] text-slate-500 cursor-pointer"
                        >
                          Xóa hẹn giờ
                        </button>
                      )}
                    </div>
                    {isLiveEndExpired && livestreamActive && (
                      <p className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
                        Giờ hẹn tự ẩn phiên Live đã qua — hãy xóa hẹn giờ hoặc bấm +1/+2 giờ.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Preview Flash Sale Banner */}
              <div
                className={`p-4 rounded-2xl bg-gradient-to-br from-rose-50 via-white to-amber-50 border border-amber-200 text-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-opacity ${
                  showSection ? 'opacity-100' : 'opacity-45'
                }`}
              >
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                    <Zap className="w-3.5 h-3.5 text-rose-600 fill-amber-400" />
                    <span>{badgeText || DEFAULT_FLASH_BADGE}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-amber-800 tabular-nums">
                      {selectedProducts.length} deal nổi bật
                    </span>
                  </div>
                  <div className="text-base sm:text-xl font-black tracking-tight mt-0.5">
                    {titleText || DEFAULT_FLASH_TITLE}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {hintText || DEFAULT_FLASH_HINT}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 font-mono font-black text-xs tabular-nums shrink-0">
                  <span className="text-slate-500 font-sans font-medium mr-1">Flash Sale:</span>
                  <span className="bg-slate-900 text-white px-2 py-1 rounded">02</span>
                  <span className="text-rose-500">:</span>
                  <span className="bg-slate-900 text-white px-2 py-1 rounded">15</span>
                  <span className="text-rose-500">:</span>
                  <span className="bg-rose-600 text-white px-2 py-1 rounded">00</span>
                </div>
              </div>

              {/* Flash Sale Texts & Timer */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      1. Dòng phụ phía trên Flash Sale:
                    </label>
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder={DEFAULT_FLASH_BADGE}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      2. Tiêu đề chính Khu Flash Sale:
                    </label>
                    <input
                      type="text"
                      value={titleText}
                      onChange={(e) => setTitleText(e.target.value)}
                      placeholder={DEFAULT_FLASH_TITLE}
                      className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      3. Mô tả ngắn Khu Flash Sale:
                    </label>
                    <input
                      type="text"
                      value={hintText}
                      onChange={(e) => setHintText(e.target.value)}
                      placeholder={DEFAULT_FLASH_HINT}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3.5 items-center">
                  <label className="flex items-center gap-2 text-xs font-semibold text-rose-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flashSalePricesEnabled}
                      onChange={(e) => setFlashSalePricesEnabled(e.target.checked)}
                      className="w-4 h-4 accent-rose-600"
                    />
                    <span>
                      Áp dụng Giá Flash Sale tạm thời (hết giờ tự động về giá sale thường)
                    </span>
                  </label>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Giờ kết thúc Flash Sale (trống = 23:59 hôm nay):</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <input
                        type="datetime-local"
                        value={flashSaleEndTime}
                        onChange={(e) => setFlashSaleEndTime(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setFlashSaleEndTime(formatLocalDatetimeOffset(2))}
                        className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-amber-50 text-[11px] font-semibold text-slate-700 cursor-pointer"
                      >
                        +2 giờ
                      </button>
                      <button
                        type="button"
                        onClick={() => setFlashSaleEndTime(formatLocalDatetimeOffset(4))}
                        className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-amber-50 text-[11px] font-semibold text-slate-700 cursor-pointer"
                      >
                        +4 giờ
                      </button>
                      {flashSaleEndTime && (
                        <button
                          type="button"
                          onClick={() => setFlashSaleEndTime('')}
                          className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[11px] text-slate-500 cursor-pointer"
                        >
                          23:59 hôm nay
                        </button>
                      )}
                    </div>
                    {isFlashEndExpired && (
                      <p className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
                        Đã hết giờ Flash Sale — khách đang thấy giá bán thường. Bấm +2 giờ hoặc +4 giờ để mở phiên mới.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Product Picker & Per-Tier Price Editor */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Selected Products for active Tab */}
            <div className="lg:col-span-6 border border-slate-200 rounded-xl flex flex-col overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {isLiveTab
                      ? `Sản phẩm trong Khu Giá Trên Live (${selectedProducts.length})`
                      : `Sản phẩm trong Khu Flash Sale (${selectedProducts.length})`}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {isLiveTab
                      ? 'Nhập Giá Livestream riêng cho từng món (ưu tiên cao nhất khi đang Live).'
                      : 'Nhập Giá Flash Sale riêng (tự về giá thường khi hết giờ Flash Sale).'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {isLiveTab ? (
                    <>
                      <button
                        type="button"
                        onClick={handlePickPricedLiveProducts}
                        className="px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>SP đã cài giá Live</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedLiveIds([...selectedFlashIds])}
                        className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Chép từ Flash Sale</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handlePickDiscountedDeals}
                        className="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Chọn SP đang sale</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedFlashIds(resolveDefaultIds)}
                        className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold cursor-pointer"
                      >
                        Mặc định (6 món)
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="p-3 space-y-2.5 max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                {selectedProducts.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-500">
                    Chưa chọn sản phẩm nào. Hãy bấm <strong>+ Thêm</strong> ở cột bên phải.
                  </div>
                ) : (
                  selectedProducts.map((p, idx) => {
                    const priceMap = isLiveTab ? livestreamPricesMap : flashSalePricesMap;
                    const setPriceMap = isLiveTab
                      ? setLivestreamPricesMap
                      : setFlashSalePricesMap;
                    const inputVal = priceMap[p.id] || '';
                    const hasVal = inputVal.trim().length > 0;
                    const flashReference = (flashSalePricesMap[p.id] || '').trim();

                    return (
                      <div key={p.id} className="pt-2.5 first:pt-0 space-y-2">
                        <div className="flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-5 h-5 rounded font-mono text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                isLiveTab
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
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
                                <span>
                                  Sale thường:{' '}
                                  <strong className="text-slate-800 tabular-nums">
                                    {p.effectiveProgramPrice}
                                  </strong>
                                </span>
                                {isLiveTab && flashReference && (
                                  <span>
                                    · Flash Sale:{' '}
                                    <strong className="text-amber-700 tabular-nums">
                                      {flashReference}
                                    </strong>
                                  </span>
                                )}
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
                                title="Sửa giá gốc / sale thường sản phẩm này"
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

                        {/* Inline Price Input for active tier */}
                        <div className="pl-7 pr-1 flex flex-col sm:flex-row sm:items-center gap-1.5">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={inputVal}
                              onChange={(e) =>
                                setPriceMap((prev) => ({
                                  ...prev,
                                  [p.id]: e.target.value,
                                }))
                              }
                              placeholder={
                                isLiveTab
                                  ? `Giá trên Live (trống = giữ ${flashReference || p.effectiveProgramPrice})`
                                  : `Giá Flash Sale (trống = giữ ${p.effectiveProgramPrice})`
                              }
                              className={`w-full pl-2.5 pr-7 py-1.5 text-xs font-bold rounded-lg focus:outline-none focus:ring-2 tabular-nums ${
                                isLiveTab
                                  ? 'text-rose-700 bg-rose-50/70 border border-rose-200 focus:ring-rose-500/20 focus:border-rose-400'
                                  : 'text-amber-900 bg-amber-50/70 border border-amber-200 focus:ring-amber-500/20 focus:border-amber-400'
                              }`}
                            />
                            {hasVal && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPriceMap((prev) => {
                                    const next = { ...prev };
                                    delete next[p.id];
                                    return next;
                                  })
                                }
                                title="Xóa giá riêng này"
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          {hasVal && (
                            <span
                              className={`text-[10px] font-semibold whitespace-nowrap ${
                                isLiveTab
                                  ? isLiveWindowRunning
                                    ? 'text-rose-600'
                                    : 'text-slate-500'
                                  : isFlashWindowRunning
                                  ? 'text-amber-700'
                                  : 'text-slate-500'
                              }`}
                            >
                              {isLiveTab
                                ? isLiveWindowRunning
                                  ? 'Đang áp dụng giá Live'
                                  : 'Tắt Live → về Flash/Thường'
                                : isFlashWindowRunning
                                ? `Đang giảm → hết giờ về ${p.effectiveProgramPrice}`
                                : `Chưa chạy/hết giờ → hiện ${p.effectiveProgramPrice}`}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
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

              <div className="p-3 space-y-2 max-h-[320px] overflow-y-auto divide-y divide-slate-100">
                {catalogSearchResults.map((p) => {
                  const isPicked = currentSelectedIds.includes(p.id);
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
              onClick={handleResetTabDefaults}
              className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>
                {isLiveTab ? 'Khôi phục mặc định Khu Live' : 'Khôi phục mặc định Flash Sale'}
              </span>
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
                    : 'Lưu cả 2 khu ngay'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
