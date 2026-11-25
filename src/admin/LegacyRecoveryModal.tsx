import React, { useEffect, useState } from 'react';
import {
  X,
  DatabaseBackup,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  Settings,
  ShoppingBag,
  LogIn,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import {
  DEFAULT_LEGACY_SECOND_SPANNER_CONFIG,
  LegacyFirebaseConfigInput,
  LegacyScanResult,
  LegacyImportProgress,
  LegacyImportResult,
  scanLegacyFirebaseProject,
  importLegacyDataIntoCurrentProject,
  signInLegacyWithGoogle,
  signOutLegacyGoogle,
  parseFirebaseConfigSnippet,
} from '../lib/legacyRecovery';
import type { SiteSettingsData, StoredOrder } from '../lib/firebase';
import type { CustomerAccount } from '../data/vouchers';

interface LegacyRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: Partial<SiteSettingsData>;
  existingOrders: StoredOrder[];
  existingCustomers: CustomerAccount[];
  candidateProductIds: string[];
}

export const LegacyRecoveryModal: React.FC<LegacyRecoveryModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  existingOrders,
  existingCustomers,
  candidateProductIds,
}) => {
  const [config, setConfig] = useState<LegacyFirebaseConfigInput>(
    DEFAULT_LEGACY_SECOND_SPANNER_CONFIG
  );
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  const [snippetText, setSnippetText] = useState('');

  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<LegacyScanResult | null>(null);

  const [importImages, setImportImages] = useState(true);
  const [importSettings, setImportSettings] = useState(true);
  const [importOrdersAndCustomers, setImportOrdersAndCustomers] = useState(true);

  const [authLoading, setAuthLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<LegacyImportProgress | null>(null);
  const [importResult, setImportResult] = useState<LegacyImportResult | null>(null);

  const runScan = async (cfg: LegacyFirebaseConfigInput = config) => {
    setScanning(true);
    setScanError(null);
    setImportResult(null);
    try {
      const res = await scanLegacyFirebaseProject(cfg, candidateProductIds);
      setScanResult(res);
    } catch (err: any) {
      setScanError(err?.message || 'Không thể kết nối tới project Firebase cũ.');
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen && !scanResult && !scanning) {
      void runScan(config);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const imageEntries = scanResult ? Object.entries(scanResult.images) : [];
  const editedProductsCount = scanResult?.settings?.editedProducts
    ? Object.keys(scanResult.settings.editedProducts).length
    : 0;
  const hiddenProductsCount = scanResult?.settings?.hiddenProductIds?.length || 0;
  const customProductsCount = scanResult?.settings?.customProducts?.length || 0;
  const heroSlidesCount = scanResult?.settings?.decorSettings?.heroSlides?.length || 0;

  const handleApplySnippet = () => {
    const parsed = parseFirebaseConfigSnippet(snippetText);
    if (!parsed) {
      setScanError('Không đọc được apiKey / projectId từ đoạn mã vừa dán.');
      return;
    }
    const nextCfg: LegacyFirebaseConfigInput = {
      ...config,
      ...parsed,
      databaseId: parsed.databaseId || config.databaseId,
    };
    setConfig(nextCfg);
    setScanError(null);
    void runScan(nextCfg);
  };

  const handleLegacyGoogleSignIn = async () => {
    setAuthLoading(true);
    setScanError(null);
    try {
      await signInLegacyWithGoogle(config);
      await runScan(config);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/unauthorized-domain') {
        setScanError(
          `Domain hiện tại chưa được thêm vào Authorized Domains của ${config.projectId}. Tuy nhiên anh vẫn khôi phục được toàn bộ Hình ảnh & Cài đặt bên dưới ngay mà không cần đăng nhập!`
        );
      } else if (code !== 'auth/popup-closed-by-user') {
        setScanError(err?.message || 'Đăng nhập Google vào project cũ thất bại.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLegacySignOut = async () => {
    setAuthLoading(true);
    try {
      await signOutLegacyGoogle(config);
      await runScan(config);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleStartImport = async () => {
    if (!scanResult) return;
    setImporting(true);
    setImportResult(null);
    setScanError(null);
    try {
      const res = await importLegacyDataIntoCurrentProject({
        scan: scanResult,
        currentSettings,
        existingOrderIds: existingOrders.map((o) => o.id),
        existingCustomerPhones: existingCustomers.map((c) => c.phoneNumber),
        importImages,
        importSettings,
        importOrdersAndCustomers:
          importOrdersAndCustomers &&
          (scanResult.orders.length > 0 || scanResult.customers.length > 0),
        onProgress: (p) => setProgress(p),
      });
      setImportResult(res);
    } catch (err: any) {
      setScanError(err?.message || 'Quá trình khôi phục bị gián đoạn.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <DatabaseBackup className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 truncate">
                Khôi phục hình cũ &amp; dữ liệu từ project cũ
              </h3>
              <p className="text-xs text-slate-500 truncate">
                Nguồn: <span className="font-mono font-semibold">{config.projectId}</span> → Đích: Web hiện tại
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Action bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="text-xs text-slate-600 space-y-0.5">
              <div>
                Project cũ: <strong className="font-mono text-slate-900">{config.projectId}</strong>
              </div>
              {scanResult && (
                <div>
                  Database tìm thấy:{' '}
                  <strong className="font-mono text-emerald-700">{scanResult.databaseIdUsed}</strong>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAdvancedConfig((v) => !v)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Cấu hình</span>
                {showAdvancedConfig ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => void runScan(config)}
                disabled={scanning || importing}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {scanning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>{scanning ? 'Đang quét...' : 'Quét lại'}</span>
              </button>
            </div>
          </div>

          {showAdvancedConfig && (
            <div className="border border-slate-200 rounded-xl p-3.5 space-y-3 bg-slate-50/70">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project ID</label>
                  <input
                    type="text"
                    value={config.projectId}
                    onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Database ID</label>
                  <input
                    type="text"
                    value={config.databaseId}
                    onChange={(e) => setConfig({ ...config, databaseId: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>
              <div className="text-xs">
                <label className="block font-semibold text-slate-700 mb-1">
                  Hoặc dán đoạn firebaseConfig khác (tùy chọn)
                </label>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={snippetText}
                    onChange={(e) => setSnippetText(e.target.value)}
                    placeholder="const firebaseConfig = { apiKey: ..., projectId: ... };"
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={handleApplySnippet}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-semibold shrink-0 cursor-pointer"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            </div>
          )}

          {scanError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{scanError}</span>
            </div>
          )}

          {scanning && (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-slate-600">
              <Loader2 className="w-7 h-7 animate-spin text-amber-600" />
              <div className="text-sm font-semibold">
                Đang quét hình ảnh &amp; cài đặt từ {config.projectId}...
              </div>
              <div className="text-xs text-slate-400">
                Việc này mất khoảng 2-4 giây để kiểm tra toàn bộ mã sản phẩm &amp; banner.
              </div>
            </div>
          )}

          {!scanning && scanResult && (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  className={`border rounded-xl p-3.5 cursor-pointer transition-colors ${
                    importImages
                      ? 'border-emerald-400 bg-emerald-50/60'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      Hình ảnh cũ
                    </span>
                    <input
                      type="checkbox"
                      checked={importImages}
                      onChange={(e) => setImportImages(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                    {imageEntries.length}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Ảnh sản phẩm, banner, mascot
                  </div>
                </label>

                <label
                  className={`border rounded-xl p-3.5 cursor-pointer transition-colors ${
                    importSettings && scanResult.settings
                      ? 'border-emerald-400 bg-emerald-50/60'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Settings className="w-4 h-4 text-blue-600" />
                      Cài đặt &amp; SP sửa
                    </span>
                    <input
                      type="checkbox"
                      checked={importSettings && Boolean(scanResult.settings)}
                      disabled={!scanResult.settings}
                      onChange={(e) => setImportSettings(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                    {scanResult.settings ? 'Có' : 'Không'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {editedProductsCount} SP sửa · {customProductsCount} SP mới · {hiddenProductsCount} ẩn · {heroSlidesCount} slide
                  </div>
                </label>

                <label
                  className={`border rounded-xl p-3.5 cursor-pointer transition-colors ${
                    importOrdersAndCustomers &&
                    (scanResult.orders.length > 0 || scanResult.customers.length > 0)
                      ? 'border-emerald-400 bg-emerald-50/60'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <ShoppingBag className="w-4 h-4 text-amber-600" />
                      Đơn &amp; Khách cũ
                    </span>
                    <input
                      type="checkbox"
                      checked={
                        importOrdersAndCustomers &&
                        (scanResult.orders.length > 0 || scanResult.customers.length > 0)
                      }
                      disabled={scanResult.orders.length === 0 && scanResult.customers.length === 0}
                      onChange={(e) => setImportOrdersAndCustomers(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                    {scanResult.orders.length + scanResult.customers.length}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {scanResult.orders.length} đơn · {scanResult.customers.length} khách
                  </div>
                </label>
              </div>

              {/* Optional Google Sign-in for orders/customers if permission-denied */}
              {(scanResult.ordersAccessDenied || scanResult.customersAccessDenied) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-amber-900 space-y-0.5">
                    <div className="font-bold">
                      Hình ảnh &amp; Cài đặt đã sẵn sàng để khôi phục ngay!
                    </div>
                    <div className="text-amber-800">
                      Nếu anh muốn kéo thêm cả <strong>Đơn hàng &amp; Khách hàng cũ</strong> (đang khóa quyền đọc), bấm nút bên cạnh để xác nhận tài khoản Google quản trị.
                    </div>
                  </div>
                  {scanResult.signedInEmail ? (
                    <button
                      type="button"
                      onClick={() => void handleLegacySignOut()}
                      disabled={authLoading}
                      className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-semibold text-amber-900 shrink-0 cursor-pointer"
                    >
                      Đổi TK ({scanResult.signedInEmail})
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleLegacyGoogleSignIn()}
                      disabled={authLoading}
                      className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {authLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <LogIn className="w-3.5 h-3.5" />
                      )}
                      <span>Đăng nhập lấy thêm Đơn cũ</span>
                    </button>
                  )}
                </div>
              )}

              {/* Image thumbnail preview */}
              {imageEntries.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Xem trước hình cũ tìm thấy ({imageEntries.length} hình):</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      Sẽ giữ nguyên ảnh gốc của anh
                    </span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-44 overflow-y-auto pr-1">
                    {imageEntries.map(([id, url]) => (
                      <div
                        key={id}
                        className="border border-slate-200 rounded-lg p-1 bg-slate-50 flex flex-col items-center gap-1"
                        title={id}
                      >
                        <img
                          src={url}
                          alt={id}
                          className="w-full h-14 object-contain rounded bg-white"
                        />
                        <span className="text-[10px] font-mono text-slate-600 truncate w-full text-center">
                          {id.replace(/^prod-/, '')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {imageEntries.length === 0 && !scanResult.settings && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-600">
                  <Search className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                  Chưa tìm thấy dữ liệu công khai trong database <code className="font-mono">{scanResult.databaseIdUsed}</code>. Anh thử bấm <strong>Cấu hình</strong> để kiểm tra lại Database ID nhé.
                </div>
              )}

              {/* Progress bar */}
              {importing && progress && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                    <span>{progress.message}</span>
                    <span className="tabular-nums">
                      {progress.current}/{progress.total}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-200"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((progress.current / Math.max(progress.total, 1)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Result banner */}
              {importResult && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 space-y-1.5 text-xs text-emerald-900">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Khôi phục thành công vào web hiện tại!</span>
                  </div>
                  <div>
                    • Đã khôi phục <strong>{importResult.imagesImported} hình ảnh</strong>
                    {importResult.imagesSkipped > 0
                      ? ` (bỏ qua ${importResult.imagesSkipped} ảnh lỗi/quá dung lượng)`
                      : ''}
                    .
                  </div>
                  {importResult.settingsImported && (
                    <div>
                      • Đã khôi phục <strong>cài đặt website, sản phẩm đã sửa, giá &amp; slide banner</strong> (vẫn giữ nguyên liên kết Google Sheets hiện tại).
                    </div>
                  )}
                  {(importResult.ordersImported > 0 || importResult.customersImported > 0) && (
                    <div>
                      • Đã chép thêm <strong>{importResult.ordersImported} đơn hàng</strong> &amp;{' '}
                      <strong>{importResult.customersImported} khách hàng</strong> cũ.
                    </div>
                  )}
                  {importResult.errors.length > 0 && (
                    <div className="pt-1 text-amber-800">
                      Ghi chú: {importResult.errors.slice(0, 3).join(' | ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">
            An toàn: Không xóa đơn mới hay cài đặt Google Sheets hiện tại.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={importing}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer disabled:opacity-40"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => void handleStartImport()}
              disabled={
                scanning ||
                importing ||
                !scanResult ||
                (!importImages && !importSettings && !importOrdersAndCustomers) ||
                (imageEntries.length === 0 && !scanResult.settings && scanResult.orders.length === 0)
              }
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <DatabaseBackup className="w-4 h-4" />
              )}
              <span>
                {importing ? 'Đang khôi phục...' : 'Khôi phục tất cả về web ngay'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
