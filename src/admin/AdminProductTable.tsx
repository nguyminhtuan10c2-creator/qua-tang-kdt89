import React, { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Tag,
  Camera,
  Eye,
  EyeOff,
  Trash2,
  RotateCcw,
  Box,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import type { CategoryItem, ProductItem } from '../data/products';
import type { ResolvedAdminProduct } from '../lib/productImportExport';

interface AdminProductTableProps {
  products: ResolvedAdminProduct[];
  categories: CategoryItem[];
  deletedCategoryIds: string[];
  onAddProduct: () => void;
  onEditProduct: (product: ProductItem) => void;
  onEditPrice: (product: ProductItem) => void;
  onEditImage: (product: ProductItem) => void;
  onUpdateStock: (
    product: ResolvedAdminProduct,
    stockCountNumber: number | undefined,
    stockStatus: string
  ) => void;
  onToggleHide: (productId: string) => void;
  onSoftDelete: (productId: string) => void;
  onRestoreProduct: (productId: string) => void;
  onGoImportExport: () => void;
}

export const AdminProductTable: React.FC<AdminProductTableProps> = ({
  products,
  categories,
  deletedCategoryIds,
  onAddProduct,
  onEditProduct,
  onEditPrice,
  onEditImage,
  onUpdateStock,
  onToggleHide,
  onSoftDelete,
  onRestoreProduct,
  onGoImportExport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<
    'active' | 'visible' | 'hidden' | 'deleted' | 'all'
  >('active');
  const [sourceFilter, setSourceFilter] = useState<
    'all' | 'original' | 'edited_original' | 'custom'
  >('all');

  // Inline stock editing state
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockCountDraft, setStockCountDraft] = useState<string>('');
  const [stockStatusDraft, setStockStatusDraft] = useState<string>('');

  const activeCategories = useMemo(
    () => categories.filter((c) => !deletedCategoryIds.includes(c.id)),
    [categories, deletedCategoryIds]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (visibilityFilter === 'active' && p.isDeleted) return false;
      if (visibilityFilter === 'visible' && (p.isDeleted || p.isHidden)) return false;
      if (visibilityFilter === 'hidden' && (p.isDeleted || !p.isHidden)) return false;
      if (visibilityFilter === 'deleted' && !p.isDeleted) return false;

      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (sourceFilter !== 'all' && p.sourceType !== sourceFilter) return false;

      if (q) {
        const matchName = p.name.toLowerCase().includes(q);
        const matchModel = (p.modelCode || '').toLowerCase().includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        return matchName || matchModel || matchId;
      }
      return true;
    });
  }, [products, searchQuery, categoryFilter, visibilityFilter, sourceFilter]);

  const counts = useMemo(() => {
    const active = products.filter((p) => !p.isDeleted);
    return {
      active: active.length,
      visible: active.filter((p) => !p.isHidden).length,
      hidden: active.filter((p) => p.isHidden).length,
      deleted: products.filter((p) => p.isDeleted).length,
    };
  }, [products]);

  const startEditStock = (p: ResolvedAdminProduct) => {
    setEditingStockId(p.id);
    setStockCountDraft(
      p.stockCountNumber !== undefined && p.stockCountNumber !== null
        ? String(p.stockCountNumber)
        : ''
    );
    setStockStatusDraft(p.stockStatus || '');
  };

  const saveEditStock = (p: ResolvedAdminProduct) => {
    const num = stockCountDraft.trim() === '' ? undefined : Math.max(0, parseInt(stockCountDraft, 10) || 0);
    onUpdateStock(p, num, stockStatusDraft.trim() || 'Sẵn kho');
    setEditingStockId(null);
  };

  const renderSourceLabel = (sourceType: ResolvedAdminProduct['sourceType']) => {
    if (sourceType === 'original') {
      return (
        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium whitespace-nowrap">
          Gốc
        </span>
      );
    }
    if (sourceType === 'edited_original') {
      return (
        <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[11px] font-semibold whitespace-nowrap">
          Gốc đã sửa
        </span>
      );
    }
    return (
      <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold whitespace-nowrap">
        Thêm mới
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản lý sản phẩm</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Hiển thị {filteredProducts.length} / {products.length} bản ghi · Xóa mềm giữ nguyên dữ liệu gốc.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onGoImportExport}
            className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Nhập / Xuất CSV & JSON</span>
          </button>

          <button
            type="button"
            onClick={onAddProduct}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm sản phẩm</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên sản phẩm, mã model hoặc ID..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            >
              <option value="all">Tất cả danh mục</option>
              {activeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            >
              <option value="all">Tất cả nguồn</option>
              <option value="original">Sản phẩm gốc</option>
              <option value="edited_original">Gốc đã sửa</option>
              <option value="custom">Thêm mới / Nhập file</option>
            </select>
          </div>
        </div>

        {/* Segmented visibility filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit max-w-full overflow-x-auto">
          {[
            { id: 'active', label: `Đang hoạt động (${counts.active})` },
            { id: 'visible', label: `Đang hiện (${counts.visible})` },
            { id: 'hidden', label: `Đang ẩn (${counts.hidden})` },
            { id: 'deleted', label: `Đã xóa mềm (${counts.deleted})` },
            { id: 'all', label: `Tất cả (${products.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setVisibilityFilter(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                visibilityFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-medium text-slate-700">
              Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setVisibilityFilter('active');
                  setSourceFilter('all');
                }}
                className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Xóa bộ lọc
              </button>
              <button
                type="button"
                onClick={onAddProduct}
                className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                + Thêm sản phẩm
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Sản phẩm</th>
                  <th className="py-3 px-3">Danh mục</th>
                  <th className="py-3 px-3">Giá chương trình / Niêm yết</th>
                  <th className="py-3 px-3">Tồn kho</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProducts.map((p) => {
                  const isEditingStock = editingStockId === p.id;
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        p.isDeleted ? 'opacity-65 bg-red-50/20' : ''
                      }`}
                    >
                      {/* Product & Image & ID */}
                      <td className="py-3 px-4 min-w-[260px] max-w-[340px]">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => onEditImage(p)}
                            title="Bấm để đổi ảnh sản phẩm"
                            className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden shrink-0 relative group cursor-pointer"
                          >
                            {p.resolvedImageUrl ? (
                              <img
                                src={p.resolvedImageUrl}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-semibold text-slate-400">
                                No img
                              </div>
                            )}
                            <span className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Camera className="w-3.5 h-3.5" />
                            </span>
                          </button>

                          <div className="min-w-0 space-y-1">
                            <div className="font-semibold text-slate-900 leading-snug line-clamp-2">
                              {p.name}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500">
                              <span className="font-mono text-slate-700">{p.id}</span>
                              {p.modelCode && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono font-semibold text-slate-800">
                                    {p.modelCode}
                                  </span>
                                </>
                              )}
                              <span aria-hidden="true">·</span>
                              {renderSourceLabel(p.sourceType)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-xs text-slate-600 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{p.categoryLabel}</div>
                        <div className="font-mono text-[11px] text-slate-400">{p.category}</div>
                      </td>

                      {/* Prices */}
                      <td className="py-3 px-3 whitespace-nowrap tabular-nums">
                        <div className="text-sm font-bold text-rose-700">
                          {p.effectiveProgramPrice}
                        </div>
                        {p.effectiveReferencePrice && (
                          <div className="text-xs text-slate-400 line-through">
                            {p.effectiveReferencePrice}
                          </div>
                        )}
                        {(p.customProgramPrice || p.customReferencePrice) && (
                          <div className="text-[11px] font-medium text-amber-700 mt-0.5">
                            Đang dùng giá tùy chỉnh
                          </div>
                        )}
                      </td>

                      {/* Stock (Inline editable) */}
                      <td className="py-3 px-3 min-w-[180px]">
                        {isEditingStock ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                value={stockCountDraft}
                                onChange={(e) => setStockCountDraft(e.target.value)}
                                placeholder="SL"
                                className="w-16 px-2 py-1 rounded border border-slate-300 text-xs font-mono tabular-nums"
                              />
                              <input
                                type="text"
                                value={stockStatusDraft}
                                onChange={(e) => setStockStatusDraft(e.target.value)}
                                placeholder="Trạng thái kho"
                                className="flex-1 min-w-[90px] px-2 py-1 rounded border border-slate-300 text-xs"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => saveEditStock(p)}
                                className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Lưu</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingStockId(null)}
                                className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                                <span>Hủy</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-xs">
                              <div className="font-semibold text-slate-800 tabular-nums">
                                {p.stockCountNumber !== undefined
                                  ? `SL: ${p.stockCountNumber}`
                                  : 'SL: —'}
                              </div>
                              <div className="text-slate-500">{p.stockStatus}</div>
                            </div>
                            {!p.isDeleted && (
                              <button
                                type="button"
                                onClick={() => startEditStock(p)}
                                title="Sửa nhanh tồn kho"
                                className="p-1 rounded hover:bg-slate-200/70 text-slate-500 hover:text-slate-900 cursor-pointer shrink-0"
                              >
                                <Box className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {p.isDeleted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-800 text-xs font-semibold">
                            Đã xóa mềm
                          </span>
                        ) : p.isHidden ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-semibold">
                            Đang ẩn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold">
                            Đang hiện
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {p.isDeleted ? (
                          <button
                            type="button"
                            onClick={() => onRestoreProduct(p.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Khôi phục</span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditProduct(p)}
                              title="Sửa thông tin sản phẩm"
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onEditPrice(p)}
                              title="Sửa giá chương trình & giá niêm yết"
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-rose-700 cursor-pointer"
                            >
                              <Tag className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onEditImage(p)}
                              title="Đổi ảnh sản phẩm"
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleHide(p.id)}
                              title={p.isHidden ? 'Hiện lại sản phẩm' : 'Ẩn sản phẩm khỏi trang khách'}
                              className={`p-1.5 rounded-lg border cursor-pointer ${
                                p.isHidden
                                  ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                  : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              {p.isHidden ? (
                                <Eye className="w-3.5 h-3.5" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => onSoftDelete(p.id)}
                              title="Xóa mềm (chuyển vào thùng rác, có thể khôi phục)"
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 hover:border-red-200 text-red-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
