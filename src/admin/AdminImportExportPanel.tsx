import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  DatabaseBackup,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
} from 'lucide-react';
import type { CategoryItem, ProductItem } from '../data/products';
import type { SiteSettingsData } from '../lib/firebase';
import {
  ResolvedAdminProduct,
  ImportAnalysisResult,
  exportProductsCSV,
  exportProductsTSV,
  exportProductsJSON,
  exportSiteSettingsBackup,
  analyzeImportRows,
  buildAtomicImportSettingsPatch,
} from '../lib/productImportExport';

interface AdminImportExportPanelProps {
  resolvedProducts: ResolvedAdminProduct[];
  categories: CategoryItem[];
  rawSiteSettings: Partial<SiteSettingsData>;
  customImageKeys: string[];
  onCommitImportPatch: (patch: Partial<SiteSettingsData>) => Promise<void>;
}

export const AdminImportExportPanel: React.FC<AdminImportExportPanelProps> = ({
  resolvedProducts,
  categories,
  rawSiteSettings,
  customImageKeys,
  onCommitImportPatch,
}) => {
  const [exportNotice, setExportNotice] = useState<{
    message: string;
    dataUrlCount: number;
  } | null>(null);

  // Import states
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [rawContent, setRawContent] = useState<string>('');
  const [analysis, setAnalysis] = useState<ImportAnalysisResult | null>(null);
  const [backupDownloadedBeforeImport, setBackupDownloadedBeforeImport] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [commitReport, setCommitReport] = useState<{
    added: number;
    updated: number;
    skipped: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportCSV = () => {
    const res = exportProductsCSV(resolvedProducts);
    setExportNotice({
      message: `Đã xuất ${res.count} sản phẩm ra file ${res.fileName} (không thay đổi dữ liệu Firebase).`,
      dataUrlCount: res.dataUrlCount,
    });
  };

  const handleExportTSV = () => {
    const res = exportProductsTSV(resolvedProducts);
    setExportNotice({
      message: `Đã xuất ${res.count} sản phẩm ra file ${res.fileName} để mở bằng Excel / Google Sheets.`,
      dataUrlCount: res.dataUrlCount,
    });
  };

  const handleExportJSON = () => {
    const res = exportProductsJSON(resolvedProducts);
    setExportNotice({
      message: `Đã xuất ${res.count} sản phẩm ra file JSON ${res.fileName}.`,
      dataUrlCount: res.dataUrlCount,
    });
  };

  const handleBackupSettings = () => {
    const res = exportSiteSettingsBackup(rawSiteSettings, customImageKeys);
    setBackupDownloadedBeforeImport(true);
    setExportNotice({
      message: `Đã tải file sao lưu cấu hình settings/site: ${res.fileName}.`,
      dataUrlCount: 0,
    });
  };

  const runAnalysis = (text: string, fileName?: string) => {
    setCommitError(null);
    setCommitReport(null);
    const result = analyzeImportRows(text, fileName, resolvedProducts, categories);
    setAnalysis(result);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    setBackupDownloadedBeforeImport(false);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target?.result || '');
      setRawContent(content);
      runAnalysis(content, file.name);
    };
    reader.onerror = () => {
      setAnalysis({
        format: 'csv',
        rows: [],
        counts: { total: 0, add: 0, update: 0, duplicate: 0, error: 0, unchanged: 0 },
        parseError: 'Không thể đọc file đã chọn.',
      });
    };
    reader.readAsText(file);
  };

  const handleConfirmCommit = async () => {
    if (!analysis || analysis.parseError) return;
    const actionable = analysis.counts.add + analysis.counts.update;
    if (actionable === 0) return;

    setCommitError(null);
    const built = buildAtomicImportSettingsPatch(analysis.rows, {
      customProducts: (rawSiteSettings.customProducts || []) as ProductItem[],
      editedProducts: rawSiteSettings.editedProducts || {},
      customPrices: rawSiteSettings.customPrices || {},
      hiddenProductIds: rawSiteSettings.hiddenProductIds || [],
    });

    if (built.error) {
      setCommitError(built.error);
      return;
    }

    setIsWriting(true);
    try {
      await onCommitImportPatch(built.patch);
      setCommitReport({
        added: built.addedCount,
        updated: built.updatedCount,
        skipped: built.skippedCount,
      });
      setAnalysis(null);
      setRawContent('');
      setSelectedFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setCommitError(
        `Lỗi ghi Firebase (chưa áp dụng thay đổi): ${err?.message || 'Vui lòng thử lại.'}`
      );
    } finally {
      setIsWriting(false);
    }
  };

  const handleResetImport = () => {
    setSelectedFileName('');
    setRawContent('');
    setAnalysis(null);
    setCommitError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Nhập / Xuất & Sao lưu dữ liệu</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Xuất dữ liệu chỉ đọc trên trình duyệt. Nhập dữ liệu kiểm tra trùng lặp theo ID/Mã model và chỉ ghi Firebase sau khi xác nhận.
        </p>
      </div>

      {/* SECTION 1: EXPORT & BACKUP */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">1. Xuất dữ liệu & Sao lưu</h3>
            <p className="text-xs text-slate-500">
              Bao gồm đầy đủ {resolvedProducts.length} sản phẩm (ID, tên, model, danh mục, giá, tồn kho, bảo hành, thông số, mô tả, ẩn/hiện, giá tùy chỉnh, URL ảnh).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-left flex items-start gap-3 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-slate-900">Xuất CSV (Excel)</div>
              <div className="text-xs text-slate-500 mt-0.5">UTF-8 BOM, mở trực tiếp bằng Excel</div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleExportTSV}
            className="p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-left flex items-start gap-3 transition-colors cursor-pointer"
          >
            <Download className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-slate-900">Xuất TSV (Sheets)</div>
              <div className="text-xs text-slate-500 mt-0.5">Phân tách Tab, dán vào Google Sheets</div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-left flex items-start gap-3 transition-colors cursor-pointer"
          >
            <FileJson className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-slate-900">Xuất JSON đầy đủ</div>
              <div className="text-xs text-slate-500 mt-0.5">Cấu trúc đầy đủ để nhập lại</div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleBackupSettings}
            className="p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-left flex items-start gap-3 transition-colors cursor-pointer"
          >
            <DatabaseBackup className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-slate-900">Sao lưu settings/site</div>
              <div className="text-xs text-slate-500 mt-0.5">File JSON gốc của document cấu hình</div>
            </div>
          </button>
        </div>

        {exportNotice && (
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{exportNotice.message}</span>
            </div>
            {exportNotice.dataUrlCount > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Có <strong>{exportNotice.dataUrlCount}</strong> sản phẩm dùng ảnh data URL dung lượng lớn đã được xuất dưới dạng mã tham chiếu{' '}
                  <code className="font-mono bg-white px-1 py-0.5 rounded">[data-url-firestore:custom_images/...]</code> để tránh treo trình duyệt hoặc lỗi giới hạn ô Excel. Ảnh thực tế vẫn giữ nguyên trên Firebase.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: SAFE IMPORT WORKFLOW */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">2. Nhập dữ liệu sản phẩm (CSV / TSV / JSON)</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Không tự động xóa sản phẩm thiếu trong file. Giữ nguyên các cột không có trong file. Chưa ghi Firebase trước khi bấm xác nhận.
          </p>
        </div>

        {commitReport && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 space-y-1">
            <div className="font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đã ghi đồng bộ lên Firebase thành công</span>
            </div>
            <div className="text-xs tabular-nums">
              Thêm mới: <strong>{commitReport.added}</strong> · Cập nhật:{' '}
              <strong>{commitReport.updated}</strong> · Bỏ qua: <strong>{commitReport.skipped}</strong>
            </div>
          </div>
        )}

        {commitError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{commitError}</span>
          </div>
        )}

        {/* File Picker & Paste Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt,.json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full min-h-[140px] border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 transition-colors cursor-pointer"
            >
              <Upload className="w-6 h-6 text-slate-500" />
              <div className="text-sm font-semibold text-slate-800">
                {selectedFileName ? selectedFileName : 'Chọn file .csv, .tsv hoặc .json'}
              </div>
              <div className="text-xs text-slate-500">
                Hệ thống sẽ phân tích & hiển thị bản xem trước trước khi ghi
              </div>
            </button>
          </div>

          <div className="lg:col-span-7 space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Hoặc dán trực tiếp nội dung CSV / TSV / JSON vào đây để kiểm tra:
            </label>
            <textarea
              rows={4}
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              placeholder="Dán dữ liệu có dòng tiêu đề cột (VD: ID sản phẩm, Tên sản phẩm, Mã model, Giá chương trình...)"
              className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            />
            <div className="flex items-center justify-end gap-2">
              {rawContent && (
                <button
                  type="button"
                  onClick={handleResetImport}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Xóa nội dung
                </button>
              )}
              <button
                type="button"
                disabled={!rawContent.trim()}
                onClick={() => runAnalysis(rawContent, selectedFileName || undefined)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer"
              >
                Kiểm tra & Xem trước
              </button>
            </div>
          </div>
        </div>

        {/* Parse Error */}
        {analysis?.parseError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block">Định dạng file không hợp lệ</strong>
              <span>{analysis.parseError}</span>
            </div>
          </div>
        )}

        {/* Analysis Preview & Confirmation Gate */}
        {analysis && !analysis.parseError && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {/* Summary Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-xs tabular-nums">
                <span className="font-bold text-slate-900">
                  Xem trước ({analysis.format.toUpperCase()} · {analysis.counts.total} dòng):
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                  Thêm mới: {analysis.counts.add}
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                  Cập nhật: {analysis.counts.update}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                  Trùng: {analysis.counts.duplicate}
                </span>
                <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-semibold">
                  Lỗi: {analysis.counts.error}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                  Không đổi: {analysis.counts.unchanged}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleBackupSettings}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                    backupDownloadedBeforeImport
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  <DatabaseBackup className="w-3.5 h-3.5" />
                  <span>
                    {backupDownloadedBeforeImport
                      ? 'Đã tải sao lưu'
                      : 'Tải sao lưu trước khi ghi'}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={
                    isWriting || analysis.counts.add + analysis.counts.update === 0
                  }
                  onClick={handleConfirmCommit}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                >
                  {isWriting
                    ? 'Đang ghi Firebase...'
                    : `Xác nhận ghi (${analysis.counts.add + analysis.counts.update} dòng)`}
                </button>
              </div>
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto max-h-[380px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-white border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Dòng</th>
                    <th className="py-2.5 px-3">Trạng thái</th>
                    <th className="py-2.5 px-3">ID / Mã model</th>
                    <th className="py-2.5 px-3">Tên sản phẩm</th>
                    <th className="py-2.5 px-3">Chi tiết xử lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analysis.rows.map((r) => (
                    <tr key={`${r.rowNumber}-${r.targetId}`} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-slate-500 tabular-nums">
                        #{r.rowNumber}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {r.status === 'add' && (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                            Thêm mới
                          </span>
                        )}
                        {r.status === 'update' && (
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                            Cập nhật
                          </span>
                        )}
                        {r.status === 'duplicate' && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                            Trùng lặp
                          </span>
                        )}
                        {r.status === 'error' && (
                          <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-semibold">
                            Lỗi
                          </span>
                        )}
                        {r.status === 'unchanged' && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                            Bỏ qua
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                        <div>{r.targetId || '—'}</div>
                        {r.targetModelCode && (
                          <div className="text-[11px] text-slate-500">{r.targetModelCode}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 max-w-[240px]">
                        <div className="truncate">{r.targetName || '(Trống)'}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{r.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
