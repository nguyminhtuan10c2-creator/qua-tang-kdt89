import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Trash2, Camera, Upload, Sparkles, Tag, ShieldCheck, Box } from 'lucide-react';
import { ProductItem, CATEGORIES, BUDGET_TIERS } from '../data/products';
import { compressImageFile } from '../lib/firebase';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProduct: (product: ProductItem) => void;
  onDeleteProduct?: (productId: string) => void;
  initialProduct?: ProductItem | null;
  mode: 'add' | 'edit';
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSaveProduct,
  onDeleteProduct,
  initialProduct,
  mode,
}) => {
  const [name, setName] = useState('');
  const [modelCode, setModelCode] = useState('');
  const [category, setCategory] = useState<ProductItem['category']>('air_conditioners');
  const [budgetTier, setBudgetTier] = useState<ProductItem['budgetTier']>('>4m');
  const [programPrice, setProgramPrice] = useState('');
  const [referencePrice, setReferencePrice] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [stockCountNumber, setStockCountNumber] = useState<number | undefined>(undefined);
  const [warranty, setWarranty] = useState('[Chính hãng 24 tháng]');
  const [deliveryCondition, setDeliveryCondition] = useState('');
  const [highlightTag, setHighlightTag] = useState('');
  const [practicalValue, setPracticalValue] = useState('');
  const [specs, setSpecs] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (initialProduct && mode === 'edit') {
      setName(initialProduct.name || '');
      setModelCode(initialProduct.modelCode || '');
      setCategory(initialProduct.category || 'air_conditioners');
      setBudgetTier(initialProduct.budgetTier || '>4m');
      setProgramPrice(initialProduct.programPrice || '');
      setReferencePrice(initialProduct.referencePrice || '');
      setStockStatus(initialProduct.stockStatus || 'Sẵn kho tại KDT-89');
      setStockCountNumber(initialProduct.stockCountNumber);
      setWarranty(initialProduct.warranty || '[Chính hãng]');
      setDeliveryCondition(initialProduct.deliveryCondition || 'Giao nhanh tại kho KDT-89');
      setHighlightTag(initialProduct.highlightTag || '');
      setPracticalValue(initialProduct.practicalValue || '');
      setSpecs(initialProduct.specs || '');
      setImageUrl(initialProduct.imageUrl || '');
    } else {
      // Defaults for adding new product
      setName('');
      setModelCode('');
      setCategory('air_conditioners');
      setBudgetTier('>4m');
      setProgramPrice('[Liên hệ Sale nhận giá thợ]');
      setReferencePrice('[Giá hãng]');
      setStockStatus('Sẵn kho số lượng lớn');
      setStockCountNumber(10);
      setWarranty('[Chính hãng 24 tháng]');
      setDeliveryCondition('Giá chương trình đã bao gồm hỗ trợ giao lắp theo khu vực');
      setHighlightTag('Mới về kho KDT-89');
      setPracticalValue('Món quà thiết thực chất lượng cao cho gia đình.');
      setSpecs('Tiết kiệm điện · Vận hành êm ái · Bảo hành chính hãng');
      setImageUrl('');
    }
    setConfirmDelete(false);
  }, [initialProduct, mode, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressed = await compressImageFile(file, 900, 0.82);
      setImageUrl(compressed);
    } catch (err) {
      console.error('Lỗi nén ảnh:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const categoryObj = CATEGORIES.find((c) => c.id === category);
    const budgetObj = BUDGET_TIERS.find((b) => b.id === budgetTier);

    const productId = initialProduct?.id || `prod-custom-${Date.now()}`;

    const updatedProduct: ProductItem = {
      id: productId,
      name: name.trim(),
      modelCode: modelCode.trim() || undefined,
      category,
      categoryLabel: categoryObj?.name || 'Sản phẩm',
      budgetTier,
      budgetLabel: budgetObj?.range || 'Mọi mức giá',
      programPrice: programPrice.trim() || '[Liên hệ Sale]',
      referencePrice: referencePrice.trim() || '[Giá hãng]',
      stockStatus: stockStatus.trim() || 'Sẵn kho',
      stockCountNumber: stockCountNumber ? Number(stockCountNumber) : undefined,
      warranty: warranty.trim() || '[Chính hãng]',
      deliveryCondition: deliveryCondition.trim() || 'Hàng sẵn kho KDT-89',
      highlightTag: highlightTag.trim() || undefined,
      practicalValue: practicalValue.trim() || 'Món quà thiết thực cho gia đình.',
      specs: specs.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    };

    onSaveProduct(updatedProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-neutral-900 via-neutral-800 to-rose-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              {mode === 'add' ? <Plus className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {mode === 'add' ? 'Thêm sản phẩm mới' : 'Sửa thông tin sản phẩm'}
              </h3>
              <p className="text-xs text-neutral-300">
                {mode === 'add'
                  ? 'Thêm máy lạnh, tivi, bếp hoặc gia dụng vào kho hàng'
                  : `Đổi tên, model, giá hoặc xóa món: ${initialProduct?.name}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Tên sản phẩm & Mã Model */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Tên sản phẩm <span className="text-rose-600">*</span>:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Máy lạnh Coocaa Inverter 1.0 HP"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm font-semibold text-neutral-900 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Mã Model:
              </label>
              <input
                type="text"
                value={modelCode}
                onChange={(e) => setModelCode(e.target.value)}
                placeholder="VD: Coocaa 32Z73"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-mono text-sm font-bold text-neutral-900 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
              />
            </div>
          </div>

          {/* Danh mục & Mức giá */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Danh mục:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductItem['category'])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm font-medium text-neutral-900 bg-white outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Phân khúc ngân sách:
              </label>
              <select
                value={budgetTier}
                onChange={(e) => setBudgetTier(e.target.value as ProductItem['budgetTier'])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm font-medium text-neutral-900 bg-white outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
              >
                <option value="<1m">Dưới 1 triệu</option>
                <option value="1m-2m">1 – 2 triệu</option>
                <option value="2m-4m">2 – 4 triệu</option>
                <option value=">4m">Trên 4 triệu</option>
              </select>
            </div>
          </div>

          {/* Giá chương trình & Giá niêm yết */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200">
            <div>
              <label className="block text-xs font-bold text-rose-700 mb-1">
                Giá chương trình (Màu đỏ, nổi bật):
              </label>
              <input
                type="text"
                value={programPrice}
                onChange={(e) => setProgramPrice(e.target.value)}
                placeholder="VD: [Giá thợ ~4.850k] hoặc 4.850.000đ"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-rose-300 bg-white font-bold text-rose-600 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Giá niêm yết (Gạch ngang đen):
              </label>
              <input
                type="text"
                value={referencePrice}
                onChange={(e) => setReferencePrice(e.target.value)}
                placeholder="VD: 6.200.000đ hoặc [Giá hãng]"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 bg-white font-semibold text-neutral-800 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
              />
            </div>
          </div>

          {/* Kho sẵn & Bảo hành */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Số lượng kho sẵn:
              </label>
              <input
                type="text"
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value)}
                placeholder="VD: Sẵn kho: 10 bộ"
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-sm font-medium text-neutral-900 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Chế độ bảo hành:
              </label>
              <input
                type="text"
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                placeholder="VD: [Chính hãng 24 tháng]"
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-sm font-medium text-neutral-900 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
              />
            </div>
          </div>

          {/* Thông số kỹ thuật & Tag nổi bật */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Thông số tóm tắt:
              </label>
              <input
                type="text"
                value={specs}
                onChange={(e) => setSpecs(e.target.value)}
                placeholder="VD: 1.0 HP Inverter · Gas R32 · Tự làm sạch"
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-900 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Tag nổi bật góc ảnh:
              </label>
              <input
                type="text"
                value={highlightTag}
                onChange={(e) => setHighlightTag(e.target.value)}
                placeholder="VD: Bán chạy nhất · Tiết kiệm điện"
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-900 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
              />
            </div>
          </div>

          {/* Điều kiện giao nhận / lắp đặt */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1">
              Điều kiện giao hàng / lắp đặt:
            </label>
            <input
              type="text"
              value={deliveryCondition}
              onChange={(e) => setDeliveryCondition(e.target.value)}
              placeholder="VD: Giá chương trình đã bao gồm hỗ trợ giao lắp theo khu vực áp dụng"
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-800 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
            />
          </div>

          {/* Giá trị món quà / Mô tả */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1">
              Lời giới thiệu ý nghĩa / Giá trị thực tế:
            </label>
            <textarea
              rows={2}
              value={practicalValue}
              onChange={(e) => setPracticalValue(e.target.value)}
              placeholder="VD: Máy lạnh làm mát êm dịu, mẹ và con không bị khô mũi họng..."
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-800 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 resize-none"
            />
          </div>

          {/* Hình ảnh sản phẩm */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200">
            <label className="block text-xs font-bold text-neutral-800 mb-2">
              Hình ảnh sản phẩm:
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {imageUrl ? (
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-neutral-200 bg-white shrink-0 relative">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-neutral-900/80 text-white flex items-center justify-center text-[10px]"
                    title="Xóa ảnh"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center text-neutral-400 shrink-0">
                  <Box className="w-6 h-6" />
                  <span className="text-[9px]">Chưa có ảnh</span>
                </div>
              )}

              <div className="flex-1 w-full space-y-2">
                <div className="flex gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs transition-colors">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{isCompressing ? 'Đang nén ảnh...' : 'Tải ảnh từ điện thoại/máy tính'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isCompressing}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Hoặc dán trực tiếp đường link ảnh (https://...)"
                  className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-mono text-neutral-700 bg-white outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-neutral-200">
            {mode === 'edit' && onDeleteProduct && (
              <div>
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa sản phẩm này</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-700 font-bold">Chắc chắn xóa?</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (initialProduct?.id) {
                          onDeleteProduct(initialProduct.id);
                          onClose();
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer shadow-xs"
                    >
                      Xóa vĩnh viễn
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1.5 rounded-lg bg-neutral-100 text-neutral-600 text-xs hover:bg-neutral-200 cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-100 text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{mode === 'add' ? 'Thêm vào kho' : 'Lưu thay đổi'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
