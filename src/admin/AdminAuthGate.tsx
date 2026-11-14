import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, LogOut, ArrowLeft } from 'lucide-react';
import {
  ADMIN_OWNER_EMAIL,
  loginAdminWithGoogle,
  logoutFirebaseAuth,
} from '../lib/firebase';

interface AdminAuthGateProps {
  currentUserEmail: string | null;
  isSignedInButUnauthorized: boolean;
}

export const AdminAuthGate: React.FC<AdminAuthGateProps> = ({
  currentUserEmail,
  isSignedInButUnauthorized,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await loginAdminWithGoogle();
      if (res.cancelled) return;
      if (!res.isAdmin) {
        setErrorMsg(
          `Tài khoản ${res.email || 'này'} không có quyền quản trị hệ thống KDT-89.`
        );
      }
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'Đăng nhập Google thất bại. Vui lòng kiểm tra kết nối hoặc cho phép cửa sổ popup.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setErrorMsg(null);
    await logoutFirebaseAuth();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 text-slate-900">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              Quản trị Kho Điện Tử KDT-89
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Xác thực bằng tài khoản Google chủ sở hữu
            </p>
          </div>
        </div>

        {(isSignedInButUnauthorized || errorMsg) && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Không có quyền truy cập quản trị</p>
              <p>
                {errorMsg ||
                  `Tài khoản hiện tại (${currentUserEmail}) chưa được cấp quyền admin. Chỉ tài khoản chủ sở hữu (${ADMIN_OWNER_EMAIL}) mới được phép truy cập.`}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
            <span>
              {loading
                ? 'Đang xác thực Google...'
                : isSignedInButUnauthorized
                ? 'Chọn tài khoản Google khác'
                : 'Đăng nhập với Google'}
            </span>
          </button>

          {isSignedInButUnauthorized && (
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất tài khoản hiện tại</span>
            </button>
          )}
        </div>

        <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về trang bán hàng</span>
          </a>
          <span>Firebase Google Auth</span>
        </div>
      </div>
    </div>
  );
};
