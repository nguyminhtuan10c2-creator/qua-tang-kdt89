import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  CheckCircle2,
  ShieldCheck,
  Truck,
  CreditCard,
  Phone,
  MapPin,
  User,
  FileText,
  Mail,
  Share2,
  AlertCircle,
  Plus,
  Minus,
  Sparkles,
  Gift,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  OrderItem,
  OrderPayload,
  StoredOrder,
  submitOrderToFirestore,
  sendOrderEmailNotification,
  generateOrderMailtoUri,
  ADMIN_NOTIFICATION_EMAIL,
  checkVoucherRedeemed,
  recordVoucherRedemption,
} from '../lib/firebase';
import { ProductItem, ComboItem } from '../data/products';
import { DEFAULT_VOUCHERS, VoucherItem, CustomerAccount } from '../data/vouchers';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Either a single product, multiple products, or a combo
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
  onOpenCustomerAuth,
}) => {
  const [customerName, setCustomerName] = useState(() => customerAccount?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(() => customerAccount?.phoneNumber || '');
  const [address, setAddress] = useState('');
  const [recipient, setRecipient] = useState<'Vợ' | 'Mẹ' | 'Người thân' | 'Tự dùng / Lắp công trình'>('Vợ');
  const [giftCardRequested, setGiftCardRequested] = useState(false);
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Thanh toán khi nhận hàng & kiểm tra (COD)');

  // Selected Voucher state & validation
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherItem | null>(initialSelectedVoucher);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);

  // Quantities for items
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<StoredOrder | null>(null);
  const [emailStatusMessage, setEmailStatusMessage] = useState<string>('');


  // Prepare items list
  const orderItems: OrderItem[] = React.useMemo(() => {
    if (selectedCombo) {
      return [
        {
          id: selectedCombo.id,
          name: `${selectedCombo.name} (${selectedCombo.subtitle})`,
          price: selectedCombo.priceNote,
          quantity: quantities[selectedCombo.id] || 1,
          imageUrl: selectedCombo.image,
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
          modelCode: singleProduct.modelCode,
          price: price,
          quantity: quantities[singleProduct.id] || 1,
          imageUrl: img,
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
          modelCode: p.modelCode,
          price: price,
          quantity: quantities[p.id] || 1,
          imageUrl: img,
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
      setEmailStatusMessage('');
      setVoucherError(null);
      if (customerAccount) {
        if (!customerName) setCustomerName(customerAccount.fullName);
        if (!phoneNumber) setPhoneNumber(customerAccount.phoneNumber);
        if (customerAccount.address && !address) setAddress(customerAccount.address);
      }
      if (initialSelectedVoucher) {
        setSelectedVoucher(initialSelectedVoucher);
      }
      // Default quantity 1 for each item
      const initialQty: Record<string, number> = {};
      if (selectedCombo) initialQty[selectedCombo.id] = 1;
      if (singleProduct) initialQty[singleProduct.id] = 1;
      selectedProducts.forEach((p) => {
        initialQty[p.id] = 1;
      });
      setQuantities(initialQty);
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

  // Apply or switch voucher with 1-voucher-per-phone check
  const handleApplyVoucher = async (voucher: VoucherItem) => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setVoucherError('Vui lòng nhập số điện thoại bên dưới trước để kiểm tra voucher.');
      return;
    }

    if (numericSubtotal > 0 && numericSubtotal < voucher.minOrderAmount) {
      setVoucherError(
        `Đơn hàng cần tối thiểu ${voucher.minOrderAmount.toLocaleString('vi-VN')}₫ để dùng mã này (Hiện tại: ${numericSubtotal.toLocaleString('vi-VN')}₫).`
      );
      return;
    }

    setIsCheckingVoucher(true);
    setVoucherError(null);

    try {
      const alreadyUsed = await checkVoucherRedeemed(cleanPhone, voucher.code);
      if (alreadyUsed) {
        setVoucherError(
          `⚠️ Số điện thoại ${cleanPhone} đã sử dụng mã ${voucher.code} rồi! Mỗi số điện thoại mua 1 lần sẽ được dùng 1 lần.`
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

  // Calculate formatted total
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const trimmedName = customerName.trim();
    const trimmedPhone = phoneNumber.trim();
    const trimmedAddress = address.trim();

    if (!trimmedName) {
      setSubmitError('Vui lòng nhập họ và tên của anh/chị.');
      return;
    }

    if (!trimmedPhone || trimmedPhone.length < 8) {
      setSubmitError('Vui lòng nhập số điện thoại hoặc Zalo chính xác để nhận máy.');
      return;
    }

    if (!trimmedAddress) {
      setSubmitError('Vui lòng nhập địa chỉ giao hàng (số nhà, đường, quận/huyện).');
      return;
    }

    if (orderItems.length === 0) {
      setSubmitError('Chưa có sản phẩm nào trong đơn hàng.');
      return;
    }

    // Final security check for voucher reuse by phone number
    if (selectedVoucher) {
      const cleanPhone = trimmedPhone.replace(/[^0-9]/g, '');
      const alreadyUsed = await checkVoucherRedeemed(cleanPhone, selectedVoucher.code);
      if (alreadyUsed) {
        setSubmitError(
          `Số điện thoại ${cleanPhone} đã từng dùng mã voucher ${selectedVoucher.code} rồi! Mỗi số điện thoại chỉ được dùng mỗi voucher 1 lần.`
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: OrderPayload = {
        customerName: trimmedName,
        phoneNumber: trimmedPhone,
        address: trimmedAddress,
        items: orderItems,
        totalAmount,
        recipient: isRecipientHidden ? undefined : recipient,
        giftCardRequested: isRecipientHidden ? false : giftCardRequested,
        paymentMethod,
        appliedVoucher: selectedVoucher ? selectedVoucher.code : undefined,
        voucherDiscount: selectedVoucher ? `-${selectedVoucher.discountAmount.toLocaleString('vi-VN')} đ` : undefined,
        note: note.trim() || undefined,
        status: 'Mới',
      };

      // 1. Submit to Firestore
      const orderId = await submitOrderToFirestore(payload);

      // 2. Record voucher redemption in Firestore if applied
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
        id: orderId,
        createdAt: new Date().toISOString(),
      };

      // 3. Dispatch email notification to admin email
      const emailResult = await sendOrderEmailNotification(storedOrder, ADMIN_NOTIFICATION_EMAIL);
      setEmailStatusMessage(
        emailResult.success
          ? `Đã gửi thông báo đơn hàng tức thì đến email ${ADMIN_NOTIFICATION_EMAIL}`

          : 'Đơn hàng đã được lưu trên hệ thống Firestore của KDT-89'
      );

      setCompletedOrder(storedOrder);
      if (onOrderSuccess) {
        onOrderSuccess(storedOrder);
      }
    } catch (err: any) {
      console.error('Lỗi đặt hàng:', err);
      setSubmitError(err.message || 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại hoặc gọi hotline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="relative bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 px-5 sm:px-6 py-5 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                  {completedOrder ? 'Đặt hàng thành công!' : 'Đặt mua sản phẩm chính hãng'}
                </h3>
                <p className="text-xs text-rose-100 font-medium">
                  {completedOrder
                    ? 'KDT-89 đã ghi nhận đơn và đang chuẩn bị đóng gói'
                    : 'Giao hàng tận nơi · Kiểm tra ưng ý mới thanh toán'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {completedOrder ? (
          /* SUCCESS SCREEN */
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4 ring-8 ring-emerald-50">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <span className="inline-block px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold mb-2">
                MÃ ĐƠN HÀNG: {completedOrder.id}
              </span>
              <h4 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                Cảm ơn {completedOrder.customerName}!
              </h4>
              <p className="mt-2 text-sm text-neutral-600 max-w-md mx-auto">
                Kỹ thuật viên KDT-89 sẽ gọi lại xác nhận số điện thoại{' '}
                <strong className="text-rose-700">{completedOrder.phoneNumber}</strong> trong ít phút để xếp lịch giao lắp.
              </p>
            </div>

            {/* Email Notification Status Box */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-neutral-700 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Mail className="w-4 h-4 text-amber-700" />
                <span>Thông báo gửi về email quản trị:</span>
              </div>
              <p className="text-neutral-600">
                Đơn hàng đã được tự động chuyển đến hòm thư: <strong className="text-neutral-900 font-mono">{ADMIN_NOTIFICATION_EMAIL}</strong>
              </p>
              <div className="pt-2 border-t border-amber-200/60 flex flex-wrap gap-2">
                <a
                  href={generateOrderMailtoUri(completedOrder, ADMIN_NOTIFICATION_EMAIL)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-neutral-800 font-bold hover:bg-amber-100 transition-colors text-xs"
                >
                  <Mail className="w-3.5 h-3.5 text-rose-600" />
                  <span>Mở ứng dụng Email gửi bản sao</span>
                </a>
                <a
                  href={`https://zalo.me/0909000000`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors text-xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Nhắn Zalo xác nhận ngay</span>
                </a>
              </div>
            </div>

            {/* Order Details Receipt */}
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 space-y-3">
              <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Chi tiết sản phẩm đã đặt:
              </div>
              <div className="divide-y divide-neutral-200/70">
                {completedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded-lg border border-neutral-200 shrink-0"
                        />
                      )}
                      <div className="truncate">
                        <div className="font-bold text-neutral-900 truncate">{item.name}</div>
                        {item.modelCode && (
                          <div className="text-[11px] text-neutral-500 font-mono">Mã: {item.modelCode}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-rose-700">{item.price}</div>
                      <div className="text-[10px] text-neutral-500">Số lượng: x{item.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-neutral-200 flex justify-between items-center text-sm font-bold">
                <span className="text-neutral-700">Tổng thanh toán:</span>
                <span className="text-rose-700 font-mono text-base">{completedOrder.totalAmount}</span>
              </div>
              <div className="text-[11px] text-neutral-500">
                Địa chỉ giao: <span className="text-neutral-800 font-medium">{completedOrder.address}</span>
              </div>
              {completedOrder.recipient && (
                <div className="text-[11px] text-rose-700 font-semibold flex items-center gap-1.5 pt-1">
                  <Gift className="w-3.5 h-3.5 text-rose-600" />
                  <span>Mục đích / Người nhận: <strong>{completedOrder.recipient}</strong></span>
                  {completedOrder.giftCardRequested && (
                    <span className="px-2 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px]">
                      + Gói quà & thiệp miễn phí
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-neutral-900 text-white font-bold text-sm hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Hoàn tất & Tiếp tục xem sản phẩm
              </button>
            </div>
          </div>
        ) : (
          /* ORDER FORM */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {submitError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{submitError}</span>
              </div>
            )}

            {/* 1. Items in Cart */}
            <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-3.5 sm:p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-700 uppercase tracking-wide">
                <span>Sản phẩm chọn mua ({orderItems.length})</span>
                <span className="text-rose-600 lowercase font-normal">cam kết 100% chính hãng</span>
              </div>

              <div className="divide-y divide-neutral-200/80 max-h-48 overflow-y-auto pr-1">
                {orderItems.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover border border-neutral-200 shrink-0 bg-white"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
                          KDT
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                          {item.name}
                        </h4>
                        {item.modelCode && (
                          <div className="text-[11px] text-neutral-500 font-mono">
                            Model: {item.modelCode}
                          </div>
                        )}
                        <div className="text-xs font-bold text-rose-600 font-mono mt-0.5">
                          {item.price}
                        </div>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 shrink-0 bg-white border border-neutral-200 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.id, -1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors"
                        title="Giảm số lượng"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-neutral-900 font-mono">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.id, 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors"
                        title="Tăng số lượng"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Row */}
              <div className="pt-2.5 border-t border-neutral-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-600">Tổng tiền tạm tính:</span>
                <span className="text-base sm:text-lg font-black text-rose-700 font-mono">
                  {numericSubtotal > 0 ? `${numericSubtotal.toLocaleString('vi-VN')} đ` : totalAmount}
                </span>
              </div>
            </div>

            {/* VOUCHER SELECTION SECTION (DIỆN MÁY XANH MODEL - MỖI SĐT 1 LẦN) */}
            <div className="rounded-2xl bg-blue-50/70 border border-blue-200 p-3.5 sm:p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-blue-950 uppercase tracking-wide flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-red-600" />
                  <span>Áp Dụng Voucher Giảm Giá (Mỗi SĐT 1 Lần)</span>
                </div>
                {selectedVoucher && (
                  <button
                    type="button"
                    onClick={handleRemoveVoucher}
                    className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                )}
              </div>

              {/* Voucher cards list */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {DEFAULT_VOUCHERS.map((v) => {
                  const isSelected = selectedVoucher?.code === v.code;
                  return (
                    <button
                      key={v.code}
                      type="button"
                      disabled={isCheckingVoucher}
                      onClick={() => handleApplyVoucher(v)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-400/30'
                          : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-black font-mono ${isSelected ? 'text-yellow-300' : 'text-blue-700'}`}>
                            {v.code}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-700'}`}>
                            {v.badge}
                          </span>
                        </div>
                        <div className="text-xs font-bold mt-1 leading-snug">
                          Giảm -{v.discountAmount.toLocaleString('vi-VN')}₫
                        </div>
                      </div>
                      <div className={`text-[10px] mt-1.5 ${isSelected ? 'text-blue-100' : 'text-neutral-500'}`}>
                        Đơn từ {(v.minOrderAmount / 1000000).toFixed(0)} triệu
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Voucher status / error alert */}
              {isCheckingVoucher && (
                <div className="text-xs text-blue-700 flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Đang kiểm tra lịch sử sử dụng voucher của SĐT...</span>
                </div>
              )}

              {voucherError && (
                <div className="p-2.5 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{voucherError}</span>
                </div>
              )}

              {selectedVoucher && !voucherError && (
                <div className="p-2.5 rounded-xl bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Đã áp dụng mã {selectedVoucher.code}: Giảm -{selectedVoucher.discountAmount.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-800">1 lần/SĐT</span>
                </div>
              )}

              {/* Price Breakdown Calculation */}
              {numericSubtotal > 0 && (
                <div className="pt-2 border-t border-blue-200/80 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-neutral-600">
                    <span>Tạm tính hàng hóa:</span>
                    <span className="font-mono font-medium">{numericSubtotal.toLocaleString('vi-VN')} đ</span>
                  </div>
                  {voucherDiscountAmount > 0 && (
                    <div className="flex items-center justify-between text-red-600 font-bold">
                      <span>Voucher giảm giá ({selectedVoucher?.code}):</span>
                      <span className="font-mono">-{voucherDiscountAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-neutral-900 font-bold pt-1 border-t border-blue-200 text-sm">
                    <span>Tổng thanh toán thực tế:</span>
                    <span className="text-base sm:text-lg font-black text-rose-700 font-mono">
                      {finalNumericTotal.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              )}
            </div>


            {/* 1.5. Recipient / Purpose Selection (Toggleable for campaigns that need/do not need it) */}
            {!isRecipientHidden && (
              <div className="rounded-2xl bg-rose-50/70 border border-rose-200/90 p-3.5 sm:p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-rose-600" />
                    <span>Mục đích / Người nhận quà:</span>
                  </label>
                  {isAdmin && onToggleRecipient && (
                    <button
                      type="button"
                      onClick={onToggleRecipient}
                      className="text-[11px] text-neutral-500 hover:text-neutral-800 flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded-md border border-neutral-200 shadow-2xs"
                      title="Quyền Admin: Bấm để Tắt mục này nếu chương trình không cần hỏi người nhận quà"
                    >
                      <EyeOff className="w-3 h-3 text-neutral-500" />
                      <span>Tắt mục này</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Vợ', 'Mẹ', 'Người thân', 'Tự dùng / Lắp công trình'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRecipient(r)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                        recipient === r
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-1 ring-rose-500'
                          : 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-300'
                      }`}
                    >
                      {r === 'Vợ' && '🌹 '}
                      {r === 'Mẹ' && '👵 '}
                      {r === 'Người thân' && '🎁 '}
                      {r === 'Tự dùng / Lắp công trình' && '🏢 '}
                      <span>{r}</span>
                    </button>
                  ))}
                </div>

                {/* Free Gift Wrap & Card Checkbox */}
                <label className="mt-1 p-2.5 rounded-xl border border-rose-200 bg-white flex items-center gap-2 cursor-pointer text-xs text-rose-950 font-medium">
                  <input
                    type="checkbox"
                    checked={giftCardRequested}
                    onChange={(e) => setGiftCardRequested(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                  />
                  <span>🎁 Yêu cầu KDT-89 viết thiệp chúc mừng & đóng gói quà chu đáo (Miễn phí 100%)</span>
                </label>
              </div>
            )}

            {/* When hidden and viewed by Admin */}
            {isRecipientHidden && isAdmin && onToggleRecipient && (
              <div className="p-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/80 flex items-center justify-between text-xs text-amber-900 shadow-2xs">
                <span className="flex items-center gap-1.5">
                  <EyeOff className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Mục <strong>&quot;Tặng quà cho ai&quot;</strong> đang <strong>TẮT</strong> (không hiện với khách)</span>
                </span>
                <button
                  type="button"
                  onClick={onToggleRecipient}
                  className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-bold cursor-pointer"
                >
                  Bật lại
                </button>
              </div>
            )}

            {/* 2. Customer Delivery Info */}
            <div className="space-y-3.5">
              <div className="text-xs font-bold text-neutral-800 uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>Thông tin giao hàng tận nơi</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Họ và tên người nhận <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Vd: Nguyễn Văn A"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
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
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Địa chỉ nhận hàng (Số nhà, đường, phường/xã, quận/huyện) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Vd: 123 Lê Duẩn, P. Bến Nghé, Quận 1, TP.HCM"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Ghi chú cho kỹ thuật viên & giao nhận
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Vd: Giao sau 17h, cần hỗ trợ gắn máy nước nóng lên lầu..."
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 3. Payment Method */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wide">
                Phương thức thanh toán an toàn
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label
                  className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center gap-2.5 transition-all ${
                    paymentMethod.includes('COD')
                      ? 'border-rose-500 bg-rose-50/50 font-bold text-rose-950 ring-1 ring-rose-400'
                      : 'border-neutral-200 bg-white text-neutral-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Thanh toán khi nhận hàng & kiểm tra (COD)"
                    checked={paymentMethod.includes('COD')}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>Thanh toán khi nhận hàng & kiểm tra (COD)</span>
                </label>

                <label
                  className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center gap-2.5 transition-all ${
                    paymentMethod.includes('Chuyển khoản')
                      ? 'border-rose-500 bg-rose-50/50 font-bold text-rose-950 ring-1 ring-rose-400'
                      : 'border-neutral-200 bg-white text-neutral-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Chuyển khoản ngân hàng sau khi xác nhận"
                    checked={paymentMethod.includes('Chuyển khoản')}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>Chuyển khoản sau khi xác nhận</span>
                </label>
              </div>
            </div>

            {/* 4. Trust Badges */}
            <div className="grid grid-cols-3 gap-2 py-2 border-y border-neutral-100 text-[10px] text-neutral-600">
              <div className="flex items-center gap-1.5 justify-center text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Bảo hành chính hãng</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center text-center">
                <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Hỗ trợ giao lắp tận nhà</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center text-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Kiểm tra mới thanh toán</span>
              </div>
            </div>

            {/* 5. Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 hover:from-rose-800 hover:to-amber-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-rose-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang gửi đơn hàng về hệ thống...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>Xác nhận Đặt Mua Ngay</span>
                  </>
                )}
              </button>
              <p className="mt-2 text-center text-[11px] text-neutral-500">
                Thông báo đơn hàng sẽ được gửi trực tiếp đến email quản lý: <strong className="font-mono text-neutral-700">{ADMIN_NOTIFICATION_EMAIL}</strong>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
