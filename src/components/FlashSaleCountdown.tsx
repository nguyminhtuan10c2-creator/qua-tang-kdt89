import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Clock,
  Sparkles,
  ArrowRight,
  Zap,
  ShoppingBag,
  Calendar,
  Gift,
  CheckCircle2,
  PhoneCall,
  Sliders,
  ChevronRight,
  Info,
  X,
  Lock,
  Save,
  Check,
} from 'lucide-react';
import { SiteDecorSettings } from '../lib/firebase';
import { MAJOR_SALE_CAMPAIGNS, MajorSaleCampaign, getCampaignById } from '../data/saleCampaigns';

interface FlashSaleCountdownProps {
  decorSettings?: SiteDecorSettings;
  onExploreProducts: () => void;
  onOpenOrderModal?: () => void;
  onOpenConsultation?: (note?: string) => void;
  isAdmin?: boolean;
  onOpenDecorationModal?: () => void;
  onUpdateDecorSettings?: (partial: Partial<SiteDecorSettings>) => void;
}

export const FlashSaleCountdown: React.FC<FlashSaleCountdownProps> = ({
  decorSettings,
  onExploreProducts,
  onOpenOrderModal,
  onOpenConsultation,
  isAdmin = false,
  onOpenDecorationModal,
  onUpdateDecorSettings,
}) => {
  const isEnabled = decorSettings?.showCountdown ?? true;

  // Selected Campaign (defaults to configured activeSaleCampaignId or double_11)
  const defaultCampaignId = decorSettings?.activeSaleCampaignId || 'double_11';
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(defaultCampaignId);
  const [showTimelineModal, setShowTimelineModal] = useState<boolean>(false);

  // Custom inline datetime input state for Admin
  const [adminCustomDate, setAdminCustomDate] = useState<string>(() => {
    return decorSettings?.countdownTargetDate || '2026-11-11T00:00';
  });
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);

  // Sync when activeSaleCampaignId or target date changes from Firestore
  useEffect(() => {
    if (decorSettings?.activeSaleCampaignId) {
      setSelectedCampaignId(decorSettings.activeSaleCampaignId);
    }
    if (decorSettings?.countdownTargetDate) {
      setAdminCustomDate(decorSettings.countdownTargetDate);
    }
  }, [decorSettings?.activeSaleCampaignId, decorSettings?.countdownTargetDate]);

  const currentCampaign = useMemo(() => {
    return getCampaignById(selectedCampaignId);
  }, [selectedCampaignId]);

  // Overrides if admin customized title or badge
  const customTitle = decorSettings?.countdownTitle;
  const customBadge = decorSettings?.countdownBadge;
  const customButtonText = decorSettings?.countdownButtonText;

  const displayTitle =
    selectedCampaignId === defaultCampaignId && customTitle ? customTitle : currentCampaign.title;
  const displayBadge =
    selectedCampaignId === defaultCampaignId && customBadge ? customBadge : currentCampaign.badge;
  const displayButtonText =
    selectedCampaignId === defaultCampaignId && customButtonText
      ? customButtonText
      : currentCampaign.buttonText;

  // Effective Target Date
  const effectiveTargetDate = useMemo(() => {
    if (decorSettings?.countdownMode === 'target_date' && decorSettings?.countdownTargetDate) {
      return decorSettings.countdownTargetDate;
    }
    if (decorSettings?.countdownMode === 'daily') {
      return 'daily';
    }
    return currentCampaign.targetDate;
  }, [
    decorSettings?.countdownMode,
    decorSettings?.countdownTargetDate,
    currentCampaign.targetDate,
  ]);

  // Format readable target date label for customer view
  const formattedTargetDateText = useMemo(() => {
    if (effectiveTargetDate === 'daily') {
      return '23:59 hôm nay';
    }
    try {
      const d = new Date(effectiveTargetDate);
      if (!isNaN(d.getTime())) {
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const MM = String(d.getMonth() + 1).padStart(2, '0');
        return `${hh}:${mm} ngày ${dd}/${MM}`;
      }
    } catch {
      // fallback
    }
    return currentCampaign.displayDateLabel;
  }, [effectiveTargetDate, currentCampaign.displayDateLabel]);

  // Time remaining state
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      let target: Date;

      if (effectiveTargetDate === 'daily') {
        target = new Date(now);
        target.setHours(23, 59, 59, 999);
      } else {
        target = new Date(effectiveTargetDate);
        if (isNaN(target.getTime())) {
          target = new Date(now);
          target.setHours(23, 59, 59, 999);
        }
      }

      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        const dailyDiff = Math.max(0, endOfDay.getTime() - now.getTime());
        const hours = Math.floor((dailyDiff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((dailyDiff / 1000 / 60) % 60);
        const seconds = Math.floor((dailyDiff / 1000) % 60);
        setTimeLeft({ days: 0, hours, minutes, seconds, isPast: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [effectiveTargetDate]);

  // Handle Admin Quick Set Presets
  const handleAdminSetPreset = (
    targetIso: string,
    campaignId?: string,
    label?: string
  ) => {
    const camp = campaignId ? getCampaignById(campaignId) : currentCampaign;
    setAdminCustomDate(targetIso);

    if (onUpdateDecorSettings) {
      onUpdateDecorSettings({
        showCountdown: true,
        countdownMode: 'target_date',
        countdownTargetDate: targetIso,
        activeSaleCampaignId: camp.id,
        countdownTitle: camp.title,
        countdownSubtitle: camp.subtitle,
        countdownBadge: camp.badge,
        countdownButtonText: camp.buttonText,
        countdownTheme: camp.theme,
      });
      setSaveSuccessNotice(label || `Đã set mốc đếm ngược đến ${targetIso}`);
      setTimeout(() => setSaveSuccessNotice(null), 3000);
    }
  };

  const handleAdminSaveCustomDate = () => {
    if (!adminCustomDate) return;
    if (onUpdateDecorSettings) {
      onUpdateDecorSettings({
        showCountdown: true,
        countdownMode: 'target_date',
        countdownTargetDate: adminCustomDate,
        activeSaleCampaignId: selectedCampaignId,
      });
      setSaveSuccessNotice(`Đã lưu mốc đếm ngược: ${adminCustomDate}`);
      setTimeout(() => setSaveSuccessNotice(null), 3000);
    }
  };

  const handleAdminSetDaily = () => {
    if (onUpdateDecorSettings) {
      onUpdateDecorSettings({
        showCountdown: true,
        countdownMode: 'daily',
        activeSaleCampaignId: 'daily_flash',
      });
      setSaveSuccessNotice('Đã chuyển về Flash Sale hằng ngày (24h)');
      setTimeout(() => setSaveSuccessNotice(null), 3000);
    }
  };

  if (!isEnabled && !isAdmin) {
    return null;
  }

  // Theme styling based on active campaign or decorSettings theme
  const activeTheme = decorSettings?.countdownTheme || currentCampaign.theme;
  const getThemeClass = (theme: string) => {
    switch (theme) {
      case 'black':
        return 'bg-gradient-to-r from-neutral-950 via-neutral-900 to-rose-950 border-neutral-800 text-white';
      case 'gold':
        return 'bg-gradient-to-r from-red-900 via-amber-800 to-yellow-700 border-amber-600/50 text-white';
      case 'orange':
        return 'bg-gradient-to-r from-amber-700 via-orange-600 to-red-700 border-orange-500/50 text-white';
      case 'rose':
        return 'bg-gradient-to-r from-rose-800 via-red-700 to-orange-700 border-rose-500/50 text-white';
      case 'red':
      default:
        return 'bg-gradient-to-r from-red-700 via-rose-700 to-amber-600 border-red-500/50 text-white';
    }
  };

  return (
    <section
      className={`relative overflow-hidden shadow-md border-b transition-colors duration-300 ${getThemeClass(
        activeTheme
      )}`}
    >
      {/* Background Animated Subtle Atmosphere */}
      <div
        className={`absolute -top-10 -left-10 w-40 h-40 rounded-full blur-2xl pointer-events-none ${currentCampaign.cardGlow}`}
      />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-red-500/20 rounded-full blur-2xl pointer-events-none" />

      {/* Admin Notice if hidden to visitors */}
      {!isEnabled && isAdmin && (
        <div className="bg-neutral-900/95 text-amber-300 text-[11px] py-1 px-4 text-center flex items-center justify-center gap-2 border-b border-amber-500/40">
          <span>⚠️ Thanh Đếm Ngược Flash Sale đang TẮT với khách hàng.</span>
          {onOpenDecorationModal && (
            <button
              type="button"
              onClick={onOpenDecorationModal}
              className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold ml-2 transition-colors cursor-pointer text-[10px]"
            >
              Mở tùy chỉnh bật lại
            </button>
          )}
        </div>
      )}

      {/* =========================================================================
          1. ADMIN CONTROL BAR: DẠNG THU GỌN 1 DÒNG (CHỈ ADMIN THẤY)
         ========================================================================= */}
      {isAdmin && (
        <div className="bg-neutral-950/95 border-b border-amber-400/30 text-white relative z-20">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-1.5 flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={() => setIsAdminPanelOpen((prev) => !prev)}
              className="flex items-center gap-1.5 text-amber-300 hover:text-white font-bold cursor-pointer transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>👑 Cài đặt Đồng Hồ Flash Sale</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 border border-amber-400/30">
                {currentCampaign.shortName}
              </span>
              <span className="text-[10px] text-neutral-400 ml-1">
                {isAdminPanelOpen ? '▲ Thu gọn' : '▼ Đổi sự kiện & mốc ngày'}
              </span>
            </button>

            {saveSuccessNotice && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                {saveSuccessNotice}
              </span>
            )}

            {onOpenDecorationModal && (
              <button
                type="button"
                onClick={onOpenDecorationModal}
                className="text-[11px] text-amber-300 hover:text-white underline cursor-pointer ml-auto"
              >
                Cài đặt chi tiết
              </button>
            )}
          </div>

          {/* Drawer for Admin Controls */}
          {isAdminPanelOpen && (
            <div className="px-3 sm:px-6 py-3 border-t border-neutral-800 bg-neutral-900/95 space-y-2.5 animate-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                <span className="text-[11px] text-neutral-400 font-semibold shrink-0">Chọn sự kiện:</span>
                {MAJOR_SALE_CAMPAIGNS.map((c) => {
                  const isSelected = c.id === selectedCampaignId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCampaignId(c.id);
                        if (onUpdateDecorSettings) {
                          onUpdateDecorSettings({
                            activeSaleCampaignId: c.id,
                            countdownTitle: c.title,
                            countdownSubtitle: c.subtitle,
                            countdownBadge: c.badge,
                            countdownButtonText: c.buttonText,
                            countdownTheme: c.theme,
                            countdownMode: c.targetDate === 'daily' ? 'daily' : 'target_date',
                            countdownTargetDate:
                              c.targetDate === 'daily' ? '' : c.targetDate.slice(0, 16),
                          });
                          setSaveSuccessNotice(`Đã chuyển sang ${c.name}`);
                          setTimeout(() => setSaveSuccessNotice(null), 3000);
                        }
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-amber-400 text-neutral-950 font-bold'
                          : 'bg-white/10 hover:bg-white/20 text-neutral-200'
                      }`}
                    >
                      <span>{c.icon}</span>
                      <span>{c.shortName}</span>
                    </button>
                  );
                })}
              </div>

              {/* Exact Datetime Input for Custom Day/Hour */}
              <div className="pt-2 border-t border-neutral-800 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[11px] text-neutral-400">Chọn giờ phút kết thúc:</span>
                <input
                  type="datetime-local"
                  value={adminCustomDate}
                  onChange={(e) => setAdminCustomDate(e.target.value)}
                  className="px-2 py-1 text-xs rounded bg-neutral-950 border border-neutral-700 text-white font-mono"
                />
                <button
                  type="button"
                  onClick={handleAdminSaveCustomDate}
                  className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu mốc</span>
                </button>
                <button
                  type="button"
                  onClick={handleAdminSetDaily}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs cursor-pointer ml-auto"
                >
                  🔄 Đếm hết hôm nay (24h)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          2. PHIÊN BẢN ĐỒNG HỒ TINH GỌN (ULTRA-SLIM RIBBON ~40PX)
          Không chiếm nguyên mảng màn hình, trực quan và đưa khách đến ngay sản phẩm
         ========================================================================= */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          {/* Cột trái: Tên Flash Sale */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider shrink-0 shadow-2xs">
              <Flame className="w-3 h-3 text-yellow-300 fill-yellow-300" />
              <span>{displayBadge || 'FLASH SALE'}</span>
            </span>

            <span className="font-black text-xs sm:text-sm text-white truncate drop-shadow-xs">
              {displayTitle || 'GIÁ SỐC ONLINE TẠI KHO'}
            </span>

            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/30 text-yellow-200 text-[10px] font-semibold border border-white/10 shrink-0">
              <Calendar className="w-2.5 h-2.5 text-yellow-300" />
              <span>{formattedTargetDateText}</span>
            </span>
          </div>

          {/* Cột phải: Đồng hồ đếm ngược RẤT NHỎ VỪA PHẢI + Nút Xem deal */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">
            <span className="text-[10px] sm:text-xs font-bold text-yellow-200 hidden sm:inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-yellow-300" />
              <span>{timeLeft.days > 0 ? 'Mở bán sau:' : 'Chỉ còn:'}</span>
            </span>

            {/* Các khối đếm số nhỏ tinh tế */}
            <div className="flex items-center gap-1 text-xs font-mono font-bold">
              {timeLeft.days > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-black/80 text-yellow-300 text-[11px] sm:text-xs border border-white/20">
                  {timeLeft.days}d
                </span>
              )}
              <span className="px-1.5 py-0.5 rounded-md bg-black/80 text-white text-[11px] sm:text-xs border border-white/20">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-yellow-300 text-xs font-bold leading-none">:</span>
              <span className="px-1.5 py-0.5 rounded-md bg-black/80 text-white text-[11px] sm:text-xs border border-white/20">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-yellow-300 text-xs font-bold leading-none">:</span>
              <span className="px-1.5 py-0.5 rounded-md bg-black/80 text-yellow-300 text-[11px] sm:text-xs border border-yellow-400/50 animate-pulse">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>

            {/* Nút bấm nhảy thẳng xuống danh mục sản phẩm */}
            <a
              href="#products"
              onClick={onExploreProducts}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-lg bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-neutral-950 font-black text-[11px] sm:text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <span>{displayButtonText || 'Săn deal'}</span>
              <ArrowRight className="w-3 h-3 text-neutral-950" />
            </a>
          </div>
        </div>
      </div>

      {/* 3. MODAL: LỊCH SĂN SALE LỚN TRONG NĂM TẠI KDT-89 (Chỉ mở khi Admin hoặc khách bấm) */}
      {showTimelineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div
            className="relative w-full max-w-2xl bg-white text-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-auto flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-700 via-rose-700 to-amber-600 px-5 sm:px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold">
                  <Calendar className="w-5 h-5 text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">
                    Lịch Các Chương Trình Siêu Sale Lớn Trong Năm
                  </h3>
                  <p className="text-xs text-rose-100">
                    Kho Điện Tử KDT-89 – Chủ động kế hoạch giữ hàng và chốt giá sỉ tốt nhất
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTimelineModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Timeline Cards */}
            <div className="p-5 sm:p-6 space-y-3.5 overflow-y-auto">
              <div className="text-xs text-neutral-600 mb-2">
                Danh sách các chương trình Siêu Sale Lớn tại Kho Điện Tử KDT-89:
              </div>

              <div className="space-y-3">
                {MAJOR_SALE_CAMPAIGNS.map((c) => {
                  const isCurrent = c.id === selectedCampaignId;
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCampaignId(c.id);
                        setShowTimelineModal(false);
                      }}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCurrent
                          ? 'border-red-600 bg-red-50/70 shadow-sm ring-1 ring-red-500'
                          : 'border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{c.icon}</span>
                          <h4 className="font-bold text-sm sm:text-base text-neutral-900">
                            {c.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase">
                            {c.displayDateLabel}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 leading-relaxed">
                          {c.subtitle}
                        </p>
                        <div className="text-[11px] text-neutral-500">
                          <strong>Sản phẩm trợ giá:</strong> {c.highlights}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {isCurrent ? (
                          <span className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đang xem</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>Xem đồng hồ</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-neutral-500">
                Cam kết giữ nguyên giá niêm yết tại kho · Không tăng giá ảo rồi giảm
              </span>
              <button
                type="button"
                onClick={() => setShowTimelineModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
