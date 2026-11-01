import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Clock,
  Flame,
  Gift,
  Bell,
  Check,
  RotateCcw,
  Sliders,
  Palette,
  Eye,
  EyeOff,
  Tag,
  Zap,
} from 'lucide-react';
import { SiteDecorSettings } from '../lib/firebase';

interface StoreDecorationModalProps {
  isOpen: boolean;
  onClose: () => void;
  decorSettings?: SiteDecorSettings;
  isRecipientHidden?: boolean;
  onSaveDecorSettings: (settings: SiteDecorSettings, hideRecipient?: boolean) => void;
  onResetDecorSettings: () => void;
}

export const DEFAULT_DECOR_SETTINGS: SiteDecorSettings = {
  showCountdown: true,
  countdownTitle: '⚡ SIÊU FLASH SALE GIỜ VÀNG GIÁ SỈ TẬN KHO',
  countdownSubtitle: 'Áp dụng số lượng có hạn cho đối tác & khách hàng KDT-89 – Kiểm tra máy ưng ý mới thanh toán',
  countdownBadge: '⚡ GIÁ GỐC CHẠM ĐÁY',
  countdownMode: 'daily',
  countdownSoldPercent: 82,
  countdownButtonText: 'Săn deal ngay',
  fallingEffect: 'confetti',
  fallingSpeed: 'normal',
  showLiveOrderTicker: true,
  showCornerRibbon: true,
  cornerRibbonText: '🔥 DEAL SỐC HÔM NAY',
  enablePulsingCta: true,
};

export const StoreDecorationModal: React.FC<StoreDecorationModalProps> = ({
  isOpen,
  onClose,
  decorSettings,
  isRecipientHidden = false,
  onSaveDecorSettings,
  onResetDecorSettings,
}) => {
  const [formState, setFormState] = useState<SiteDecorSettings>(() => ({
    ...DEFAULT_DECOR_SETTINGS,
    ...(decorSettings || {}),
  }));

  const [hideRecipientField, setHideRecipientField] = useState<boolean>(isRecipientHidden);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setFormState({
        ...DEFAULT_DECOR_SETTINGS,
        ...(decorSettings || {}),
      });
      setHideRecipientField(isRecipientHidden);
      setSaveSuccess(false);
    }
  }, [isOpen, decorSettings, isRecipientHidden]);

  if (!isOpen) return null;

  const handleApplyPreset = (presetType: 'double_day' | 'black_friday' | 'tet' | 'women_day' | 'default') => {
    switch (presetType) {
      case 'double_day':
        setFormState((prev) => ({
          ...prev,
          showCountdown: true,
          countdownTitle: '⚡ ĐẠI TIỆC SIÊU SALE NGÀY ĐÔI – CHỚP DEAL GIÁ KHO',
          countdownSubtitle: 'Xả kho giá thợ cho toàn bộ Smart Tivi, Nồi cơm Cuckoo, Bếp từ đôi – Giao hỏa tốc 24h',
          countdownBadge: '⚡ SIÊU DEAL NGÀY ĐÔI',
          countdownMode: 'daily',
          countdownSoldPercent: 89,
          countdownButtonText: 'Săn deal ngày đôi',
          fallingEffect: 'confetti',
          showLiveOrderTicker: true,
          showCornerRibbon: true,
          cornerRibbonText: '⚡ BÃO SALE NGÀY ĐÔI',
        }));
        setHideRecipientField(true); // Don't ask recipient for double day sale
        break;

      case 'black_friday':
        setFormState((prev) => ({
          ...prev,
          showCountdown: true,
          countdownTitle: '🖤 BLACK FRIDAY – BÃO GIẢM GIÁ ĐẾN 50% LỚN NHẤT NĂM',
          countdownSubtitle: 'Cơ hội duy nhất trong năm – Toàn bộ điện máy, tivi, máy tắm nóng kịch sàn giá gốc tại kho',
          countdownBadge: '🖤 GIẢM ĐẾN 50%',
          countdownMode: 'daily',
          countdownSoldPercent: 93,
          countdownButtonText: 'Khóa giá Black Friday',
          fallingEffect: 'snow',
          showLiveOrderTicker: true,
          showCornerRibbon: true,
          cornerRibbonText: '🖤 BLACK FRIDAY -50%',
        }));
        setHideRecipientField(true); // Don't ask recipient for black friday
        break;

      case 'tet':
        setFormState((prev) => ({
          ...prev,
          showCountdown: true,
          countdownTitle: '🧧 SẮM ĐIỆN MÁY ĐÓN TẾT SUM VẦY – KHAI XUÂN ĐÓN LỘC',
          countdownSubtitle: 'Smart Tivi xem Táo Quân, Nồi cơm mâm cỗ Tết, Bếp từ lẩu sum vầy – Hàng sẵn kho giao hỏa tốc',
          countdownBadge: '🧧 KHAI XUÂN ĐÓN LỘC',
          countdownMode: 'daily',
          countdownSoldPercent: 85,
          countdownButtonText: 'Sắm Tết giá kho',
          fallingEffect: 'red_envelope',
          showLiveOrderTicker: true,
          showCornerRibbon: true,
          cornerRibbonText: '🧧 LỘC XUÂN SUM VẦY',
        }));
        setHideRecipientField(false); // Asking gift recipient makes sense for Tet gifts
        break;

      case 'women_day':
        setFormState((prev) => ({
          ...prev,
          showCountdown: true,
          countdownTitle: '💐 ĐẠI TIỆC 20/10 & 8/3 – TRI ÂN PHỤ NỮ VIỆT NAM',
          countdownSubtitle: 'Tặng kèm thiệp viết tay chu đáo & gói quà miễn phí – Món quà thiết thực mẹ và vợ đều ưng',
          countdownBadge: '🌸 QUÀ TẶNG MẸ & VỢ',
          countdownMode: 'daily',
          countdownSoldPercent: 78,
          countdownButtonText: 'Chọn quà tặng ngay',
          fallingEffect: 'hearts',
          showLiveOrderTicker: true,
          showCornerRibbon: true,
          cornerRibbonText: '🌸 QUÀ TẶNG YÊU THƯƠNG',
        }));
        setHideRecipientField(false); // Enable asking recipient for Women's Day
        break;

      case 'default':
      default:
        setFormState(DEFAULT_DECOR_SETTINGS);
        setHideRecipientField(false);
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveDecorSettings(formState, hideRecipientField);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-red-700 via-rose-700 to-amber-600 px-5 sm:px-6 py-4 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center text-white shrink-0">
              <Palette className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>Tùy chỉnh Trang trí Website & Flash Sale</span>
                <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-neutral-950 text-[10px] font-black uppercase">
                  Admin
                </span>
              </h3>
              <p className="text-xs text-rose-100">
                Tạo hiệu ứng cuốn hút, đồng hồ đếm ngược Flash Sale và phong cách trang trí thu hút khách
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Style Presets Strip */}
        <div className="px-5 py-3 bg-amber-50/80 border-b border-amber-200 flex flex-col gap-2 shrink-0">
          <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Mẫu trang trí nhanh theo sự kiện:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleApplyPreset('double_day')}
              className="px-2.5 py-1 rounded-xl bg-white border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
            >
              <span>⚡ Ngày Đôi (11.11 / 12.12)</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('black_friday')}
              className="px-2.5 py-1 rounded-xl bg-neutral-900 border border-neutral-700 text-white hover:bg-neutral-800 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
            >
              <span>🖤 Black Friday</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('tet')}
              className="px-2.5 py-1 rounded-xl bg-white border border-red-300 text-red-800 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
            >
              <span>🧧 Tết Đón Lộc</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('women_day')}
              className="px-2.5 py-1 rounded-xl bg-white border border-pink-300 text-pink-700 hover:bg-pink-50 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
            >
              <span>🌸 20/10 & 8/3</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('default')}
              className="px-2.5 py-1 rounded-xl bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100 text-xs font-medium transition-all cursor-pointer shadow-2xs flex items-center gap-1 ml-auto"
            >
              <RotateCcw className="w-3 h-3 text-neutral-500" />
              <span>Chuẩn KDT-89</span>
            </button>
          </div>
        </div>

        {/* Scrollable Form Settings */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[65vh]">
          {/* Section 1: Flash Sale Countdown Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 border border-neutral-200/90 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">
                    1. Thanh Đếm Ngược Flash Sale Giờ Vàng
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Thanh đồng hồ đếm ngược đỏ rực rỡ tạo cảm giác khẩn cấp săn deal
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.showCountdown}
                  onChange={(e) => setFormState({ ...formState, showCountdown: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                <span className="ml-2 text-xs font-bold text-neutral-700">
                  {formState.showCountdown ? 'Đang BẬT' : 'Đang TẮT'}
                </span>
              </label>
            </div>

            {formState.showCountdown && (
              <div className="space-y-3 pt-3 border-t border-neutral-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Tiêu đề Flash Sale
                    </label>
                    <input
                      type="text"
                      value={formState.countdownTitle || ''}
                      onChange={(e) => setFormState({ ...formState, countdownTitle: e.target.value })}
                      placeholder="VD: ⚡ SIÊU FLASH SALE GIỜ VÀNG GIÁ SỈ TẬN KHO"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Huy hiệu nổi bật
                    </label>
                    <input
                      type="text"
                      value={formState.countdownBadge || ''}
                      onChange={(e) => setFormState({ ...formState, countdownBadge: e.target.value })}
                      placeholder="VD: ⚡ GIÁ GỐC CHẠM ĐÁY, 🖤 BLACK FRIDAY"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Mô tả phụ
                  </label>
                  <input
                    type="text"
                    value={formState.countdownSubtitle || ''}
                    onChange={(e) => setFormState({ ...formState, countdownSubtitle: e.target.value })}
                    placeholder="VD: Áp dụng số lượng có hạn cho đối tác & khách hàng KDT-89..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Chế độ đếm ngược
                    </label>
                    <select
                      value={formState.countdownMode || 'daily'}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          countdownMode: e.target.value as 'daily' | 'target_date',
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    >
                      <option value="daily">Lặp lại 24h (Hết ngày hôm nay)</option>
                      <option value="target_date">Chọn ngày & giờ cụ thể</option>
                    </select>
                  </div>

                  {formState.countdownMode === 'target_date' && (
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Ngày kết thúc sale
                      </label>
                      <input
                        type="datetime-local"
                        value={formState.countdownTargetDate || ''}
                        onChange={(e) =>
                          setFormState({ ...formState, countdownTargetDate: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Thanh đã bán (% giả lập)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="20"
                        max="95"
                        value={formState.countdownSoldPercent ?? 82}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            countdownSoldPercent: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full accent-red-600"
                      />
                      <span className="text-xs font-bold text-red-700 w-10 text-right">
                        {formState.countdownSoldPercent ?? 82}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Chữ trên nút bấm
                    </label>
                    <input
                      type="text"
                      value={formState.countdownButtonText || 'Săn deal ngay'}
                      onChange={(e) =>
                        setFormState({ ...formState, countdownButtonText: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Falling Particle Effects */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 border border-neutral-200/90 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-pink-600 text-white flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900">
                  2. Hiệu ứng Rơi Trang trí trên Toàn Màn hình
                </h4>
                <p className="text-[11px] text-neutral-500">
                  Các hạt rơi nhẹ nhàng không che chữ, tạo không khí lễ hội cuốn hút
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              {[
                { id: 'none', label: '🚫 Không rơi', desc: 'Giao diện bình thường' },
                { id: 'confetti', label: '🎉 Bão Confetti', desc: 'Bão sale rực rỡ' },
                { id: 'sakura', label: '🌸 Hoa Đào / Sakura', desc: 'Mùa xuân & Tết' },
                { id: 'red_envelope', label: '🧧 Lì Xì & Tiền Vàng', desc: 'Thần tài & Khai xuân' },
                { id: 'snow', label: '❄️ Bông Tuyết', desc: 'Mùa đông & Noel' },
                { id: 'hearts', label: '🌹 Hoa Hồng & Tim', desc: '20/10, 8/3, Valentine' },
                { id: 'stars', label: '✨ Sao Vàng Lấp Lánh', desc: 'Sang trọng & Đẳng cấp' },
              ].map((eff) => (
                <button
                  key={eff.id}
                  type="button"
                  onClick={() => setFormState({ ...formState, fallingEffect: eff.id as any })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    formState.fallingEffect === eff.id
                      ? 'border-red-600 bg-red-50 ring-2 ring-red-500 font-bold'
                      : 'border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700'
                  }`}
                >
                  <div className="text-xs font-bold text-neutral-900">{eff.label}</div>
                  <div className="text-[10px] text-neutral-500">{eff.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Live Orders Social Proof & Corner Ribbon */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 border border-neutral-200/90 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900">
                  3. Thông Báo Đơn Hàng & Nút Deal Nổi
                </h4>
                <p className="text-[11px] text-neutral-500">
                  Kích thích tâm lý khách mua ngay khi thấy có người khác đang đặt hàng
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-white border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800">
                    Thông báo khách vừa đặt (Góc trái)
                  </span>
                  <input
                    type="checkbox"
                    checked={formState.showLiveOrderTicker ?? true}
                    onChange={(e) =>
                      setFormState({ ...formState, showLiveOrderTicker: e.target.checked })
                    }
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                </div>
                <p className="text-[11px] text-neutral-500">
                  Hiện hộp tin nhỏ &quot;Anh Tuấn vừa đặt Smart Tivi...&quot; giúp trang nhộn nhịp hơn.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800">
                    Huy hiệu Hot Deal nổi (Góc phải)
                  </span>
                  <input
                    type="checkbox"
                    checked={formState.showCornerRibbon ?? true}
                    onChange={(e) =>
                      setFormState({ ...formState, showCornerRibbon: e.target.checked })
                    }
                    className="w-4 h-4 accent-red-600 rounded"
                  />
                </div>
                <input
                  type="text"
                  value={formState.cornerRibbonText || ''}
                  onChange={(e) =>
                    setFormState({ ...formState, cornerRibbonText: e.target.value })
                  }
                  placeholder="VD: 🔥 DEAL SỐC HÔM NAY"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 bg-neutral-50 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Toggle Gift Recipient Field ("Anh muốn tặng quà cho ai") */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-950">
                    4. Mục Chọn Người Nhận Quà (Vợ / Mẹ / Người thân)
                  </h4>
                  <p className="text-[11px] text-amber-800">
                    Tắt bớt mục này khi chạy chương trình không cần hỏi người nhận quà (như Black Friday, xả kho...)
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!hideRecipientField}
                  onChange={(e) => setHideRecipientField(!e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                <span className="ml-2 text-xs font-bold text-neutral-800">
                  {!hideRecipientField ? 'Đang BẬT' : 'Đang TẮT (Ẩn)'}
                </span>
              </label>
            </div>

            <div className="text-xs text-amber-900/90 leading-relaxed bg-white/70 p-3 rounded-xl border border-amber-200/80">
              {hideRecipientField ? (
                <span className="flex items-center gap-1.5 text-neutral-700">
                  <EyeOff className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Hiện tại câu hỏi <strong>&quot;Anh muốn mua quà cho ai&quot;</strong> đang <strong>ẨN</strong> trong Form đặt hàng và Form đăng ký tư vấn. Khách chỉ cần điền tên, sđt và địa chỉ nhận hàng để chốt đơn nhanh nhất.
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Hiện tại câu hỏi <strong>&quot;Anh muốn mua quà cho ai&quot;</strong> đang <strong>HIỂN THỊ</strong> (phù hợp dịp 20/10, 8/3, sinh nhật, quà tặng người thân).
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onResetDecorSettings}
              className="px-4 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục mặc định</span>
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-extrabold text-sm shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-yellow-300" />
                  <span>Đã lưu thành công!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Lưu & Áp dụng ngay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
