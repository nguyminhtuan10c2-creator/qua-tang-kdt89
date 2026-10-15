import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Check,
  Sparkles,
  Camera,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  Trash2,
  Copy,
} from 'lucide-react';
import {
  PRODUCTS,
  ProductItem,
  CATEGORIES,
  HERO_IMAGE,
  IMG_CUCKOO_CR1021_WHITE,
  IMG_CUCKOO_CR1021_RED,
  IMG_CUCKOO_CR0671,
  IMG_SANAKY_INFRARED,
  IMG_LADOMAX_INDUCTION,
  IMG_FERROLI_IC4200BN,
  IMG_SMART_TV_PRODUCT,
  IMG_SMART_TV_LIVING_ROOM,
  IMG_MICROWAVE_OVEN,
} from '../data/products';

export interface CustomizableItem {
  id: string;
  name: string;
  modelCode?: string;
  category: string;
  categoryLabel: string;
  stockStatus?: string;
  imageUrl?: string;
  isSpecial?: boolean;
}

export const SPECIAL_SITE_ITEMS: CustomizableItem[] = [
  {
    id: 'site-hero-image',
    name: '🌟 Ảnh bìa chính đầu trang (Hero Banner 20/10)',
    modelCode: 'HERO-BANNER',
    category: 'site_branding',
    categoryLabel: 'Ảnh bìa đầu trang',
    stockStatus: 'Hiển thị ngay đầu trang khi mở web',
    imageUrl: HERO_IMAGE,
    isSpecial: true,
  },
  {
    id: 'site-logo',
    name: '🏷️ Logo thương hiệu KDT-89',
    modelCode: 'LOGO-KDT89',
    category: 'site_branding',
    categoryLabel: 'Logo thương hiệu',
    stockStatus: 'Hiển thị trên thanh Header trên cùng & chân trang Footer',
    imageUrl: '',
    isSpecial: true,
  },
];

interface ImageUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProduct?: ProductItem | CustomizableItem | { id: string } | null;
  customImages: Record<string, string>;
  onSaveImage: (productId: string, imageDataUrl: string) => void;
  onResetImage: (productId: string) => void;
}

// Preset library of clean model photos
const PRESET_PHOTOS = [
  {
    label: 'Cuckoo CR-1021 Trắng (Hình 1 chuẩn)',
    url: IMG_CUCKOO_CR1021_WHITE,
    forProductId: 'prod-cuckoo-cr1021-white',
    category: 'rice_cooker_appliances',
  },
  {
    label: 'Cuckoo CR-1021 Đỏ (Hình 2 chuẩn)',
    url: IMG_CUCKOO_CR1021_RED,
    forProductId: 'prod-cuckoo-cr1021-red',
    category: 'rice_cooker_appliances',
  },
  {
    label: 'Cuckoo CR-0671 Vàng / Tím (1.0L)',
    url: IMG_CUCKOO_CR0671,
    forProductId: 'prod-cuckoo-cr0671',
    category: 'rice_cooker_appliances',
  },
  {
    label: 'Bếp từ đôi Ferroli IC4200BN',
    url: IMG_FERROLI_IC4200BN,
    forProductId: 'prod-bep-tu-ferroli',
    category: 'kitchen_stoves',
  },
  {
    label: 'Bếp từ đơn Ladomax',
    url: IMG_LADOMAX_INDUCTION,
    forProductId: 'prod-bep-tu-ladomax',
    category: 'kitchen_stoves',
  },
  {
    label: 'Bếp hồng ngoại Sanaky (không kén nồi)',
    url: IMG_SANAKY_INFRARED,
    forProductId: 'prod-bep-hong-ngoai-sanaky',
    category: 'kitchen_stoves',
  },
  {
    label: 'Smart Tivi Casper (Studio chuẩn)',
    url: IMG_SMART_TV_PRODUCT,
    forProductId: 'prod-tivi-casper-43fga610',
    category: 'televisions',
  },
  {
    label: 'Smart Tivi Casper 4K (Phòng khách sum vầy)',
    url: IMG_SMART_TV_LIVING_ROOM,
    forProductId: 'prod-tivi-casper-50uga610',
    category: 'televisions',
  },
  {
    label: 'Lò vi sóng cao cấp sang trọng',
    url: IMG_MICROWAVE_OVEN,
    forProductId: 'prod-microwave-toshiba-20l',
    category: 'rice_cooker_appliances',
  },
];

export const ImageUpdateModal: React.FC<ImageUpdateModalProps> = ({
  isOpen,
  onClose,
  targetProduct,
  customImages,
  onSaveImage,
  onResetImage,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    targetProduct?.id || PRODUCTS[0].id
  );
  const [filterCat, setFilterCat] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyCustomImages = () => {
    try {
      const dataStr = JSON.stringify(customImages, null, 2);
      navigator.clipboard.writeText(dataStr);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      // fallback
    }
  };

  React.useEffect(() => {
    if (targetProduct) {
      setSelectedProductId(targetProduct.id);
      setPreviewImage(null);
    }
  }, [targetProduct]);

  if (!isOpen) return null;

  const ALL_ITEMS: CustomizableItem[] = useMemo(() => {
    return [
      ...SPECIAL_SITE_ITEMS,
      ...PRODUCTS.map((p) => ({
        id: p.id,
        name: p.name,
        modelCode: p.modelCode,
        category: p.category,
        categoryLabel: p.categoryLabel,
        stockStatus: p.stockStatus,
        imageUrl: p.imageUrl,
        isSpecial: false,
      })),
    ];
  }, []);

  const currentProduct = ALL_ITEMS.find((p) => p.id === selectedProductId) || ALL_ITEMS[0];
  const activeDisplayImage = previewImage || customImages[currentProduct.id] || currentProduct.imageUrl;

  const filteredProductList = ALL_ITEMS.filter((p) => {
    const matchCat = filterCat === 'all' || p.category === filterCat;
    const matchSearch =
      searchFilter.trim() === '' ||
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.modelCode && p.modelCode.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchCat && matchSearch;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, WEBP...)');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setPreviewImage(result);
        onSaveImage(currentProduct.id, result);
        setFeedbackMsg(`Đã cập nhật ảnh chụp mới cho "${currentProduct.name}"!`);
        setTimeout(() => setFeedbackMsg(''), 3500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;

    setPreviewImage(imageUrlInput.trim());
    onSaveImage(currentProduct.id, imageUrlInput.trim());
    setFeedbackMsg(`Đã lưu link ảnh mới cho "${currentProduct.name}"!`);
    setImageUrlInput('');
    setTimeout(() => setFeedbackMsg(''), 3500);
  };

  const handleSelectPreset = (presetUrl: string, presetLabel: string) => {
    setPreviewImage(presetUrl);
    onSaveImage(currentProduct.id, presetUrl);
    setFeedbackMsg(`Đã áp dụng mẫu "${presetLabel}" cho "${currentProduct.name}"!`);
    setTimeout(() => setFeedbackMsg(''), 3500);
  };

  const handleResetCurrent = () => {
    onResetImage(currentProduct.id);
    setPreviewImage(null);
    setFeedbackMsg(`Đã khôi phục ảnh mặc định cho "${currentProduct.name}".`);
    setTimeout(() => setFeedbackMsg(''), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-neutral-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg leading-tight">
                  Chỗ cập nhật hình ảnh sản phẩm
                </h3>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                  KDT-89 Kho Sẵn
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Tải ảnh chụp thật từ điện thoại / thư viện máy, dán link hoặc chọn ảnh model chuẩn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Notification feedback */}
          {feedbackMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs sm:text-sm text-emerald-800 flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-medium">{feedbackMsg}</span>
            </div>
          )}

          {/* Section 1: Active Product Showcase & Preview */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/60 via-stone-50 to-neutral-50 border border-amber-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block mb-2">
              1. Sản phẩm đang được chọn đổi ảnh:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* Product Image preview */}
              <div className="sm:col-span-5 relative aspect-[4/3] rounded-xl overflow-hidden bg-white border border-neutral-300 shadow-xs">
                {activeDisplayImage ? (
                  <img
                    src={activeDisplayImage}
                    alt={currentProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 p-2 text-center text-xs">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span>Chưa có ảnh</span>
                  </div>
                )}
                {customImages[currentProduct.id] && (
                  <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                    <Check className="w-3 h-3" /> Đã đổi ảnh riêng
                  </span>
                )}
              </div>

              {/* Product Info & Action */}
              <div className="sm:col-span-7 flex flex-col justify-between space-y-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">
                    {currentProduct.categoryLabel}
                  </span>
                  <h4 className="text-base font-bold text-neutral-900 leading-snug">
                    {currentProduct.name}
                  </h4>
                  {currentProduct.modelCode && (
                    <div className="inline-block mt-1 px-2 py-0.5 rounded bg-neutral-200/70 font-mono text-xs font-bold text-neutral-800">
                      Mã: {currentProduct.modelCode}
                    </div>
                  )}
                  <span className="text-xs text-neutral-600 block mt-1.5 font-medium">
                    📦 {currentProduct.stockStatus}
                  </span>
                </div>

                {customImages[currentProduct.id] && (
                  <button
                    type="button"
                    onClick={handleResetCurrent}
                    className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-rose-600 transition-colors pt-2 font-medium cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Khôi phục ảnh gốc mặc định</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Upload Options Tabs */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block mb-2">
              2. Chọn cách cập nhật ảnh cho món này:
            </span>

            <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Tải ảnh từ điện thoại / máy tính</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preset')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'preset'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Ảnh mẫu model chuẩn</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'url'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Dán link ảnh</span>
              </button>
            </div>

            {/* Tab 1: File Upload / Camera */}
            {activeTab === 'upload' && (
              <div className="pt-3 space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 sm:p-8 border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-2xl bg-amber-50/50 hover:bg-amber-50/90 transition-all text-center cursor-pointer group shadow-2xs"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-2.5 group-hover:scale-105 transition-transform">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div className="text-sm sm:text-base font-bold text-neutral-900">
                    Bấm vào đây để Chụp ảnh hoặc Chọn từ thư viện ảnh máy
                  </div>
                  <div className="text-xs text-neutral-600 mt-1 max-w-sm mx-auto">
                    Hỗ trợ tất cả ảnh chụp JPG, PNG, WEBP. Ảnh sẽ hiển thị ngay trên landing page của anh.
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Chọn file ảnh ngay</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Presets */}
            {activeTab === 'preset' && (
              <div className="pt-3 space-y-3">
                <p className="text-xs text-neutral-600">
                  Bấm chọn nhanh một trong các mẫu ảnh chuẩn bên dưới để gán cho <strong>{currentProduct.name}</strong>:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PRESET_PHOTOS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(preset.url, preset.label)}
                      className="p-2 rounded-xl border border-neutral-200 hover:border-amber-400 bg-white hover:bg-amber-50/50 text-left transition-all flex flex-col group cursor-pointer"
                    >
                      <div className="aspect-[4/3] rounded-lg overflow-hidden bg-neutral-100 mb-1.5 border border-neutral-150">
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-neutral-800 leading-tight">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: URL */}
            {activeTab === 'url' && (
              <form onSubmit={handleApplyUrl} className="pt-3 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Đường dẫn (URL) hình ảnh online:
                  </label>
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://example.com/hinh-anh-san-pham.jpg"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Áp dụng link ảnh này cho sản phẩm
                </button>
              </form>
            )}
          </div>

          {/* Section 3: All customizable items visual browser */}
          <div className="pt-2 border-t border-neutral-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                3. Bấm để chuyển sang đổi ảnh sản phẩm, Logo hoặc Ảnh bìa ({ALL_ITEMS.length} mục):
              </span>

              {/* Quick Search in modal */}
              <div className="relative w-full sm:w-48">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Lọc tên/mã/logo..."
                  className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-neutral-300 text-xs outline-none focus:border-amber-500"
                />
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-2" />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-2">
              <button
                type="button"
                onClick={() => setFilterCat('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  filterCat === 'all'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                Tất cả ({ALL_ITEMS.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCat('site_branding')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  filterCat === 'site_branding'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold'
                }`}
              >
                🌟 Logo & Ảnh bìa ({SPECIAL_SITE_ITEMS.length})
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFilterCat(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    filterCat === cat.id
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Thumbnail Grid */}
            <div className="max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 rounded-xl bg-neutral-50 border border-neutral-200">
              {filteredProductList.map((p) => {
                const isSelected = p.id === selectedProductId;
                const hasCustom = !!customImages[p.id];
                const displayImg = customImages[p.id] || p.imageUrl;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProductId(p.id);
                      setPreviewImage(null);
                    }}
                    className={`p-2 rounded-xl text-left text-xs flex items-center gap-2.5 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-500 text-white font-bold border-amber-600 shadow-xs'
                        : 'bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-200/80'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                      {displayImg ? (
                        <img
                          src={displayImg}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="truncate text-xs leading-snug">{p.name}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-amber-100' : 'text-neutral-500'}`}>
                        {p.modelCode ? `Mã: ${p.modelCode}` : p.categoryLabel}
                      </div>
                    </div>

                    {hasCustom && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        Đã đổi
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer with Sync Advice & Export */}
        <div className="p-4 bg-amber-50/90 border-t border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-amber-950 leading-tight">
            💡 <strong>Để hiển thị trên tất cả điện thoại khác & khách hàng:</strong>
            <p className="text-amber-850 text-[10px] mt-0.5">
              Ảnh anh đổi tại đây đang được lưu trên trình duyệt của máy tính này. Để đồng bộ vĩnh viễn cho mọi điện thoại, anh bấm &quot;Sao chép mã ảnh&quot; rồi dán gửi em nhé!
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {Object.keys(customImages).length > 0 && (
              <button
                type="button"
                onClick={handleCopyCustomImages}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                title="Sao chép toàn bộ dữ liệu ảnh anh đã đổi để dán gửi lập trình viên lưu vào web vĩnh viễn"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedCode ? 'Đã chép vào bộ nhớ!' : 'Sao chép mã ảnh'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              Đã xong & Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
