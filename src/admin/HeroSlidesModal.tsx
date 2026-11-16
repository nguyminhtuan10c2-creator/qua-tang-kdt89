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
  aspectRatio?: HeroAspectRatio;
  memberVisualFit?: HeroSlideFit;
  slides: HeroSlideConfig[];
  customImages: Record<string, string>;
  onUploadSlideImage: (imageKey: string, dataUrl: string) => Promise<void>;
  onSaveConfig: (
    nextMode: 'slider' | 'classic',
    nextSlides: HeroSlideConfig[],
    nextShowMemberSlide?: boolean,
    nextAspectRatio?: HeroAspectRatio,
    nextMemberVisualFit?: HeroSlideFit
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
  { value: '16/7', label: '16:7 Chuẩn ngang ĐMX' },
  { value: '2/1', label: '2:1 Khung rộng' },
  { value: '16/9', label: '16:9 Khung cao' },
];

const FIT_OPTIONS: Array<{ value: HeroSlideFit; label: string }> = [
  { value: 'smart', label: 'Tự động chống cắt chữ/người (Khuyên dùng)' },
  { value: 'contain', label: 'Hiện trọn 100% ảnh (nền mờ 2 bên)' },
  { value: 'cover', label: 'Phủ kín viền khung ngang (cover)' },
];

const PREVIEW_ASPECT_CLASS: Record<HeroAspectRatio, string> = {
  '16/7': 'aspect-[16/7]',
  '2/1': 'aspect-[2/1]',
  '16/9': 'aspect-[16/9]',
};

export const HeroSlidesModal: React.FC<HeroSlidesModalProps> = ({
  isOpen,
  onClose,
  layoutMode,
  showMemberSlide = true,
  aspectRatio = '16/7',
  memberVisualFit = 'smart',
  slides,
  customImages,
  onUploadSlideImage,
  onSaveConfig,
}) => {
  const [draftMode, setDraftMode] = useState<'slider' | 'classic'>(layoutMode);
  const [draftShowMember, setDraftShowMember] = useState<boolean>(showMemberSlide);
  const [draftAspectRatio, setDraftAspectRatio] = useState<HeroAspectRatio>(aspectRatio);
  const [draftMemberFit, setDraftMemberFit] = useState<HeroSlideFit>(memberVisualFit);
  const [draftSlides, setDraftSlides] = useState<HeroSlideConfig[]>([]);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraftMode(layoutMode || 'slider');
      setDraftShowMember(showMemberSlide !== false);
      setDraftAspectRatio(aspectRatio || '16/7');
      setDraftMemberFit(memberVisualFit || 'smart');
      setDraftSlides(
        slides && slides.length > 0
          ? slides.map((s) => ({ ...s }))
          : DEFAULT_HERO_SLIDES.map((s) => ({ ...s }))
      );
      setNotice(null);
    }
  }, [isOpen, layoutMode, showMemberSlide, aspectRatio, memberVisualFit, slides]);

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
    setNotice('Đang nén & tải ảnh lên kho...');
    try {
      const compressed = await compressImageFile(file, 1280, 0.85);
      await onUploadSlideImage(imageKey, compressed);
      setNotice('Đã cập nhật ảnh slide thành công!');
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
        fallbackImage: HERO_SLIDE_FALLBACK_MAP['site-hero-slide-1'],
        title: `Banner Khuyến Mãi ${nextIdx}`,
        actionType: 'products',
        fit: 'smart',
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
    setDraftAspectRatio('16/7');
    setDraftMemberFit('smart');
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
        draftMemberFit
      );
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const memberVisualPreview =
    customImages['site-member-slide-visual'] || DEFAULT_MEMBER_SLIDE_IMAGE;

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

          {/* Synchronized Aspect Ratio Selector */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-slate-800">
                Tỉ lệ khung Slide (đồng bộ Điện thoại &amp; Máy tính):
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Khóa cùng 1 tỉ lệ ngang trên mọi màn hình để tránh lệch bố cục hoặc cắt ảnh.
              </p>
            </div>
            <div className="flex flex-wrap rounded-lg bg-slate-200/70 p-1 text-[11px] font-bold gap-1 shrink-0">
              {ASPECT_RATIO_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDraftAspectRatio(opt.value)}
                  className={`px-2.5 py-1.5 rounded-md cursor-pointer transition-all ${
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

          {/* Member Onboarding Slide #1 Config */}
          <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Slide #1: Ảnh thương hiệu bên trái &amp; Form Đăng nhập SĐT
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Toàn bộ cụm bên trái của Slide #1 là 1 ảnh riêng để anh tự do thay đổi bằng banner của KDT-89.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDraftShowMember(!draftShowMember)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors shrink-0 self-start sm:self-center ${
                  draftShowMember
                    ? 'bg-sky-600 text-white hover:bg-sky-700'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {draftShowMember ? 'Đang BẬT Slide #1' : 'Đang TẮT Slide #1'}
              </button>
            </div>

            {draftShowMember && (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-1 border-t border-sky-200/70">
                <div className="sm:col-span-5 aspect-[4/3] rounded-lg overflow-hidden bg-white border border-sky-200 relative flex items-center justify-center">
                  <img
                    src={memberVisualPreview}
                    alt="Ảnh bên trái Slide 1"
                    className={`w-full h-full ${
                      draftMemberFit === 'cover' ? 'object-cover' : 'object-contain'
                    }`}
                  />
                </div>
                <div className="sm:col-span-7 space-y-2">
                  <button
                    type="button"
                    onClick={() => triggerUpload('site-member-slide-visual')}
                    disabled={uploadingKey === 'site-member-slide-visual'}
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {uploadingKey === 'site-member-slide-visual'
                        ? 'Đang tải ảnh lên...'
                        : 'Tải ảnh mới cho bên trái Slide #1'}
                    </span>
                  </button>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Cách hiển thị ảnh bên trái Slide #1:
                    </label>
                    <select
                      value={draftMemberFit}
                      onChange={(e) => setDraftMemberFit(e.target.value as HeroSlideFit)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    >
                      {FIT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
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

                  {/* Preview + Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div
                      className={`sm:col-span-6 ${
                        PREVIEW_ASPECT_CLASS[draftAspectRatio] || 'aspect-[16/7]'
                      } rounded-lg overflow-hidden bg-slate-900 border border-slate-200 relative flex items-center justify-center`}
                    >
                      {imgSrc ? (
                        slide.fit === 'cover' ? (
                          <img
                            src={imgSrc}
                            alt={slide.title || `Slide ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <>
                            <img
                              src={imgSrc}
                              alt=""
                              aria-hidden="true"
                              className="absolute inset-0 w-full h-full object-cover scale-110 blur-md opacity-65 pointer-events-none"
                            />
                            <img
                              src={imgSrc}
                              alt={slide.title || `Slide ${idx + 1}`}
                              className="relative z-10 w-full h-full object-contain"
                            />
                          </>
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                          Chưa có ảnh
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-6 space-y-2">
                      <button
                        type="button"
                        onClick={() => triggerUpload(slide.imageKey)}
                        disabled={uploadingKey === slide.imageKey}
                        className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>
                          {uploadingKey === slide.imageKey
                            ? 'Đang tải ảnh lên...'
                            : 'Tải ảnh Banner từ máy'}
                        </span>
                      </button>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Cách hiển thị ảnh trong khung ngang:
                        </label>
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
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                        >
                          {FIT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

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
