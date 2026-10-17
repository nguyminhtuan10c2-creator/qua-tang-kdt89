import React, { useState, useEffect } from 'react';
import {
  X,
  Type,
  Share2,
  Check,
  RotateCcw,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Globe,
  Phone,
  HelpCircle,
  Copy,
} from 'lucide-react';

interface SiteTextEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  customTexts: Record<string, string>;
  customSeo?: { title?: string; description?: string };
  onSaveTexts: (texts: Record<string, string>, seo: { title: string; description: string }) => void;
  onResetTexts: () => void;
}

export const DEFAULT_SITE_TEXTS: Record<string, string> = {
  partnerBadge: 'Ưu đãi riêng cho đối tác & khách hàng KDT-89',
  heroTitle: 'Kho Điện Tử KDT-89 | Thiết Bị Điện Máy & Gia Dụng Chính Hãng Giá Tốt',
  heroSubtitle: 'Chọn món quà thiết thực – dùng được mỗi ngày – giá tận kho KDT-89.',
  heroContext: 'Hàng sẵn tại kho 89-91 Đường số 1, giao nhanh tận tay, hỗ trợ lắp đặt chu đáo, kiểm tra hàng ưng ý mới thanh toán.',
  heroHighlights: 'Nồi cơm Cuckoo giá kho · Bếp từ đôi & đơn · Smart Tivi 32-55" · Máy lạnh · Máy tắm nóng',
  comboTitle: 'Các combo quà tặng thiết thực được chọn nhiều nhất',
  comboSubtitle: 'Đã phối sẵn tinh tế, thiết thực – anh chỉ việc chọn, KDT-89 lo đóng gói và giao tận nơi.',
  hotline: '0397.017.013',
  address: '89-91 Đường số 1, P. Tân Tạo A, Q. Bình Tân, TP.HCM',
};

export const DEFAULT_SITE_SEO = {
  title: 'Kho Điện Tử KDT-89 | Phân Phối Thiết Bị Điện Máy & Gia Dụng Chính Hãng',
  description: 'Chương trình ưu đãi thiết bị điện máy, điện gia dụng chính hãng giá tốt tại CÔNG TY TNHH KDT-89. Hàng sẵn kho – giao nhanh – kiểm tra mới thanh toán.',
};

export const SiteTextEditorModal: React.FC<SiteTextEditorModalProps> = ({
  isOpen,
  onClose,
  customTexts,
  customSeo,
  onSaveTexts,
  onResetTexts,
}) => {
  const [activeTab, setActiveTab] = useState<'seo' | 'hero' | 'combos' | 'contact'>('seo');

  const [texts, setTexts] = useState<Record<string, string>>({});
  const [seo, setSeo] = useState<{ title: string; description: string }>({
    title: '',
    description: '',
  });

  const [isCopied, setIsCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTexts({
        ...DEFAULT_SITE_TEXTS,
        ...customTexts,
      });
      setSeo({
        title: customSeo?.title || DEFAULT_SITE_SEO.title,
        description: customSeo?.description || DEFAULT_SITE_SEO.description,
      });
      setSavedSuccess(false);
    }
  }, [isOpen, customTexts, customSeo]);

  if (!isOpen) return null;

  const handleTextChange = (key: string, value: string) => {
    setTexts((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSaveTexts(texts, seo);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleCopyZaloBustLink = () => {
    try {
      const url = new URL(window.location.origin + window.location.pathname);
      url.searchParams.set('v', Date.now().toString().slice(-4));
      navigator.clipboard.writeText(url.toString());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden my-auto flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-neutral-900 px-5 sm:px-6 py-4 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>Sửa nội dung chữ & Tiêu đề khi chia sẻ link</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Tùy chỉnh chữ trên website và hình xem trước khi gửi link qua Zalo / Facebook
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

        {/* Tab Navigation */}
        <div className="px-5 pt-3 bg-neutral-50 border-b border-neutral-200 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'seo'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>1. Chữ khi share link Zalo/Facebook</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hero')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'hero'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>2. Tiêu đề & Chữ đầu trang (Hero)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('combos')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'combos'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3. Mục Combo quà</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'contact'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>4. Hotline & Địa chỉ</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {activeTab === 'seo' && (
            <div className="space-y-4">
              {/* Zalo Preview Card Demonstration */}
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-sky-900">
                  <span className="flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-sky-600" />
                    <span>Xem trước ô hiển thị khi chia sẻ link trên Zalo / Tin nhắn:</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-sky-100 text-[10px] text-sky-700 font-mono">
                    Live Preview
                  </span>
                </div>

                {/* Simulated Zalo / Chat Preview Bubble */}
                <div className="bg-white rounded-xl p-3 border border-sky-200 shadow-sm space-y-1.5 max-w-md">
                  <div className="text-[11px] text-sky-600 truncate font-mono">
                    https://qua-tang-kdt89-new.vercel.app/
                  </div>
                  <div className="text-sm font-bold text-neutral-900 line-clamp-2 leading-tight">
                    {seo.title || 'Tiêu đề trang web'}
                  </div>
                  <div className="text-xs text-neutral-600 line-clamp-2 leading-normal">
                    {seo.description || 'Mô tả tóm tắt nội dung khi share link...'}
                  </div>
                  <div className="text-[10px] text-neutral-400 pt-1">
                    kdt89.vn
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-neutral-600">
                  <span className="flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Mẹo: Zalo có cơ chế lưu đệm (cache). Nếu gửi link cũ mà chữ chưa đổi, hãy bấm nút bên phải:</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyZaloBustLink}
                    className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{isCopied ? 'Đã copy link mới!' : 'Copy link gửi Zalo'}</span>
                  </button>
                </div>
              </div>

              {/* Form inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Tiêu đề khi chia sẻ link (SEO Title) <span className="text-rose-600">*</span>:
                  </label>
                  <input
                    type="text"
                    value={seo.title}
                    onChange={(e) => setSeo({ ...seo, title: e.target.value })}
                    placeholder="Vd: Kho Điện Tử KDT-89 | Phân Phối Thiết Bị Điện Máy & Gia Dụng Chính Hãng"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                  <p className="mt-1 text-[11px] text-neutral-500">
                    Độ dài khuyên dùng: 50 – 70 ký tự. Xuất hiện nổi bật đậm nhất trong tin nhắn Zalo.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Đoạn văn mô tả tóm tắt (SEO Description) <span className="text-rose-600">*</span>:
                  </label>
                  <textarea
                    rows={3}
                    value={seo.description}
                    onChange={(e) => setSeo({ ...seo, description: e.target.value })}
                    placeholder="Vd: Chương trình ưu đãi thiết bị điện máy, điện gia dụng chính hãng giá tốt tại CÔNG TY TNHH KDT-89. Hàng sẵn kho – giao nhanh – kiểm tra mới thanh toán."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                  <p className="mt-1 text-[11px] text-neutral-500">
                    Đoạn mô tả ngắn gọn bên dưới tiêu đề để người nhận biết nội dung trước khi bấm vào.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hero' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Huy hiệu nhỏ trên cùng (Partner Badge):
                </label>
                <input
                  type="text"
                  value={texts.partnerBadge || ''}
                  onChange={(e) => handleTextChange('partnerBadge', e.target.value)}
                  placeholder="Vd: Ưu đãi riêng cho đối tác & khách hàng KDT-89"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Tiêu đề chính lớn (Hero Title) <span className="text-rose-600">*</span>:
                </label>
                <input
                  type="text"
                  value={texts.heroTitle || ''}
                  onChange={(e) => handleTextChange('heroTitle', e.target.value)}
                  placeholder="Vd: Kho Điện Tử KDT-89 | Phân Phối Thiết Bị Điện Máy Chính Hãng"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Dòng mô tả phụ dưới tiêu đề (Hero Subtitle):
                </label>
                <input
                  type="text"
                  value={texts.heroSubtitle || ''}
                  onChange={(e) => handleTextChange('heroSubtitle', e.target.value)}
                  placeholder="Vd: Chọn món quà thiết thực – dùng được mỗi ngày – giá tận kho KDT-89."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Đoạn giải thích chi tiết (Hero Context paragraph):
                </label>
                <textarea
                  rows={2}
                  value={texts.heroContext || ''}
                  onChange={(e) => handleTextChange('heroContext', e.target.value)}
                  placeholder="Vd: Hàng sẵn tại kho 89-91 Đường số 1, giao nhanh tận tay, hỗ trợ lắp đặt chu đáo, kiểm tra máy ưng ý mới thanh toán."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Dòng chữ Tiêu điểm thợ chọn (Highlights bar):
                </label>
                <input
                  type="text"
                  value={texts.heroHighlights || ''}
                  onChange={(e) => handleTextChange('heroHighlights', e.target.value)}
                  placeholder="Vd: Nồi cơm Cuckoo giá rẻ · Bếp từ đôi & đơn · Smart Tivi 32-55 inch · Máy lạnh · Máy nước nóng"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                />
              </div>
            </div>
          )}

          {activeTab === 'combos' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Tiêu đề phần Combo quà tặng:
                </label>
                <input
                  type="text"
                  value={texts.comboTitle || ''}
                  onChange={(e) => handleTextChange('comboTitle', e.target.value)}
                  placeholder="Vd: Các combo quà tặng thiết thực được chọn nhiều nhất"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Mô tả phụ phần Combo:
                </label>
                <textarea
                  rows={2}
                  value={texts.comboSubtitle || ''}
                  onChange={(e) => handleTextChange('comboSubtitle', e.target.value)}
                  placeholder="Vd: Đã phối sẵn tinh tế, thiết thực – anh chỉ việc chọn, KDT-89 lo đóng gói kèm thiệp và giao đến nơi."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                />
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Số điện thoại Hotline / Zalo:
                </label>
                <input
                  type="text"
                  value={texts.hotline || ''}
                  onChange={(e) => handleTextChange('hotline', e.target.value)}
                  placeholder="Vd: 0397.017.013"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Địa chỉ kho hàng KDT-89:
                </label>
                <input
                  type="text"
                  value={texts.address || ''}
                  onChange={(e) => handleTextChange('address', e.target.value)}
                  placeholder="Vd: 89-91 Đường số 1, P. Tân Tạo A, Q. Bình Tân, TP.HCM"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onResetTexts}
            className="px-3.5 py-2 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-bold hover:bg-neutral-100 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
            <span>Khôi phục mặc định</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-neutral-600 hover:text-neutral-900 text-xs font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Đã lưu thành công!</span>
                </>
              ) : (
                <>
                  <span>Lưu tất cả thay đổi</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
