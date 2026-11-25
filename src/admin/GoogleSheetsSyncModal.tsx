import React, { useEffect, useState } from 'react';
import {
  X,
  FileSpreadsheet,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Plus,
  Link2,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Send,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { auth, StoredOrder } from '../lib/firebase';
import type { CustomerAccount } from '../data/vouchers';
import {
  connectGoogleSheetsPopup,
  getSheetsAccessToken,
  getSheetsConnectedEmail,
  clearSheetsAccessToken,
  extractSpreadsheetId,
  fetchSpreadsheetMeta,
  createWarehouseSpreadsheet,
  syncOrdersAndCustomersToSheet,
  pushOrderToSheetWebhook,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  ORDER_SHEET_TAB,
  CUSTOMER_SHEET_TAB,
  SheetSyncResult,
} from '../lib/googleSheets';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: StoredOrder[];
  customers: CustomerAccount[];
  googleSheetId?: string;
  googleSheetTitle?: string;
  googleSheetUrl?: string;
  googleSheetWebhookUrl?: string;
  googleSheetAutoSyncOnAdmin?: boolean;
  isSheetsConnected: boolean;
  sheetsEmail: string | null;
  onSheetsAuthChanged: (connected: boolean, email: string | null) => void;
  onSaveSheetConfig: (patch: {
    googleSheetId?: string;
    googleSheetTitle?: string;
    googleSheetUrl?: string;
    googleSheetWebhookUrl?: string;
    googleSheetAutoSyncOnAdmin?: boolean;
  }) => Promise<void>;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  orders,
  customers,
  googleSheetId = '',
  googleSheetTitle = '',
  googleSheetUrl = '',
  googleSheetWebhookUrl = '',
  googleSheetAutoSyncOnAdmin = false,
  isSheetsConnected,
  sheetsEmail,
  onSheetsAuthChanged,
  onSaveSheetConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'oauth' | 'webhook'>('oauth');
  const [sheetLinkInput, setSheetLinkInput] = useState(googleSheetUrl || googleSheetId || '');
  const [webhookInput, setWebhookInput] = useState(googleSheetWebhookUrl || '');

  const [isConnecting, setIsConnecting] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [confirmSyncPending, setConfirmSyncPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SheetSyncResult | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSheetLinkInput(googleSheetUrl || googleSheetId || '');
      setWebhookInput(googleSheetWebhookUrl || '');
      setErrorMsg(null);
      setStatusMsg(null);
      setSyncResult(null);
      setConfirmSyncPending(false);
    }
  }, [isOpen, googleSheetUrl, googleSheetId, googleSheetWebhookUrl]);

  if (!isOpen) return null;

  const currentToken = getSheetsAccessToken();
  const connectedEmailDisplay = sheetsEmail || getSheetsConnectedEmail();

  const handleConnectGoogle = async () => {
    setErrorMsg(null);
    setStatusMsg(null);
    setIsConnecting(true);
    try {
      const res = await connectGoogleSheetsPopup(auth);
      if (res) {
        onSheetsAuthChanged(true, res.email);
        setStatusMsg(`Đã kết nối Google Sheets với tài khoản ${res.email || 'Google'}.`);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể kết nối Google Sheets. Vui lòng thử lại.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectGoogle = () => {
    clearSheetsAccessToken();
    onSheetsAuthChanged(false, null);
    setConfirmSyncPending(false);
    setStatusMsg('Đã ngắt phiên kết nối Google Sheets trên trình duyệt này.');
  };

  const handleCreateNewSheet = async () => {
    const token = getSheetsAccessToken();
    if (!token) {
      setErrorMsg('Anh vui lòng bấm "Sign in with Google" ở trên để kết nối trước.');
      return;
    }
    setErrorMsg(null);
    setStatusMsg(null);
    setIsWorking(true);
    try {
      const meta = await createWarehouseSpreadsheet(token);
      await onSaveSheetConfig({
        googleSheetId: meta.spreadsheetId,
        googleSheetTitle: meta.title,
        googleSheetUrl: meta.spreadsheetUrl,
      });
      setSheetLinkInput(meta.spreadsheetUrl);
      setStatusMsg(
        `Đã tạo file "${meta.title}" với 2 tab (${ORDER_SHEET_TAB} & ${CUSTOMER_SHEET_TAB}). Anh có thể bấm Đồng bộ ngay!`
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể tạo Google Sheet mới.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleLinkExistingSheet = async () => {
    const token = getSheetsAccessToken();
    if (!token) {
      setErrorMsg('Anh vui lòng kết nối Google ở bước trên trước để hệ thống đọc được file Sheet.');
      return;
    }
    const id = extractSpreadsheetId(sheetLinkInput);
    if (!id) {
      setErrorMsg('Link hoặc ID Google Sheet không hợp lệ. Vui lòng dán đúng link từ thanh địa chỉ Google Sheets.');
      return;
    }
    setErrorMsg(null);
    setStatusMsg(null);
    setIsWorking(true);
    try {
      const meta = await fetchSpreadsheetMeta(token, id);
      await onSaveSheetConfig({
        googleSheetId: meta.spreadsheetId,
        googleSheetTitle: meta.title,
        googleSheetUrl: meta.spreadsheetUrl,
      });
      setSheetLinkInput(meta.spreadsheetUrl);
      setStatusMsg(`Đã liên kết bảng tính "${meta.title}" thành công!`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể truy cập Google Sheet này. Hãy kiểm tra quyền chỉnh sửa của tài khoản Google.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleConfirmSyncToSheet = async () => {
    const token = getSheetsAccessToken();
    if (!token) {
      setErrorMsg('Phiên Google Sheets chưa kết nối hoặc đã hết hạn. Anh vui lòng bấm kết nối lại.');
      setConfirmSyncPending(false);
      return;
    }
    if (!googleSheetId) {
      setErrorMsg('Chưa chọn file Google Sheet Kho. Anh hãy bấm "Tạo Google Sheet Kho mới" hoặc dán link Sheet trước.');
      setConfirmSyncPending(false);
      return;
    }

    setErrorMsg(null);
    setStatusMsg(null);
    setSyncResult(null);
    setIsWorking(true);
    try {
      const result = await syncOrdersAndCustomersToSheet({
        accessToken: token,
        spreadsheetId: googleSheetId,
        orders,
        customers,
      });
      setSyncResult(result);
      setConfirmSyncPending(false);
      setStatusMsg('Đồng bộ lên Google Sheet hoàn tất!');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi khi ghi dữ liệu lên Google Sheet.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleToggleAutoSync = async (nextVal: boolean) => {
    setErrorMsg(null);
    try {
      await onSaveSheetConfig({ googleSheetAutoSyncOnAdmin: nextVal });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể lưu tùy chọn tự động đồng bộ.');
    }
  };

  const handleSaveWebhook = async () => {
    const trimmed = webhookInput.trim();
    if (trimmed && !trimmed.startsWith('https://script.google.com/')) {
      setErrorMsg('URL Webhook phải là link Web App của Google Apps Script (bắt đầu bằng https://script.google.com/...).');
      return;
    }
    setErrorMsg(null);
    setStatusMsg(null);
    setIsWorking(true);
    try {
      await onSaveSheetConfig({ googleSheetWebhookUrl: trimmed });
      setStatusMsg(
        trimmed
          ? 'Đã lưu link Webhook 24/7! Từ giờ mọi đơn mới sẽ tự động gửi vào Google Sheet.'
          : 'Đã xóa link Webhook 24/7.'
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi khi lưu Webhook.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleTestWebhook = async () => {
    const trimmed = webhookInput.trim();
    if (!trimmed.startsWith('https://script.google.com/')) {
      setErrorMsg('Vui lòng nhập đúng link Google Apps Script Webhook trước khi gửi thử.');
      return;
    }
    setErrorMsg(null);
    setStatusMsg(null);
    setIsTestingWebhook(true);
    try {
      await pushOrderToSheetWebhook(trimmed, 'test', {
        id: `TEST_${Date.now().toString().slice(-6)}`,
        customerName: 'Khách Test Livestream KDT-89',
        phoneNumber: '0397017013',
        address: 'Kho KDT-89 (Dòng test kết nối 24/7)',
        items: [{ id: 'test-1', name: 'Nồi cơm / Quạt hơi nước KDT-89 (Test)', price: '1.250.000 đ', quantity: 1 }],
        totalAmount: '1.250.000 đ',
        appliedVoucher: 'KDT89-50K',
        voucherDiscount: '-50.000 đ',
        note: 'Kiểm tra nhận đơn tự động về Sheet',
        status: 'Mới',
        createdAt: new Date().toISOString(),
      });
      setStatusMsg('Đã gửi 1 dòng Test sang Webhook! Anh mở Google Sheet tab Don_Hang_Kho để kiểm tra sau 2 giây.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không gửi được tín hiệu Test.');
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    } catch {
      setErrorMsg('Không thể tự động sao chép, anh vui lòng bôi đen đoạn mã và bấm Ctrl+C.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-emerald-700 px-5 py-4 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold truncate">
                Google Sheets Kho &amp; Vận Đơn Livestream
              </h3>
              <p className="text-xs text-emerald-100 truncate">
                Đẩy đơn hàng &amp; danh sách khách hàng sang Google Sheets để kho xử lý ngay
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại Google Sheets"
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-mode tabs */}
        <div className="px-5 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setActiveTab('oauth');
              setErrorMsg(null);
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'oauth'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>1. Kết nối Google Sheets trực tiếp</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('webhook');
              setErrorMsg(null);
              setConfirmSyncPending(false);
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'webhook'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>2. Tự động nhận đơn 24/7 (khi tắt Admin)</span>
            {googleSheetWebhookUrl && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {statusMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{statusMsg}</span>
            </div>
          )}

          {activeTab === 'oauth' ? (
            <div className="space-y-4">
              {/* Step 1: Google Account Auth */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Bước 1: Tài khoản Google sở hữu bảng tính</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Chọn tài khoản Google quản trị (ví dụ <span className="font-mono font-semibold text-slate-700">nguyminhtuan10C2@gmail.com</span>) để tạo &amp; đồng bộ Google Sheet.
                    </p>
                  </div>

                  {isSheetsConnected && currentToken ? (
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                        Đã kết nối: {connectedEmailDisplay || 'Google'}
                      </span>
                      <button
                        type="button"
                        onClick={handleDisconnectGoogle}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Đổi / Ngắt</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isConnecting}
                      onClick={handleConnectGoogle}
                      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                      <span>{isConnecting ? 'Đang mở Google...' : 'Sign in with Google'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Step 2: Select or Create Warehouse Sheet */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Bước 2: Chọn hoặc Tạo Google Sheet Kho
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Tự động tạo sẵn 2 trang tính: <code className="font-mono font-bold text-slate-700">{ORDER_SHEET_TAB}</code> và{' '}
                      <code className="font-mono font-bold text-slate-700">{CUSTOMER_SHEET_TAB}</code>.
                    </p>
                  </div>

                  {googleSheetUrl && (
                    <a
                      href={googleSheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
                    >
                      <span>Mở Google Sheet Kho</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {googleSheetId && (
                  <div className="px-3 py-2 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-emerald-700 font-semibold">Đang liên kết: </span>
                      <strong className="text-slate-900 truncate">{googleSheetTitle || googleSheetId}</strong>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      ID: {googleSheetId.slice(0, 12)}...
                    </span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    disabled={isWorking || !isSheetsConnected || !currentToken}
                    onClick={handleCreateNewSheet}
                    className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tạo Google Sheet Kho mới</span>
                  </button>

                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={sheetLinkInput}
                      onChange={(e) => setSheetLinkInput(e.target.value)}
                      placeholder="Hoặc dán link Google Sheet có sẵn vào đây..."
                      className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                    />
                    <button
                      type="button"
                      disabled={isWorking || !isSheetsConnected || !currentToken || !sheetLinkInput.trim()}
                      onClick={handleLinkExistingSheet}
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-800 text-xs font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Liên kết</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 3: Sync & Auto-sync Toggle */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Bước 3: Đồng bộ Đơn hàng ({orders.length}) &amp; Khách hàng ({customers.length})
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Cập nhật trạng thái đơn hiện có theo Mã đơn &amp; thêm đơn mới cuối bảng — không bị trùng dòng.
                    </p>
                  </div>

                  {!confirmSyncPending && (
                    <button
                      type="button"
                      disabled={isWorking || !isSheetsConnected || !currentToken || !googleSheetId}
                      onClick={() => {
                        setErrorMsg(null);
                        setConfirmSyncPending(true);
                      }}
                      className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isWorking ? 'animate-spin' : ''}`} />
                      <span>Đồng bộ lên Google Sheet ngay</span>
                    </button>
                  )}
                </div>

                {/* Mandatory Confirmation Step before writing/modifying user's Sheet */}
                {confirmSyncPending && (
                  <div className="rounded-xl bg-amber-50 border-2 border-amber-300 p-3.5 space-y-2.5">
                    <div className="flex items-start gap-2 text-xs text-amber-950">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="font-bold">
                          Xác nhận ghi dữ liệu vào Google Sheet?
                        </div>
                        <p className="text-[11px] text-amber-900 leading-relaxed">
                          Hệ thống sẽ ghi/cập nhật <strong>{orders.length} đơn hàng</strong> vào tab{' '}
                          <code className="font-mono font-bold">{ORDER_SHEET_TAB}</code> và{' '}
                          <strong>{customers.length} khách hàng</strong> vào tab{' '}
                          <code className="font-mono font-bold">{CUSTOMER_SHEET_TAB}</code> trong bảng tính{' '}
                          <strong>&ldquo;{googleSheetTitle || googleSheetId}&rdquo;</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={isWorking}
                        onClick={() => setConfirmSyncPending(false)}
                        className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-100 text-amber-950 text-xs font-semibold cursor-pointer"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        type="button"
                        disabled={isWorking}
                        onClick={handleConfirmSyncToSheet}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {isWorking ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang ghi Sheet...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Xác nhận ghi vào Google Sheet</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {syncResult && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      Thêm mới <strong>{syncResult.addedOrders}</strong> đơn, cập nhật{' '}
                      <strong>{syncResult.updatedOrders}</strong> đơn · Thêm mới{' '}
                      <strong>{syncResult.addedCustomers}</strong> khách hàng.
                    </div>
                    <a
                      href={syncResult.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-emerald-800 hover:underline inline-flex items-center gap-1 shrink-0"
                    >
                      <span>Xem kết quả trên Sheet</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                <label className="pt-2 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(googleSheetAutoSyncOnAdmin)}
                    onChange={(e) => void handleToggleAutoSync(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300"
                  />
                  <span>
                    <strong className="text-slate-900">
                      Tự động đẩy đơn mới sang Google Sheet khi đang mở trang Quản trị
                    </strong>
                    <span className="block text-[11px] text-slate-500">
                      Khi kho mở sẵn máy tính trang Admin trong lúc livestream, có đơn mới sẽ tự đẩy lên Sheet sau vài giây (chỉ chạy khi đã đăng nhập Google ở Bước 1).
                    </span>
                  </span>
                </label>
              </div>
            </div>
          ) : (
            /* TAB 2: 24/7 APPS SCRIPT WEBHOOK */
            <div className="space-y-4">
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-3.5 text-xs text-blue-950 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span>Gửi đơn tức thì 24/7 (kể cả khi tắt trình duyệt Admin)</span>
                </div>
                <p className="text-[11px] text-blue-900 leading-relaxed">
                  Khi khách xem livestream bấm <strong>&ldquo;Giữ giá 24h&rdquo;</strong> trên điện thoại, đơn hàng &amp; địa chỉ giao (Bước 2) sẽ tự động ghi thẳng vào tab{' '}
                  <code className="font-mono font-bold">{ORDER_SHEET_TAB}</code> chỉ sau 1–2 giây.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 space-y-2.5">
                <label className="block text-xs font-bold text-slate-900">
                  Link Webhook Google Apps Script (Web App URL)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={webhookInput}
                    onChange={(e) => setWebhookInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-400"
                  />
                  <button
                    type="button"
                    disabled={isWorking}
                    onClick={handleSaveWebhook}
                    className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold cursor-pointer shrink-0"
                  >
                    Lưu Link Webhook
                  </button>
                  <button
                    type="button"
                    disabled={isTestingWebhook || !webhookInput.trim()}
                    onClick={handleTestWebhook}
                    className="px-3.5 py-2 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-800 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isTestingWebhook ? 'Đang gửi...' : 'Gửi dòng Test'}</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-bold text-slate-900">
                    Hướng dẫn cài đặt nhanh 3 bước (1 lần duy nhất):
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đã chép mã Script</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Chép đoạn mã Apps Script</span>
                      </>
                    )}
                  </button>
                </div>

                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                  <li>
                    Mở file Google Sheet Kho của anh → trên thanh menu chọn{' '}
                    <strong>Tiện ích mở rộng (Extensions) → Apps Script</strong>.
                  </li>
                  <li>
                    Xóa mã mặc định, dán toàn bộ đoạn mã bên dưới vào và bấm biểu tượng <strong>Lưu (Save)</strong>.
                  </li>
                  <li>
                    Bấm <strong>Triển khai (Deploy) → Tùy chọn triển khai mới → Loại: Ứng dụng web (Web app)</strong>, mục{' '}
                    <em>Người có quyền truy cập</em> chọn <strong>Bất kỳ ai (Anyone)</strong> → bấm <strong>Triển khai</strong> rồi chép URL <code className="font-mono">/exec</code> dán vào ô phía trên!
                  </li>
                </ol>

                <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 text-[10px] leading-relaxed font-mono overflow-x-auto max-h-44">
                  {GOOGLE_APPS_SCRIPT_TEMPLATE}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
