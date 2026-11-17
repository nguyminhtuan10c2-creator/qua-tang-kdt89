import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  RotateCcw,
  Save,
  Images,
  LayoutTemplate,
} from 'lucide-react';
import {
  DEFAULT_HERO_SLIDES,
  HERO_SLIDE_FALLBACK_MAP,
  DEFAULT_MEMBER_SLIDE_IMAGE,
  HeroAspectRatio,
  HeroMobileAspectRatio,
  HeroSlideAction,
  HeroSlideConfig,
  HeroSlideFit,
} from '../data/heroSlides';
import { compressImageFile } from '../lib/firebase';

interface HeroSlidesModalProps {
  isOpen: boolean;
  onClose: () => void;
  layoutMode: 'slider' | 'classic';
  showMemberSlide?: boolean;
  showMemberSlideMobile?: boolean;
  aspectRatio?: HeroAspectRatio;
  mobileAspectRatio?: HeroMobileAspectRatio;
  memberVisualFit?: HeroSlideFit;
  mobileMemberVisualFit?: HeroSlideFit;
  slides: HeroSlideConfig[];
  customImages: Record<string, string>;
  onUploadSlideImage: (imageKey: string, dataUrl: string) => Promise<void>;
  onDeleteSlideImage?: (imageKey: string) => Promise<void>;
  onSaveConfig: (
    nextMode: 'slider' | 'classic',
    nextSlides: HeroSlideConfig[],
    nextShowMemberSlide?: boolean,
    nextAspectRatio?: HeroAspectRatio,
    nextMemberVisualFit?: HeroSlideFit,
    nextMobileAspectRatio?: HeroMobileAspectRatio,
    nextMobileMemberVisualFit?: HeroSlideFit,
    nextShowMemberSlideMobile?: boolean
  ) => Promise<void>;
}

const ACTION_OPTIONS: Array<{ value: HeroSlideAction; label: string }> = [
  { value: 'products', label: 'Cuộn xuống xem Danh mục Sản phẩm' },
  { value: 'voucher', label: 'Mở Ví Voucher Khuyến Mãi' },
  { value: 'welcome', label: 'Mở Pop-up Đăng ký Thành viên mới' },
  { value: 'consult', label: 'Mở Pop-up Tư vấn / Nhận tin SĐT' },
  { value: 'none', label: 'Chỉ hiển thị ảnh (không bấm chuyển)' },
];

const ASPECT_RATIO_OPTIONS: Array<{ value: HeroAspectRatio; label: string }> = [
  { value: '5/1', label: '5:1 (1200×240 px · ĐMX)' },
  { value: '16/7', label: '16:7 (1600×700 px)' },
  { value: '2/1', label: '2:1 (1600×800 px)' },
  { value: '16/9', label: '16:9 (1600×900 px)' },
];

const MOBILE_ASPECT_OPTIONS: Array<{ value: HeroMobileAspectRatio; label: string }> = [
  { value: '16/9', label: '16:9 (800×450 px · Rõ nét)' },
  { value: '2/1', label: '2:1 (800×400 px · Gọn)' },
  { value: '4/3', label: '4:3 (800×600 px · To nhất)' },
];

const SLIDE_PIXEL_GUIDE: Record<HeroAspectRatio, { banner: string; memberLeft: string }> = {
  '5/1': {
    banner: '1200 × 240 px hoặc 1800 × 360 px (tỉ lệ ngang 5:1 chuẩn ĐMX)',
    memberLeft: '720 × 220 px (hoặc 1080 × 330 px · nửa trái PC)',
  },
  '16/7': {
    banner: '1600 × 700 px (hoặc 1280 × 560 px · tỉ lệ ngang 16:7)',
    memberLeft: '800 × 600 px (tỉ lệ 4:3 · nửa trái PC)',
  },
  '2/1': {
    banner: '1600 × 800 px (hoặc 1280 × 640 px · tỉ lệ ngang 2:1)',
    memberLeft: '800 × 660 px (tỉ lệ 5:4 · nửa trái PC)',
  },
  '16/9': {
    banner: '1600 × 900 px (hoặc 1280 × 720 px · tỉ lệ ngang 16:9)',
    memberLeft: '800 × 750 px (gần vuông 1:1 · nửa trái PC)',
  },
};

const MOBILE_PIXEL_GUIDE: Record<HeroMobileAspectRatio, string> = {
  '16/9': '800 × 450 px (hoặc 1080 × 608 px · tỉ lệ 16:9 cho Mobile)',
  '2/1': '800 × 400 px (hoặc 1000 × 500 px · tỉ lệ 2:1 cho Mobile)',
  '4/3': '800 × 600 px (hoặc 1000 × 750 px · tỉ lệ 4:3 to nhất Mobile)',
};

const FIT_OPTIONS: Array<{ value: HeroSlideFit; label: string }> = [
  { value: 'smart', label: 'Tự động chống cắt chữ/người (Khuyên dùng)' },
  { value: 'contain', label: 'Hiện trọn 100% ảnh (nền mờ 2 bên)' },
  { value: 'cover', label: 'Phủ kín viền khung (cover)' },
];

const PREVIEW_ASPECT_CLASS: Record<HeroAspectRatio, string> = {
  '5/1': 'aspect-[5/1]',
  '16/7': 'aspect-[16/7]',
  '2/1': 'aspect-[2/1]',
  '16/9': 'aspect-[16/9]',
};

const MOBILE_PREVIEW_ASPECT_CLASS: Record<HeroMobileAspectRatio, string> = {
  '16/9': 'aspect-[16/9]',
  '2/1': 'aspect-[2/1]',
  '4/3': 'aspect-[4/3]',
};

export const HeroSlidesModal: React.FC<HeroSlidesModalProps> = ({
  isOpen,
  onClose,
  layoutMode,
  showMemberSlide = true,
  showMemberSlideMobile,
  aspectRatio = '5/1',
  mobileAspectRatio = '16/9',
  memberVisualFit = 'smart',
  mobileMemberVisualFit = 'smart',
  slides,
  customImages,
  onUploadSlideImage,
  onDeleteSlideImage,
  onSaveConfig,
}) => {
  const [draftMode, setDraftMode] = useState<'slider' | 'classic'>(layoutMode);
  const [draftShowMember, setDraftShowMember] = useState<boolean>(showMemberSlide);
  const [draftShowMemberMobile, setDraftShowMemberMobile] = useState<boolean>(
    showMemberSlideMobile ?? showMemberSlide
  );
  const [draftAspectRatio, setDraftAspectRatio] = useState<HeroAspectRatio>(aspectRatio);
  const [draftMobileAspect, setDraftMobileAspect] = useState<HeroMobileAspectRatio>(mobileAspectRatio);
  const [draftMemberFit, setDraftMemberFit] = useState<HeroSlideFit>(memberVisualFit);
  const [draftMobileMemberFit, setDraftMobileMemberFit] = useState<HeroSlideFit>(mobileMemberVisualFit);
  const [draftSlides, setDraftSlides] = useState<HeroSlideConfig[]>([]);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const desktopOn = showMemberSlide !== false;
      setDraftMode(layoutMode || 'slider');
      setDraftShowMember(desktopOn);
      setDraftShowMemberMobile(showMemberSlideMobile ?? desktopOn);
      setDraftAspectRatio(aspectRatio || '5/1');
      setDraftMobileAspect(mobileAspectRatio || '16/9');
      setDraftMemberFit(memberVisualFit || 'smart');
      setDraftMobileMemberFit(mobileMemberVisualFit || 'smart');
      setDraftSlides(
        slides && slides.length > 0
          ? slides.map((s) => ({ ...s }))
          : DEFAULT_HERO_SLIDES.map((s) => ({ ...s }))
      );
      setNotice(null);
    }
  }, [
    isOpen,
    layoutMode,
    showMemberSlide,
    showMemberSlideMobile,
    aspectRatio,
    mobileAspectRatio,
    memberVisualFit,
    mobileMemberVisualFit,
    slides,
  ]);

  if (!isOpen) return null;

  const triggerUpload = (imageKey: string) => {
    pendingUploadKeyRef.current = imageKey;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const imageKey = pendingUploadKeyRef.current;
    e.target.value = '';
    if (!file || !imageKey) return;

    if (!file.type.startsWith('image/')) {
      setNotice('Vui lòng chọn file ảnh (JPG, PNG, WEBP).');
      return;
    }

    setUploadingKey(imageKey);
    setNotice('Đang xử lý ảnh độ nét cao & tải lên...');
    try {
      const isMobileAsset = imageKey.endsWith('-mobile');
      const targetMaxWidth = isMobileAsset ? 1200 : 1920;
      const targetQuality = isMobileAsset ? 0.93 : 0.94;
      const compressed = await compressImageFile(file, targetMaxWidth, targetQuality);
      await onUploadSlideImage(imageKey, compressed);
      setNotice('Đã cập nhật ảnh slide sắc nét thành công (tách biệt PC & Mobile)!');
    } catch (err: any) {
      setNotice(err?.message || 'Lỗi tải ảnh slide.');
    } finally {
      setUploadingKey(null);
      pendingUploadKeyRef.current = null;
    }
  };

  const handleAddSlide = () => {
    if (draftSlides.length >= 5) return;
    const nextIdx = draftSlides.length + 1;
    const newKey = `site-hero-slide-${nextIdx}`;
    setDraftSlides((prev) => [
      ...prev,
      {
        id: `slide-${Date.now()}`,
        imageKey: newKey,
        mobileImageKey: `${newKey}-mobile`,
        fallbackImage: HERO_SLIDE_FALLBACK_MAP['site-hero-slide-1'],
        mobileFallbackImage: HERO_SLIDE_FALLBACK_MAP['site-hero-slide-1'],
        title: `Banner Khuyến Mãi ${nextIdx}`,
        actionType: 'products',
        fit: 'smart',
        syncMobileWithPc: false,
      },
    ]);
  };

  const handleMove = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= draftSlides.length) return;
    const copy = [...draftSlides];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    setDraftSlides(copy);
  };

  const handleDelete = (index: number) => {
    if (draftSlides.length <= 1) return;
    setDraftSlides((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setDraftMode('slider');
    setDraftShowMember(true);
    setDraftShowMemberMobile(true);
    setDraftAspectRatio('5/1');
    setDraftMobileAspect('16/9');
    setDraftMemberFit('smart');
    setDraftMobileMemberFit('smart');
    setDraftSlides(DEFAULT_HERO_SLIDES.map((s) => ({ ...s })));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveConfig(
        draftMode,
        draftSlides,
        draftShowMember,
        draftAspectRatio,
        draftMemberFit,
        draftMobileAspect,
        draftMobileMemberFit,
        draftShowMemberMobile
      );
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const customPcMemberVisual = customImages['site-member-slide-visual'] || '';
  const memberVisualPreview = customPcMemberVisual || DEFAULT_MEMBER_SLIDE_IMAGE;
  const mobileMemberVisualPreview = customImages['site-member-slide-visual-mobile'] || '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <Images className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h3 className="font-bold text-base leading-tight">
                Quản lý Slide Ảnh Đầu Trang (Kiểu Điện Máy Xanh)
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Bao gồm Slide Mascot Đăng nhập nhận Voucher &amp; các banner khuyến mãi ngang
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {notice && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              {notice}
            </div>
          )}

          {/* Mode Toggle */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <LayoutTemplate className="w-4 h-4 text-blue-600" />
              <span>Kiểu hiển thị đầu trang:</span>
            </div>
            <div className="flex rounded-lg bg-slate-200/70 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setDraftMode('slider')}
                className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                  draftMode === 'slider'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Slide Ảnh Banner (ĐMX)
              </button>
              <button
                type="button"
                onClick={() => setDraftMode('classic')}
                className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                  draftMode === 'classic'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chữ + Ảnh truyền thống
              </button>
            </div>
          </div>

          {/* Aspect Ratio Selectors: Separate PC & Mobile */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  1. Khung ảnh cho Máy tính (PC):
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Hiển thị banner ngang rộng chuẩn trên màn hình Desktop/Laptop.
                </p>
              </div>
              <div className="flex flex-wrap rounded-lg bg-slate-200/70 p-1 text-[11px] font-bold gap-1 shrink-0">
                {ASPECT_RATIO_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDraftAspectRatio(opt.value)}
                    className={`px-2 py-1 rounded-md cursor-pointer transition-all ${
                      draftAspectRatio === opt.value
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  2. Khung ảnh riêng cho Điện thoại (Mobile):
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cao và to rõ hơn để khách lướt điện thoại dễ đọc chữ &amp; nhìn rõ sản phẩm.
                </p>
              </div>
              <div className="flex flex-wrap rounded-lg bg-slate-200/70 p-1 text-[11px] font-bold gap-1 shrink-0">
                {MOBILE_ASPECT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDraftMobileAspect(opt.value)}
                    className={`px-2 py-1 rounded-md cursor-pointer transition-all ${
                      draftMobileAspect === opt.value
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Member Onboarding Slide #1 Config: Separate & Non-Synced PC vs Mobile */}
          <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Slide #1 đầu trang: Ảnh thương hiệu &amp; Form Đăng nhập SĐT
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  <strong>Tải riêng lẻ không đồng bộ:</strong> Đổi ảnh hoặc Bật/Tắt trên PC sẽ không ảnh hưởng sang Điện thoại (và ngược lại).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setDraftShowMember(!draftShowMember)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    draftShowMember
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {draftShowMember ? '🖥️ PC: Đang BẬT' : '🖥️ PC: Đang TẮT'}
                </button>
                <button
                  type="button"
                  onClick={() => setDraftShowMemberMobile(!draftShowMemberMobile)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    draftShowMemberMobile
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {draftShowMemberMobile ? '📱 Mobile: Đang BẬT' : '📱 Mobile: Đang TẮT'}
                </button>
              </div>
            </div>

            {(draftShowMember || draftShowMemberMobile) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-sky-200/70">
                {/* PC Member Visual */}
                <div className={`p-2.5 rounded-xl bg-white border border-sky-200 space-y-2 ${!draftShowMember ? 'opacity-55' : ''}`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-extrabold text-blue-800 uppercase tracking-wide">
                      🖥️ Ảnh Slide #1 (Chỉ PC)
                    </span>
                    {customPcMemberVisual && onDeleteSlideImage && (
                      <button
                        type="button"
                        onClick={() => void onDeleteSlideImage('site-member-slide-visual')}
                        className="text-[10px] font-semibold text-rose-600 hover:underline cursor-pointer"
                      >
                        Khôi phục gốc
                      </button>
                    )}
                  </div>
                  <div className="aspect-[16/9] rounded-lg overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center relative">
                    <img
                      src={memberVisualPreview}
                      alt="Slide 1 PC"
                      className={`w-full h-full ${
                        draftMemberFit === 'cover' ? 'object-cover' : 'object-contain'
                      }`}
                    />
                    {!customPcMemberVisual && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/65 text-white text-[9px] font-semibold">
                        Ảnh mặc định PC
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerUpload('site-member-slide-visual')}
                    disabled={uploadingKey === 'site-member-slide-visual'}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3 h-3" />
                    <span>
                      {uploadingKey === 'site-member-slide-visual'
                        ? 'Đang tải...'
                        : 'Tải ảnh riêng cho PC'}
                    </span>
                  </button>
                  <div className="text-[10.5px] text-slate-600">
                    📐 Size: <strong>{SLIDE_PIXEL_GUIDE[draftAspectRatio].memberLeft}</strong>
                  </div>
                  <select
                    value={draftMemberFit}
                    onChange={(e) => setDraftMemberFit(e.target.value as HeroSlideFit)}
                    className="w-full px-2 py-1 rounded-md border border-slate-300 text-[11px] bg-white"
                  >
                    {FIT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mobile Member Visual (100% Independent — NEVER auto-inherits PC image) */}
                <div className={`p-2.5 rounded-xl bg-white border border-emerald-200 space-y-2 ${!draftShowMemberMobile ? 'opacity-55' : ''}`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wide">
                      📱 Ảnh Slide #1 (Chỉ Mobile)
                    </span>
                    <div className="flex items-center gap-2">
                      {customPcMemberVisual && (
                        <button
                          type="button"
                          onClick={() =>
                            void onUploadSlideImage('site-member-slide-visual-mobile', customPcMemberVisual)
                          }
                          className="text-[10px] font-semibold text-blue-600 hover:underline cursor-pointer"
                          title="Chép ảnh hiện tại của PC sang bản Mobile"
                        >
                          Chép từ PC
                        </button>
                      )}
                      {mobileMemberVisualPreview && onDeleteSlideImage && (
                        <button
                          type="button"
                          onClick={() => void onDeleteSlideImage('site-member-slide-visual-mobile')}
                          className="text-[10px] font-semibold text-rose-600 hover:underline cursor-pointer"
                        >
                          Khôi phục gốc
                        </button>
                      )}
                    </div>
                  </div>
                  <div
                    className={`${
                      MOBILE_PREVIEW_ASPECT_CLASS[draftMobileAspect] || 'aspect-[16/9]'
                    } rounded-lg overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center relative`}
                  >
                    <img
                      src={mobileMemberVisualPreview || DEFAULT_MEMBER_SLIDE_IMAGE}
                      alt="Slide 1 Mobile"
                      className={`w-full h-full ${
                        draftMobileMemberFit === 'cover' ? 'object-cover' : 'object-contain'
                      }`}
                    />
                    {!mobileMemberVisualPreview && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/65 text-white text-[9px] font-semibold">
                        Ảnh mặc định Mobile (độc lập PC)
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerUpload('site-member-slide-visual-mobile')}
                    disabled={uploadingKey === 'site-member-slide-visual-mobile'}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3 h-3" />
                    <span>
                      {uploadingKey === 'site-member-slide-visual-mobile'
                        ? 'Đang tải...'
                        : 'Tải ảnh riêng cho Mobile'}
                    </span>
                  </button>
                  <div className="text-[10.5px] text-slate-600">
                    📐 Size: <strong>{MOBILE_PIXEL_GUIDE[draftMobileAspect]}</strong>
                  </div>
                  <select
                    value={draftMobileMemberFit}
                    onChange={(e) => setDraftMobileMemberFit(e.target.value as HeroSlideFit)}
                    className="w-full px-2 py-1 rounded-md border border-slate-300 text-[11px] bg-white"
                  >
                    {FIT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Slide List */}
          <div className="space-y-3">
            {draftSlides.map((slide, idx) => {
              const imgSrc =
                customImages[slide.imageKey] ||
                slide.fallbackImage ||
                HERO_SLIDE_FALLBACK_MAP[slide.imageKey] ||
                '';

              return (
                <div
                  key={slide.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Slide #{idx + 1} <span className="text-slate-400 font-mono">({slide.imageKey})</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, -1)}
                        className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                        title="Đưa lên trước"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === draftSlides.length - 1}
                        onClick={() => handleMove(idx, 1)}
                        className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                        title="Đưa xuống sau"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      {draftSlides.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDelete(idx)}
                          className="p-1.5 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Xóa slide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dual PC & Mobile Preview + Upload */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* PC Banner */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                      <div className="text-[11px] font-extrabold text-blue-800 uppercase tracking-wide">
                        🖥️ Bản Máy tính (PC)
                      </div>
                      <div
                        className={`${
                          PREVIEW_ASPECT_CLASS[draftAspectRatio] || 'aspect-[5/1]'
                        } rounded-md overflow-hidden bg-slate-900 border border-slate-200 relative flex items-center justify-center`}
                      >
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={slide.title || `Slide ${idx + 1} PC`}
                            className={`w-full h-full ${
                              slide.fit === 'cover' ? 'object-cover' : 'object-contain'
                            }`}
                          />
                        ) : (
                          <span className="text-[11px] text-slate-400">Chưa có ảnh PC</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => triggerUpload(slide.imageKey)}
                        disabled={uploadingKey === slide.imageKey}
                        className="w-full py-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-3 h-3" />
                        <span>
                          {uploadingKey === slide.imageKey
                            ? 'Đang tải...'
                            : 'Tải ảnh Banner PC'}
                        </span>
                      </button>
                      <div className="text-[10.5px] text-slate-600">
                        📐 Size: <strong>{SLIDE_PIXEL_GUIDE[draftAspectRatio].banner}</strong>
                      </div>
                      <select
                        value={slide.fit || 'smart'}
                        onChange={(e) => {
                          const val = e.target.value as HeroSlideFit;
                          setDraftSlides((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, fit: val } : item
                            )
                          );
                        }}
                        className="w-full px-2 py-1 rounded-md border border-slate-300 text-[11px] bg-white"
                      >
                        {FIT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Mobile Banner (Independent from PC custom image) */}
                    {(() => {
                      const mobileKey = slide.mobileImageKey || `${slide.imageKey}-mobile`;
                      const customMobileImg = customImages[mobileKey];
                      const customPcImg = customImages[slide.imageKey];
                      const mobileDefaultImg =
                        slide.mobileFallbackImage ||
                        (slide.syncMobileWithPc ? imgSrc : '') ||
                        slide.fallbackImage ||
                        HERO_SLIDE_FALLBACK_MAP[slide.imageKey] ||
                        '';
                      const mobilePreviewSrc = customMobileImg || mobileDefaultImg;
                      return (
                        <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-2">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wide">
                              📱 Bản Điện thoại (Chỉ Mobile)
                            </span>
                            <div className="flex items-center gap-2">
                              {customPcImg && (
                                <button
                                  type="button"
                                  onClick={() => void onUploadSlideImage(mobileKey, customPcImg)}
                                  className="text-[10px] font-semibold text-blue-600 hover:underline cursor-pointer"
                                  title="Chép ảnh PC hiện tại sang bản Mobile"
                                >
                                  Chép từ PC
                                </button>
                              )}
                              {customMobileImg && onDeleteSlideImage && (
                                <button
                                  type="button"
                                  onClick={() => void onDeleteSlideImage(mobileKey)}
                                  className="text-[10px] font-semibold text-rose-600 hover:underline cursor-pointer"
                                >
                                  Khôi phục gốc
                                </button>
                              )}
                            </div>
                          </div>
                          <div
                            className={`${
                              MOBILE_PREVIEW_ASPECT_CLASS[draftMobileAspect] || 'aspect-[16/9]'
                            } rounded-md overflow-hidden bg-slate-900 border border-slate-200 relative flex items-center justify-center`}
                          >
                            {mobilePreviewSrc ? (
                              <img
                                src={mobilePreviewSrc}
                                alt={slide.title || `Slide ${idx + 1} Mobile`}
                                className={`w-full h-full ${
                                  (slide.mobileFit || slide.fit) === 'cover'
                                    ? 'object-cover'
                                    : 'object-contain'
                                }`}
                              />
                            ) : (
                              <span className="text-[11px] text-slate-400">Chưa có ảnh Mobile</span>
                            )}
                            {!customMobileImg && (
                              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-semibold">
                                Ảnh mặc định (độc lập PC)
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => triggerUpload(mobileKey)}
                            disabled={uploadingKey === mobileKey}
                            className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Upload className="w-3 h-3" />
                            <span>
                              {uploadingKey === mobileKey
                                ? 'Đang tải...'
                                : 'Tải ảnh riêng cho Mobile'}
                            </span>
                          </button>
                          <div className="text-[10.5px] text-slate-600">
                            📐 Size: <strong>{MOBILE_PIXEL_GUIDE[draftMobileAspect]}</strong>
                          </div>
                          <select
                            value={slide.mobileFit || slide.fit || 'smart'}
                            onChange={(e) => {
                              const val = e.target.value as HeroSlideFit;
                              setDraftSlides((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, mobileFit: val } : item
                                )
                              );
                            }}
                            className="w-full px-2 py-1 rounded-md border border-slate-300 text-[11px] bg-white"
                          >
                            {FIT_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Common Slide Metadata (Action + Title) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Khi khách bấm vào ảnh này:
                      </label>
                      <select
                        value={slide.actionType}
                        onChange={(e) => {
                          const val = e.target.value as HeroSlideAction;
                          setDraftSlides((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, actionType: val } : item
                            )
                          );
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        {ACTION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Mô tả ảnh (SEO / Alt):
                      </label>
                      <input
                        type="text"
                        value={slide.title || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraftSlides((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, title: val } : item
                            )
                          );
                        }}
                        placeholder="VD: Khuyến mãi gia dụng tại kho KDT-89"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {draftSlides.length < 5 && (
            <button
              type="button"
              onClick={handleAddSlide}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Slide Banner mới (tối đa 5 slide)</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mặc định 2 slide</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu Slide Đầu Trang'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
