import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Phone,
  MapPin,
  User,
  FileText,
  AlertCircle,
  Plus,
  Minus,
  Gift,
  EyeOff,
  Clock,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import {
  OrderItem,
  OrderPayload,
  StoredOrder,
  submitOrderToFirestore,
  updateOrderAddressInFirestore,
  sendOrderEmailNotification,
  ADMIN_NOTIFICATION_EMAIL,
  checkVoucherRedeemed,
  recordVoucherRedemption,
} from '../lib/firebase';
import { ProductItem, ComboItem, COMPANY_INFO } from '../data/products';
import {
  DEFAULT_VOUCHERS,
  VoucherItem,
  CustomerAccount,
  formatShortVnd,
} from '../data/vouchers';
import { trackEvent } from '../lib/tracking';
import { pushOrderToSheetWebhook } from '../lib/googleSheets';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  singleProduct?: ProductItem | null;
  selectedProducts?: ProductItem[];
  selectedCombo?: ComboItem | null;
  customPrices?: Record<string, { programPrice?: string; referencePrice?: string }>;
  customImages?: Record<string, string>;
  onOrderSuccess?: (order: StoredOrder) => void;
  isRecipientHidden?: boolean;
  isAdmin?: boolean;
  onToggleRecipient?: () => void;
  customerAccount?: CustomerAccount | null;
  initialSelectedVoucher?: VoucherItem | null;
  onOpenCustomerAuth?: () => void;
  vouchers?: VoucherItem[];
  googleSheetWebhookUrl?: string;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  singleProduct,
  selectedProducts = [],
  selectedCombo,
  customPrices = {},
  customImages = {},
  onOrderSuccess,
  isRecipientHidden = false,
  isAdmin = false,
  onToggleRecipient,
  customerAccount,
  initialSelectedVoucher = null,
  vouchers = DEFAULT_VOUCHERS,
  googleSheetWebhookUrl,
}) => {
  const activeVouchers = vouchers.length > 0 ? vouchers : DEFAULT_VOUCHERS;
  const [customerName, setCustomerName] = useState(() => customerAccount?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(() => customerAccount?.phoneNumber || '');
  const [step2Address, setStep2Address] = useState(() => customerAccount?.address || '');
  const [step2Note, setStep2Note] = useState('');
  const [isAddressSaved, setIsAddressSaved] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const [recipient, setRecipient] = useState<'Vợ' | 'Mẹ' | 'Người thân' | 'Tự dùng / Lắp công trình'>('Tự dùng / Lắp công trình');
  const [giftCardRequested, setGiftCardRequested] = useState(false);
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [showVouchers, setShowVouchers] = useState(false);

  // Selected Voucher state & validation
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherItem | null>(initialSelectedVoucher);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);

  // Quantities for items
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<StoredOrder | null>(null);

  // Prepare items list (omit optional undefined fields for Firestore compatibility)
  const orderItems: OrderItem[] = React.useMemo(() => {
    if (selectedCombo) {
      return [
        {
          id: selectedCombo.id,
          name: `${selectedCombo.name} (${selectedCombo.subtitle})`,
          price: selectedCombo.priceNote,
          quantity: quantities[selectedCombo.id] || 1,
          ...(selectedCombo.image ? { imageUrl: selectedCombo.image } : {}),
        },
      ];
    }

    if (singleProduct) {
      const price = customPrices[singleProduct.id]?.programPrice || singleProduct.programPrice;
      const img = customImages[singleProduct.id] || singleProduct.imageUrl;
      return [
        {
          id: singleProduct.id,
          name: singleProduct.name,
          ...(singleProduct.modelCode ? { modelCode: singleProduct.modelCode } : {}),
          price: price,
          quantity: quantities[singleProduct.id] || 1,
          ...(img ? { imageUrl: img } : {}),
        },
      ];
    }

    if (selectedProducts.length > 0) {
      return selectedProducts.map((p) => {
        const price = customPrices[p.id]?.programPrice || p.programPrice;
        const img = customImages[p.id] || p.imageUrl;
        return {
          id: p.id,
          name: p.name,
          ...(p.modelCode ? { modelCode: p.modelCode } : {}),
          price: price,
          quantity: quantities[p.id] || 1,
          ...(img ? { imageUrl: img } : {}),
        };
      });
    }

    return [];
  }, [selectedCombo, singleProduct, selectedProducts, quantities, customPrices, customImages]);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setSubmitError(null);
      setCompletedOrder(null);
      setVoucherError(null);
      setIsAddressSaved(false);
      setAddressError(null);
      setStep2Note('');
      setShowOptionalDetails(false);

      if (customerAccount) {
        if (!customerName) setCustomerName(customerAccount.fullName);
        if (!phoneNumber) setPhoneNumber(customerAccount.phoneNumber);
        if (customerAccount.address) setStep2Address(customerAccount.address);
      }
      if (initialSelectedVoucher) {
        setSelectedVoucher(initialSelectedVoucher);
        setShowVouchers(true);
      } else {
        setShowVouchers(false);
      }

      const initialQty: Record<string, number> = {};
      if (selectedCombo) initialQty[selectedCombo.id] = 1;
      if (singleProduct) initialQty[singleProduct.id] = 1;
      selectedProducts.forEach((p) => {
        initialQty[p.id] = 1;
      });
      setQuantities(initialQty);

      trackEvent('open_checkout', {
        productId: singleProduct?.id || selectedCombo?.id || 'cart',
        productName: singleProduct?.name || selectedCombo?.name || `${selectedProducts.length} sản phẩm`,
      });
    }
  }, [isOpen, selectedCombo, singleProduct, selectedProducts, customerAccount, initialSelectedVoucher]);

  // Calculate raw numeric subtotal
  const numericSubtotal = React.useMemo((): number => {
    let sum = 0;
    for (const it of orderItems) {
      const cleanStr = it.price.replace(/[^0-9]/g, '');
      if (cleanStr.length >= 4) {
        sum += parseInt(cleanStr, 10) * it.quantity;
      }
    }
    return sum;
  }, [orderItems]);

  // Calculate voucher discount
  const voucherDiscountAmount = React.useMemo((): number => {
    if (!selectedVoucher) return 0;
    if (numericSubtotal > 0 && numericSubtotal < selectedVoucher.minOrderAmount) {
      return 0;
    }
    return selectedVoucher.discountAmount;
  }, [selectedVoucher, numericSubtotal]);

  const finalNumericTotal = Math.max(0, numericSubtotal - voucherDiscountAmount);

  // Next eligible voucher hint (e.g. "Mua thêm 600.000đ để giảm 50.000đ")
  const nextVoucherHint = React.useMemo(() => {
    if (numericSubtotal <= 0) return null;
    const unmet = [...activeVouchers]
      .sort((a, b) => a.minOrderAmount - b.minOrderAmount)
      .find((v) => numericSubtotal < v.minOrderAmount);
    if (!unmet) return null;
    const diff = unmet.minOrderAmount - numericSubtotal;
    return `Mua thêm ${diff.toLocaleString('vi-VN')}đ để giảm ${unmet.discountAmount.toLocaleString('vi-VN')}đ`;
  }, [numericSubtotal, activeVouchers]);

  const handleApplyVoucher = async (voucher: VoucherItem) => {
    if (numericSubtotal > 0 && numericSubtotal < voucher.minOrderAmount) {
      const diff = voucher.minOrderAmount - numericSubtotal;
      setVoucherError(
        `Mua thêm ${diff.toLocaleString('vi-VN')}đ để giảm ${voucher.discountAmount.toLocaleString('vi-VN')}đ.`
      );
      return;
    }

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setVoucherError('Vui lòng nhập SĐT ở trên trước để áp mã voucher.');
      return;
    }

    setIsCheckingVoucher(true);
    setVoucherError(null);

    try {
      const alreadyUsed = await checkVoucherRedeemed(cleanPhone, voucher.code);
      if (alreadyUsed) {
        setVoucherError(
          `SĐT ${cleanPhone} đã sử dụng mã ${voucher.code} trước đó (mỗi SĐT dùng 1 lần).`
        );
        setSelectedVoucher(null);
      } else {
        setSelectedVoucher(voucher);
        setVoucherError(null);
      }
    } catch {
      setSelectedVoucher(voucher);
    } finally {
      setIsCheckingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setSelectedVoucher(null);
    setVoucherError(null);
  };

  if (!isOpen) return null;

  const calculateTotal = (): string => {
    if (numericSubtotal > 0) {
      return `${finalNumericTotal.toLocaleString('vi-VN')} đ`;
    }
    if (orderItems.length === 1) {
      return orderItems[0].price;
    }
    return 'Giá chương trình ưu đãi';
  };

  const totalAmount = calculateTotal();

  const handleUpdateQty = (id: string, delta: number) => {
    setQuantities((prev) => {
      const curr = prev[id] || 1;
      const next = Math.max(1, Math.min(20, curr + delta));
      return { ...prev, [id]: next };
    });
  };

  // STEP 1 SUBMIT: Product + Name + Phone -> Create 24h Price Hold
  const handleSubmitStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const trimmedName = customerName.trim();
    const trimmedPhone = phoneNumber.trim();

    if (!trimmedName) {
      setSubmitError('Vui lòng nhập họ tên để sale giữ suất giúp anh/chị.');
      return;
    }

    if (!trimmedPhone || trimmedPhone.replace(/[^0-9]/g, '').length < 8) {
      setSubmitError('Vui lòng nhập số điện thoại / Zalo chính xác để sale xác nhận.');
      return;
    }

    if (orderItems.length === 0) {
      setSubmitError('Chưa có sản phẩm nào được chọn.');
      return;
    }

    if (selectedVoucher) {
      const cleanPhone = trimmedPhone.replace(/[^0-9]/g, '');
      const alreadyUsed = await checkVoucherRedeemed(cleanPhone, selectedVoucher.code);
      if (alreadyUsed) {
        setSubmitError(
          `SĐT ${cleanPhone} đã từng dùng mã ${selectedVoucher.code} (mỗi SĐT dùng 1 lần).`
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const initialAddress = (
        step2Address.trim() || 'Sale xác nhận tồn, quà tặng & khu vực giao (Giữ giá 24h)'
      ).slice(0, 300);

      // Avoid bloated custom base64 data URLs inside the order document (keep under Firestore 1MB limit)
      const safeOrderItems: OrderItem[] = orderItems.slice(0, 30).map((it) => ({
        id: it.id,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        ...(it.modelCode ? { modelCode: it.modelCode } : {}),
        ...(it.imageUrl && it.imageUrl.length <= 120_000 ? { imageUrl: it.imageUrl } : {}),
      }));

      const payload: OrderPayload = {
        customerName: trimmedName.slice(0, 100),
        phoneNumber: trimmedPhone.slice(0, 25),
        address: initialAddress,
        items: safeOrderItems,
        totalAmount: totalAmount.slice(0, 50),
        ...(!isRecipientHidden && recipient ? { recipient: recipient.slice(0, 100) } : {}),
        giftCardRequested: isRecipientHidden ? false : Boolean(giftCardRequested),
        paymentMethod: 'Thanh toán khi nhận hàng & kiểm tra (COD)',
        ...(selectedVoucher
          ? {
              appliedVoucher: selectedVoucher.code.slice(0, 50),
              voucherDiscount: `-${selectedVoucher.discountAmount.toLocaleString('vi-VN')} đ`.slice(0, 50),
            }
          : {}),
        note: (step2Note.trim() || 'Giữ giá 24h – Sale gọi xác nhận trong 5 phút').slice(0, 1000),
        status: 'Mới',
      };

      const orderId = await submitOrderToFirestore(payload);

      if (selectedVoucher) {
        await recordVoucherRedemption(
          trimmedPhone,
          trimmedName,
          selectedVoucher.code,
          selectedVoucher.discountAmount,
          orderId
        );
      }

      const storedOrder: StoredOrder = {
        ...payload,
        items: orderItems,
        id: orderId,
        createdAt: new Date().toISOString(),
      };

      // Silent background email notification & Google Sheet 24/7 webhook for admin/warehouse
      sendOrderEmailNotification(storedOrder, ADMIN_NOTIFICATION_EMAIL).catch(() => {});
      pushOrderToSheetWebhook(googleSheetWebhookUrl, 'new_order', storedOrder).catch(() => {});

      trackEvent('submit_hold_success', {
        orderId,
        productId: orderItems[0]?.id,
        productName: orderItems.map((i) => i.name).join(', '),
        price: totalAmount,
        voucherCode: selectedVoucher?.code,
      });

      setCompletedOrder(storedOrder);
      if (onOrderSuccess) {
        onOrderSuccess(storedOrder);
      }
    } catch (err: any) {
      console.error('Lỗi đặt giữ giá:', err);
      const rawMsg = typeof err?.message === 'string' ? err.message : '';
      let friendlyMsg = 'Có lỗi xảy ra khi giữ suất. Vui lòng thử lại hoặc nhắn Zalo 0397.017.013.';
      if (rawMsg.toLowerCase().includes('quota') || rawMsg.toLowerCase().includes('resource-exhausted')) {
        friendlyMsg = 'Hệ thống đang quá tải tạm thời. Anh/chị vui lòng thử lại sau ít phút hoặc nhắn Zalo 0397.017.013 để sale giữ giá ngay.';
      } else if (rawMsg && !rawMsg.trim().startsWith('{')) {
        friendlyMsg = rawMsg;
      }
      setSubmitError(friendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2 SUBMIT (OPTIONAL): Save detailed delivery address after hold created
  const handleSaveStep2Address = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completedOrder) return;
    setAddressError(null);

    const trimmedAddr = step2Address.trim();
    if (!trimmedAddr) {
      setAddressError('Vui lòng nhập địa chỉ giao hàng hoặc bấm Hoàn tất nếu đợi sale gọi.');
      return;
    }

    setIsSavingAddress(true);
    try {
      await updateOrderAddressInFirestore(completedOrder.id, trimmedAddr, step2Note);
      const updatedOrder: StoredOrder = {
        ...completedOrder,
        address: trimmedAddr,
        note: step2Note || completedOrder.note,
      };
      setCompletedOrder(updatedOrder);
      pushOrderToSheetWebhook(googleSheetWebhookUrl, 'update_address', updatedOrder).catch(() => {});
      setIsAddressSaved(true);
    } catch (err: any) {
      setAddressError(err.message || 'Không thể lưu địa chỉ lúc này, sale sẽ gọi xác nhận trực tiếp.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-neutral-950/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="relative bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 px-4 sm:px-6 py-3.5 sm:py-4 text-white shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-lg font-bold tracking-tight truncate">
                  {completedOrder
                    ? 'Bước 2/2: Đã giữ giá 24h thành công!'
                    : 'Giữ giá 24h – Sale xác nhận trong 5 phút'}
                </h3>
                <p className="text-[11px] sm:text-xs text-rose-100 font-medium truncate">
                  {completedOrder
                    ? 'Sale đang kiểm tra tồn kho, quà tặng & khu vực giao'
                    : 'Bước 1/2: Chọn sản phẩm & nhập SĐT · Kiểm tra mới trả tiền'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng form đặt mua"
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {completedOrder ? (
          /* STEP 2: PRICE HOLD CONFIRMED + OPTIONAL DELIVERY ADDRESS */
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-2.5 ring-6 ring-emerald-50">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold mb-1.5">
                MÃ GIỮ SUẤT: {completedOrder.id}
              </span>
              <h4 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                Đã giữ giá 24h cho {completedOrder.customerName}!
              </h4>
              <p className="mt-1.5 text-xs sm:text-sm text-neutral-600 max-w-md mx-auto">
                Sale KDT-89 sẽ gọi/nhắn Zalo tới{' '}
                <strong className="text-rose-700 font-mono">{completedOrder.phoneNumber}</strong>{' '}
                trong 5 phút để xác nhận tồn kho, quà tặng và khu vực giao.
              </p>
            </div>

            {/* Compact Order Summary */}
            <div className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-200/80 space-y-2">
              {completedOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-9 h-9 object-cover rounded-lg border border-neutral-200 shrink-0 bg-white"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-neutral-900 truncate">{item.name}</div>
                      <div className="text-[11px] text-neutral-500">Số lượng: x{item.quantity}</div>
                    </div>
                  </div>
                  <div className="font-bold text-rose-700 shrink-0">{item.price}</div>
                </div>
              ))}
              <div className="pt-2 border-t border-neutral-200 flex justify-between items-center text-xs sm:text-sm font-bold">
                <span className="text-neutral-700">Giá giữ suất 24h:</span>
                <span className="text-rose-700 font-mono">{completedOrder.totalAmount}</span>
              </div>
            </div>

            {/* Step 2 Optional Detailed Address Form */}
            <form
              onSubmit={handleSaveStep2Address}
              className="rounded-2xl bg-sky-50/70 border border-sky-200 p-3.5 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Bổ sung địa chỉ nhận hàng (Không bắt buộc)</span>
                </div>
                {isAddressSaved && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Đã lưu
                  </span>
                )}
              </div>

              <p className="text-[11px] text-neutral-600">
                Anh/chị có thể điền sẵn địa chỉ để giao nhanh hơn, hoặc đợi sale gọi xác nhận tồn và khu vực giao rồi báo sau.
              </p>

              {addressError && (
                <div className="text-xs text-rose-700 font-medium">{addressError}</div>
              )}

              <input
                type="text"
                value={step2Address}
                onChange={(e) => {
                  setStep2Address(e.target.value);
                  setIsAddressSaved(false);
                }}
                placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-sky-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />

              <input
                type="text"
                value={step2Note}
                onChange={(e) => {
                  setStep2Note(e.target.value);
                  setIsAddressSaved(false);
                }}
                placeholder="Ghi chú giờ nhận hoặc lắp đặt (tuỳ chọn)..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-sky-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />

              <button
                type="submit"
                disabled={isSavingAddress || isAddressSaved}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-emerald-600 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                {isSavingAddress
                  ? 'Đang lưu địa chỉ...'
                  : isAddressSaved
                  ? '✓ Đã cập nhật địa chỉ giao hàng'
                  : 'Cập nhật địa chỉ nhận hàng'}
              </button>
            </form>

            {/* Quick Zalo + Done Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <a
                href={COMPANY_INFO.zaloLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackEvent('click_zalo', {
                    source: 'checkout_step2',
                    orderId: completedOrder.id,
                  })
                }
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hỏi nhanh qua Zalo</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        ) : (
          /* STEP 1: SHORT FORM WITH STICKY BOTTOM CTA */
          <form onSubmit={handleSubmitStep1} className="flex flex-col flex-1 min-h-0">
            {/* Scrollable Body */}
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
              {submitError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* 1. Selected Product(s) */}
              <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-3 space-y-2">
                <div className="divide-y divide-neutral-200/80 max-h-36 overflow-y-auto pr-1">
                  {orderItems.map((item) => (
                    <div key={item.id} className="py-1.5 flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-11 h-11 rounded-xl object-cover border border-neutral-200 shrink-0 bg-white"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
                            KDT
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                            {item.name}
                          </h4>
                          <div className="text-xs font-bold text-rose-600 font-mono">
                            {item.price}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 bg-white border border-neutral-200 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, -1)}
                          aria-label="Giảm số lượng"
                          className="w-6 h-6 rounded flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-neutral-900 font-mono">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, 1)}
                          aria-label="Tăng số lượng"
                          className="w-6 h-6 rounded flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. PRIMARY STEP 1 FIELDS: NAME & PHONE RIGHT AT TOP */}
              <div className="rounded-2xl bg-rose-50/50 border border-rose-200/80 p-3.5 space-y-2.5">
                <div className="text-xs font-bold text-neutral-900 flex items-center justify-between">
                  <span>Thông tin giữ giá 24h:</span>
                  <span className="text-[11px] text-rose-700 font-semibold">Chỉ cần tên &amp; SĐT</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Họ và tên <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Vd: Anh Tuấn"
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Số điện thoại / Zalo <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Vd: 0912 345 678"
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. COMPACT COLLAPSIBLE VOUCHER STRIP */}
              <div className="rounded-2xl bg-blue-50/60 border border-blue-200 p-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowVouchers((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950 min-w-0">
                    <Gift className="w-4 h-4 text-red-600 shrink-0" />
                    <span className="truncate">
                      {selectedVoucher
                        ? `Đã áp dụng ${selectedVoucher.code} (-${selectedVoucher.discountAmount.toLocaleString('vi-VN')}đ)`
                        : nextVoucherHint || 'Chọn voucher giảm thêm (nếu đủ mức đơn)'}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-blue-700 shrink-0 flex items-center gap-0.5">
                    <span>{showVouchers ? 'Thu gọn' : 'Chọn mã'}</span>
                    {showVouchers ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </span>
                </button>

                {showVouchers && (
                  <div className="pt-2 border-t border-blue-200/70 space-y-2">
                    <div className="grid grid-cols-3 gap-1.5">
                      {activeVouchers.map((v) => {
                        const isSelected = selectedVoucher?.code === v.code;
                        const isBelowMin = numericSubtotal > 0 && numericSubtotal < v.minOrderAmount;
                        return (
                          <button
                            key={v.code}
                            type="button"
                            disabled={isCheckingVoucher}
                            onClick={() => (isSelected ? handleRemoveVoucher() : handleApplyVoucher(v))}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : isBelowMin
                                ? 'bg-white/70 text-neutral-500 border-neutral-200'
                                : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-300'
                            }`}
                          >
                            <div className={`text-[10px] font-black font-mono truncate ${isSelected ? 'text-yellow-300' : 'text-blue-700'}`}>
                              {v.code}
                            </div>
                            <div className="text-[11px] font-bold mt-0.5">
                              -{formatShortVnd(v.discountAmount)}
                            </div>
                            <div className={`text-[9px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-neutral-500'}`}>
                              Từ {v.minOrderAmount >= 1000000 ? `${(v.minOrderAmount / 1000000).toFixed(1).replace('.0', '')}tr` : `${Math.round(v.minOrderAmount / 1000)}k`}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {voucherError && (
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium">
                        {voucherError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 4. OPTIONAL EXTRA NOTE / RECIPIENT (COLLAPSED BY DEFAULT) */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowOptionalDetails((v) => !v)}
                  className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-800 flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{showOptionalDetails ? 'Ẩn tuỳ chọn thêm' : '+ Thêm ghi chú hoặc gói quà (tuỳ chọn)'}</span>
                </button>

                {showOptionalDetails && (
                  <div className="mt-2 p-3 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2.5">
                    {!isRecipientHidden && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-neutral-700">Mục đích mua:</span>
                          {isAdmin && onToggleRecipient && (
                            <button
                              type="button"
                              onClick={onToggleRecipient}
                              className="text-[10px] text-neutral-500 hover:text-neutral-800 flex items-center gap-1 cursor-pointer"
                            >
                              <EyeOff className="w-3 h-3" />
                              <span>Tắt mục này</span>
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {(['Tự dùng / Lắp công trình', 'Vợ', 'Mẹ', 'Người thân'] as const).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setRecipient(r)}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                                recipient === r
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-white text-neutral-700 border-neutral-300'
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                        <label className="flex items-center gap-2 text-[11px] text-neutral-700 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={giftCardRequested}
                            onChange={(e) => setGiftCardRequested(e.target.checked)}
                            className="w-3.5 h-3.5 text-rose-600 rounded"
                          />
                          <span>Gói quà &amp; viết thiệp miễn phí</span>
                        </label>
                      </div>
                    )}

                    <input
                      type="text"
                      value={step2Note}
                      onChange={(e) => setStep2Note(e.target.value)}
                      placeholder="Ghi chú thêm (vd: Giao sau 17h, hỏi kích thước khoét đá...)"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-3 pt-1 text-[10px] text-neutral-500">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Chính hãng 100%</span>
                </span>
                <span>·</span>
                <span>Kiểm tra hàng mới thanh toán (COD)</span>
              </div>
            </div>

            {/* STICKY BOTTOM CTA BAR — ALWAYS VISIBLE WITHOUT SCROLLING */}
            <div className="shrink-0 bg-white border-t border-neutral-200 px-4 sm:px-5 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-600 font-medium">Giá giữ suất 24h:</span>
                <span className="text-sm sm:text-base font-black text-rose-700 font-mono">
                  {totalAmount}
                </span>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 hover:from-rose-800 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang giữ suất giá sale...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Giữ giá 24h – Sale xác nhận trong 5 phút</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
