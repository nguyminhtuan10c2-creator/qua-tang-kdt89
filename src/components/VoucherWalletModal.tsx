import React, { useState, useEffect } from 'react';
import {
  X,
  Gift,
  Ticket,
  Check,
  Clock,
  Sparkles,
  Phone,
  User,
  ShieldAlert,
  ArrowRight,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { CustomerAccount, DEFAULT_VOUCHERS, VoucherItem } from '../data/vouchers';
import { getCustomerRedeemedVouchers } from '../lib/firebase';

interface VoucherWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerAccount: CustomerAccount | null;
  onOpenLogin: () => void;
  onLogoutCustomer: () => void;
  onSelectVoucherToShop?: (voucher: VoucherItem) => void;
}

export const VoucherWalletModal: React.FC<VoucherWalletModalProps> = ({
  isOpen,
  onClose,
  customerAccount,
  onOpenLogin,
  onLogoutCustomer,
  onSelectVoucherToShop,
}) => {
  const [usedVouchers, setUsedVouchers] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (customerAccount?.phoneNumber) {
      getCustomerRedeemedVouchers(customerAccount.phoneNumber).then((redeemed) => {
        setUsedVouchers(redeemed);
      });
    } else {
      setUsedVouchers([]);
    }
  }, [customerAccount?.phoneNumber, isOpen]);

  if (!isOpen) return null;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleUseVoucher = (voucher: VoucherItem) => {
    if (onSelectVoucherToShop) {
      onSelectVoucherToShop(voucher);
    } else {
      onClose();
      const el = document.getElementById('products');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center shadow-inner">
              <Ticket className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-1.5">
                <span>Ví Voucher Khuyến Mãi</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-400 text-neutral-950 uppercase tracking-tight">
                  Kho KDT-89
                </span>
              </h3>
              <p className="text-xs text-sky-100">
                Ưu đãi giảm giá trực tiếp vào đơn hàng tại kho KDT-89
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Customer Account Banner */}
        <div className="bg-neutral-50 px-4 sm:px-6 py-3 border-b border-neutral-200/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {customerAccount ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-neutral-900">
                    {customerAccount.fullName}
                  </div>
                  <div className="text-[11px] text-neutral-500 font-mono">
                    SĐT: {customerAccount.phoneNumber}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogoutCustomer}
                className="text-[11px] font-semibold text-neutral-500 hover:text-red-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-200/60 transition-colors cursor-pointer"
                title="Đăng xuất hoặc đổi số điện thoại"
              >
                <LogOut className="w-3 h-3" />
                <span>Đổi SĐT</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-neutral-600">
                Chưa đăng nhập tài khoản nhận voucher.
              </div>
              <button
                type="button"
                onClick={onOpenLogin}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <span>Đăng nhập / Tạo tài khoản</span>
              </button>
            </div>
          )}
        </div>

        {/* Voucher List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
          {/* Note Rule Bar */}
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-2 text-[11px] text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Quy định áp dụng:</strong> Mỗi số điện thoại mua 1 lần sẽ được dùng 1 lần cho từng voucher. Mã giảm sẽ được trừ trực tiếp khi xác nhận đặt mua.
            </span>
          </div>

          {DEFAULT_VOUCHERS.map((voucher) => {
            const isRedeemed = usedVouchers.includes(voucher.code);
            return (
              <div
                key={voucher.code}
                className={`relative rounded-2xl border transition-all p-3.5 sm:p-4 flex flex-col justify-between gap-3 ${
                  isRedeemed
                    ? 'bg-neutral-50/90 border-neutral-200 opacity-65'
                    : 'bg-white border-blue-200 shadow-xs hover:border-blue-400 hover:shadow-md'
                }`}
              >
                {/* Left ticket notches styling */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                        {voucher.badge}
                      </span>
                      <span className="text-xs font-mono font-bold text-neutral-400">
                        {voucher.expiryDateText}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm sm:text-base text-neutral-900 leading-tight">
                      {voucher.title}
                    </h4>

                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                      {voucher.description}
                    </p>

                    <div className="mt-2 text-xs font-bold text-red-600">
                      Giảm: -{voucher.discountAmount.toLocaleString('vi-VN')}₫
                    </div>
                  </div>

                  {/* Code pill & Action */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(voucher.code)}
                      className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-mono font-bold text-xs border border-neutral-300 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Bấm để sao chép mã voucher"
                    >
                      {copiedCode === voucher.code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Đã chép</span>
                        </>
                      ) : (
                        <span>{voucher.code}</span>
                      )}
                    </button>

                    {isRedeemed ? (
                      <span className="px-2.5 py-1 rounded-lg bg-neutral-200 text-neutral-600 text-[11px] font-bold">
                        Đã sử dụng
                      </span>
                    ) : customerAccount ? (
                      <button
                        type="button"
                        onClick={() => handleUseVoucher(voucher)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                      >
                        <span>Dùng ngay</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onOpenLogin}
                        className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                      >
                        Kích hoạt
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500 shrink-0">
          <span>Kho phân phối Điện tử KDT-89</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
