import React, { useState } from 'react';
import { X, Lock, KeyRound, ShieldCheck, CheckCircle2, AlertCircle, LogOut, Camera, EyeOff, Tag, CloudCheck, Pencil, ShoppingBag, Type } from 'lucide-react';
import { loginAdminWithGoogle } from '../lib/firebase';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onLoginSuccess: () => void;
  onLogout: () => void;
  onOpenImageUpdater?: () => void;
  onOpenManageVisibility?: () => void;
  onOpenPriceEditor?: () => void;
  onOpenCategoryEditor?: () => void;
  onOpenOrders?: () => void;
  onOpenSiteTextEditor?: () => void;
  hiddenCount?: number;
  adminEmail?: string | null;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
  onLoginSuccess,
  onLogout,
  onOpenImageUpdater,
  onOpenManageVisibility,
  onOpenPriceEditor,
  onOpenCategoryEditor,
  onOpenOrders,
  onOpenSiteTextEditor,
  hiddenCount = 0,
  adminEmail,
}) => {
  const [passcode, setPasscode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    try {
      const res = await loginAdminWithGoogle();
      setSuccessMsg(`Chào anh ${res.email || ''}! Đã xác thực quyền Quản trị qua Google.`);
      setTimeout(() => {
        onLoginSuccess();
        setSuccessMsg('');
        onClose();
      }, 700);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Không thể đăng nhập Google. Anh có thể nhập mã quản trị 89 bên dưới.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = passcode.trim();
    // Allow passcode 89, kdt89, 1234, admin, or admin89
    if (clean === '89' || clean.toLowerCase() === 'kdt89' || clean === '1234' || clean.toLowerCase() === 'admin') {
      setErrorMsg('');
      setSuccessMsg('Đăng nhập Quản trị viên thành công!');
      setTimeout(() => {
        onLoginSuccess();
        setSuccessMsg('');
        setPasscode('');
        onClose();
      }, 700);
    } else {
      setErrorMsg('Mã quản trị chưa chính xác. Gợi ý: mã của công ty là 89');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="bg-neutral-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Khu vực Quản trị viên KDT-89
              </h3>
              <p className="text-[11px] text-neutral-400">
                Lưu trữ Firebase Cloud · Đồng bộ mọi thiết bị tức thì
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Cloud Badge */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Firebase Cloud Firestore</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
              Đồng bộ Realtime
            </span>
          </div>

          {isAdmin ? (
            /* Logged in state */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong className="block text-sm font-bold text-amber-900 mb-0.5">
                    Anh đang ở Quyền Quản trị viên (Admin)
                  </strong>
                  {adminEmail && (
                    <div className="text-[11px] font-medium text-amber-800 mb-1">
                      Tài khoản Google: <strong>{adminEmail}</strong>
                    </div>
                  )}
                  Mọi thay đổi (sửa giá, đổi ảnh, ẩn/hiện sản phẩm) đều được lưu trực tiếp lên Google Cloud và hiển thị ngay trên điện thoại khách hàng.
                </div>
              </div>

              <div className="space-y-2">
                {onOpenOrders && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenOrders();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors ring-1 ring-rose-400"
                  >
                    <ShoppingBag className="w-4 h-4 text-white" />
                    <span>Xem danh sách đơn đặt hàng của khách</span>
                  </button>
                )}

                {onOpenSiteTextEditor && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSiteTextEditor();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Type className="w-4 h-4 text-sky-200" />
                    <span>Sửa nội dung chữ trên trang & Tiêu đề share link Zalo</span>
                  </button>
                )}

                {onOpenPriceEditor && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPriceEditor();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Tag className="w-4 h-4" />
                    <span>Sửa giá sản phẩm (Giá chương trình & Giá niêm yết)</span>
                  </button>
                )}

                {onOpenCategoryEditor && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCategoryEditor();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-amber-400" />
                    <span>Sửa đề mục & mô tả nhóm (Máy tắm nóng, điều kiện lắp đặt...)</span>
                  </button>
                )}

                {onOpenManageVisibility && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenManageVisibility();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <EyeOff className="w-4 h-4 text-amber-400" />
                    <span>Quản lý Ẩn / Hiện sản phẩm {hiddenCount > 0 ? `(Đang ẩn ${hiddenCount} món)` : ''}</span>
                  </button>
                )}

                {onOpenImageUpdater && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenImageUpdater();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Mở bảng Cập nhật hình ảnh sản phẩm & Logo</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Thoát quyền Admin (Xem giao diện như khách bình thường)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Login form */
            <div className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Google 1-click Sign-In */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 border-2 border-neutral-300 font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-98"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                    />
                  </svg>
                  <span>{isGoogleLoading ? 'Đang xác thực...' : 'Đăng nhập nhanh với Google'}</span>
                </button>
              </div>

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-neutral-200 w-full" />
                <span className="bg-white px-2 text-[10px] uppercase font-bold text-neutral-400 absolute">
                  Hoặc nhập mã
                </span>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                    Nhập mã quản trị (Passcode):
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={passcode}
                      onChange={(e) => {
                        setPasscode(e.target.value);
                        setErrorMsg('');
                      }}
                      placeholder="Nhập mã (Mặc định: 89)..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-300 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                    <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  </div>
                  <span className="text-[11px] text-neutral-500 block mt-1">
                    * Gợi ý: Nhập số <strong>89</strong> để bật quyền Admin.
                  </span>
                </div>

              </form>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-neutral-100 border-t border-neutral-200 text-center text-[11px] text-neutral-500">
          Chỉ có anh có quyền admin mới cập nhật được giá và hình ảnh sản phẩm.
        </div>
      </div>
    </div>
  );
};

