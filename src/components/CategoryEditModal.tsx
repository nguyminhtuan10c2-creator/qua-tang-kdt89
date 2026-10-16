import React, { useState, useEffect } from 'react';
import { X, Pencil, Check, RotateCcw, Sparkles, Layers } from 'lucide-react';
import { CATEGORIES } from '../data/products';
import { CategoryOverride } from '../lib/firebase';

interface CategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCategoryId?: string | null;
  customCategories?: Record<string, CategoryOverride>;
  onSaveCategory: (categoryId: string, override: CategoryOverride) => void;
  onResetCategory: (categoryId: string) => void;
}

export const CategoryEditModal: React.FC<CategoryEditModalProps> = ({
  isOpen,
  onClose,
  targetCategoryId,
  customCategories = {},
  onSaveCategory,
  onResetCategory,
}) => {
  const [selectedId, setSelectedId] = useState<string>('water_heaters');
  const [name, setName] = useState('');
  const [subTitle, setSubTitle] = useState('');
  const [tagline, setTagline] = useState('');

  // Default category object
  const defaultCategory = CATEGORIES.find((c) => c.id === selectedId) || CATEGORIES[0];

  useEffect(() => {
    if (targetCategoryId) {
      setSelectedId(targetCategoryId);
    }
  }, [targetCategoryId, isOpen]);

  useEffect(() => {
    const existing = customCategories[selectedId];
    setName(existing?.name !== undefined ? existing.name : defaultCategory.name);
    setSubTitle(existing?.subTitle !== undefined ? existing.subTitle : defaultCategory.subTitle);
    setTagline(existing?.tagline !== undefined ? existing.tagline : defaultCategory.tagline);
  }, [selectedId, customCategories, defaultCategory]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveCategory(selectedId, {
      name: name.trim(),
      subTitle: subTitle.trim(),
      tagline: tagline.trim(),
    });
    onClose();
  };

  const handleReset = () => {
    onResetCategory(selectedId);
    setName(defaultCategory.name);
    setSubTitle(defaultCategory.subTitle);
    setTagline(defaultCategory.tagline);
  };

  const hasOverride = Boolean(customCategories[selectedId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-neutral-900 via-neutral-800 to-rose-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                Sửa đề mục & mô tả nhóm sản phẩm
              </h3>
              <p className="text-xs text-neutral-300">
                Tự do đổi tên nhóm, điều kiện giao lắp hoặc ghi chú vật tư
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Select Category */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-rose-600" />
              <span>Chọn nhóm đề mục cần sửa:</span>
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-semibold text-neutral-900 bg-white outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-sm"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {customCategories[cat.id]?.name || cat.name} {customCategories[cat.id] ? '(Đã tùy chỉnh)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Tiêu đề chính */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1">
              Tiêu đề chính của đề mục <span className="text-rose-600">*</span>:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Máy tắm nóng – chăm sóc gia đình"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm font-bold text-neutral-900 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
            />
            <p className="mt-1 text-[11px] text-neutral-500">
              Xuất hiện to rõ ở đầu nhóm và trên thanh chọn danh mục quà.
            </p>
          </div>

          {/* Dòng mô tả phụ / điều kiện lắp đặt */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1">
              Dòng mô tả phụ (Giao nhận / Điều kiện lắp đặt / Vật tư):
            </label>
            <textarea
              rows={2}
              value={subTitle}
              onChange={(e) => setSubTitle(e.target.value)}
              placeholder="VD: Bao gồm công lắp đặt theo điều kiện áp dụng, vật tư phát sinh tính riêng nếu có."
              className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 bg-rose-50/30 text-xs sm:text-sm font-medium text-rose-800 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 resize-none"
            />
            <p className="mt-1 text-[11px] text-neutral-500">
              Dòng chữ đỏ nổi bật ngay dưới tiêu đề nhóm để thông báo rõ cho anh em thợ & khách hàng.
            </p>
          </div>

          {/* Khẩu hiệu / Tagline */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1">
              Lời tựa / Khẩu hiệu ý nghĩa (Tagline):
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="VD: Chăm sóc sức khỏe mẹ và vợ khi thời tiết chuyển lạnh cuối năm."
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-700 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
            />
          </div>

          {/* Live Preview Box */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-neutral-200">
            <span className="text-[11px] font-bold text-neutral-600 block mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Xem trước hiển thị thực tế trên website:</span>
            </span>
            <div className="p-3.5 rounded-xl bg-white border border-neutral-200/90 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-neutral-900">
                  {name || 'Tiêu đề nhóm'}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  Sẵn kho
                </span>
              </div>
              <p className="mt-1 text-xs text-rose-700 font-medium">
                {subTitle || 'Dòng mô tả phụ điều kiện lắp đặt và vật tư'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-neutral-200">
            {hasOverride ? (
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Khôi phục tiêu đề và mô tả mặc định của hệ thống"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi phục gốc</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-100 text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Lưu đề mục mới</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
