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
  AlertCircle,
} from 'lucide-react';
import { SiteDecorSettings, MegaSaleCampaignConfig } from '../lib/firebase';
import {
  MEGA_SALE_PRESETS,
  MegaSalePreset,
  DEFAULT_MEGA_SALE_CONFIG,
} from '../data/saleCampaigns';

interface MegaSaleCampaignCountdownProps {
  decorSettings?: SiteDecorSettings;
  onExploreProducts: () => void;
  onOpenOrderModal?: () => void;
  onOpenConsultation?: (note?: string) => void;
  isAdmin?: boolean;
  onOpenDecorationModal?: () => void;
  onUpdateDecorSettings?: (partial: Partial<SiteDecorSettings>) => void;
}

export const MegaSaleCampaignCountdown: React.FC<MegaSaleCampaignCountdownProps> = ({
  decorSettings,
  onExploreProducts,
  onOpenOrderModal,
  onOpenConsultation,
  isAdmin = false,
  onOpenDecorationModal,
  onUpdateDecorSettings,
}) => {
  // Config loaded from decorSettings or fallback default (11.11 sale from 09/11 to 13/11)
  const config: MegaSaleCampaignConfig = useMemo(() => {
    return {
      ...DEFAULT_MEGA_SALE_CONFIG,
      ...(decorSettings?.megaSaleConfig || {}),
    };
  }, [decorSettings?.megaSaleConfig]);

  const isEnabled = config.enabled ?? true;

  // Local admin editing state for exact dates
  const [adminTeaserDate, setAdminTeaserDate] = useState<string>(config.teaserStartDate || '2026-11-02T00:00');
  const [adminStartDate, setAdminStartDate] = useState<string>(config.startDate || '2026-11-09T00:00');
  const [adminEndDate, setAdminEndDate] = useState<string>(config.endDate || '2026-11-13T23:59');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  useEffect(() => {
    if (config.teaserStartDate) setAdminTeaserDate(config.teaserStartDate);
    if (config.startDate) setAdminStartDate(config.startDate);
    if (config.endDate) setAdminEndDate(config.endDate);
  }, [config.teaserStartDate, config.startDate, config.endDate]);

  // Current real-time clock state & campaign lifecycle stage
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine stage:
  // 'PRE_TEASER': now < teaserStartDate (hidden from visitors, visible in admin)
  // 'UPCOMING': teaserStartDate <= now < startDate (counting down to start of big sale!)
  // 'LIVE': startDate <= now <= endDate (sale is live, counting down to end of sale!)
  // 'ENDED': now > endDate (sale has passed)
  const stageInfo = useMemo(() => {
    const teaserTime = new Date(config.teaserStartDate).getTime();
    const startTime = new Date(config.startDate).getTime();
    const endTime = new Date(config.endDate).getTime();
    const currentTime = now.getTime();

    if (currentTime < teaserTime) {
      return { stage: 'PRE_TEASER' as const, targetTime: startTime };
    }
    if (currentTime < startTime) {
      return { stage: 'UPCOMING' as const, targetTime: startTime };
    }
    if (currentTime <= endTime) {
      return { stage: 'LIVE' as const, targetTime: endTime };
    }
    return { stage: 'ENDED' as const, targetTime: endTime };
  }, [config.teaserStartDate, config.startDate, config.endDate, now]);

  // Calculate remaining time
  const timeLeft = useMemo(() => {
    const diff = Math.max(0, stageInfo.targetTime - now.getTime());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days, hours, minutes, seconds, diff };
  }, [stageInfo.targetTime, now]);

  // Format date helper (e.g. 09/11)
  const formatDateLabel = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} (${hh}:${min})`;
    } catch {
      return isoStr;
    }
  };

  const formatShortDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      return `${dd}/${mm}`;
    } catch {
      return isoStr;
    }
  };

  // Preset switch handler
  const handleApplyPreset = (preset: MegaSalePreset, customTeaser?: string) => {
    const updated: MegaSaleCampaignConfig = {
      enabled: true,
      campaignId: preset.id,
      title: preset.title,
      badge: preset.badge,
      subtitle: preset.subtitle,
      teaserStartDate: customTeaser || preset.teaserStartDate,
      startDate: preset.startDate,
      endDate: preset.endDate,
      highlights: preset.highlights,
      theme: preset.theme,
      buttonTextUpcoming: preset.buttonTextUpcoming,
      buttonTextLive: preset.buttonTextLive,
      earlyBirdSlots: 20,
    };

    setAdminTeaserDate(updated.teaserStartDate);
    setAdminStartDate(updated.startDate);
    setAdminEndDate(updated.endDate);

    if (onUpdateDecorSettings) {
      onUpdateDecorSettings({
        megaSaleConfig: updated,
      });
      setSaveNotice(`Đã chọn: ${preset.name}`);
      setTimeout(() => setSaveNotice(null), 3000);
    }
  };

  const handleSaveCustomDates = () => {
    const updated: MegaSaleCampaignConfig = {
      ...config,
      enabled: true,
      teaserStartDate: adminTeaserDate,
      startDate: adminStartDate,
      endDate: adminEndDate,
    };

    if (onUpdateDecorSettings) {
      onUpdateDecorSettings({
        megaSaleConfig: updated,
      });
      setSaveNotice('Đã lưu mốc ngày chiến dịch Siêu Sale!');
      setTimeout(() => setSaveNotice(null), 3000);
    }
  };

  const handleToggleEnabled = (enabled: boolean) => {
    if (onUpdateDecorSettings) {
      onUpdateDecorSettings({
        megaSaleConfig: {
          ...config,
          enabled,
        },
      });
      setSaveNotice(enabled ? 'Đã bật Đồng hồ Siêu Sale' : 'Đã tắt Đồng hồ Siêu Sale');
      setTimeout(() => setSaveNotice(null), 3000);
    }
  };

  // If disabled and not admin, do not render
  if (!isEnabled && !isAdmin) {
    return null;
  }

  // If stage is PRE_TEASER and not admin, don't show to visitors yet
  if (stageInfo.stage === 'PRE_TEASER' && !isAdmin) {
    return null;
  }

  // If stage is ENDED and not admin, hide
  if (stageInfo.stage === 'ENDED' && !isAdmin) {
    return null;
  }

  // Theme styling based on config.theme
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

  const isLive = stageInfo.stage === 'LIVE';
  const isUpcoming = stageInfo.stage === 'UPCOMING';
  const isPreTeaser = stageInfo.stage === 'PRE_TEASER';
  const isEnded = stageInfo.stage === 'ENDED';

  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);

  return (
    <section
      className={`relative overflow-hidden shadow-md border-b transition-all duration-300 ${getThemeClass(
        config.theme || 'red'
      )}`}
    >
      {/* Background Animated Subtle Atmosphere */}
      <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-yellow-400/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-red-500/20 blur-2xl pointer-events-none" />

      {/* =========================================================================
          ADMIN BAR (CHỈ ADMIN THẤY): DẠNG THU GỌN 1 DÒNG ĐỂ KHÔNG CHIẾM DIỆN TÍCH
         ========================================================================= */}
      {isAdmin && (
        <div className="bg-neutral-950/95 border-b border-amber-400/30 text-white relative z-30">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-1.5 flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={() => setIsAdminPanelOpen((prev) => !prev)}
              className="flex items-center gap-1.5 text-amber-300 hover:text-white font-bold cursor-pointer transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>👑 Cài đặt Mốc Siêu Sale 11.11</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 border border-amber-400/30">
                {stageInfo.stage === 'UPCOMING'
                  ? 'Đang đếm đón đầu'
                  : stageInfo.stage === 'LIVE'
                  ? 'Đang bùng nổ sale'
                  : stageInfo.stage === 'PRE_TEASER'
                  ? 'Chưa đến ngày teaser'
                  : 'Đã kết thúc'}
              </span>
              <span className="text-[10px] text-neutral-400 ml-1">
                {isAdminPanelOpen ? '▲ Thu gọn' : '▼ Chỉnh sửa ngày'}
              </span>
            </button>

            {saveNotice && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                {saveNotice}
              </span>
            )}

            <label className="relative inline-flex items-center cursor-pointer ml-auto">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => handleToggleEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-7 h-3.5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-400"></div>
              <span className="ml-1.5 text-[10px] font-bold text-neutral-300">
                {isEnabled ? 'BẬT' : 'TẮT'}
              </span>
            </label>
          </div>

          {/* Expanded Drawer for Admin Controls */}
          {isAdminPanelOpen && (
            <div className="px-3 sm:px-6 py-3 border-t border-neutral-800 bg-neutral-900/95 space-y-2.5 animate-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
                <span className="text-[11px] text-neutral-400 font-semibold shrink-0">Chọn mẫu:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(MEGA_SALE_PRESETS[0], '2026-11-02T00:00')}
                  className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs shrink-0 cursor-pointer"
                >
                  ⚡ 11.11 (Chạy 09-13/11 · Đếm từ hôm nay)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(MEGA_SALE_PRESETS[0], '2026-11-08T00:00')}
                  className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs shrink-0 cursor-pointer"
                >
                  ⚡ 11.11 (Đếm từ 08/11)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(MEGA_SALE_PRESETS[1])}
                  className="px-2.5 py-1 rounded bg-neutral-950 hover:bg-neutral-800 text-amber-400 font-semibold text-xs shrink-0 cursor-pointer border border-amber-500/40"
                >
                  🖤 Black Friday (25-29/11)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(MEGA_SALE_PRESETS[2])}
                  className="px-2.5 py-1 rounded bg-orange-700 hover:bg-orange-600 text-white font-semibold text-xs shrink-0 cursor-pointer"
                >
                  🎁 12.12 (10-14/12)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(MEGA_SALE_PRESETS[3])}
                  className="px-2.5 py-1 rounded bg-rose-700 hover:bg-rose-600 text-white font-semibold text-xs shrink-0 cursor-pointer"
                >
                  🔥 Xả Kho (26-31/12)
                </button>
              </div>

              <div className="pt-2 border-t border-neutral-800 flex flex-wrap items-center gap-2.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-400">Đếm đón đầu từ:</span>
                  <input
                    type="datetime-local"
                    value={adminTeaserDate}
                    onChange={(e) => setAdminTeaserDate(e.target.value)}
                    className="px-2 py-1 text-xs rounded bg-neutral-950 border border-neutral-700 text-white font-mono"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-300 font-bold">Giờ mở bán:</span>
                  <input
                    type="datetime-local"
                    value={adminStartDate}
                    onChange={(e) => setAdminStartDate(e.target.value)}
                    className="px-2 py-1 text-xs rounded bg-neutral-950 border border-neutral-700 text-white font-mono"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-300 font-bold">Kết thúc:</span>
                  <input
                    type="datetime-local"
                    value={adminEndDate}
                    onChange={(e) => setAdminEndDate(e.target.value)}
                    className="px-2 py-1 text-xs rounded bg-neutral-950 border border-neutral-700 text-white font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveCustomDates}
                  className="px-3 py-1 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold flex items-center gap-1 cursor-pointer ml-auto"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu mốc</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Notice if Pre-Teaser */}
      {isAdmin && isPreTeaser && (
        <div className="bg-amber-500/20 text-amber-200 text-[11px] py-1 px-4 text-center border-b border-amber-400/30 flex items-center justify-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>
            Đang ở chế độ xem trước Admin (Khách chỉ thấy từ ngày {formatDateLabel(config.teaserStartDate)})
          </span>
        </div>
      )}

      {/* =========================================================================
          PHIÊN BẢN ĐỒNG HỒ TINH GỌN (ULTRA-SLIM RIBBON ~40PX)
          Không chiếm nguyên mảng màn hình, không làm dài hành trình mua hàng
         ========================================================================= */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          {/* Cột trái: Tên chương trình & Mốc ngày (gọn trong 1 dòng) */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400 text-neutral-950 text-[10px] font-black uppercase tracking-wider shrink-0 shadow-2xs">
              <Zap className="w-3 h-3 text-neutral-950 fill-neutral-950" />
              <span>{isUpcoming ? 'SẮP SALE' : 'BÙNG NỔ'}</span>
            </span>

            <span className="font-black text-xs sm:text-sm text-white truncate drop-shadow-xs">
              {config.title || 'SIÊU DEAL 11.11'}
            </span>

            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/35 text-yellow-300 text-[10px] font-semibold border border-yellow-300/30 shrink-0">
              <Calendar className="w-2.5 h-2.5 text-yellow-300" />
              <span>{formatShortDate(config.startDate)} – {formatShortDate(config.endDate)}</span>
            </span>
          </div>

          {/* Cột phải: Đồng hồ đếm ngược RẤT NHỎ VỪA PHẢI + Nút Săn deal */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">
            {/* Nhãn đếm ngược */}
            <span className="text-[10px] sm:text-xs font-bold text-yellow-200 hidden sm:inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-yellow-300" />
              <span>{isUpcoming ? 'Mở bán sau:' : isLive ? 'Kết thúc sau:' : 'Còn lại:'}</span>
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

            {/* Nút nhỏ bấm nhảy thẳng xuống danh mục sản phẩm */}
            <a
              href="#products"
              onClick={onExploreProducts}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-lg bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-neutral-950 font-black text-[11px] sm:text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Săn deal</span>
              <ArrowRight className="w-3 h-3 text-neutral-950" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
