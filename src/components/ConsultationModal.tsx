import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  PhoneCall,
  MessageCircle,
  Heart,
  ShieldAlert,
  Bell,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { COMPANY_INFO } from '../data/products';
import { submitConsultationLead } from '../lib/firebase';
import { trackEvent } from '../lib/tracking';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedProductNames?: string[];
  initialRecipient?: 'Vợ' | 'Mẹ' | 'Người thân';
  initialNote?: string;
  isRecipientHidden?: boolean;
  customTexts?: Record<string, string>;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  preselectedProductNames = [],
  initialRecipient = 'Vợ',
  initialNote = '',
  isRecipientHidden = false,
  customTexts = {},
}) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [recipient, setRecipient] = useState<'Vợ' | 'Mẹ' | 'Người thân'>(initialRecipient);
  const [interestedProducts, setInterestedProducts] = useState<string>('');
  const [deliveryArea, setDeliveryArea] = useState('');
  const [giftNote, setGiftNote] = useState(initialNote);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      setErrorMsg('');
      setShowOptionalFields(false);
      if (preselectedProductNames.length > 0) {
        setInterestedProducts(preselectedProductNames.join(', '));
      } else {
        setInterestedProducts('');
      }
      if (initialNote) {
        setGiftNote(initialNote);
      }
      if (initialRecipient) {
        setRecipient(initialRecipient);
      }
    }
  }, [isOpen, preselectedProductNames, initialNote, initialRecipient]);

  if (!isOpen) return null;

  const isLaunchNotification =
    interestedProducts.toLowerCase().includes('mở bán') ||
    interestedProducts.toLowerCase().includes('nhận thông báo') ||
    interestedProducts.toLowerCase().includes('nhận tin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMsg('Vui lòng nhập số điện thoại hợp lệ (từ 8 số) để KDT-89 gửi tin / liên hệ.');
      return;
    }
    setErrorMsg('');
    setIsSubmitted(true);

    try {
      await submitConsultationLead({
        fullName: fullName.trim() || 'Khách nhận tin qua SĐT',
        phoneNumber: phoneNumber.trim(),
        recipient: isRecipientHidden ? 'Khách kho KDT-89' : recipient,
        interestedProducts: interestedProducts.trim() || undefined,
        deliveryArea: deliveryArea.trim() || undefined,
        giftNote: giftNote.trim() || undefined,
      });
    } catch (err) {
      console.error('Không thể lưu yêu cầu vào Firebase', err);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md max-h-[88vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Header Bar */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white px-4 py-3 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {isLaunchNotification ? (
              <Bell className="w-4 h-4 text-yellow-300 shrink-0" />
            ) : (
              <Heart className="w-4 h-4 fill-white/20 shrink-0" />
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-sm leading-tight truncate">
                {isLaunchNotification
                  ? 'Nhận Tin Khi Mở Bán Sale'
                  : 'Nhờ Sale Tư Vấn & Giữ Hàng'}
              </h3>
              <p className="text-[11px] text-rose-100 truncate">
                {isLaunchNotification
                  ? 'Chỉ cần để lại SĐT — KDT-89 báo giá mở bán ngay'
                  : 'Chỉ cần nhập SĐT · Giá sỉ cho đối tác & thợ KDT-89'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Single Inner Scroll Container (No Double Scrollbar) */}
        <div className="p-4 overflow-y-auto flex-1">
          {isSubmitted ? (
            <div className="text-center py-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-neutral-900 mb-1.5">
                {isLaunchNotification
                  ? 'Đã đăng ký nhận tin mở bán!'
                  : 'Đã tiếp nhận SĐT giữ hàng!'}
              </h4>
              <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                Cảm ơn {fullName.trim() ? <strong className="text-neutral-900">{fullName}</strong> : 'anh/chị'} (
                <strong className="font-mono text-rose-600">{phoneNumber}</strong>). Sale KDT-89 sẽ nhắn Zalo / gọi báo giá ưu đãi tốt nhất ngay.
              </p>

              {(interestedProducts || deliveryArea || giftNote) && (
                <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200 text-left text-[11px] text-neutral-600 space-y-1 mb-4">
                  {interestedProducts && (
                    <div>
                      <span className="font-semibold text-neutral-800">Nhu cầu: </span>
                      {interestedProducts}
                    </div>
                  )}
                  {deliveryArea && (
                    <div>
                      <span className="font-semibold text-neutral-800">Khu vực: </span>
                      {deliveryArea}
                    </div>
                  )}
                  {giftNote && (
                    <div>
                      <span className="font-semibold text-neutral-800">Ghi chú: </span>
                      &quot;{giftNote}&quot;
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <a
                  href={COMPANY_INFO.zaloLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('click_zalo', { source: 'consultation_modal' })}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  <span>Nhắn Zalo giữ hàng ngay: {COMPANY_INFO.hotlineDisplay}</span>
                </a>
                <a
                  href={`tel:${COMPANY_INFO.hotline}`}
                  className="w-full py-2 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Hoặc gọi trực tiếp: {COMPANY_INFO.hotline}</span>
                </a>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-2 px-4 rounded-xl text-neutral-500 hover:text-neutral-900 text-xs font-medium cursor-pointer"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Primary Phone Field (Required Only) */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Số điện thoại / Zalo nhận tin <span className="text-rose-600">*</span>
                </label>
                <input
                  type="tel"
                  required
                  autoFocus
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Nhập SĐT của bạn (VD: 0912 345 678)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm font-mono focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                />
              </div>

              {/* Optional Name (Not required) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">
                  Tên anh/chị (tuỳ chọn)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="VD: Anh Tuấn (có thể bỏ trống)"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                />
              </div>

              {/* Interested Product pill / input */}
              {interestedProducts && !showOptionalFields ? (
                <div className="px-3 py-2 rounded-xl bg-rose-50/80 border border-rose-200 text-[11px] text-rose-900 flex items-center justify-between gap-2">
                  <span className="truncate">
                    <strong>Quan tâm:</strong> {interestedProducts}
                  </span>
                </div>
              ) : null}

              {/* Collapsible Optional Fields */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowOptionalFields((prev) => !prev)}
                  className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-800 inline-flex items-center gap-1 cursor-pointer"
                >
                  {showOptionalFields ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Ẩn thông tin thêm</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>+ Thêm sản phẩm, khu vực hoặc lời nhắn (tuỳ chọn)</span>
                    </>
                  )}
                </button>

                {showOptionalFields && (
                  <div className="mt-2.5 p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2.5">
                    {!isRecipientHidden && (
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                          {customTexts.recipientLabel || 'Mua tặng cho:'}
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['Vợ', 'Mẹ', 'Người thân'] as const).map((item) => (
                            <button
                              type="button"
                              key={item}
                              onClick={() => setRecipient(item)}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                                recipient === item
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-white text-neutral-700 border-neutral-200'
                              }`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                        Sản phẩm quan tâm
                      </label>
                      <input
                        type="text"
                        value={interestedProducts}
                        onChange={(e) => setInterestedProducts(e.target.value)}
                        placeholder="VD: Nồi Cuckoo, Quạt hơi nước..."
                        className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 bg-white text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                        Khu vực giao hàng / Nhận tại kho
                      </label>
                      <input
                        type="text"
                        value={deliveryArea}
                        onChange={(e) => setDeliveryArea(e.target.value)}
                        placeholder="VD: Quận 12, Hóc Môn, lấy tại kho..."
                        className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 bg-white text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                        Lời nhắn / Ghi chú
                      </label>
                      <textarea
                        rows={2}
                        value={giftNote}
                        onChange={(e) => setGiftNote(e.target.value)}
                        placeholder="Ghi chú thêm cho sale..."
                        className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 bg-white text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Row */}
              <div className="pt-1 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                >
                  {isLaunchNotification ? 'Đăng Ký Nhận Tin' : 'Xác Nhận & Giữ Hàng'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-3.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium text-xs transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
