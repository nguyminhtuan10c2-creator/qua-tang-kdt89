import React from 'react';
import { COMPANY_INFO } from '../data/products';
import { Phone, MessageCircle, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { KDTLogo } from './KDTLogo';

interface FooterProps {
  onOpenAdminLogin?: () => void;
  isAdmin?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdminLogin, isAdmin = false }) => {
  return (
    <footer className="bg-neutral-900 text-neutral-300 pt-12 pb-24 md:pb-12 border-t border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-neutral-800">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-3">
            <div className="bg-white/10 p-2 rounded-xl inline-block">
              <KDTLogo size="md" variant="full" />
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed pr-4">
              {COMPANY_INFO.programTitle} – Đồng hành cùng anh em thợ, kỹ thuật viên và đại lý đối tác thân thiết chuẩn bị món quà thiết thực, trọn vẹn yêu thương ngày 20/10.
            </p>
            <div className="pt-2 text-xs text-neutral-500">
              © {new Date().getFullYear()} {COMPANY_INFO.name}. Bản quyền thuộc về công ty.
            </div>
          </div>

          {/* Contact Details */}
          <div className="md:col-span-7 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-200 mb-3">
              Thông tin liên hệ & Kho hàng
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              {/* Hotline */}
              <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-750 flex items-start gap-3">
                <Phone className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-neutral-400 text-xs">Hotline:</div>
                  <a
                    href="tel:[Điền số điện thoại]"
                    className="font-semibold text-white hover:text-rose-400 transition-colors"
                  >
                    [Điền số điện thoại]
                  </a>
                </div>
              </div>

              {/* Zalo */}
              <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-750 flex items-start gap-3">
                <MessageCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-neutral-400 text-xs">Zalo:</div>
                  <a
                    href="#register-form"
                    className="font-semibold text-white hover:text-sky-400 transition-colors"
                  >
                    [Điền link Zalo]
                  </a>
                </div>
              </div>

              {/* Địa chỉ kho / showroom */}
              <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-750 flex items-start gap-3 sm:col-span-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-neutral-400 text-xs">Địa chỉ kho/showroom:</div>
                  <div className="font-semibold text-white">
                    {COMPANY_INFO.address}
                  </div>
                </div>
              </div>

              {/* Thời gian chương trình */}
              <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-750 flex items-start gap-3 sm:col-span-2">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-neutral-400 text-xs">Thời gian chương trình:</div>
                  <div className="font-semibold text-white">
                    {COMPANY_INFO.timeframe}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mandatory Policy Note & Admin Link */}
        <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-400">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-neutral-200">Ghi chú quan trọng: </strong>
              Số lượng có hạn, giá và điều kiện lắp đặt cần được sale xác nhận trước khi chốt đơn.
            </p>
          </div>

          {onOpenAdminLogin && (
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="text-[11px] text-neutral-500 hover:text-amber-400 transition-colors whitespace-nowrap self-end sm:self-auto cursor-pointer"
              title="Đăng nhập dành cho Quản trị viên KDT-89"
            >
              {isAdmin ? '👑 Quyền Admin (Đang bật)' : '🔒 Quản trị viên KDT-89'}
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};
