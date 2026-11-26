import React, { useMemo, useState } from 'react';
import {
  Search,
  Phone,
  MapPin,
  Mail,
  Trash2,
  ExternalLink,
  Download,
  AlertCircle,
  Users,
  ShoppingBag,
  Ticket,
  Calendar,
  FileSpreadsheet,
  Copy,
  Check,
  RefreshCw,
  Truck,
  Loader2,
} from 'lucide-react';
import {
  StoredOrder,
  StoredLead,
  updateOrderStatus,
  deleteOrderFromFirestore,
  deleteCustomerFromFirestore,
  generateOrderMailtoUri,
  ADMIN_NOTIFICATION_EMAIL,
} from '../lib/firebase';
import type { CustomerAccount } from '../data/vouchers';
import { triggerFileDownload } from '../lib/productImportExport';
import {
  ShippingConfig,
  ShippingEstimateResult,
  estimateDistanceByAddress,
  resolveShippingConfig,
  buildOpenStreetMapDirectionsUrl,
} from '../lib/shipping';

interface AdminOrdersPanelProps {
  orders: StoredOrder[];
  loading: boolean;
  loadError: string | null;
  customers?: CustomerAccount[];
  customersLoading?: boolean;
  customersError?: string | null;
  leads?: StoredLead[];
  initialSubTab?: 'orders' | 'customers';
  googleSheetUrl?: string;
  isSheetsConnected?: boolean;
  autoSyncEnabled?: boolean;
  onOpenGoogleSheetsModal?: () => void;
  onSyncSheetsNow?: () => Promise<void>;
  shippingConfig?: Partial<ShippingConfig> | null;
}

const ORDER_STATUSES: Array<'Mới' | 'Đã liên hệ' | 'Đang giao' | 'Hoàn thành' | 'Đã hủy'> = [
  'Mới',
  'Đã liên hệ',
  'Đang giao',
  'Hoàn thành',
  'Đã hủy',
];

export const AdminOrdersPanel: React.FC<AdminOrdersPanelProps> = ({
  orders,
  loading,
  loadError,
  customers = [],
  customersLoading = false,
  customersError = null,
  leads = [],
  initialSubTab = 'orders',
  googleSheetUrl,
  isSheetsConnected = false,
  autoSyncEnabled = false,
  onOpenGoogleSheetsModal,
  onSyncSheetsNow,
  shippingConfig,
}) => {
  const [subTab, setSubTab] = useState<'orders' | 'customers'>(initialSubTab);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedPhones, setCopiedPhones] = useState(false);
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [deletingCustomerPhone, setDeletingCustomerPhone] = useState<string | null>(null);
  const [orderEstimates, setOrderEstimates] = useState<
    Record<string, ShippingEstimateResult | 'not_found'>
  >({});
  const [estimatingOrderId, setEstimatingOrderId] = useState<string | null>(null);
  const resolvedShipping = useMemo(
    () => resolveShippingConfig(shippingConfig),
    [shippingConfig]
  );

  const handleMeasureOrderDistance = async (order: StoredOrder) => {
    const addr = (order.address || '').trim();
    if (!addr || addr.toLowerCase().includes('sale xác nhận')) {
      setOrderEstimates((prev) => ({ ...prev, [order.id]: 'not_found' }));
      return;
    }
    const subtotalNum = parseInt((order.totalAmount || '').replace(/[^0-9]/g, ''), 10) || 0;
    setEstimatingOrderId(order.id);
    try {
      const res = await estimateDistanceByAddress({
        address: addr,
        orderSubtotal: subtotalNum,
        config: resolvedShipping,
      });
      setOrderEstimates((prev) => ({ ...prev, [order.id]: res || 'not_found' }));
    } finally {
      setEstimatingOrderId(null);
    }
  };

  React.useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    return customers.filter((c) => {
      if (!q) return true;
      return (
        (c.fullName || '').toLowerCase().includes(q) ||
        (c.phoneNumber || '').includes(q) ||
        (c.address || '').toLowerCase().includes(q)
      );
    });
  }, [customers, customerSearch]);

  const handleExportCustomersCSV = () => {
    const escape = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
    const header = [
      'Họ và tên',
      'Số điện thoại',
      'Địa chỉ',
      'Ngày đăng ký',
      'Đăng nhập gần nhất',
      'Voucher đã nhận',
    ].join(',');
    const rows = filteredCustomers.map((c) =>
      [
        escape(c.fullName || ''),
        escape(c.phoneNumber || ''),
        escape(c.address || ''),
        escape(c.registeredAt ? new Date(c.registeredAt).toLocaleString('vi-VN') : ''),
        escape(c.lastLoginAt ? new Date(c.lastLoginAt).toLocaleString('vi-VN') : ''),
        escape((c.vouchersClaimed || []).join(' | ')),
      ].join(',')
    );
    triggerFileDownload(
      '\uFEFF' + [header, ...rows].join('\r\n'),
      `kdt89-khach-hang-${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv;charset=utf-8;'
    );
  };

  const handleCopyAllPhones = async () => {
    const phones = filteredCustomers.map((c) => c.phoneNumber).filter(Boolean).join('\n');
    if (!phones) return;
    try {
      await navigator.clipboard.writeText(phones);
      setCopiedPhones(true);
      setTimeout(() => setCopiedPhones(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleQuickSheetsSync = async () => {
    if (!onSyncSheetsNow) {
      onOpenGoogleSheetsModal?.();
      return;
    }
    setSyncingSheets(true);
    try {
      await onSyncSheetsNow();
    } finally {
      setSyncingSheets(false);
    }
  };

  const handleDeleteCustomer = async (phoneNumber: string) => {
    setDeletingCustomerPhone(phoneNumber);
    try {
      await deleteCustomerFromFirestore(phoneNumber);
    } catch (err) {
      console.error('Lỗi xóa khách hàng:', err);
    } finally {
      setDeletingCustomerPhone(null);
    }
  };

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((ord) => {
      const currentStatus = ord.status || 'Mới';
      if (filterStatus !== 'all' && currentStatus !== filterStatus) return false;
      if (q) {
        return (
          ord.customerName.toLowerCase().includes(q) ||
          ord.phoneNumber.includes(q) ||
          ord.address.toLowerCase().includes(q) ||
          ord.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, filterStatus, searchQuery]);

  const handleStatusChange = async (
    orderId: string,
    newStatus: 'Mới' | 'Đã liên hệ' | 'Đang giao' | 'Hoàn thành' | 'Đã hủy'
  ) => {
    try {
      setUpdatingId(orderId);
      await updateOrderStatus(orderId, newStatus);
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái đơn:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      setDeletingId(orderId);
      await deleteOrderFromFirestore(orderId);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Lỗi xóa đơn hàng:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportOrdersCSV = () => {
    const escape = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
    const header = [
      'Mã đơn',
      'Thời gian',
      'Khách hàng',
      'Số điện thoại',
      'Địa chỉ',
      'Sản phẩm',
      'Tổng tiền',
      'Voucher',
      'Trạng thái',
      'Ghi chú',
    ].join(',');
    const rows = filteredOrders.map((o) =>
      [
        escape(o.id),
        escape(new Date(o.createdAt).toLocaleString('vi-VN')),
        escape(o.customerName),
        escape(o.phoneNumber),
        escape(o.address),
        escape(o.items.map((i) => `${i.name} x${i.quantity}`).join(' | ')),
        escape(o.totalAmount),
        escape(o.appliedVoucher || ''),
        escape(o.status || 'Mới'),
        escape(o.note || ''),
      ].join(',')
    );
    triggerFileDownload(
      '\uFEFF' + [header, ...rows].join('\r\n'),
      `kdt89-don-hang-${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv;charset=utf-8;'
    );
  };

  const getStatusClass = (status?: string) => {
    switch (status) {
      case 'Mới':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Đã liên hệ':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Đang giao':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Hoàn thành':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Đã hủy':
        return 'bg-slate-200 text-slate-700 border-slate-300';
      default:
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub-tab Switch: Đơn hàng vs Khách hàng đăng ký (First Data) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setSubTab('orders')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors cursor-pointer ${
            subTab === 'orders'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Đơn hàng ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('customers')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors cursor-pointer ${
            subTab === 'customers'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Khách hàng đăng ký / First Data ({customers.length})</span>
        </button>
      </div>

      {subTab === 'customers' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Danh sách Khách hàng đã đăng ký (First Data)
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Khách hàng đăng ký qua Pop-up chào mừng hoặc nút Đăng nhập (collection{' '}
                <code className="font-mono">customers</code>).
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {isSheetsConnected && onSyncSheetsNow && (
                <button
                  type="button"
                  onClick={() => void handleQuickSheetsSync()}
                  disabled={syncingSheets}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingSheets ? 'animate-spin' : ''}`} />
                  <span>{syncingSheets ? 'Đang đồng bộ...' : 'Đồng bộ ngay lên Sheet'}</span>
                </button>
              )}

              {onOpenGoogleSheetsModal && (
                <button
                  type="button"
                  onClick={onOpenGoogleSheetsModal}
                  className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-2xs"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Google Sheets Kho</span>
                  {(isSheetsConnected || autoSyncEnabled) && (
                    <span className="w-2 h-2 rounded-full bg-emerald-300" />
                  )}
                </button>
              )}

              {googleSheetUrl && (
                <a
                  href={googleSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Mở Sheet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <button
                type="button"
                onClick={() => void handleCopyAllPhones()}
                disabled={filteredCustomers.length === 0}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                {copiedPhones ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedPhones ? 'Đã copy SĐT' : 'Copy SĐT'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportCustomersCSV}
                disabled={filteredCustomers.length === 0}
                className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Xuất Excel / CSV ({filteredCustomers.length})</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Tìm theo tên, số điện thoại hoặc địa chỉ..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              />
            </div>
          </div>

          {customersLoading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
              Đang tải danh sách khách hàng từ Firestore...
            </div>
          ) : customersError ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{customersError}</span>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
              Chưa có khách hàng nào đăng ký tài khoản hoặc không khớp từ khóa tìm kiếm.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Khách hàng</th>
                      <th className="py-3 px-4">Số điện thoại / Zalo</th>
                      <th className="py-3 px-4">Địa chỉ</th>
                      <th className="py-3 px-4">Voucher đã nhận</th>
                      <th className="py-3 px-4">Ngày đăng ký</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.map((cust) => {
                      const cleanPhone = (cust.phoneNumber || '').replace(/[^0-9]/g, '');
                      return (
                        <tr key={cust.phoneNumber} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {cust.fullName || 'Chưa đặt tên'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <a
                                href={`tel:${cleanPhone}`}
                                className="inline-flex items-center gap-1 font-mono font-bold text-blue-700 hover:underline"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>{cust.phoneNumber}</span>
                              </a>
                              <a
                                href={`https://zalo.me/${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 hover:bg-sky-100"
                              >
                                <span>Zalo</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600 max-w-xs">
                            {cust.address || <span className="text-slate-400 italic">Chưa cập nhật</span>}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {(cust.vouchersClaimed || []).map((v) => (
                                <span
                                  key={v}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-mono text-[10px] font-bold"
                                >
                                  <Ticket className="w-3 h-3" />
                                  <span>{v}</span>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {cust.registeredAt
                                  ? new Date(cust.registeredAt).toLocaleString('vi-VN')
                                  : '—'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => void handleDeleteCustomer(cust.phoneNumber)}
                              disabled={deletingCustomerPhone === cust.phoneNumber}
                              title="Xóa khách hàng này"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-40"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {leads.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-4">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                <div className="text-xs font-bold text-slate-800">
                  Khách để lại SĐT tư vấn ({leads.length})
                </div>
                <span className="text-[11px] text-slate-500">
                  Từ form đăng ký tư vấn / chọn quà
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Họ tên</th>
                      <th className="py-2.5 px-4">SĐT / Zalo</th>
                      <th className="py-2.5 px-4">Nhu cầu / Sản phẩm</th>
                      <th className="py-2.5 px-4">Ngày gửi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.map((lead) => {
                      const cleanPhone = (lead.phoneNumber || '').replace(/[^0-9]/g, '');
                      return (
                        <tr key={lead.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4 font-semibold text-slate-900">
                            {lead.fullName}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-blue-700">
                            <a href={`tel:${cleanPhone}`} className="hover:underline">
                              {lead.phoneNumber}
                            </a>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-slate-600">
                            {[lead.recipient, lead.budgetTier, lead.interestedProducts, lead.giftNote]
                              .filter(Boolean)
                              .join(' · ') || 'Cần tư vấn'}
                          </td>
                          <td className="py-2.5 px-4 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                            {lead.createdAt
                              ? new Date(lead.createdAt).toLocaleString('vi-VN')
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Quản lý đơn hàng</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Tổng {orders.length} đơn đồng bộ trực tiếp từ collection <code className="font-mono">orders</code>.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {onOpenGoogleSheetsModal && (
                <button
                  type="button"
                  onClick={onOpenGoogleSheetsModal}
                  className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-2xs"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Google Sheets Kho</span>
                  {(isSheetsConnected || autoSyncEnabled) && (
                    <span className="w-2 h-2 rounded-full bg-emerald-300" />
                  )}
                </button>
              )}

              {googleSheetUrl && (
                <a
                  href={googleSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Mở Sheet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <button
                type="button"
                onClick={handleExportOrdersCSV}
                disabled={filteredOrders.length === 0}
                className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Xuất CSV ({filteredOrders.length})</span>
              </button>
            </div>
          </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên khách, số điện thoại, địa chỉ hoặc mã đơn..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {['all', ...ORDER_STATUSES].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                filterStatus === st
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'all' ? 'Tất cả' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List / States */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
          Đang tải danh sách đơn hàng từ Firestore...
        </div>
      ) : loadError ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{loadError}</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
          Chưa có đơn hàng nào khớp bộ lọc hiện tại.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const cleanPhone = order.phoneNumber.replace(/[^0-9]/g, '');
            return (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 flex-wrap text-xs">
                    <span className="font-mono font-bold text-slate-900">{order.id}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-slate-500 tabular-nums">
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {order.status || 'Mới'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={order.status || 'Mới'}
                      disabled={updatingId === order.id}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value as any)
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white cursor-pointer"
                    >
                      {ORDER_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>

                    {confirmDeleteId === order.id ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          disabled={deletingId === order.id}
                          onClick={() => handleDeleteOrder(order.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold cursor-pointer"
                        >
                          Xác nhận xóa
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(order.id)}
                        title="Xóa đơn hàng"
                        className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs sm:text-sm">
                  <div className="lg:col-span-5 space-y-1.5">
                    <div className="font-bold text-slate-900">{order.customerName}</div>
                    <div className="flex items-center gap-3 flex-wrap text-xs">
                      <a
                        href={`tel:${cleanPhone}`}
                        className="inline-flex items-center gap-1 font-mono font-semibold text-blue-700 hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{order.phoneNumber}</span>
                      </a>
                      <a
                        href={`https://zalo.me/${cleanPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:underline"
                      >
                        <span>Mở Zalo</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href={generateOrderMailtoUri(order, ADMIN_NOTIFICATION_EMAIL)}
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email</span>
                      </a>
                    </div>
                    <div className="text-xs text-slate-600 flex items-start justify-between gap-2 pt-1">
                      <div className="flex items-start gap-1.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="break-words">{order.address}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleMeasureOrderDistance(order)}
                        disabled={estimatingOrderId === order.id}
                        className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold cursor-pointer disabled:opacity-60 whitespace-nowrap"
                      >
                        {estimatingOrderId === order.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Truck className="w-3 h-3" />
                        )}
                        <span>Đo km &amp; Ship</span>
                      </button>
                    </div>

                    {orderEstimates[order.id] === 'not_found' && (
                      <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                        Đơn chưa có địa chỉ cụ thể hoặc chưa nhận diện được Quận/Huyện từ &quot;{order.address}&quot;.
                      </div>
                    )}

                    {orderEstimates[order.id] && orderEstimates[order.id] !== 'not_found' && (() => {
                      const est = orderEstimates[order.id] as ShippingEstimateResult;
                      return (
                        <div className="text-[11px] bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 space-y-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-bold text-emerald-900">
                              Cách kho ~{est.distanceKm} km · Ship tạm tính:{' '}
                              <span className="text-rose-700 font-mono">
                                {est.isFreeShipping
                                  ? 'MIỄN PHÍ (0đ)'
                                  : `${est.estimatedFee.toLocaleString('vi-VN')}đ`}
                              </span>
                            </span>
                            <a
                              href={buildOpenStreetMapDirectionsUrl(
                                resolvedShipping.warehouseLat,
                                resolvedShipping.warehouseLng,
                                est.customerLat,
                                est.customerLng,
                                est.matchedLabel
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-emerald-700 hover:underline font-semibold"
                            >
                              <span>Mở bản đồ</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div className="text-[10px] text-slate-600">{est.explanation}</div>
                        </div>
                      );
                    })()}

                    {order.note && (
                      <div className="text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/70">
                        Ghi chú: {order.note}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-7 space-y-2">
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg px-3 py-1 bg-slate-50/50">
                      {order.items.map((it, idx) => (
                        <div
                          key={`${it.id}-${idx}`}
                          className="py-1.5 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="font-medium text-slate-800 truncate">
                            {it.name} {it.modelCode ? `(${it.modelCode})` : ''} × {it.quantity}
                          </div>
                          <div className="font-mono font-semibold text-slate-900 shrink-0 tabular-nums">
                            {it.price}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="text-slate-500">
                        {order.appliedVoucher
                          ? `Voucher: ${order.appliedVoucher} (-${order.voucherDiscount || ''})`
                          : 'Không áp dụng voucher'}
                      </div>
                      <div className="font-bold text-rose-700 text-sm tabular-nums">
                        Tổng: {order.totalAmount}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
};
