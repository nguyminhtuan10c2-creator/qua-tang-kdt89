import React, { useState } from 'react';
import { X, Lock, KeyRound, ShieldCheck, CheckCircle2, AlertCircle, LogOut, Camera, EyeOff } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onLoginSuccess: () => void;
  onLogout: () => void;
  onOpenImageUpdater?: () => void;
  onOpenManageVisibility?: () => void;
  hiddenCount?: number;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
  onLoginSuccess,
  onLogout,
  onOpenImageUpdater,
  onOpenManageVisibility,
  hiddenCount = 0,
}) => {
  const [passcode, setPasscode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

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
                Chỉ dành riêng cho anh quản trị cập nhật hình ảnh & kho
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
          {isAdmin ? (
            /* Logged in state */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong className="block text-sm font-bold text-amber-900 mb-0.5">
                    Anh đang ở Quyền Quản trị viên (Admin)
                  </strong>
                  Chỉ có thiết bị của anh mới thấy các nút &quot;Cập nhật hình&quot;, &quot;Đổi ảnh&quot;. Khách hàng hoặc thợ vào xem bình thường sẽ không thấy các nút này.
                </div>
              </div>

              <div className="space-y-2">
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
                    <span>Mở bảng Cập nhật hình ảnh sản phẩm ngay</span>
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
            <form onSubmit={handleLogin} className="space-y-4">
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

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                  Nhập mã quản trị (Passcode):
                </label>
                <div className="relative">
                  <input
                    type="password"
                    autoFocus
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

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
              >
                Xác nhận & Bật quyền Admin
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-neutral-100 border-t border-neutral-200 text-center text-[11px] text-neutral-500">
          Chỉ có anh có quyền admin mới cập nhật được hình ảnh sản phẩm.
        </div>
      </div>
    </div>
  );
};
