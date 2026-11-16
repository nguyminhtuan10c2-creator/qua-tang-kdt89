import React from 'react';
import {
  X,
  ShoppingCart,
  Trash2,
  ArrowRight,
  User,
  Ticket,
  Sparkles,
  LogIn,
} from 'lucide-react';
import { ProductItem, extractProductPrice } from '../data/products';
import {
  CustomerAccount,
  DEFAULT_VOUCHERS,
  VoucherItem,
  formatShortVnd,
} from '../data/vouchers';

interface CartDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartProducts: ProductItem[];
  customPrices?: Record<string, { programPrice?: string; referencePrice?: string }>;
  customImages?: Record<string, string>;
  customerAccount?: CustomerAccount | null;
  onRemoveProduct: (product: ProductItem) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  onOpenCustomerAuth: () => void;
  onExploreProducts: () => void;
  vouchers?: VoucherItem[];
}

export const CartDrawerModal: React.FC<CartDrawerModalProps> = ({
  isOpen,
  onClose,
  cartProducts,
  customPrices = {},
  customImages = {},
  customerAccount,
  onRemoveProduct,
  onClearCart,
  onCheckout,
  onOpenCustomerAuth,
  onExploreProducts,
  vouchers = DEFAULT_VOUCHERS,
}) => {
  if (!isOpen) return null;

  const activeVouchers = vouchers.length > 0 ? vouchers : DEFAULT_VOUCHERS;
  const maxDiscount = activeVouchers.reduce(
    (max, v) => (v.discountAmount > max ? v.discountAmount : max),
    0
  );
  const maxDiscountLabel = formatShortVnd(maxDiscount);

  const estimatedTotal = cartProducts.reduce((sum, p) => {
    const customPrice = customPrices[p.id];
    const progStr = customPrice?.programPrice || p.programPrice || '';
    if (progStr.toLowerCase().includes('liên hệ')) return sum;
    const { rep } = extractProductPrice(p, customPrice);
    return sum + rep;
  }, 0);

  const eligibleVoucher = [...activeVouchers]
    .sort((a, b) => b.minOrderAmount - a.minOrderAmount)
    .find((v) => estimatedTotal >= v.minOrderAmount);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-neutral-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                Giỏ Hàng Riêng ({cartProducts.length})
              </h3>
              <p className="text-[11px] text-neutral-300">
                {customerAccount
                  ? `Lưu cho: ${customerAccount.fullName} (${customerAccount.phoneNumber})`
                  : 'Đăng nhập bằng SĐT để lưu giỏ hàng & áp voucher'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Account Strip */}
        <div className="px-4 py-2.5 bg-blue-50/80 border-b border-blue-200/80 flex items-center justify-between gap-2 text-xs shrink-0">
          {customerAccount ? (
            <div className="flex items-center gap-2 text-blue-950 font-semibold">
              <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">
                Thành viên: <strong>{customerAccount.fullName}</strong> (Ví Voucher đã mở)
              </span>
            </div>
          ) : (
            <>
              <span className="text-blue-900 font-medium">
                Đăng nhập để tự động lưu giỏ &amp; nhận giảm tới {maxDiscountLabel}:
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCustomerAuth();
                }}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] inline-flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <LogIn className="w-3 h-3" />
                <span>Đăng nhập / Tạo TK</span>
              </button>
            </>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartProducts.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center">
                <ShoppingCart className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-neutral-800">
                  Giỏ hàng riêng của anh/chị đang trống
                </h4>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                  Hãy bấm nút <strong>&quot;+ Giỏ hàng&quot;</strong> trên các sản phẩm giá sale tại kho để gom vào giỏ và chốt đơn một lần!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onExploreProducts();
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Xem các sản phẩm đang sale</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              {cartProducts.map((product) => {
                const imgSrc = customImages[product.id] || product.imageUrl;
                const progPrice =
                  customPrices[product.id]?.programPrice || product.programPrice;
                const refPrice =
                  customPrices[product.id]?.referencePrice || product.referencePrice;

                return (
                  <div
                    key={product.id}
                    className="p-3 rounded-2xl border border-neutral-200 bg-white flex items-center gap-3 shadow-2xs"
                  >
                    <div className="w-16 h-16 rounded-xl border border-neutral-100 bg-neutral-50 overflow-hidden shrink-0 flex items-center justify-center">
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Sparkles className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-neutral-900 line-clamp-2">
                        {product.name}
                      </div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-rose-600">
                          {progPrice}
                        </span>
                        {refPrice && refPrice !== progPrice && (
                          <span className="text-[11px] text-neutral-400 line-through">
                            {refPrice}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveProduct(product)}
                      title="Xóa khỏi giỏ"
                      className="p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              {cartProducts.length > 1 && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={onClearCart}
                    className="text-[11px] text-neutral-500 hover:text-red-600 font-semibold cursor-pointer"
                  >
                    Xóa toàn bộ giỏ hàng
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {cartProducts.length > 0 && (
          <div className="p-4 border-t border-neutral-200 bg-neutral-50 space-y-3 shrink-0">
            {eligibleVoucher && (
              <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Đủ điều kiện áp mã <strong className="font-mono">{eligibleVoucher.code}</strong> giảm ngay{' '}
                  <strong>{eligibleVoucher.discountAmount.toLocaleString('vi-VN')}đ</strong>!
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600 font-medium">Tạm tính ({cartProducts.length} món):</span>
              <strong className="text-base font-black text-rose-600">
                {estimatedTotal > 0
                  ? `${estimatedTotal.toLocaleString('vi-VN')}đ`
                  : 'Theo báo giá kho'}
              </strong>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Đặt Mua &amp; Giữ Giá 24h ({cartProducts.length} món)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
