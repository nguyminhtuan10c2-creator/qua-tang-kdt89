import React, { useState, useEffect } from 'react';
import {
  X,
  Gift,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  LogIn,
  UserPlus,
  LogOut,
  Ticket,
} from 'lucide-react';
import { registerCustomerAccount, loginCustomerAccount } from '../lib/firebase';
import { CustomerAccount } from '../data/vouchers';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (account: CustomerAccount) => void;
  initialMode?: 'login' | 'register';
  currentAccount?: CustomerAccount | null;
  onLogoutCustomer?: () => void;
  onOpenVoucherWallet?: () => void;
  initialPhone?: string;
  initialName?: string;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
  currentAccount = null,
  onLogoutCustomer,
  onOpenVoucherWallet,
  initialPhone = '',
  initialName = '',
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialMode);

  // Form fields
  const [fullName, setFullName] = useState(initialName);
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [welcomeSuccess, setWelcomeSuccess] = useState<CustomerAccount | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setWelcomeSuccess(null);
      setPassword('');
      if (initialPhone) setPhoneNumber(initialPhone);
      if (initialName) setFullName(initialName);
      if (currentAccount) {
        // If already logged in, show profile
      } else {
        setActiveTab(initialMode);
      }
    }
  }, [isOpen, initialMode, initialPhone, initialName, currentAccount]);

  if (!isOpen) return null;

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
      setError('Số điện thoại không hợp lệ (Ví dụ: 0912345678 - bắt đầu bằng số 0, đủ 10 số).');
      return;
    }

    if (!cleanPass || cleanPass.length < 4) {
      setError('Vui lòng nhập mật khẩu từ 4 ký tự trở lên để bảo mật tài khoản.');
      return;
    }

    setIsLoading(true);
    try {
      const account = await registerCustomerAccount({
        fullName: cleanName,
        phoneNumber: cleanPhone,
        password: cleanPass,
        address: address.trim() || undefined,
      });

      // Save locally
      localStorage.setItem('kdt89_customer_account', JSON.stringify(account));
      setWelcomeSuccess(account);
      onLoginSuccess(account);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    const cleanPass = password.trim();

    if (!validatePhone(cleanPhone)) {
      setError('Vui lòng nhập số điện thoại hợp lệ (10 số, bắt đầu bằng 0).');
      return;
    }

    setIsLoading(true);
    try {
      const account = await loginCustomerAccount(cleanPhone, cleanPass || undefined);

      // Save locally
      localStorage.setItem('kdt89_customer_account', JSON.stringify(account));
      onLoginSuccess(account);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Không thể đăng nhập. Vui lòng kiểm tra lại số điện thoại và mật khẩu!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishWelcome = () => {
    if (welcomeSuccess) {
      onLoginSuccess(welcomeSuccess);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 text-white p-4 sm:p-5 text-center relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-11 h-11 mx-auto rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center mb-1.5 shadow-inner">
            {currentAccount ? (
              <User className="w-5 h-5 text-yellow-300" />
            ) : activeTab === 'register' ? (
              <Gift className="w-5 h-5 text-yellow-300" />
            ) : (
              <LogIn className="w-5 h-5 text-yellow-300" />
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold">
            {welcomeSuccess
              ? 'Tạo Tài Khoản Thành Công!'
              : currentAccount
              ? 'Tài Khoản Khách Hàng'
              : activeTab === 'register'
              ? 'Tạo Tài Khoản & Nhận Voucher Ưu Đãi'
              : 'Đăng Nhập Tài Khoản'}
          </h3>
          <p className="text-xs text-sky-100 mt-0.5">
            {welcomeSuccess
              ? 'Ví voucher giảm giá đã sẵn sàng sử dụng tại kho KDT-89'
              : currentAccount
              ? `Xin chào ${currentAccount.fullName} (${currentAccount.phoneNumber})`
              : activeTab === 'register'
              ? 'Đăng ký nhanh bằng SĐT để nhận voucher giảm giá theo từng đơn hàng'
              : 'Nhập số điện thoại và mật khẩu để quản lý đơn hàng & ví voucher'}
          </p>
        </div>

        {/* Tab Switcher (Only if not already logged in and not on success screen) */}
        {!currentAccount && !welcomeSuccess && (
          <div className="flex border-b border-neutral-200 bg-neutral-50 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError(null);
              }}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'border-blue-600 text-blue-600 bg-white shadow-2xs'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setError(null);
              }}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer relative ${
                activeTab === 'register'
                  ? 'border-blue-600 text-blue-600 bg-white shadow-2xs'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Tạo Tài Khoản</span>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-red-600 text-white animate-pulse">
                Ưu Đãi
              </span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* STATE 1: ALREADY LOGGED IN -> PROFILE VIEW */}
          {currentAccount && !welcomeSuccess ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-sm">
                    {currentAccount.fullName ? currentAccount.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 text-base">
                      {currentAccount.fullName}
                    </h4>
                    <p className="text-xs text-neutral-600 font-mono">
                      SĐT: <strong>{currentAccount.phoneNumber}</strong>
                    </p>
                  </div>
                </div>

                {currentAccount.address && (
                  <div className="text-xs text-neutral-600 flex items-start gap-1.5 pt-1 border-t border-blue-200/60">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>Địa chỉ: {currentAccount.address}</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-2">
                {onOpenVoucherWallet && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenVoucherWallet();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-neutral-950 font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Ticket className="w-4 h-4 text-neutral-900" />
                    <span>Mở Ví Voucher Khuyến Mãi</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (onLogoutCustomer) onLogoutCustomer();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng Xuất Tài Khoản</span>
                </button>
              </div>
            </div>
          ) : welcomeSuccess ? (
            /* STATE 2: REGISTRATION SUCCESS SCREEN */
            <div className="text-center py-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h4 className="text-base font-bold text-neutral-900">
                Chào mừng {welcomeSuccess.fullName}!
              </h4>
              <p className="text-xs text-neutral-600 mt-1">
                Tài khoản SĐT <strong className="text-blue-600 font-mono">{welcomeSuccess.phoneNumber}</strong> đã được tạo thành công!
              </p>

              {/* Gift Voucher Preview Cards */}
              <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Voucher Giảm Giá Theo Giá Trị Đơn Hàng Đã Kích Hoạt:</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="bg-white p-2 rounded-xl border border-amber-200/80 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-red-600 font-mono">KDT89-50K</div>
                      <div className="text-[11px] text-neutral-500">Giảm 50.000₫ cho đơn từ 1.500.000₫</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Đã kích hoạt
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-amber-200/80 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-red-600 font-mono">KDT89-100K</div>
                      <div className="text-[11px] text-neutral-500">Giảm 100.000₫ cho đơn từ 3.500.000₫</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Đã kích hoạt
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-amber-200/80 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-red-600 font-mono">KDT89-200K</div>
                      <div className="text-[11px] text-neutral-500">Giảm 200.000₫ cho đơn từ 7.000.000₫</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Đã kích hoạt
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-neutral-500 italic pt-1">
                  * Mỗi số điện thoại mua 1 lần sẽ được áp dụng voucher 1 lần.
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinishWelcome}
                className="w-full mt-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
              >
                <Ticket className="w-4 h-4 text-yellow-300" />
                <span>Xem Ví Voucher & Bắt Đầu Mua Sắm</span>
              </button>
            </div>
          ) : activeTab === 'login' ? (
            /* STATE 3: FORM ĐĂNG NHẬP */
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Input Phone */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Số điện thoại đăng nhập:
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Ví dụ: 0912345678"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Input Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-neutral-700">
                    Mật khẩu tài khoản:
                  </label>
                  <span className="text-[11px] text-neutral-400">
                    (Hoặc để trống nếu tạo bằng SĐT)
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-neutral-400 hover:text-neutral-600 absolute right-2.5 top-2.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Đang đăng nhập...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Đăng Nhập Ngay</span>
                  </>
                )}
              </button>

              {/* Switch to Register */}
              <div className="text-center pt-2 border-t border-neutral-100">
                <p className="text-xs text-neutral-600">
                  Chưa có tài khoản KDT-89?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('register');
                      setError(null);
                    }}
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Tạo tài khoản mới nhận voucher ưu đãi
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* STATE 4: FORM TẠO TÀI KHOẢN MỚI */
            <form onSubmit={handleRegister} className="space-y-3.5">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Input Full Name */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Họ và tên của anh/chị: <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Minh Tuấn"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Input Phone */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Số điện thoại đăng ký: <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Ví dụ: 0912345678"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">
                  * Mỗi số điện thoại mua 1 lần sẽ được dùng voucher 1 lần.
                </p>
              </div>

              {/* Input Password */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Mật khẩu bảo vệ tài khoản: <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu (từ 4 ký tự)..."
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-neutral-400 hover:text-neutral-600 absolute right-2.5 top-2.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Input Address (Optional) */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Địa chỉ nhận hàng (tuỳ chọn, điền để đặt mua nhanh):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Gift Voucher Notice */}
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-[11px] text-amber-900 leading-relaxed">
                <Gift className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Đặc quyền thành viên:</strong> Tặng ngay các mã voucher giảm giá trực tiếp theo giá trị từng đơn hàng nạp thẳng vào ví tài khoản sau khi tạo!
                </span>
              </div>

              {/* Policy Highlights */}
              <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-2 text-[11px] text-blue-900 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Bảo mật thông tin 100%. Kho KDT-89 chỉ dùng SĐT để gửi mã giảm giá và giao hàng kiểm tra mới thanh toán.
                </span>
              </div>

              {/* Submit Register Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Đang tạo tài khoản...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Tạo Tài Khoản & Kích Hoạt Voucher</span>
                  </>
                )}
              </button>

              {/* Switch to Login */}
              <div className="text-center pt-2 border-t border-neutral-100">
                <p className="text-xs text-neutral-600">
                  Đã có tài khoản KDT-89?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login');
                      setError(null);
                    }}
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Bấm vào đây để đăng nhập
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
