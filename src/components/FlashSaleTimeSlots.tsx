import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Clock,
  Zap,
  Calendar,
  Sparkles,
  ChevronRight,
  Sliders,
  Check,
  Lock,
  Eye,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { SiteDecorSettings, MegaSaleCampaignConfig } from '../lib/firebase';
import { DEFAULT_MEGA_SALE_CONFIG } from '../data/saleCampaigns';

export interface TimeSlotItem {
  id: string;
  dayLabel: string; // 'Chỉ còn' | 'Hôm nay' | 'Ngày mai' | '09/11' | '11/11'
  timeLabel: string; // '09:00' | '12:00' | '18:00' | '21:00' | '00:00'
  isLive?: boolean; // Khung giờ đang diễn ra
  targetDate?: string; // ISO datetime
}

interface FlashSaleTimeSlotsProps {
  decorSettings?: SiteDecorSettings;
  activeCategoryTab?: string;
  onSelectCategoryTab?: (catId: string) => void;
  activeSlotId?: string;
  onSelectSlot?: (slot: TimeSlotItem) => void;
  isAdmin?: boolean;
  onOpenDecorationModal?: () => void;
  onUpdateDecorSettings?: (partial: Partial<SiteDecorSettings>) => void;
  onOpenConsultation?: (note?: string) => void;
  onOpenVoucherWallet?: () => void;
}

export const FlashSaleTimeSlots: React.FC<FlashSaleTimeSlotsProps> = ({
  decorSettings,
  activeCategoryTab = 'all',
  onSelectCategoryTab,
  activeSlotId,
  onSelectSlot,
  isAdmin = false,
  onOpenDecorationModal,
  onUpdateDecorSettings,
  onOpenConsultation,
  onOpenVoucherWallet,
}) => {
  // Load Mega Sale Config
  const megaConfig: MegaSaleCampaignConfig = useMemo(() => {
    return {
      ...DEFAULT_MEGA_SALE_CONFIG,
      ...(decorSettings?.megaSaleConfig || {}),
    };
  }, [decorSettings?.megaSaleConfig]);

  // Real-time clock
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Admin Override Mode for previewing (auto, teaser_mode, live_mode)
  const [adminModeOverride, setAdminModeOverride] = useState<'auto' | 'teaser' | 'live'>('auto');

  // Determine true campaign stage:
  // Teaser/Upcoming: now < startDate
  // Live: startDate <= now <= endDate
  const realStage = useMemo(() => {
    const startTime = new Date(megaConfig.startDate).getTime();
    const endTime = new Date(megaConfig.endDate).getTime();
    const curTime = now.getTime();

    if (curTime < startTime) return 'UPCOMING'; // Đếm ngược ĐẾN NGÀY SALE
    if (curTime <= endTime) return 'LIVE'; // Đang trong THỜI GIAN SALE
    return 'ENDED';
  }, [megaConfig.startDate, megaConfig.endDate, now]);

  // Effective mode (respects admin preview override if set)
  const effectiveStage = useMemo(() => {
    if (adminModeOverride === 'teaser') return 'UPCOMING';
    if (adminModeOverride === 'live') return 'LIVE';
    return realStage;
  }, [adminModeOverride, realStage]);

  const isDuringSale = effectiveStage === 'LIVE'; // Đang trong thời gian sale
  const isCountdownToSale = effectiveStage === 'UPCOMING'; // Đếm ngược ĐẾN ngày sale

  // Target time for countdown:
  // - If countdown to sale: Target is startDate (e.g. 09/11/2026 00:00)
  // - If during sale: Target is next slot end time or end of day / endDate
  const targetEndTime = useMemo(() => {
    if (isCountdownToSale) {
      return new Date(megaConfig.startDate).getTime();
    }
    // During sale: next slot e.g. 12:00, 18:00, or 23:59:59
    const end = new Date(now);
    const hour = now.getHours();
    if (hour < 9) end.setHours(9, 0, 0, 0);
    else if (hour < 12) end.setHours(12, 0, 0, 0);
    else if (hour < 18) end.setHours(18, 0, 0, 0);
    else if (hour < 21) end.setHours(21, 0, 0, 0);
    else end.setHours(23, 59, 59, 999);
    return end.getTime();
  }, [isCountdownToSale, megaConfig.startDate, now]);

  // Ticking time remaining
  const timeLeft = useMemo(() => {
    const diff = Math.max(0, targetEndTime - now.getTime());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days, hours, minutes, seconds, diff };
  }, [targetEndTime, now]);

  // Dynamic Time Slots based on stage
  // Trạng thái 1: Đếm ngược ĐẾN NGÀY SALE (Upcoming 11.11)
  // Trạng thái 2: Đang trong THỜI GIAN SALE (Chỉ còn [00:20:21] + Ngày mai 09:00, 12:00, 18:00)
  const timeSlots: TimeSlotItem[] = useMemo(() => {
    if (isCountdownToSale) {
      // Chuỗi mốc đếm ngược đến ngày mở sale 11.11 (Ngắn gọn, chuẩn mobile không bị tràn chữ)
      return [
        {
          id: 'slot_teaser_main',
          dayLabel: 'Mở bán sau',
          timeLabel: 'Sắp mở bán',
          isLive: true,
        },
        {
          id: 'slot_opening_day',
          dayLabel: '09/11',
          timeLabel: '00:00',
        },
        {
          id: 'slot_day_noon',
          dayLabel: '09/11',
          timeLabel: '12:00',
        },
        {
          id: 'slot_day_night',
          dayLabel: '10/11',
          timeLabel: '20:00',
        },
        {
          id: 'slot_grand_double_11',
          dayLabel: '11/11',
          timeLabel: '00:00',
        },
      ];
    } else {
      // Đang trong thời gian sale - Y HỆT ẢNH CHỤP ĐIỆN MÁY XANH
      return [
        {
          id: 'slot_live_now',
          dayLabel: 'Chỉ còn',
          timeLabel: 'LIVE',
          isLive: true,
        },
        {
          id: 'slot_tomorrow_09',
          dayLabel: 'Ngày mai',
          timeLabel: '09:00',
        },
        {
          id: 'slot_tomorrow_12',
          dayLabel: 'Ngày mai',
          timeLabel: '12:00',
        },
        {
          id: 'slot_tomorrow_18',
          dayLabel: 'Ngày mai',
          timeLabel: '18:00',
        },
        {
          id: 'slot_tomorrow_21',
          dayLabel: 'Ngày mai',
          timeLabel: '21:00',
        },
      ];
    }
  }, [isCountdownToSale]);


  // Selected slot state
  const [currentSlotId, setCurrentSlotId] = useState<string>(() => {
    return activeSlotId || timeSlots[0].id;
  });

  const handleSlotClick = (slot: TimeSlotItem) => {
    setCurrentSlotId(slot.id);
    if (onSelectSlot) onSelectSlot(slot);
  };

  // Category Deal Tabs (chuẩn DMX như ảnh chụp, gọn gàng trên mobile)
  const dealCategoryTabs = [
    { id: 'flash_deal', label: 'FLASH SALE GIÁ SỐC', isHot: true },
    { id: 'discount_50', label: 'GIẢM ĐẾN 50%', isSpecial: true },
    { id: 'televisions', label: 'TIVI GIẢM SÂU', isBlueBadge: true },
    { id: 'refrigerators', label: 'TỦ LẠNH GIẢM SỐC', isOrangeBadge: true },
    { id: 'air_conditioners', label: 'Máy lạnh' },
    { id: 'washing_machines', label: 'Máy giặt' },
    { id: 'vacuum_cleaners', label: 'Hút bụi' },
    { id: 'rice_cooker_appliances', label: 'Nồi cơm' },
    { id: 'air_fryers', label: 'Nồi chiên' },
    { id: 'accessories', label: 'Phụ kiện' },
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-neutral-200/90 shadow-sm overflow-hidden mb-6 transition-all">
      {/* =========================================================================
          ADMIN QUICK STATUS & MODE SWITCHER (CHỈ ADMIN THẤY)
         ========================================================================= */}
      {isAdmin && (
        <div className="bg-neutral-900 text-white px-3 sm:px-5 py-2 text-xs border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-amber-300">Admin Quản Lý Khung Giờ Flash Sale:</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                isCountdownToSale
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {isCountdownToSale ? '⏳ ĐANG ĐẾM NGƯỢC ĐẾN NGÀY SALE' : '🔥 ĐANG TRONG THỜI GIAN SALE'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[11px] text-neutral-400">Xem thử:</span>
            <button
              type="button"
              onClick={() => setAdminModeOverride('auto')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                adminModeOverride === 'auto' ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              Tự động
            </button>
            <button
              type="button"
              onClick={() => setAdminModeOverride('teaser')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                adminModeOverride === 'teaser' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-300'
              }`}
              title="Xem giao diện đếm ngược đón đầu trước ngày sale"
            >
              1. Đếm đến ngày sale
            </button>
            <button
              type="button"
              onClick={() => setAdminModeOverride('live')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                adminModeOverride === 'live' ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-300'
              }`}
              title="Xem giao diện khung giờ đang mở bán sale trực tiếp"
            >
              2. Trong giờ sale bùng nổ
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TIÊU ĐỀ GỌN GÀNG 1 DÒNG DUY NHẤT: KHUYẾN MÃI ONLINE (CHUẨN MOBILE)
         ========================================================================= */}
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between border-b border-neutral-150 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-neutral-900 tracking-tight shrink-0">
            Khuyến mãi online
          </h2>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
              isCountdownToSale
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}
          >
            {isCountdownToSale ? '⏳ Sắp mở bán 11.11' : '🔥 Bùng nổ sale'}
          </span>
        </div>

        {onOpenConsultation && (
          <button
            type="button"
            onClick={() =>
              onOpenConsultation(
                isCountdownToSale
                  ? 'Đăng ký nhận thông báo mở bán Flash Sale 11.11'
                  : 'Tư vấn săn deal trong khung giờ Flash Sale hiện tại'
              )
            }
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer shrink-0 py-1 px-1.5 rounded-lg hover:bg-rose-50"
            title="Nhận thông báo khi mở bán"
          >
            <Bell className="w-3.5 h-3.5 text-rose-600" />
            <span>Nhận tin</span>
          </button>
        )}
      </div>

      {/* =========================================================================
          ROW 1: CATEGORY DEAL TABS (CHUẨN ĐIỆN MÁY XANH NHƯ ẢNH CHỤP)
         ========================================================================= */}
      <div className="border-b border-neutral-200 bg-neutral-50/50 px-2 sm:px-4">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-2 text-xs scroll-smooth">
          {dealCategoryTabs.map((tab) => {
            const isSelected = activeCategoryTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectCategoryTab?.(tab.id)}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  tab.isHot
                    ? isSelected
                      ? 'text-red-600 border-b-2 border-red-600 bg-red-50/70 font-black'
                      : 'text-red-600 hover:bg-red-50/50'
                    : tab.isSpecial
                    ? isSelected
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-950 shadow-2xs font-black'
                      : 'bg-amber-100 hover:bg-amber-200/70 text-amber-900 border border-amber-300'
                    : tab.isBlueBadge
                    ? isSelected
                      ? 'bg-blue-600 text-white shadow-2xs font-black'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                    : tab.isOrangeBadge
                    ? isSelected
                      ? 'bg-orange-600 text-white shadow-2xs font-black'
                      : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200'
                    : isSelected
                    ? 'bg-neutral-900 text-white shadow-2xs font-black'
                    : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200'
                }`}
              >
                {tab.isHot && <Zap className="w-3.5 h-3.5 fill-red-600 text-red-600" />}
                {tab.isSpecial && <Sparkles className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          ROW 2: THANH KHUNG GIỜ SĂN SALE (TIMELINE SLOTS BAR)
          Căn chỉnh chính xác chuẩn mobile không bị tràn hay cắt chữ
         ========================================================================= */}
      <div className="p-2.5 sm:p-4 bg-white">
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar pb-1 scroll-smooth">
          {timeSlots.map((slot) => {
            const isSelected = currentSlotId === slot.id;
            const isSlotActiveNow = slot.isLive;

            // SLOT ĐANG DIỄN RA (BLUE PILL CHUẨN ĐIỆN MÁY XANH)
            if (isSlotActiveNow) {
              return (
                <div
                  key={slot.id}
                  onClick={() => handleSlotClick(slot)}
                  className="bg-gradient-to-b from-[#2992f0] to-[#1c78e0] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl shadow-sm text-center min-w-[124px] max-w-[140px] cursor-pointer shrink-0 transition-transform active:scale-95 ring-2 ring-blue-400/40 flex flex-col justify-center items-center"
                >
                  {/* Dòng 1: 'Chỉ còn' hoặc 'Mở bán sau' */}
                  <span className="text-[10px] sm:text-[11px] font-semibold text-white leading-tight">
                    {isCountdownToSale ? 'Mở bán sau' : 'Chỉ còn'}
                  </span>

                  {/* Dòng 2: Đồng hồ đếm ngược với các ô trắng gọn gàng */}
                  <div className="flex items-center gap-0.5 sm:gap-1 mt-1 font-mono font-black text-xs sm:text-sm">
                    {timeLeft.days > 0 && (
                      <>
                        <span className="bg-white text-[#1c78e0] px-1 py-0.5 rounded font-black text-[11px] sm:text-xs shadow-2xs">
                          {timeLeft.days}d
                        </span>
                        <span className="text-white text-[10px] font-bold leading-none">:</span>
                      </>
                    )}
                    <span className="bg-white text-[#1c78e0] px-1 py-0.5 rounded font-black text-[11px] sm:text-xs shadow-2xs">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-white text-[10px] font-bold leading-none">:</span>
                    <span className="bg-white text-[#1c78e0] px-1 py-0.5 rounded font-black text-[11px] sm:text-xs shadow-2xs">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-white text-[10px] font-bold leading-none">:</span>
                    <span className="bg-white text-[#1c78e0] px-1 py-0.5 rounded font-black text-[11px] sm:text-xs shadow-2xs">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              );
            }

            // CÁC KHUNG GIỜ KẾ TIẾP (Gọn gàng, không bị tràn viền)
            return (
              <div
                key={slot.id}
                onClick={() => handleSlotClick(slot)}
                className={`px-3 py-1.5 sm:py-2 rounded-2xl text-center min-w-[76px] sm:min-w-[90px] cursor-pointer shrink-0 transition-all flex flex-col justify-center items-center border ${
                  isSelected
                    ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                    : 'bg-[#f2f4f7] hover:bg-neutral-200/90 border-transparent text-neutral-800'
                }`}
              >
                {/* Dòng 1: 'Hôm nay' hoặc 'Ngày mai' hoặc ngày */}
                <span className="text-[10px] sm:text-[11px] font-medium text-neutral-500 leading-tight">
                  {slot.dayLabel}
                </span>

                {/* Dòng 2: Giờ cụ thể '09:00', '12:00', '18:00' */}
                <span className="text-xs sm:text-sm font-bold text-neutral-900 leading-tight mt-0.5">
                  {slot.timeLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

