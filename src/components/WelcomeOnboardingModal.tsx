import React, { useState } from 'react';
import {
  X,
  Gift,
  ShoppingCart,
  UserPlus,
  LogIn,
  CheckCircle2,
  Phone,
  User,
  Lock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Ticket,
  Eye,
  EyeOff,
} from 'lucide-react';
import { DEFAULT_WELCOME_MASCOT_IMAGE } from '../data/heroSlides';
import {
  registerCustomerAccount,
  loginCustomerAccount,
} from '../lib/firebase';
import {
  CustomerAccount,
  DEFAULT_VOUCHERS,
  VoucherItem,
  formatShortVnd,
  getTotalVoucherAmount,
} from '../data/vouchers';

interface WelcomeOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDismissForever: () => void;
  onLoginSuccess: (account: CustomerAccount) => void;
  customTexts?: Record<string, string>;
  customHeroImage?: string;
  customMascotImage?: string;
  vouchers?: VoucherItem[];
}

export const WelcomeOnboardingModal: React.FC<WelcomeOnboardingModalProps> = ({
  isOpen,
  onClose,
  onDismissForever,
  onLoginSuccess,
  customTexts = {},
  customMascotImage,
  vouchers = DEFAULT_VOUCHERS,
}) => {
  const [slideIdx, setSlideIdx] = useState<0 | 1>(0);
  const [authTab, setAuthTab] = useState<'register' | 'login'>('register');

  // Registration / Login form state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdAccount, setCreatedAccount] = useState<CustomerAccount | null>(null);

  if (!isOpen) return null;

  const activeVouchers = vouchers.length > 0 ? vouchers : DEFAULT_VOUCHERS;
  const totalDiscountAmount = getTotalVoucherAmount(activeVouchers);
  const totalShortLabel = formatShortVnd(totalDiscountAmount);

  const welcomeTitle =
    customTexts.welcomePopupTitle ||
    `Nhận Ngay Bộ Voucher ${totalDiscountAmount.toLocaleString('vi-VN')}đ`;

  const validatePhone = (phone: string): boolean => {
    const clean = phone.replace(/[^0-9]/g, '');
    return clean.length >= 9 && clean.length <= 11 && clean.startsWith('0');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = fullName.trim();
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    const cleanPass = password.trim();

    if (!cleanName || cleanName.length < 2) {
      setError('Vui lòng nhập họ và tên của anh/chị.');
      return;
    }
    if (!validatePhone(cleanPhone)) {
      setError('Vui lòng nhập SĐT hợp lệ (10 số, bắt đầu bằng 0).');
      return;
    }
    if (!cleanPass || cleanPass.length < 4) {
      setError('Vui lòng đặt mật khẩu từ 4 ký tự trở lên (vd: 1234).');
      return;
    }

    setIsSubmitting(true);
    try {
      const account = await registerCustomerAccount({
        fullName: cleanName,
        phoneNumber: cleanPhone,
        password: cleanPass,
        voucherCodes: activeVouchers.map((v) => v.code),
      });
      localStorage.setItem('kdt89_customer_account', JSON.stringify(account));
      setCreatedAccount(account);
      onLoginSuccess(account);
      onDismissForever();
    } catch (err: any) {
      setError(
        err?.message || 'Số điện thoại này có thể đã đăng ký. Bấm sang tab Đã có TK nhé!'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (!validatePhone(cleanPhone)) {
      setError('Vui lòng nhập đúng số điện thoại đã đăng ký.');
      return;
    }

    setIsSubmitting(true);
    try {
      const account = await loginCustomerAccount(cleanPhone, password.trim() || undefined);
      localStorage.setItem('kdt89_customer_account', JSON.stringify(account));
      onLoginSuccess(account);
      onDismissForever();
      onClose();
    } catch (err: any) {
      setError(
        err?.message || 'Không thể đăng nhập. Kiểm tra lại SĐT hoặc mật khẩu giúp em nhé!'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onDismissForever();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-neutral-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={handleSkip}
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md max-h-[88vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Top Banner with 2-Slide Switcher */}
        <div className="bg-gradient-to-r from-rose-700 via-red-600 to-amber-600 text-white px-4 pt-3 pb-3 relative shrink-0">
          <button
            type="button"
            onClick={handleSkip}
            aria-label="Đóng cửa sổ chào mừng"
            className="absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-full bg-black/20 hover:bg-black/35 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Compact Slide Tabs */}
          <div className="flex items-center gap-1.5 pr-8 mb-2">
            <button
              type="button"
              onClick={() => setSlideIdx(0)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                slideIdx === 0
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'bg-white/15 text-white/90 hover:bg-white/25'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Bộ Voucher {totalShortLabel}</span>
            </button>
            <button
              type="button"
              onClick={() => setSlideIdx(1)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                slideIdx === 1
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'bg-white/15 text-white/90 hover:bg-white/25'
              }`}
            >
              <ShoppingCart className="w-3 h-3" />
              <span>Cách dùng Giỏ hàng</span>
            </button>
          </div>

          {slideIdx === 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <img
                  src={customMascotImage || DEFAULT_WELCOME_MASCOT_IMAGE}
                  alt="Mascot KDT-89"
                  className="w-10 h-10 rounded-full border border-yellow-300 bg-[#F4F7FB] object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-black leading-tight">
                    {welcomeTitle}
                  </h2>
                  <p className="text-[11px] text-rose-100 leading-snug line-clamp-2 mt-0.5">
                    Đăng ký SĐT trong 10 giây để mở Ví Voucher &amp; Giỏ hàng riêng.
                  </p>
                </div>
              </div>

              {/* Dynamic Voucher Preview Strip */}
              <div className="grid grid-cols-3 gap-1.5">
                {activeVouchers.slice(0, 3).map((v) => (
                  <div
                    key={v.code}
                    className="rounded-xl bg-white text-neutral-900 px-1.5 py-1.5 text-center shadow-xs"
                  >
                    <div className="text-[9px] font-mono font-bold text-rose-600 truncate">
                      {v.code}
                    </div>
                    <div className="text-xs font-black text-neutral-900">
                      -{formatShortVnd(v.discountAmount)}
                    </div>
                    <div className="text-[9px] text-neutral-500 leading-tight truncate">
                      Từ {v.minOrderAmount >= 1000000
                        ? `${(v.minOrderAmount / 1000000).toFixed(1).replace('.0', '')}tr`
                        : `${Math.round(v.minOrderAmount / 1000)}k`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 text-[11px]">
              <div className="font-black text-xs sm:text-sm">
                Giỏ Hàng Riêng KDT-89 — Chốt Deal Nhanh:
              </div>
              <div className="grid grid-cols-1 gap-1 text-rose-50">
                <div className="bg-white/15 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-yellow-400 text-neutral-950 font-black text-[10px] flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>Tạo tài khoản bằng SĐT ngay bên dưới để kích hoạt Ví Voucher.</span>
                </div>
                <div className="bg-white/15 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-yellow-400 text-neutral-950 font-black text-[10px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>Bấm <strong>&quot;+ Giỏ hàng&quot;</strong> ở nhiều món để gom đơn &amp; tự áp mã giảm.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Single Inner Scroll Body (Compact Mobile-First Form) */}
        <div className="p-3.5 sm:p-4 overflow-y-auto flex-1 bg-white">
          {createdAccount ? (
            <div className="text-center space-y-3 py-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Chào mừng {createdAccount.fullName}!
                </h3>
                <p className="text-xs text-neutral-600 mt-1">
                  Đã kích hoạt SĐT{' '}
                  <strong className="font-mono text-rose-600">{createdAccount.phoneNumber}</strong>{' '}
                  cùng bộ Voucher {totalShortLabel} &amp; Giỏ hàng riêng.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-sm inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Ticket className="w-4 h-4 text-yellow-300" />
                <span>Bắt Đầu Mua Sắm Ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Compact Auth Mode Tabs */}
              <div className="flex rounded-xl bg-neutral-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('register');
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    authTab === 'register'
                      ? 'bg-white text-rose-700 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Tạo TK nhận Voucher</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('login');
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    authTab === 'login'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đã có tài khoản</span>
                </button>
              </div>

              {error && (
                <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {authTab === 'register' ? (
                <form onSubmit={handleRegister} className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Họ và tên: <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Vd: Anh Minh Tuấn..."
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                      />
                      <User className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Số điện thoại / Zalo: <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Ví dụ: 0912345678"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-neutral-300 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                      />
                      <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Đặt mật khẩu (từ 4 ký tự): <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={4}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Vd: 1234..."
                        className="w-full pl-8 pr-9 py-2 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                      />
                      <Lock className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-neutral-400 hover:text-neutral-600 absolute right-2 top-1.5 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Gift className="w-4 h-4 text-yellow-200" />
                    <span>
                      {isSubmitting
                        ? 'Đang kích hoạt...'
                        : `Tạo Tài Khoản & Nhận ${totalShortLabel}`}
                    </span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Số điện thoại đã đăng ký:
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Ví dụ: 0912345678"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-neutral-300 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Mật khẩu (bỏ trống nếu chưa đặt):
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhập mật khẩu..."
                        className="w-full pl-8 pr-9 py-2 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <Lock className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-neutral-400 hover:text-neutral-600 absolute right-2 top-1.5 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{isSubmitting ? 'Đang đăng nhập...' : 'Đăng Nhập Tài Khoản'}</span>
                  </button>
                </form>
              )}

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-neutral-500 hover:text-neutral-800 font-medium cursor-pointer"
                >
                  Để sau, xem sản phẩm trước →
                </button>
                <span className="text-neutral-400">KDT-89 Chính Hãng</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
