import React, { useEffect, useState } from 'react';
import { X, Ticket, Plus, Trash2, RotateCcw, Check, Sparkles } from 'lucide-react';
import {
  DEFAULT_VOUCHERS,
  VoucherItem,
  getTotalVoucherAmount,
} from '../data/vouchers';

interface VoucherEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vouchers: VoucherItem[];
  onSaveVouchers: (nextVouchers: VoucherItem[]) => Promise<void> | void;
}

export const VoucherEditorModal: React.FC<VoucherEditorModalProps> = ({
  isOpen,
  onClose,
  vouchers,
  onSaveVouchers,
}) => {
  const [items, setItems] = useState<VoucherItem[]>(DEFAULT_VOUCHERS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setItems(vouchers.length > 0 ? vouchers.map((v) => ({ ...v })) : DEFAULT_VOUCHERS.map((v) => ({ ...v })));
    }
  }, [isOpen, vouchers]);

  if (!isOpen) return null;

  const updateItem = (idx: number, patch: Partial<VoucherItem>) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const merged = { ...it, ...patch };
        if (patch.discountAmount !== undefined || patch.minOrderAmount !== undefined) {
          const disc = Number(merged.discountAmount) || 0;
          const min = Number(merged.minOrderAmount) || 0;
          merged.title = `VOUCHER GIẢM ${disc.toLocaleString('vi-VN')}₫`;
          merged.description =
            min > 0
              ? `Giảm ${disc.toLocaleString('vi-VN')}₫ trực tiếp cho đơn hàng từ ${min.toLocaleString('vi-VN')}₫ tại kho KDT-89`
              : `Giảm ${disc.toLocaleString('vi-VN')}₫ trực tiếp vào đơn hàng tại kho KDT-89`;
          merged.badge =
            min > 0
              ? `ĐƠN TỪ ${(min / 1000000).toFixed(1).replace(/\.0$/, '')} TRIỆU`
              : 'ƯU ĐÃI KDT-89';
        }
        return merged;
      })
    );
  };

  const handleAddVoucher = () => {
    setItems((prev) => [
      ...prev,
      {
        code: `KDT89-SALE${prev.length + 1}`,
        title: 'VOUCHER GIẢM 150.000₫',
        discountAmount: 150000,
        minOrderAmount: 2500000,
        description: 'Giảm 150.000₫ trực tiếp cho đơn hàng từ 2.500.000₫ tại kho KDT-89',
        badge: 'ĐƠN TỪ 2.5 TRIỆU',
        expiryDateText: 'HSD: 30/12/2026',
        iconType: 'discount',
      },
    ]);
  };

  const handleRemove = (idx: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const cleaned = items
        .filter((it) => it.code.trim() !== '')
        .map((it) => ({
          ...it,
          code: it.code.trim().toUpperCase(),
          discountAmount: Math.max(0, Number(it.discountAmount) || 0),
          minOrderAmount: Math.max(0, Number(it.minOrderAmount) || 0),
        }));
      await onSaveVouchers(cleaned.length > 0 ? cleaned : DEFAULT_VOUCHERS);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const totalAmount = getTotalVoucherAmount(items);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Điều Chỉnh Giá Trị Bộ Voucher</h3>
              <p className="text-xs text-slate-300">
                Tổng giá trị bộ voucher hiện tại:{' '}
                <strong className="text-amber-300">
                  {totalAmount.toLocaleString('vi-VN')}đ
                </strong>{' '}
                (tự động cập nhật cả Mascot &amp; Ví Voucher)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 bg-slate-50">
          {items.map((v, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                  <span>Voucher #{idx + 1}</span>
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="text-xs text-red-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Mã Voucher:
                  </label>
                  <input
                    type="text"
                    value={v.code}
                    onChange={(e) => updateItem(idx, { code: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Số tiền giảm (VNĐ):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={v.discountAmount}
                    onChange={(e) =>
                      updateItem(idx, { discountAmount: Number(e.target.value) || 0 })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Đơn tối thiểu (VNĐ):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100000}
                    value={v.minOrderAmount}
                    onChange={(e) =>
                      updateItem(idx, { minOrderAmount: Number(e.target.value) || 0 })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Hạn sử dụng:
                  </label>
                  <input
                    type="text"
                    value={v.expiryDateText}
                    onChange={(e) =>
                      updateItem(idx, { expiryDateText: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                Hiển thị cho khách: <strong className="text-slate-800">{v.title}</strong> —{' '}
                {v.description}
              </div>
            </div>
          ))}

          {items.length < 6 && (
            <button
              type="button"
              onClick={handleAddVoucher}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer bg-white"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Voucher mới</span>
            </button>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setItems(DEFAULT_VOUCHERS.map((v) => ({ ...v })))}
            className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mặc định (50K / 100K / 200K)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu giá trị Voucher'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
