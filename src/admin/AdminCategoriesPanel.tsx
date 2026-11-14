import React, { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Layers,
  Check,
  AlertCircle,
} from 'lucide-react';
import { CATEGORIES, CategoryItem } from '../data/products';
import type { CategoryOverride } from '../lib/firebase';
import type { ResolvedAdminProduct } from '../lib/productImportExport';

interface AdminCategoriesPanelProps {
  allCategories: CategoryItem[];
  resolvedProducts: ResolvedAdminProduct[];
  customCategories: Record<string, CategoryOverride>;
  deletedCategoryIds: string[];
  onAddCategory: (category: CategoryItem) => void;
  onDeleteCategory: (categoryId: string) => void;
  onRestoreCategory: (categoryId: string) => void;
  onSaveCategoryOverride: (categoryId: string, override: CategoryOverride) => void;
  onResetCategoryOverride: (categoryId: string) => void;
}

export const AdminCategoriesPanel: React.FC<AdminCategoriesPanelProps> = ({
  allCategories,
  resolvedProducts,
  customCategories,
  deletedCategoryIds,
  onAddCategory,
  onDeleteCategory,
  onRestoreCategory,
  onSaveCategoryOverride,
  onResetCategoryOverride,
}) => {
  const [newName, setNewName] = useState('');
  const [newSubTitle, setNewSubTitle] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [addError, setAddError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSubTitle, setEditSubTitle] = useState('');
  const [editTagline, setEditTagline] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setAddError('Vui lòng nhập tên danh mục.');
      return;
    }
    const slug = newName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 32);

    const id = `cat_${slug || 'custom'}_${Date.now().toString(36)}`;
    onAddCategory({
      id,
      name: newName.trim(),
      subTitle: newSubTitle.trim() || undefined,
      tagline: newTagline.trim() || undefined,
      isCustom: true,
    });
    setNewName('');
    setNewSubTitle('');
    setNewTagline('');
    setAddError('');
  };

  const startEdit = (cat: CategoryItem) => {
    const ov = customCategories[cat.id];
    setEditingId(cat.id);
    setEditName(ov?.name ?? cat.name);
    setEditSubTitle(ov?.subTitle ?? cat.subTitle ?? '');
    setEditTagline(ov?.tagline ?? cat.tagline ?? '');
  };

  const saveEdit = (catId: string) => {
    onSaveCategoryOverride(catId, {
      name: editName.trim(),
      subTitle: editSubTitle.trim(),
      tagline: editTagline.trim(),
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Quản lý danh mục</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Thêm mới, sửa tiêu đề / mô tả lắp đặt hoặc ẩn/khôi phục danh mục trên trang bán hàng.
        </p>
      </div>

      {/* Add Category Form */}
      <form
        onSubmit={handleAddSubmit}
        className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Layers className="w-4 h-4 text-slate-600" />
          <span>Thêm danh mục sản phẩm mới</span>
        </div>

        {addError && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{addError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tên danh mục *
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setAddError('');
              }}
              placeholder="VD: Quạt điều hòa & Máy lọc không khí"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Phụ đề ngắn (tùy chọn)
            </label>
            <input
              type="text"
              value={newSubTitle}
              onChange={(e) => setNewSubTitle(e.target.value)}
              placeholder="VD: Giá kho chính hãng – Giao trong ngày"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Ghi chú giao lắp (tùy chọn)
            </label>
            <input
              type="text"
              value={newTagline}
              onChange={(e) => setNewTagline(e.target.value)}
              placeholder="VD: Kiểm tra hàng trước khi thanh toán"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo danh mục</span>
          </button>
        </div>
      </form>

      {/* Categories Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Danh mục</th>
                <th className="py-3 px-3">Số sản phẩm</th>
                <th className="py-3 px-3">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allCategories.map((cat) => {
                const isDeleted = deletedCategoryIds.includes(cat.id);
                const isBuiltIn = CATEGORIES.some((c) => c.id === cat.id);
                const override = customCategories[cat.id];
                const displayName = override?.name ?? cat.name;
                const displaySub = override?.subTitle ?? cat.subTitle;
                const activeProdCount = resolvedProducts.filter(
                  (p) => !p.isDeleted && p.category === cat.id
                ).length;

                return (
                  <tr key={cat.id} className={isDeleted ? 'opacity-60 bg-slate-50' : ''}>
                    <td className="py-3 px-4">
                      {editingId === cat.id ? (
                        <div className="space-y-2 max-w-lg">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm font-semibold"
                          />
                          <input
                            type="text"
                            value={editSubTitle}
                            onChange={(e) => setEditSubTitle(e.target.value)}
                            placeholder="Phụ đề"
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                          />
                          <input
                            type="text"
                            value={editTagline}
                            onChange={(e) => setEditTagline(e.target.value)}
                            placeholder="Điều kiện giao lắp / Tagline"
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => saveEdit(cat.id)}
                              className="px-3 py-1 rounded bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Lưu</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1 rounded bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-semibold text-slate-900">{displayName}</div>
                          {displaySub && (
                            <div className="text-xs text-slate-500 mt-0.5">{displaySub}</div>
                          )}
                          <div className="text-[11px] font-mono text-slate-400 mt-1">
                            {cat.id} · {isBuiltIn ? 'Mặc định' : 'Tạo mới'}
                            {override ? ' · Đã tùy chỉnh tiêu đề' : ''}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono text-xs tabular-nums text-slate-700 whitespace-nowrap">
                      {activeProdCount} SP
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {isDeleted ? (
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-xs font-medium">
                          Đã ẩn/xóa
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold">
                          Đang bật
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEdit(cat)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                          title="Sửa tiêu đề danh mục"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {override && (
                          <button
                            type="button"
                            onClick={() => onResetCategoryOverride(cat.id)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-amber-700 cursor-pointer"
                            title="Khôi phục tiêu đề mặc định"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isDeleted ? (
                          <button
                            type="button"
                            onClick={() => onRestoreCategory(cat.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                          >
                            Khôi phục
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onDeleteCategory(cat.id)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 text-red-600 cursor-pointer"
                            title="Ẩn / Xóa mềm danh mục"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
