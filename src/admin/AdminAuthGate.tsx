import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  LogOut,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Send,
} from 'lucide-react';
import {
  ADMIN_OWNER_EMAIL,
  loginAdminWithGoogle,
  loginAdminWithEmailPassword,
  logoutFirebaseAuth,
  sendAdminVerificationEmail,
  reloadAdminAuthUser,
} from '../lib/firebase';

interface AdminAuthGateProps {
  currentUserEmail: string | null;
  isSignedInButUnauthorized: boolean;
  needsEmailVerification?: boolean;
  diagnosticError?: string | null;
  onAuthRefreshed?: () => void;
}

export const AdminAuthGate: React.FC<AdminAuthGateProps> = ({
  currentUserEmail,
  isSignedInButUnauthorized,
  needsEmailVerification = false,
  diagnosticError = null,
  onAuthRefreshed,
}) => {
  const [identifier, setIdentifier] = useState(currentUserEmail || 'admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [verifyingAction, setVerifyingAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ Tên đăng nhập (hoặc Email) và Mật khẩu.');
      return;
    }

    setLoadingEmail(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      const res = await loginAdminWithEmailPassword(identifier, password);
      if (res.needsVerification) {
        setInfoMsg(
          `Đã đăng nhập (${res.email}), nhưng email này chưa xác minh (emailVerified = false). Hãy bấm "Gửi email xác minh" bên dưới.`
        );
      } else if (res.diagnosticError) {
        setErrorMsg(res.diagnosticError);
      } else if (!res.isAdmin) {
        setErrorMsg(
          `Tài khoản ${res.email || 'này'} chưa được cấp quyền quản trị hệ thống KDT-89.`
        );
      }
      if (onAuthRefreshed) onAuthRefreshed();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Đăng nhập bằng Tài khoản/Mật khẩu thất bại.');
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      const res = await loginAdminWithGoogle();
      if (res.cancelled) return;
      if (res.needsVerification) {
        setInfoMsg(
          `Đã đăng nhập (${res.email}), nhưng email này chưa được xác minh.`
        );
      } else if (!res.isAdmin) {
        setErrorMsg(
          `Tài khoản ${res.email || 'này'} không có quyền quản trị hệ thống KDT-89.`
        );
      }
      if (onAuthRefreshed) onAuthRefreshed();
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'Đăng nhập Google thất bại. Vui lòng kiểm tra kết nối hoặc cho phép cửa sổ popup.'
      );
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleResendVerification = async () => {
    setVerifyingAction(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      await sendAdminVerificationEmail();
      setInfoMsg(
        `Đã gửi link xác minh tới ${currentUserEmail || ADMIN_OWNER_EMAIL}. Vui lòng mở Gmail bấm xác nhận, sau đó bấm "Tôi đã xác minh, kiểm tra lại".`
      );
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'Không thể gửi email xác minh. Vui lòng thử lại sau ít phút.'
      );
    } finally {
      setVerifyingAction(false);
    }
  };

  const handleCheckVerified = async () => {
    setVerifyingAction(true);
    setErrorMsg(null);
    try {
      const res = await reloadAdminAuthUser();
      if (res.isAdmin) {
        if (onAuthRefreshed) onAuthRefreshed();
      } else {
        setInfoMsg(
          'Firebase vẫn ghi nhận email chưa xác minh. Nếu bạn vừa bấm link trong Gmail, hãy đợi vài giây rồi kiểm tra lại.'
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể kiểm tra lại trạng thái tài khoản.');
    } finally {
      setVerifyingAction(false);
    }
  };

  const handleSignOut = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    await logoutFirebaseAuth();
    if (onAuthRefreshed) onAuthRefreshed();
  };

  const busy = loadingEmail || loadingGoogle || verifyingAction;

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
              Đăng nhập bằng Tên đăng nhập / Email & Mật khẩu hoặc Google
            </p>
          </div>
        </div>

        {needsEmailVerification && (
          <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Tài khoản cần xác minh Email</p>
                <p>
                  Bạn đã đăng nhập <strong>{currentUserEmail}</strong>, nhưng trạng thái{' '}
                  <code>emailVerified</code> trên Firebase đang là <code>false</code>. Quyền
                  admin yêu cầu email đã xác minh để bảo vệ dữ liệu Firestore.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={busy}
                onClick={handleResendVerification}
                className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi email xác minh</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleCheckVerified}
                className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-100 text-amber-900 font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tôi đã xác minh, kiểm tra lại</span>
              </button>
            </div>
          </div>
        )}

        {infoMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
            {infoMsg}
          </div>
        )}

        {((isSignedInButUnauthorized && !needsEmailVerification) || errorMsg || diagnosticError) && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Không thể đăng nhập quản trị</p>
              <p className="break-words">
                {errorMsg ||
                  diagnosticError ||
                  `Tài khoản hiện tại (${currentUserEmail}) chưa được cấp quyền admin. Chỉ tài khoản chủ sở hữu (${ADMIN_OWNER_EMAIL}) hoặc tài khoản được cấp quyền trong /admins mới được phép truy cập.`}
              </p>
            </div>
          </div>
        )}

        {/* Username/Email + Password Login Form */}
        <form onSubmit={handleEmailPasswordSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên đăng nhập hoặc Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin hoặc email quản trị"
                autoComplete="username"
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-500"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Nhập ngắn <code className="bg-slate-100 px-1 rounded">admin</code> (ứng với{' '}
              ngmtuan241@gmail.com) hoặc email quản trị được cấp quyền.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu Firebase Auth"
                autoComplete="current-password"
                required
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold text-sm transition-colors cursor-pointer"
          >
            {loadingEmail ? 'Đang đăng nhập...' : 'Đăng nhập bằng Tài khoản & Mật khẩu'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-[11px] font-medium text-slate-400 uppercase">Hoặc</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Google Sign-In Fallback / Alternative */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={busy}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-800 font-semibold text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
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
              {loadingGoogle ? 'Đang xác thực Google...' : 'Đăng nhập với Google'}
            </span>
          </button>

          {(isSignedInButUnauthorized || needsEmailVerification) && (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={busy}
              className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
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
          <span>Firebase Auth</span>
        </div>
      </div>
    </div>
  );
};
