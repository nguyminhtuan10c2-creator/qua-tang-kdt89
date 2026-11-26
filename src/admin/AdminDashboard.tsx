import React from 'react';
import {
  Package,
  Layers,
  ShoppingBag,
  Image as ImageIcon,
  FileSpreadsheet,
  Settings,
  ArrowRight,
  EyeOff,
  Trash2,
  Zap,
  DatabaseBackup,
  Radio,
} from 'lucide-react';
import type { ResolvedAdminProduct } from '../lib/productImportExport';
import type { StoredOrder } from '../lib/firebase';
import type { CategoryItem } from '../data/products';

export type AdminTabId =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'import_export'
  | 'orders'
  | 'customers'
  | 'settings';

interface AdminDashboardProps {
  resolvedProducts: ResolvedAdminProduct[];
  allCategories: CategoryItem[];
  deletedCategoryIds: string[];
  orders: StoredOrder[];
  customersCount?: number;
  customImagesCount: number;
  lastUpdatedAt?: string;
  onNavigateTab: (tab: AdminTabId) => void;
  onOpenFlashSaleShowcase?: (initialTab?: 'flash_sale' | 'livestream') => void;
  livestreamActive?: boolean;
  onToggleLivestreamActive?: (nextActive: boolean) => void;
  onOpenLegacyRecovery?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  resolvedProducts,
  allCategories,
  deletedCategoryIds,
  orders,
  customersCount = 0,
  customImagesCount,
  lastUpdatedAt,
  onNavigateTab,
  onOpenFlashSaleShowcase,
  livestreamActive = false,
  onToggleLivestreamActive,
  onOpenLegacyRecovery,
}) => {
  const activeProducts = resolvedProducts.filter((p) => !p.isDeleted);
  const visibleProducts = activeProducts.filter((p) => !p.isHidden);
  const hiddenProducts = activeProducts.filter((p) => p.isHidden);
  const softDeletedProducts = resolvedProducts.filter((p) => p.isDeleted);

  const builtInCount = activeProducts.filter((p) => p.sourceType === 'original').length;
  const editedOriginalCount = activeProducts.filter(
    (p) => p.sourceType === 'edited_original'
  ).length;
  const customAddedCount = activeProducts.filter((p) => p.sourceType === 'custom').length;

  const activeCategoriesCount = allCategories.filter(
    (c) => !deletedCategoryIds.includes(c.id)
  ).length;

  const newOrdersCount = orders.filter((o) => !o.status || o.status === 'Mới').length;

  const stats = [
    {
      label: 'Sản phẩm đang hiển thị',
      value: visibleProducts.length,
      meta: `${activeProducts.length} đang hoạt động · ${hiddenProducts.length} đang ẩn`,
      icon: Package,
      actionLabel: 'Mở bảng sản phẩm',
      targetTab: 'products' as AdminTabId,
    },
    {
      label: 'Đơn hàng & Khách đăng ký',
      value: orders.length,
      meta: `${newOrdersCount} đơn mới · ${customersCount} KH đã đăng ký`,
      icon: ShoppingBag,
      actionLabel: 'Xem Data Khách Hàng',
      targetTab: 'customers' as AdminTabId,
    },
    {
      label: 'Danh mục đang bật',
      value: activeCategoriesCount,
      meta: `${deletedCategoryIds.length} danh mục đang ẩn`,
      icon: Layers,
      actionLabel: 'Quản lý danh mục',
      targetTab: 'categories' as AdminTabId,
    },
    {
      label: 'Ảnh tùy chỉnh (custom_images)',
      value: customImagesCount,
      meta: 'Lưu tách document trên Firestore',
      icon: ImageIcon,
      actionLabel: 'Cập nhật nội dung',
      targetTab: 'settings' as AdminTabId,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Tổng quan kho hàng</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Số liệu thực tế đồng bộ từ Firestore và dữ liệu sản phẩm gốc.
          </p>
        </div>
        {lastUpdatedAt && (
          <div className="text-xs text-slate-500 tabular-nums">
            Cập nhật cấu hình gần nhất:{' '}
            <span className="font-medium text-slate-700">
              {new Date(lastUpdatedAt).toLocaleString('vi-VN')}
            </span>
          </div>
        )}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-slate-500">{item.label}</div>
                  <div className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">
                    {item.value}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-500 truncate">{item.meta}</span>
                <button
                  type="button"
                  onClick={() => onNavigateTab(item.targetTab)}
                  className="font-semibold text-slate-900 hover:text-rose-600 inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Source Breakdown + Quick Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            Phân loại nguồn dữ liệu sản phẩm
          </h3>
          <div className="divide-y divide-slate-100 text-sm">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">Sản phẩm gốc nguyên bản (products.ts)</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {builtInCount}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">Sản phẩm gốc đã ghi đè (editedProducts)</span>
              <span className="font-mono font-semibold text-amber-700 tabular-nums">
                {editedOriginalCount}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">Sản phẩm thêm mới / nhập file (customProducts)</span>
              <span className="font-mono font-semibold text-emerald-700 tabular-nums">
                {customAddedCount}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600 inline-flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Đang tạm ẩn khỏi trang khách</span>
              </span>
              <span className="font-mono font-semibold text-slate-700 tabular-nums">
                {hiddenProducts.length}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600 inline-flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Đã xóa mềm (có thể khôi phục)</span>
              </span>
              <span className="font-mono font-semibold text-red-700 tabular-nums">
                {softDeletedProducts.length}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Thao tác nhanh
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Mọi thay đổi được đồng bộ lên `settings/site` và `custom_images` ngay lập tức.
            </p>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => onNavigateTab('import_export')}
                className="w-full py-2.5 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 text-left flex items-center justify-between text-sm font-medium text-slate-800 transition-colors cursor-pointer"
              >
                <span className="inline-flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-slate-600" />
                  <span>Xuất CSV / JSON & Sao lưu cấu hình</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('products')}
                className="w-full py-2.5 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 text-left flex items-center justify-between text-sm font-medium text-slate-800 transition-colors cursor-pointer"
              >
                <span className="inline-flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-600" />
                  <span>Sửa giá, tồn kho, ảnh & ẩn/hiện sản phẩm</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              {onToggleLivestreamActive && (
                <button
                  type="button"
                  onClick={() => onToggleLivestreamActive(!livestreamActive)}
                  className={`w-full py-2.5 px-4 rounded-lg border text-left flex items-center justify-between text-sm font-semibold transition-colors cursor-pointer ${
                    livestreamActive
                      ? 'border-rose-400 bg-rose-600 hover:bg-rose-700 text-white'
                      : 'border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-800'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Radio className="w-4 h-4 shrink-0" />
                    <span>
                      {livestreamActive
                        ? 'Khu Giá Trên Live: ĐANG BẬT (Bấm tắt)'
                        : 'Bật Khu Giá Trên Live (Livestream)'}
                    </span>
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              )}

              {onOpenFlashSaleShowcase && (
                <button
                  type="button"
                  onClick={() => onOpenFlashSaleShowcase('flash_sale')}
                  className="w-full py-2.5 px-4 rounded-lg border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-left flex items-center justify-between text-sm font-semibold text-amber-900 transition-colors cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span>Quản lý Khu Flash Sale &amp; Giá Live</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-amber-600" />
                </button>
              )}

              {onOpenLegacyRecovery && (
                <button
                  type="button"
                  onClick={onOpenLegacyRecovery}
                  className="w-full py-2.5 px-4 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-left flex items-center justify-between text-sm font-semibold text-amber-900 transition-colors cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <DatabaseBackup className="w-4 h-4 text-amber-700" />
                    <span>Khôi phục hình cũ từ second-spanner-gvxch</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-amber-600" />
                </button>
              )}

              <button
                type="button"
                onClick={() => onNavigateTab('settings')}
                className="w-full py-2.5 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 text-left flex items-center justify-between text-sm font-medium text-slate-800 transition-colors cursor-pointer"
              >
                <span className="inline-flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-600" />
                  <span>Sửa chữ trang web, SEO Zalo & Flash Sale</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
