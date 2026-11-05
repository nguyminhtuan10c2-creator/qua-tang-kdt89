import React, { useMemo } from 'react';
import {
  ShieldCheck,
  Package,
  Truck,
  CheckCircle2,
  PhoneCall,
  ShoppingCart,
  ShoppingBag,
  Camera,
  Tv,
  Eye,
  EyeOff,
  Tag,
  Pencil,
  Star,
  Flame,
  Gift,
} from 'lucide-react';
import { ProductItem } from '../data/products';

interface ProductCardProps {
  product: ProductItem;
  onSelect: (product: ProductItem) => void;
  onBuyProduct?: (product: ProductItem) => void;
  onConsultProduct?: (product: ProductItem) => void;
  onOpenImageUpdater?: (product: ProductItem) => void;
  onOpenPriceEditor?: (product: ProductItem) => void;
  onEditProduct?: (product: ProductItem) => void;
  onDeleteProduct?: (productId: string) => void;
  customPrice?: { programPrice?: string; referencePrice?: string };
  customImage?: string;
  isSelected?: boolean;
  isAdmin?: boolean;
  isHidden?: boolean;
  onToggleHide?: (product: ProductItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onBuyProduct,
  onConsultProduct,
  onOpenImageUpdater,
  onOpenPriceEditor,
  onEditProduct,
  onDeleteProduct,
  customPrice,
  customImage,
  isSelected,
  isAdmin = false,
  isHidden = false,
  onToggleHide,
}) => {
  // If not admin and product is marked as hidden, do not render to regular customers
  if (!isAdmin && isHidden) {
    return null;
  }

  const programPriceStr = customPrice?.programPrice || product.programPrice;
  const referencePriceStr = customPrice?.referencePrice || product.referencePrice;

  // Calculate discount percent if available
  const discountPercent = useMemo(() => {
    const parseNum = (str: string): number | null => {
      if (!str) return null;
      const digitsOnly = str.replace(/[^\d]/g, '');
      if (digitsOnly.length >= 5) {
        const val = parseInt(digitsOnly, 10);
        if (val >= 50000) return val;
      }
      const trieuMatch = str.match(/(\d+(?:[.,]\d+)?)\s*(?:tr|triệu)/i);
      if (trieuMatch) {
        return Math.round(parseFloat(trieuMatch[1].replace(',', '.')) * 1000000);
      }
      return null;
    };
    const prog = parseNum(programPriceStr);
    const ref = parseNum(referencePriceStr);
    if (prog && ref && ref > prog) {
      return Math.round(((ref - prog) / ref) * 100);
    }
    // Fallback based on text if contains -XX%
    const tagMatch = product.highlightTag?.match(/-(\d+)%/);
    if (tagMatch) return parseInt(tagMatch[1], 10);
    return null;
  }, [programPriceStr, referencePriceStr, product.highlightTag]);

  // Compute realistic rating, sold count, and slot urgency bar (matching Điện Máy Xanh)
  const meta = useMemo(() => {
    // Generate stable deterministic pseudo-data based on product id
    let hash = 0;
    for (let i = 0; i < product.id.length; i++) {
      hash = (hash << 5) - hash + product.id.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);

    // Rating: 4.8 to 5.0
    const rating = (4.8 + (absHash % 3) * 0.1).toFixed(absHash % 2 === 0 ? 0 : 1);

    // Sold count: e.g. 245, 1,2k, 3,8k, 11,2k
    const soldPool = ['245', '1,2k', '3,8k', '5,6k', '11,2k', '890', '4,5k'];
    const sold = soldPool[absHash % soldPool.length];

    // Slots: taken / 5
    const takenSlots = 2 + (absHash % 4); // 2, 3, 4, or 5
    const totalSlots = 5;

    // Feature badge like "Tủ lạnh inverter tiết kiệm điện", "Đồng hồ thông minh", etc.
    let featureBadge = '';
    if (product.category === 'televisions') {
      featureBadge = 'Smart TV 4K hình ảnh siêu nét';
    } else if (product.category === 'air_conditioners') {
      featureBadge = 'Máy lạnh inverter tiết kiệm điện';
    } else if (product.category === 'kitchen_stoves') {
      featureBadge = 'Bếp từ đôi công nghệ tiết kiệm điện';
    } else if (product.category === 'water_heaters') {
      featureBadge = 'Bình nước nóng an toàn chống giật';
    } else {
      featureBadge = 'Gia dụng chính hãng tiện ích';
    }

    // Gift promo ribbon like "TẶNG BÌNH ĐUN...", "TẶNG MÁY HÚT BỤI RAPIDO..."
    let giftPromo = '';
    if (product.highlightTag && product.highlightTag.toLowerCase().includes('tặng')) {
      giftPromo = product.highlightTag;
    } else if (absHash % 3 === 0) {
      giftPromo = 'TẶNG BÌNH ĐUN TRỊ GIÁ 390.000Đ';
    } else if (absHash % 3 === 1) {
      giftPromo = 'TẶNG MÁY HÚT BỤI RAPIDO 1.020.000Đ';
    } else {
      giftPromo = 'BẢO HÀNH CHÍNH HÃNG 24 THÁNG';
    }

    return {
      rating,
      sold,
      takenSlots,
      totalSlots,
      featureBadge,
      giftPromo,
    };
  }, [product.id, product.category, product.highlightTag]);

  // Category-specific visual icon/illustration fallback
  const renderProductIllustration = () => {
    switch (product.category) {
      case 'rice_cooker_appliances':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100/50 p-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-orange-200/60 flex items-center justify-center text-orange-600 mb-2">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 11h16a1 1 0 0 1 1 1v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-6a1 1 0 0 1 1-1Z" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                <line x1="12" y1="15" x2="12" y2="17" />
              </svg>
            </div>
            <span className="text-[10px] font-medium text-amber-900 tracking-tight">Thiết bị gia dụng</span>
          </div>
        );
      case 'kitchen_stoves':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 to-red-100/40 p-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-rose-200/60 flex items-center justify-center text-rose-600 mb-2">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="14" rx="2" />
                <circle cx="8" cy="13" r="3" />
                <circle cx="16" cy="13" r="3" />
                <line x1="12" y1="6" x2="12" y2="20" />
              </svg>
            </div>
            <span className="text-[10px] font-medium text-rose-900 tracking-tight">Bếp nấu hiện đại</span>
          </div>
        );
      case 'water_heaters':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100/50 p-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-sky-200/60 flex items-center justify-center text-sky-600 mb-2">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4" />
                <rect x="6" y="6" width="12" height="15" rx="3" />
                <path d="M10 12h4" />
                <circle cx="12" cy="16" r="1" />
              </svg>
            </div>
            <span className="text-[10px] font-medium text-sky-900 tracking-tight">Máy nước nóng</span>
          </div>
        );
      case 'air_conditioners':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-100/40 p-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-teal-200/60 flex items-center justify-center text-teal-600 mb-2">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="9" rx="2" />
                <line x1="6" y1="12" x2="18" y2="12" />
                <path d="M6 18c1-1 2-1 3 0s2 1 3 0 2-1 3 0 2 1 3 0" />
              </svg>
            </div>
            <span className="text-[10px] font-medium text-teal-900 tracking-tight">Máy lạnh làm mát</span>
          </div>
        );
      case 'televisions':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100/40 p-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-indigo-200/60 flex items-center justify-center text-indigo-600 mb-2">
              <Tv className="w-8 h-8" />
            </div>
            <span className="text-[10px] font-medium text-indigo-900 tracking-tight">Smart Tivi</span>
          </div>
        );
      default:
        return null;
    }
  };

  const imageSrc = customImage || product.imageUrl;

  return (
    <div
      className={`group flex flex-col rounded-2xl bg-white border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md h-full justify-between ${
        isHidden
          ? 'border-amber-400 bg-amber-50/15 ring-2 ring-amber-400/30'
          : isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/20'
          : 'border-neutral-200 hover:border-neutral-300'
      }`}
    >
      {/* =========================================================================
          TOP: PRODUCT IMAGE + PROMO GIFTS (CHUẨN ĐIỆN MÁY XANH)
         ========================================================================= */}
      <div className="relative aspect-square w-full bg-white flex items-center justify-center overflow-hidden p-2 border-b border-neutral-100">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            className={`w-full h-full object-contain transition-transform duration-300 ${
              isHidden ? 'grayscale-[40%] group-hover:scale-100' : 'group-hover:scale-105'
            }`}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          renderProductIllustration()
        )}

        {/* Feature Pill tag on image (e.g. Inverter tiết kiệm điện) */}
        {meta.featureBadge && (
          <div className="absolute top-2 left-2 z-10 bg-neutral-100/90 backdrop-blur-xs text-neutral-600 text-[9px] sm:text-[10px] font-medium px-2 py-0.5 rounded-full border border-neutral-200 shadow-2xs max-w-[85%] truncate">
            {meta.featureBadge}
          </div>
        )}

        {/* Top-Right: Admin Controls / Model tag */}
        {isAdmin ? (
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
            {isHidden ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleHide?.(product);
                }}
                className="px-2 py-0.5 rounded-lg bg-amber-600 hover:bg-emerald-600 text-white text-[10px] font-bold shadow-xs transition-all cursor-pointer"
                title="Bấm để Hiện lại sản phẩm"
              >
                Đã ẩn
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleHide?.(product);
                }}
                className="px-1.5 py-0.5 rounded bg-neutral-900/80 hover:bg-rose-600 text-neutral-200 hover:text-white text-[10px] font-medium flex items-center gap-0.5 shadow-xs transition-colors cursor-pointer"
                title="Quyền Admin: Ẩn món này khỏi khách hàng"
              >
                <EyeOff className="w-3 h-3 text-amber-300" />
                <span>Ẩn</span>
              </button>
            )}
          </div>
        ) : null}

        {/* Gift Banner at bottom of Image (Red ribbon with gift text - chuẩn Điện Máy Xanh) */}
        {meta.giftPromo && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white text-[9px] sm:text-[10px] font-bold py-1 px-2 flex items-center justify-center gap-1 text-center shadow-xs z-10">
            <span className="shrink-0">🎁</span>
            <span className="truncate uppercase font-black tracking-tight">{meta.giftPromo}</span>
          </div>
        )}

        {/* Quick Camera Update Button - ONLY for Admin */}
        {isAdmin && onOpenImageUpdater && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenImageUpdater(product);
            }}
            className="absolute bottom-6 right-2 px-1.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all flex items-center gap-0.5 text-[9px] font-bold cursor-pointer active:scale-95 z-20"
            title="Quyền Admin: Đổi ảnh"
          >
            <Camera className="w-3 h-3 text-white shrink-0" />
            <span>Ảnh</span>
          </button>
        )}
      </div>

      {/* =========================================================================
          BODY: PRODUCT INFORMATION (Y HỆT ẢNH CHỤP ĐIỆN MÁY XANH)
         ========================================================================= */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
        <div>
          {/* Admin Hidden notice */}
          {isAdmin && isHidden && (
            <div className="mb-1.5 p-1 rounded bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold flex items-center justify-between">
              <span className="flex items-center gap-1">
                <EyeOff className="w-3 h-3 text-amber-700" />
                <span>Đã ẩn với khách</span>
              </span>
              <button
                type="button"
                onClick={() => onToggleHide?.(product)}
                className="underline text-emerald-800"
              >
                Hiện
              </button>
            </div>
          )}

          {/* Product Name (2 lines, clean sans font) */}
          <h3
            className="font-medium sm:font-semibold text-xs sm:text-sm text-neutral-800 line-clamp-2 leading-snug min-h-[34px] sm:min-h-[40px]"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Price Hierarchy (Chuẩn Điện Máy Xanh: Bold red program price + Strikethrough reference price & -XX%) */}
          <div className="mt-1.5 sm:mt-2">
            <div className="text-sm sm:text-lg font-bold text-red-600 font-sans tracking-tight leading-none">
              {programPriceStr}
            </div>

            <div className="flex items-center gap-1 mt-1 text-[11px] sm:text-xs">
              <span className="text-neutral-400 line-through">
                {referencePriceStr}
              </span>
              {discountPercent !== null && discountPercent > 0 && (
                <span className="font-bold text-red-600">
                  -{discountPercent}%
                </span>
              )}
            </div>
          </div>

          {/* Rating & Sold count: ★ 5 • Đã bán 3,8k */}
          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-neutral-600 font-medium">
            <span className="flex items-center text-amber-500 font-bold">
              ★ {meta.rating}
            </span>
            <span className="text-neutral-300">•</span>
            <span>Đã bán {meta.sold}</span>
          </div>

          {/* Fire Urgency Slot Bar: 🔥 3/5 Suất (Chuẩn ảnh Điện Máy Xanh) */}
          <div className="mt-2">
            <div className="bg-amber-100/90 rounded-full h-4 sm:h-4.5 relative overflow-hidden flex items-center border border-amber-200/80">
              <div
                className="bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (meta.takenSlots / meta.totalSlots) * 100)}%`,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-neutral-900 leading-none gap-1">
                <span>🔥</span>
                <span>{meta.takenSlots}/{meta.totalSlots} Suất</span>
              </div>
            </div>
          </div>

          {/* Admin Edit Price/Info Row */}
          {isAdmin && (
            <div className="mt-2 pt-1.5 border-t border-neutral-150 grid grid-cols-2 gap-1">
              {onOpenPriceEditor && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPriceEditor(product);
                  }}
                  className="py-1 px-1.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                  title="Sửa giá"
                >
                  <Tag className="w-3 h-3 text-amber-800" />
                  <span>Sửa giá</span>
                </button>
              )}
              {onEditProduct && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditProduct(product);
                  }}
                  className="py-1 px-1.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                  title="Đổi tên/kho"
                >
                  <Pencil className="w-3 h-3 text-neutral-700" />
                  <span>Đổi kho</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* =========================================================================
            BOTTOM ACTION BUTTONS: MUA NGAY (NỀN XANH DƯƠNG NHẠT CHUẨN ĐMX 100% NHƯ ẢNH)
           ========================================================================= */}
        <div className="mt-3 pt-2 border-t border-neutral-100">
          <div className="flex items-center gap-1.5">
            {/* Primary Action Button: "Mua ngay" (Full-width light blue button matching user screenshot) */}
            <button
              type="button"
              onClick={() => {
                if (onBuyProduct) {
                  onBuyProduct(product);
                } else if (onConsultProduct) {
                  onConsultProduct(product);
                } else {
                  onSelect(product);
                }
              }}
              className="w-full py-2 sm:py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold text-[#1d79e8] bg-[#eef6ff] hover:bg-blue-100 border border-blue-200/70 active:scale-[0.98] transition-all flex items-center justify-center gap-1 text-center cursor-pointer shadow-2xs hover:shadow-xs"
              title="Đặt mua sản phẩm này ngay - Giao tận nhà kiểm tra mới thanh toán"
            >
              <span>Mua ngay</span>
            </button>

            {/* Desktop Quick Consultation button */}
            {onConsultProduct && (
              <button
                type="button"
                onClick={() => onConsultProduct(product)}
                className="hidden sm:flex p-2 sm:p-2.5 rounded-xl text-neutral-600 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 active:scale-95 transition-all cursor-pointer shrink-0"
                title="Tư vấn thêm qua Zalo / Điện thoại"
              >
                <PhoneCall className="w-3.5 h-3.5 text-neutral-700" />
              </button>
            )}

            {/* Desktop Cart toggle button */}
            <button
              type="button"
              onClick={() => onSelect(product)}
              className={`hidden sm:flex p-2 sm:p-2.5 rounded-xl border active:scale-95 transition-all cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border-neutral-200'
              }`}
              title={isSelected ? 'Đã thêm vào giỏ hàng' : 'Thêm vào giỏ hàng'}
            >
              {isSelected ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              ) : (
                <ShoppingCart className="w-3.5 h-3.5 text-neutral-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
