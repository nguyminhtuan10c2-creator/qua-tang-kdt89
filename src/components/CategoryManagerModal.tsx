import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Pencil,
  RotateCcw,
  Layers,
  Sparkles,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  FolderPlus,
  Package,
} from 'lucide-react';
import { CATEGORIES, CategoryItem, ProductItem } from '../data/products';
import { CategoryOverride } from '../lib/firebase';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allCategories: CategoryItem[];
  allProducts: ProductItem[];
  customCategories: Record<string, CategoryOverride>;
  deletedCategoryIds: string[];
  targetCategoryId?: string | null;
  onAddCategory: (category: CategoryItem) => void;
  onDeleteCategory: (categoryId: string) => void;
  onRestoreCategory: (categoryId: string) => void;
  onSaveCategoryOverride: (categoryId: string, override: CategoryOverride) => void;
  onResetCategoryOverride: (categoryId: string) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  allCategories = [],
  allProducts = [],
  customCategories = {},
  deletedCategoryIds = [],
  targetCategoryId = null,
  onAddCategory,
  onDeleteCategory,
  onRestoreCategory,
  onSaveCategoryOverride,
  onResetCategoryOverride,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'edit'>('list');

  // Form state for adding new category
  const [newCatName, setNewCatName] = useState('');
  const [newCatSubTitle, setNewCatSubTitle] = useState('');
  const [newCatTagline, setNewCatTagline] = useState('');
  const [addError, setAddError] = useState('');

  // Form state for editing category
  const [editCatId, setEditCatId] = useState<string>(targetCategoryId || allCategories[0]?.id || 'rice_cooker_appliances');
  const [editName, setEditName] = useState('');
  const [editSubTitle, setEditSubTitle] = useState('');
  const [editTagline, setEditTagline] = useState('');

  // When targetCategoryId changes or modal opens
  React.useEffect(() => {
    if (targetCategoryId) {
      setEditCatId(targetCategoryId);
      setActiveTab('edit');
    }
  }, [targetCategoryId, isOpen]);

  // Sync edit form fields with current category
  React.useEffect(() => {
    const currentCat = allCategories.find((c) => c.id === editCatId);
    if (!currentCat) return;

    const override = customCategories[editCatId];
    setEditName(override?.name !== undefined ? override.name : currentCat.name);
    setEditSubTitle(override?.subTitle !== undefined ? override.subTitle : currentCat.subTitle || '');
    setEditTagline(override?.tagline !== undefined ? override.tagline : currentCat.tagline || '');
  }, [editCatId, allCategories, customCategories]);

  if (!isOpen) return null;

  // Active (non-deleted) categories
  const activeCategories = allCategories.filter((c) => !deletedCategoryIds.includes(c.id));
  const deletedCategories = allCategories.filter((c) => deletedCategoryIds.includes(c.id));

  // Handle Add Category Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    const cleanName = newCatName.trim();
    if (!cleanName) {
      setAddError('Vui lòng nhập tên danh mục');
      return;
    }

    // Generate unique ID slug from name
    const slugBase = cleanName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || `cat_${Date.now()}`;

    let generatedId = slugBase;
    if (allCategories.some((c) => c.id === generatedId)) {
      generatedId = `${slugBase}_${Date.now().toString().slice(-4)}`;
    }

    const newCategory: CategoryItem = {
      id: generatedId,
      name: cleanName,
      subTitle: newCatSubTitle.trim() || 'Hàng chính hãng sẵn kho KDT-89',
      tagline: newCatTagline.trim() || 'Món quà ý nghĩa, chất lượng cho gia đình.',
      isCustom: true,
    };

    onAddCategory(newCategory);

    // Reset form and return to list
    setNewCatName('');
    setNewCatSubTitle('');
    setNewCatTagline('');
    setActiveTab('list');
  };

  // Handle Edit Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    onSaveCategoryOverride(editCatId, {
      name: editName.trim(),
      subTitle: editSubTitle.trim(),
      tagline: editTagline.trim(),
    });

    setActiveTab('list');
  };

  // Quick switch to edit a category
  const startEditing = (catId: string) => {
    setEditCatId(catId);
    setActiveTab('edit');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-850 to-rose-950 px-5 sm:px-6 py-4 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>Quản lý Danh mục Sản phẩm</span>
              </h3>
              <p className="text-xs text-neutral-300">
                Thêm mới, bớt (xóa/ẩn) hoặc đổi tên đề mục nhóm hàng trên landing page
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="p-3 bg-neutral-50 border-b border-neutral-200 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'list'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Danh sách danh mục ({activeCategories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'add'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Thêm danh mục mới</span>
          </button>

          {activeTab === 'edit' && (
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-900 text-white shadow-xs flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5 text-amber-400" />
              <span>Sửa đề mục</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* TAB 1: LIST CATEGORIES */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Hiện có <strong>{activeCategories.length}</strong> danh mục đang hoạt động trên website:</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('add')}
                  className="inline-flex items-center gap-1 font-bold text-rose-700 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm danh mục mới</span>
                </button>
              </div>

              {/* Active categories list */}
              <div className="space-y-2.5">
                {activeCategories.map((cat, idx) => {
                  const override = customCategories[cat.id];
                  const currentName = override?.name || cat.name;
                  const currentSub = override?.subTitle || cat.subTitle;
                  const count = allProducts.filter((p) => p.category === cat.id).length;

                  return (
                    <div
                      key={cat.id}
                      className="p-3.5 sm:p-4 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-rose-200">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-neutral-900">
                              {currentName}
                            </h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                              {count} sản phẩm
                            </span>
                            {cat.isCustom ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Tự thêm
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                                Mặc định
                              </span>
                            )}
                            {override && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                Đã sửa
                              </span>
                            )}
                          </div>
                          {currentSub && (
                            <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
                              {currentSub}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 sm:self-center self-end">
                        <button
                          type="button"
                          onClick={() => startEditing(cat.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="Sửa tên, mô tả & ghi chú đề mục"
                        >
                          <Pencil className="w-3.5 h-3.5 text-neutral-600" />
                          <span>Sửa đề mục</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Anh có chắc muốn bớt (xóa/ẩn) danh mục "${currentName}" khỏi website không?`)) {
                              onDeleteCategory(cat.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="Bớt (Xóa hoặc Ẩn) danh mục này"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Bớt danh mục</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Deleted categories to restore */}
              {deletedCategories.length > 0 && (
                <div className="mt-6 pt-5 border-t border-neutral-200">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Danh mục đã bớt / ẩn ({deletedCategories.length}):</span>
                  </h4>
                  <div className="space-y-2">
                    {deletedCategories.map((dcat) => (
                      <div
                        key={dcat.id}
                        className="p-3 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="font-semibold text-neutral-600 line-through">
                          {dcat.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRestoreCategory(dcat.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-neutral-300 hover:bg-neutral-50 text-emerald-700 font-bold text-xs shadow-2xs cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Khôi phục lại</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADD NEW CATEGORY */}
          {activeTab === 'add' && (
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <FolderPlus className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Thêm danh mục mới vào Kho Điện Tử:</strong> Danh mục mới sẽ xuất hiện trên thanh chọn danh mục, lưới sản phẩm và có thể gán sản phẩm vào ngay lập tức!
                </div>
              </div>

              {addError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Tên danh mục mới <span className="text-rose-600">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ví dụ: Tủ lạnh & Tủ đông, Máy giặt, Quạt điều hòa, Máy lọc nước..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-medium text-neutral-900 bg-white outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Mô tả phụ & Điều kiện giao lắp (hiển thị dưới tên danh mục):
                </label>
                <input
                  type="text"
                  value={newCatSubTitle}
                  onChange={(e) => setNewCatSubTitle(e.target.value)}
                  placeholder="Ví dụ: Hàng chính hãng sẵn kho, bao gồm công giao lắp theo điều kiện áp dụng."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-medium text-neutral-900 bg-white outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Lời nhắn / Tagline chia sẻ:
                </label>
                <textarea
                  rows={2}
                  value={newCatTagline}
                  onChange={(e) => setNewCatTagline(e.target.value)}
                  placeholder="Ví dụ: Món quà nâng tầm tiện nghi, mẹ và gia đình sử dụng thoải mái mỗi ngày."
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 font-medium text-neutral-900 bg-white outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-sm resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-bold hover:bg-neutral-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>Tạo danh mục ngay</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: EDIT CATEGORY */}
          {activeTab === 'edit' && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-rose-600" />
                  <span>Chọn danh mục cần sửa:</span>
                </label>
                <select
                  value={editCatId}
                  onChange={(e) => setEditCatId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-semibold text-neutral-900 bg-white outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-sm cursor-pointer"
                >
                  {allCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {customCategories[c.id]?.name || c.name} {deletedCategoryIds.includes(c.id) ? '(Đang ẩn)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Tiêu đề chính danh mục <span className="text-rose-600">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-medium text-neutral-900 bg-white outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Mô tả phụ & Điều kiện giao lắp:
                </label>
                <input
                  type="text"
                  value={editSubTitle}
                  onChange={(e) => setEditSubTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-medium text-neutral-900 bg-white outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Lời nhắn / Tagline chia sẻ:
                </label>
                <textarea
                  rows={2}
                  value={editTagline}
                  onChange={(e) => setEditTagline(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 font-medium text-neutral-900 bg-white outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-sm resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-2.5">
                {customCategories[editCatId] ? (
                  <button
                    type="button"
                    onClick={() => {
                      onResetCategoryOverride(editCatId);
                      setActiveTab('list');
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Về mặc định</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-bold hover:bg-neutral-50 cursor-pointer"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Lưu thay đổi</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-neutral-500">
            * Các thay đổi danh mục được lưu trữ đám mây và đồng bộ với mọi khách truy cập.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
