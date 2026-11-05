import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { ProductItem, CategoryItem, CATEGORIES } from '../data/products';

interface BulkProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  onImportProducts: (newProducts: ProductItem[]) => void;
}

export const BulkProductImportModal: React.FC<BulkProductImportModalProps> = ({
  isOpen,
  onClose,
  categories,
  onImportProducts,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste');
  const [pasteContent, setPasteContent] = useState<string>('');
  const [defaultCategory, setDefaultCategory] = useState<string>(categories[0]?.id || 'rice_cooker_appliances');
  const [parsedProducts, setParsedProducts] = useState<ProductItem[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Auto-detect category from product name
  const detectCategory = (name: string, fallback: string): { id: any; label: string } => {
    const lower = name.toLowerCase();
    if (lower.includes('cuckoo') || lower.includes('nồi cơm') || lower.includes('nồi chiên') || lower.includes('lò vi sóng')) {
      return { id: 'rice_cooker_appliances', label: 'Nồi Cơm Cuckoo & Gia Dụng' };
    }
    if (lower.includes('bếp') || lower.includes('sunhouse') || lower.includes('hồng ngoại') || lower.includes('bếp từ')) {
      return { id: 'kitchen_stoves', label: 'Bếp Nấu Hiện Đại' };
    }
    if (lower.includes('nước nóng') || lower.includes('ariston') || lower.includes('máy tắm') || lower.includes('bình nóng lạnh')) {
      return { id: 'water_heaters', label: 'Máy Nước Nóng Gia Đình' };
    }
    if (lower.includes('máy lạnh') || lower.includes('điều hòa') || lower.includes('casper') || lower.includes('inverter') || lower.includes('daikin') || lower.includes('panasonic')) {
      return { id: 'air_conditioners', label: 'Máy Lạnh Làm Mát' };
    }
    if (lower.includes('tivi') || lower.includes('tv') || lower.includes('smart tivi') || lower.includes('coocaa') || lower.includes('samsung') || lower.includes('lg')) {
      return { id: 'televisions', label: 'Smart Tivi & Màn Hình' };
    }
    const foundCat = categories.find((c) => c.id === fallback);
    return {
      id: fallback as any,
      label: foundCat?.name || 'Sản phẩm gia dụng',
    };
  };

  // Parse raw text (TSV/CSV/lines)
  const handleParseText = (text: string) => {
    setParseError(null);
    setImportSuccessCount(null);
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

    if (lines.length === 0) {
      setParsedProducts([]);
      return;
    }

    const results: ProductItem[] = [];

    lines.forEach((line, index) => {
      // Check if header row
      const lower = line.toLowerCase();
      if (
        (lower.includes('tên') || lower.includes('sản phẩm') || lower.includes('model')) &&
        (lower.includes('giá') || lower.includes('price'))
      ) {
        return; // skip header
      }

      // Split by tab, comma, or pipe |
      let parts: string[] = [];
      if (line.includes('\t')) {
        parts = line.split('\t');
      } else if (line.includes('|')) {
        parts = line.split('|');
      } else if (line.includes(';') && !line.includes(',')) {
        parts = line.split(';');
      } else {
        // CSV split respecting possible quotes
        parts = line.split(',');
      }

      parts = parts.map((p) => p.trim().replace(/^["']|["']$/g, ''));

      if (parts.length >= 1 && parts[0]) {
        const name = parts[0];
        const programPriceRaw = parts[1] || 'Liên hệ giá kho';
        const referencePriceRaw = parts[2] || '';
        const modelCode = parts[3] || '';
        const specs = parts[4] || '';

        const catInfo = detectCategory(name, defaultCategory);

        // Standardize price format
        const formatPrice = (p: string) => {
          if (!p) return '';
          if (p.includes('đ') || p.includes('VNĐ') || p.includes('triệu') || p.includes('Liên hệ')) return p;
          const num = parseInt(p.replace(/\D/g, ''), 10);
          if (!isNaN(num)) {
            return num.toLocaleString('vi-VN') + ' đ';
          }
          return p;
        };

        const programPrice = formatPrice(programPriceRaw);
        const referencePrice = formatPrice(referencePriceRaw);

        const newId = `import-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`;

        results.push({
          id: newId,
          name: name,
          category: catInfo.id,
          categoryLabel: catInfo.label,
          budgetTier: '>4m',
          budgetLabel: 'Kho KDT-89',
          programPrice: programPrice || '[Liên hệ Sale nhận giá thợ]',
          referencePrice: referencePrice || '',
          stockStatus: 'Sẵn kho',
          warranty: 'Chính hãng 24 tháng',
          deliveryCondition: 'Giá chương trình đã bao gồm hỗ trợ giao lắp',
          practicalValue: specs || 'Hàng chính hãng 100% nguyên đai nguyên kiện bảo hành chu đáo.',
          modelCode: modelCode || undefined,
          specs: specs || undefined,
        });
      }
    });

    if (results.length === 0) {
      setParseError('Không đọc được dòng sản phẩm nào. Vui lòng kiểm tra định dạng dữ liệu.');
    } else {
      setParsedProducts(results);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPasteContent(content);
        handleParseText(content);
      }
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setParseError('Không thể đọc file. Vui lòng thử lại với file .csv hoặc dán nội dung vào ô văn bản.');
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = () => {
    const csvContent =
      'Tên Sản Phẩm\tGiá Kho KDT-89\tGiá Niêm Yết\tMã Model\tThông Số Kỹ Thuật\n' +
      'Nồi cơm điện Cuckoo CR-1021 1.8L\t1.490.000 đ\t1.890.000 đ\tCR-1021\tDung tích 1.8L, lòng nồi chống dính Hàn Quốc\n' +
      'Máy lạnh Casper Inverter 1HP TC-09IS35\t4.890.000 đ\t5.990.000 đ\tTC-09IS35\tCông suất 1 HP, tiết kiệm điện Inverter, bao công lắp\n' +
      'Máy nước nóng trực tiếp Ariston Aures SM45PE\t2.690.000 đ\t3.290.000 đ\tSM45PE\tCó bơm trợ lực, chống giật ELCB an toàn\n' +
      'Smart Tivi 43 inch Coocaa Full HD\t3.990.000 đ\t4.990.000 đ\t43S3U\tMàn hình tràn viền, YouTube, Netflix mượt mà\n';

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'bang-gia-mau-kdt89.tsv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmImport = () => {
    if (parsedProducts.length === 0) return;
    onImportProducts(parsedProducts);
    setImportSuccessCount(parsedProducts.length);
    setTimeout(() => {
      onClose();
      setParsedProducts([]);
      setPasteContent('');
      setImportSuccessCount(null);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-200 bg-neutral-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                Nhập Bảng Giá Sản Phẩm (File Excel / CSV / Dán Bảng)
              </h3>
              <p className="text-xs text-neutral-400">
                Tự động nhận diện model, giá sỉ, bảo hành và phân loại vào kho KDT-89
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Quick Notice */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Mẹo nạp nhanh:</strong> Anh có thể copy bảng tính từ file <strong>Excel</strong>, <strong>Google Sheets</strong> hoặc tin nhắn <strong>Zalo</strong> rồi dán thẳng vào đây. Hệ thống sẽ tự nhận diện từng cột và thêm ngay vào web! Hoặc anh có thể quăng file trực tiếp vào khung chat để em nạp giúp anh.
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'paste'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                📋 Dán nội dung từ Excel / Zalo
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('file')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'file'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                📁 Tải file .CSV / .TSV / .TXT
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadSample}
              className="text-xs text-rose-700 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file mẫu (.tsv)</span>
            </button>
          </div>

          {activeTab === 'paste' ? (
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Dán bảng dữ liệu (Mỗi dòng 1 sản phẩm):
              </label>
              <textarea
                value={pasteContent}
                onChange={(e) => {
                  setPasteContent(e.target.value);
                  handleParseText(e.target.value);
                }}
                rows={6}
                placeholder={`Ví dụ sao chép từ Excel:\nNồi cơm Cuckoo CR-1021\t1.490.000 đ\t1.890.000 đ\tCR-1021\tLòng nồi chống dính\nSmart Tivi Casper 43 inch\t4.290.000 đ\t5.490.000 đ\t43FX6200\tAndroid TV giọng nói`}
                className="w-full p-3 text-xs font-mono rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
          ) : (
            <div className="p-6 border-2 border-dashed border-neutral-300 rounded-2xl text-center bg-neutral-50/50 hover:bg-neutral-50 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-neutral-700">
                Chọn file bảng giá từ máy tính / điện thoại
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">
                Hỗ trợ định dạng .csv, .tsv, .txt
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer"
              >
                Chọn file từ thiết bị
              </button>
            </div>
          )}

          {/* Parsing Results / Live Preview */}
          {parseError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {importSuccessCount !== null && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Đã nhập thành công {importSuccessCount} sản phẩm vào kho hàng KDT-89!</span>
            </div>
          )}

          {parsedProducts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-800">
                <span>Xem trước kết quả ({parsedProducts.length} sản phẩm hợp lệ):</span>
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Sẵn sàng nhập kho
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded-xl divide-y divide-neutral-150 text-xs">
                {parsedProducts.map((p, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between gap-2 hover:bg-neutral-50">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-neutral-900 truncate">{p.name}</div>
                      <div className="text-[11px] text-neutral-500 flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded bg-neutral-100 font-medium">{p.categoryLabel}</span>
                        {p.modelCode && <span>Model: {p.modelCode}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-extrabold text-rose-600 font-mono">{p.programPrice}</div>
                      {p.referencePrice && (
                        <div className="text-[10px] text-neutral-400 line-through font-mono">{p.referencePrice}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100 font-bold text-xs cursor-pointer"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={parsedProducts.length === 0 || isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-300 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Xác nhận nhập {parsedProducts.length > 0 ? `${parsedProducts.length} sản phẩm` : ''} vào kho</span>
          </button>
        </div>
      </div>
    </div>
  );
};
