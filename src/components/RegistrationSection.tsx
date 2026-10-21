import React, { useState } from 'react';
import { Send, CheckCircle, Heart, PhoneCall, MessageSquareQuote, Eye, EyeOff } from 'lucide-react';
import { COMPANY_INFO } from '../data/products';
import { submitConsultationLead } from '../lib/firebase';

interface RegistrationSectionProps {
  onSuccessSubmit?: () => void;
  customTexts?: Record<string, string>;
  isAdmin?: boolean;
  isRecipientHidden?: boolean;
  onToggleRecipient?: () => void;
}

export const RegistrationSection: React.FC<RegistrationSectionProps> = ({
  onSuccessSubmit,
  customTexts = {},
  isAdmin = false,
  isRecipientHidden = false,
  onToggleRecipient,
}) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [recipient, setRecipient] = useState<'Vợ' | 'Mẹ' | 'Người thân'>('Vợ');
  const [budgetTier, setBudgetTier] = useState('Từ 1.000.000đ đến 2.000.000đ');
  const [interestedProducts, setInterestedProducts] = useState('');
  const [deliveryArea, setDeliveryArea] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const badge = customTexts.registerBadge || 'Đăng ký giữ hàng & nhận báo giá thợ';
  const title = customTexts.registerTitle || 'Điền thông tin – Sale KDT-89 hỗ trợ giữ hàng ngay';
  const subtitle = customTexts.registerSubtitle || 'Ưu đãi riêng cho đối tác · Hàng có sẵn – giao nhanh · Giá và điều kiện lắp đặt sẽ được sale báo cụ thể trước khi anh chốt đơn.';
  const recipientLabel = customTexts.recipientLabel || 'Anh muốn mua quà cho:';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phoneNumber) return;
    setSubmitted(true);
    if (onSuccessSubmit) onSuccessSubmit();

    try {
      await submitConsultationLead({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        recipient: isRecipientHidden ? 'Tự dùng / Gia đình' : recipient,
        budgetTier,
        interestedProducts: interestedProducts.trim(),
        deliveryArea: deliveryArea.trim(),
      });
    } catch (err) {
      console.error('Không thể lưu vào Firebase', err);
    }
  };

  return (
    <section id="register-form" className="py-12 sm:py-16 bg-white border-b border-neutral-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-rose-50/80 via-white to-neutral-50 rounded-3xl border border-rose-200 p-6 sm:p-10 shadow-sm">
          <div className="text-center max-w-xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold mb-2">
              <Heart className="w-3.5 h-3.5 fill-rose-600/30 text-rose-600" />
              <span>{badge}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              {title}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600">
              {subtitle}
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-8 bg-white rounded-2xl border border-neutral-200 p-6">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">
                KDT-89 đã nhận thông tin của anh {fullName}!
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 mb-4">
                Chuyên viên sale của KDT-89 sẽ gọi vào số <strong>{phoneNumber}</strong> để xác nhận sản phẩm và giữ giá ưu đãi tốt nhất ngay cho anh.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold"
              >
                Gửi thêm yêu cầu khác
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Recipient Selection (Tùy chọn Bật/Tắt) */}
              {!isRecipientHidden && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wide">
                      {recipientLabel}
                    </label>
                    {isAdmin && onToggleRecipient && (
                      <button
                        type="button"
                        onClick={onToggleRecipient}
                        className="text-[11px] text-neutral-500 hover:text-neutral-800 flex items-center gap-1 cursor-pointer bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200"
                        title="Quyền Admin: Bấm để Tắt mục này nếu chương trình không cần hỏi người nhận quà"
                      >
                        <EyeOff className="w-3 h-3 text-neutral-500" />
                        <span>Tắt mục này</span>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['Vợ', 'Mẹ', 'Người thân'] as const).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setRecipient(item)}
                        className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                          recipient === item
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-1 ring-rose-600'
                            : 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-300'
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
              )}

              {/* Khi mục này đang TẮT và Admin đang xem, hiển thị thanh nhắc nhở Admin có thể bật lại */}
              {isRecipientHidden && isAdmin && onToggleRecipient && (
                <div className="p-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/80 flex items-center justify-between text-xs text-amber-900 shadow-2xs">
                  <span className="flex items-center gap-1.5">
                    <EyeOff className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Mục <strong>&quot;Anh muốn mua quà cho ai&quot;</strong> đang <strong>TẮT</strong> (không hiển thị với khách)</span>
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

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    Họ tên của anh *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="VD: Anh Tuấn (Kỹ thuật/Thợ)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    Số điện thoại liên hệ *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="VD: 0988 xxx xxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-xs"
                  />
                </div>
              </div>

              {/* Ngân sách & Sản phẩm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    Ngân sách dự kiến
                  </label>
                  <select
                    value={budgetTier}
                    onChange={(e) => setBudgetTier(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-xs"
                  >
                    <option value="Dưới 1.000.000đ">Dưới 1.000.000đ</option>
                    <option value="Từ 1.000.000đ đến 2.000.000đ">Từ 1.000.000đ đến 2.000.000đ</option>
                    <option value="Từ 2.000.000đ đến 4.000.000đ">Từ 2.000.000đ đến 4.000.000đ</option>
                    <option value="Trên 4.000.000đ">Trên 4.000.000đ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    Sản phẩm quan tâm
                  </label>
                  <input
                    type="text"
                    value={interestedProducts}
                    onChange={(e) => setInterestedProducts(e.target.value)}
                    placeholder="VD: Nồi Cuckoo, Bếp đôi Ferroli, Máy lạnh Casper..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-xs"
                  />
                </div>
              </div>

              {/* Delivery Area */}
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">
                  Khu vực giao hàng / Nhận tại kho
                </label>
                <input
                  type="text"
                  value={deliveryArea}
                  onChange={(e) => setDeliveryArea(e.target.value)}
                  placeholder="VD: Nhận trực tiếp tại kho KDT-89, hoặc giao về Quận/Huyện..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi thông tin – Giữ hàng cho tôi</span>
                </button>
              </div>

              <p className="text-[11px] text-center text-neutral-500 pt-1">
                {COMPANY_INFO.policyNote}
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
