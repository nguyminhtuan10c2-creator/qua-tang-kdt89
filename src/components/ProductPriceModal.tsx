import React, { useState, useEffect } from 'react';
import { X, DollarSign, Tag, Check, RotateCcw, AlertCircle, Sparkles } from 'lucide-react';
import { PRODUCTS, ProductItem } from '../data/products';

export interface CustomPrice {
  programPrice?: string;
  referencePrice?: string;
}

interface ProductPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProduct: ProductItem | null;
  customPrices: Record<string, CustomPrice>;
  onSavePrice: (productId: string, price: CustomPrice) => void;
  onResetPrice: (productId: string) => void;
}

export const ProductPriceModal: React.FC<ProductPriceModalProps> = ({
  isOpen,
  onClose,
  targetProduct,
  customPrices,
  onSavePrice,
  onResetPrice,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    targetProduct?.id || PRODUCTS[0]?.id || ''
  );
  const [programPriceInput, setProgramPriceInput] = useState<string>('');
  const [referencePriceInput, setReferencePriceInput] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (targetProduct) {
      setSelectedProductId(targetProduct.id);
    }
  }, [targetProduct]);

  const currentProduct =
    PRODUCTS.find((p) => p.id === selectedProductId) || targetProduct || PRODUCTS[0];

  useEffect(() => {
    if (currentProduct) {
      const existing = customPrices[currentProduct.id];
      setProgramPriceInput(existing?.programPrice ?? currentProduct.programPrice);
      setReferencePriceInput(existing?.referencePrice ?? currentProduct.referencePrice);
    }
  }, [selectedProductId, customPrices, currentProduct]);

  if (!isOpen || !currentProduct) return null;

  const hasCustomPrice = !!customPrices[currentProduct.id];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePrice(currentProduct.id, {
      programPrice: programPriceInput.trim(),
      referencePrice: referencePriceInput.trim(),
    });
    setSuccessMsg(`Đã cập nhật giá mới cho "${currentProduct.name}"!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleReset = () => {
    onResetPrice(currentProduct.id);
    setProgramPriceInput(currentProduct.programPrice);
    setReferencePriceInput(currentProduct.referencePrice);
    setSuccessMsg(`Đã khôi phục giá gốc mặc định.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const filteredProducts = PRODUCTS.filter((p) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.modelCode && p.modelCode.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-neutral-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Cập nhật giá sản phẩm KDT-89
              </h3>
              <p className="text-xs text-neutral-400">
                Giá chương trình (Màu đỏ, to hơn) & Giá niêm yết (Gạch ngang đen)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* Product selected banner */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block mb-1">
              {currentProduct.categoryLabel}
            </span>
            <h4 className="font-bold text-sm sm:text-base text-neutral-900 leading-snug">
              {currentProduct.name}
            </h4>
            {currentProduct.modelCode && (
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-neutral-200/80 font-mono text-[11px] font-bold text-neutral-800">
                Model: {currentProduct.modelCode}
              </span>
            )}
          </div>

          {/* Form edit price */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-3">
              {/* Program price (red, bigger) */}
              <div>
                <label className="block text-xs font-bold text-rose-700 mb-1">
                  Giá chương trình 20/10 (Hiển thị to hơn, MÀU ĐỎ):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={programPriceInput}
                    onChange={(e) => setProgramPriceInput(e.target.value)}
                    placeholder="VD: [Giá thợ ~1.250k] hoặc 1.250.000đ"
                    className="w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-rose-300 bg-rose-50/40 text-sm font-bold text-rose-600 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                    required
                  />
                  <span className="absolute right-3 top-3 text-[11px] text-rose-700 font-bold uppercase">
                    Màu đỏ to
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className="text-[10px] text-neutral-500">Mẫu nhanh:</span>
                  <button
                    type="button"
                    onClick={() => setProgramPriceInput('[Giá thợ ưu đãi]')}
                    className="text-[10px] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded"
                  >
                    [Giá thợ ưu đãi]
                  </button>
                  <button
                    type="button"
                    onClick={() => setProgramPriceInput('[Giá thợ cực rẻ]')}
                    className="text-[10px] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded"
                  >
                    [Giá thợ cực rẻ]
                  </button>
                  <button
                    type="button"
                    onClick={() => setProgramPriceInput('[Liên hệ Sale]')}
                    className="text-[10px] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded"
                  >
                    [Liên hệ Sale]
                  </button>
                </div>
              </div>

              {/* Reference price (black strikethrough) */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Giá niêm yết / Giá bán gốc (Hiển thị GẠCH NGANG MÀU ĐEN):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={referencePriceInput}
                    onChange={(e) => setReferencePriceInput(e.target.value)}
                    placeholder="VD: 1.890.000đ hoặc [Giá hãng 2.200k]"
                    className="w-full pl-3.5 pr-28 py-2.5 rounded-xl border border-neutral-300 text-sm font-semibold text-neutral-900 outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-700"
                    required
                  />
                  <span className="absolute right-3 top-3 text-[11px] text-neutral-800 font-semibold line-through">
                    Gạch ngang đen
                  </span>
                </div>
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
              <span className="text-[11px] font-bold text-amber-900 block mb-2">
                👁️ Xem trước hiển thị trên thẻ sản phẩm:
              </span>
              <div className="p-3 rounded-xl bg-white border border-rose-100 flex items-center justify-between gap-3 shadow-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">
                    Giá 20/10:
                  </span>
                  <span className="text-base sm:text-lg font-extrabold text-rose-600 font-mono tabular-nums leading-tight">
                    {programPriceInput || currentProduct.programPrice}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-neutral-500 block">Giá niêm yết:</span>
                  <span className="text-xs sm:text-sm font-semibold text-neutral-900 line-through decoration-neutral-900 decoration-1.5 font-mono tabular-nums">
                    {referencePriceInput || currentProduct.referencePrice}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Lưu giá mới</span>
              </button>

              {hasCustomPrice && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-3 px-3.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-xs transition-all cursor-pointer flex items-center gap-1"
                  title="Khôi phục giá mặc định ban đầu của sản phẩm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi phục giá gốc</span>
                </button>
              )}
            </div>
          </form>

          {/* Quick Product Switcher */}
          <div className="pt-3 border-t border-neutral-200">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-neutral-700">
                Chọn nhanh sản phẩm khác để sửa giá ({PRODUCTS.length} món):
              </span>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Tìm model..."
                className="w-36 px-2.5 py-1 text-xs border border-neutral-300 rounded-lg outline-none"
              />
            </div>

            <div className="max-h-44 overflow-y-auto space-y-1 p-1 bg-neutral-50 rounded-xl border border-neutral-200">
              {filteredProducts.map((p) => {
                const isSelected = p.id === currentProduct.id;
                const hasCustom = !!customPrices[p.id];
                const progPrice = customPrices[p.id]?.programPrice ?? p.programPrice;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProductId(p.id);
                      setSuccessMsg('');
                    }}
                    className={`w-full p-2 rounded-lg text-left text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-900 text-white font-bold shadow-xs'
                        : 'bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200/60'
                    }`}
                  >
                    <div className="truncate flex-1">
                      <span>{p.name}</span>
                      {p.modelCode && (
                        <span className={`ml-1 text-[10px] ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                          ({p.modelCode})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[11px] font-bold ${isSelected ? 'text-rose-300' : 'text-rose-600'}`}>
                        {progPrice}
                      </span>
                      {hasCustom && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500 text-neutral-950 font-black text-[9px]">
                          Đã sửa
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-100 border-t border-neutral-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-neutral-500 italic">
            * Giá đã sửa được lưu tự động trên hệ thống.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
