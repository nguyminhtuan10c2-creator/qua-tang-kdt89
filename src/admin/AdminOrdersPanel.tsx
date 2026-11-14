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
} from 'lucide-react';
import {
  StoredOrder,
  updateOrderStatus,
  deleteOrderFromFirestore,
  generateOrderMailtoUri,
  ADMIN_NOTIFICATION_EMAIL,
} from '../lib/firebase';
import { triggerFileDownload } from '../lib/productImportExport';

interface AdminOrdersPanelProps {
  orders: StoredOrder[];
  loading: boolean;
  loadError: string | null;
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
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản lý đơn hàng</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Tổng {orders.length} đơn đồng bộ trực tiếp từ collection <code className="font-mono">orders</code>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportOrdersCSV}
          disabled={filteredOrders.length === 0}
          className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Xuất CSV đơn hàng ({filteredOrders.length})</span>
        </button>
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
                    <div className="text-xs text-slate-600 flex items-start gap-1.5 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{order.address}</span>
                    </div>
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
    </div>
  );
};
