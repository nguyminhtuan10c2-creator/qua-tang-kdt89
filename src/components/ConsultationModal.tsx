import React, { useState, useEffect } from 'react';
import { X, CheckCircle, PhoneCall, MessageCircle, Heart, ShieldAlert, Sparkles } from 'lucide-react';
import { PRODUCTS, COMPANY_INFO } from '../data/products';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedProductNames?: string[];
  initialRecipient?: 'Vợ' | 'Mẹ' | 'Người thân';
  initialNote?: string;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  preselectedProductNames = [],
  initialRecipient = 'Vợ',
  initialNote = '',
}) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [recipient, setRecipient] = useState<'Vợ' | 'Mẹ' | 'Người thân'>(initialRecipient);
  const [budgetTier, setBudgetTier] = useState('Dưới 2.000.000đ');
  const [interestedProducts, setInterestedProducts] = useState<string>('');
  const [deliveryArea, setDeliveryArea] = useState('');
  const [giftNote, setGiftNote] = useState(initialNote);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (preselectedProductNames.length > 0) {
      setInterestedProducts(preselectedProductNames.join(', '));
    }
  }, [preselectedProductNames]);

  useEffect(() => {
    if (initialNote) {
      setGiftNote(initialNote);
    }
  }, [initialNote]);

  useEffect(() => {
    if (initialRecipient) {
      setRecipient(initialRecipient);
    }
  }, [initialRecipient]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập họ tên của anh');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.length < 8) {
      setErrorMsg('Vui lòng nhập số điện thoại để sale KDT-89 liên hệ');
      return;
    }
    setErrorMsg('');
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-6">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 fill-white/20" />
            <div>
              <h3 className="font-bold text-base leading-tight">
                Nhờ Sale Tư Vấn & Giữ Hàng 20/10
              </h3>
              <p className="text-[11px] text-rose-100 font-medium">
                Giá riêng cho đối tác & anh em thợ KDT-89
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {isSubmitted ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-neutral-900 mb-2">
                Đã tiếp nhận yêu cầu giữ hàng!
              </h4>
              <p className="text-sm text-neutral-600 leading-relaxed mb-6">
                Cảm ơn anh <strong className="text-neutral-900">{fullName}</strong> ({phoneNumber}). Sale phụ trách anh em thợ của KDT-89 sẽ gọi lại ngay để xác nhận giá ưu đãi tốt nhất và giữ hàng quà 20/10 cho anh.
              </p>

              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 text-left text-xs text-neutral-600 space-y-2 mb-6">
                <div>
                  <span className="font-semibold text-neutral-800">Quà tặng cho: </span>
                  {recipient}
                </div>
                {interestedProducts && (
                  <div>
                    <span className="font-semibold text-neutral-800">Sản phẩm: </span>
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
                    <span className="font-semibold text-neutral-800">Lời chúc/Ghi chú: </span>
                    "{giftNote}"
                  </div>
                )}
              </div>

              {/* Direct Quick Connection */}
              <div className="space-y-2">
                <a
                  href={`tel:${COMPANY_INFO.hotline}`}
                  className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-400" />
                  <span>Gọi trực tiếp Hotline: {COMPANY_INFO.hotline}</span>
                </a>
                <button
                  onClick={handleReset}
                  className="w-full py-2.5 px-4 rounded-xl text-neutral-600 hover:text-neutral-900 text-xs font-medium"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Recipient Selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                  Anh muốn mua quà cho:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Vợ', 'Mẹ', 'Người thân'] as const).map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => setRecipient(item)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        recipient === item
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                      }`}
                    >
                      {item === 'Vợ' && '🌹 '}
                      {item === 'Mẹ' && '👵 '}
                      {item === 'Người thân' && '🎁 '}
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Họ tên & SĐT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Họ tên của anh *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="VD: Nguyễn Văn Nam (Thợ điện lạnh)"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="VD: 0912 345 678"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                  />
                </div>
              </div>

              {/* Ngân sách dự kiến */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Ngân sách dự kiến
                </label>
                <select
                  value={budgetTier}
                  onChange={(e) => setBudgetTier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                >
                  <option value="Dưới 1.000.000đ">Dưới 1.000.000đ (Bộ nồi, bếp nướng...)</option>
                  <option value="Từ 1.000.000đ đến 2.000.000đ">Từ 1.000.000đ đến 2.000.000đ (Nồi chiên, lò vi sóng...)</option>
                  <option value="Từ 2.000.000đ đến 4.000.000đ">Từ 2.000.000đ đến 4.000.000đ (Nồi Cuckoo, bếp từ đôi...)</option>
                  <option value="Trên 4.000.000đ">Trên 4.000.000đ (Máy lạnh trọn gói...)</option>
                  <option value="Chưa xác định - Nhờ sale tư vấn">Chưa xác định - Nhờ sale tư vấn theo món</option>
                </select>
              </div>

              {/* Sản phẩm quan tâm */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Sản phẩm quan tâm
                </label>
                <input
                  type="text"
                  value={interestedProducts}
                  onChange={(e) => setInterestedProducts(e.target.value)}
                  placeholder="VD: Nồi Cuckoo, Bếp đôi Ferroli, hoặc Combo cho Mẹ..."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                />
              </div>

              {/* Khu vực giao hàng */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Khu vực giao hàng / Nhận tại kho
                </label>
                <input
                  type="text"
                  value={deliveryArea}
                  onChange={(e) => setDeliveryArea(e.target.value)}
                  placeholder="VD: Qua lấy tại kho KDT-89, hoặc Quận 12 / Hóc Môn / Gửi chành..."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                />
              </div>

              {/* Ghi chú hoặc lời chúc 20/10 in kèm */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center justify-between">
                  <span>Lời nhắn / Lời chúc in kèm thiệp (nếu có)</span>
                  <span className="text-[11px] text-rose-600 font-normal">Miễn phí thiệp</span>
                </label>
                <textarea
                  rows={2}
                  value={giftNote}
                  onChange={(e) => setGiftNote(e.target.value)}
                  placeholder="VD: KDT-89 viết giúp em thiệp chúc vợ 20/10 hạnh phúc nhé..."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                />
              </div>

              {/* Policy note */}
              <div className="p-2.5 rounded-xl bg-neutral-100 text-[11px] text-neutral-600 leading-tight">
                <strong>Lưu ý: </strong> {COMPANY_INFO.policyNote}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
                >
                  Xác nhận & Giữ hàng cho tôi
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium text-xs sm:text-sm transition-all"
                >
                  Để sau
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
