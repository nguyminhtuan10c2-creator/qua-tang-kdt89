import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  Search,
  ExternalLink,
  Mail,
  RefreshCw,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react';
import {
  StoredOrder,
  subscribeToOrders,
  updateOrderStatus,
  deleteOrderFromFirestore,
  generateOrderMailtoUri,
  ADMIN_NOTIFICATION_EMAIL,
} from '../lib/firebase';

interface OrderManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

export const OrderManagementModal: React.FC<OrderManagementModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
}) => {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !isAdmin) return;

    setLoading(true);
    setLoadError(null);
    const unsubscribe = subscribeToOrders(
      (orderList) => {
        setOrders(orderList);
        setLoading(false);
        setLoadError(null);
      },
      (err) => {
        console.warn('Orders subscription status:', err.message || err);
        setLoadError('Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen, isAdmin]);

  if (!isOpen) return null;

  const filteredOrders = orders.filter((ord) => {
    if (filterStatus !== 'all' && ord.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = ord.customerName.toLowerCase().includes(q);
      const matchPhone = ord.phoneNumber.includes(q);
      const matchAddress = ord.address.toLowerCase().includes(q);
      const matchId = ord.id.toLowerCase().includes(q);
      return matchName || matchPhone || matchAddress || matchId;
    }
    return true;
  });

  const handleStatusChange = async (
    orderId: string,
    newStatus: 'Mới' | 'Đã liên hệ' | 'Đang giao' | 'Hoàn thành' | 'Đã hủy'
  ) => {
    try {
      setUpdatingId(orderId);
      await updateOrderStatus(orderId, newStatus);
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Anh có chắc muốn xóa đơn hàng này không?')) return;
    try {
      setDeletingId(orderId);
      await deleteOrderFromFirestore(orderId);
    } catch (e) {
      console.error('Lỗi xóa đơn hàng:', e);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Mới':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse';
      case 'Đã liên hệ':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Đang giao':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Hoàn thành':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Đã hủy':
        return 'bg-neutral-200 text-neutral-600 border-neutral-300';
      default:
        return 'bg-rose-100 text-rose-800 border-rose-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-auto flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-neutral-900 px-5 sm:px-6 py-4 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>Quản lý đơn đặt hàng</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-700 text-white text-xs font-mono">
                  {orders.length} đơn
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                Thông báo đơn hàng cũng được chuyển đến: {ADMIN_NOTIFICATION_EMAIL}
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

        {/* Filter bar */}
        <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'Mới', label: 'Mới' },
              { id: 'Đã liên hệ', label: 'Đã liên hệ' },
              { id: 'Đang giao', label: 'Đang giao' },
              { id: 'Hoàn thành', label: 'Hoàn thành' },
              { id: 'Đã hủy', label: 'Đã hủy' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterStatus === tab.id
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, SĐT, mã..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* Orders list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loadError ? (
            <div className="py-14 text-center text-neutral-600 space-y-3">
              <AlertCircle className="w-10 h-10 mx-auto text-amber-500" />
              <p className="text-sm font-semibold text-neutral-800">{loadError}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setLoadError(null);
                  subscribeToOrders(
                    (list) => {
                      setOrders(list);
                      setLoading(false);
                    },
                    (e) => {
                      setLoadError('Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
                      setLoading(false);
                    }
                  );
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                Tải lại danh sách
              </button>
            </div>
          ) : loading ? (
            <div className="py-16 text-center text-neutral-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-600" />
              <p className="text-xs">Đang tải danh sách đơn hàng từ Firebase...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-neutral-400">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold text-neutral-700">Chưa có đơn hàng nào phù hợp</p>
              <p className="text-xs mt-1">Khi khách bấm "Mua hàng" trên web, đơn sẽ hiển thị ngay tại đây!</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 sm:p-5 rounded-2xl border border-neutral-200 bg-white shadow-xs hover:border-neutral-300 transition-all space-y-3"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                      #{order.id}
                    </span>
                    <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  {/* Status select */}
                  <div className="flex items-center gap-2">
                    <select
                      value={order.status || 'Mới'}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value as any)
                      }
                      disabled={updatingId === order.id}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-bold focus:outline-none cursor-pointer ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      <option value="Mới">Mới (Chưa xử lý)</option>
                      <option value="Đã liên hệ">Đã liên hệ xác nhận</option>
                      <option value="Đang giao">Đang giao hàng</option>
                      <option value="Hoàn thành">Đã hoàn thành</option>
                      <option value="Đã hủy">Đã hủy</option>
                    </select>
                  </div>
                </div>

                {/* Customer info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-neutral-500 text-[11px]">Khách hàng:</div>
                    <div className="font-bold text-neutral-900 text-sm mt-0.5">
                      {order.customerName}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href={`tel:${order.phoneNumber}`}
                        className="inline-flex items-center gap-1 font-mono font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{order.phoneNumber}</span>
                      </a>
                      <a
                        href={`https://zalo.me/${order.phoneNumber.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span>Nhắn Zalo</span>
                      </a>
                    </div>
                  </div>

                  <div>
                    <div className="text-neutral-500 text-[11px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-neutral-400" />
                      <span>Địa chỉ nhận hàng:</span>
                    </div>
                    <div className="text-neutral-800 font-medium mt-0.5">
                      {order.address}
                    </div>
                    {order.note && (
                      <div className="mt-1 text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <strong>Ghi chú:</strong> {order.note}
                      </div>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="pt-2 bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                  <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide mb-1.5">
                    Sản phẩm:
                  </div>
                  <div className="space-y-1.5">
                    {order.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {it.imageUrl && (
                            <img
                              src={it.imageUrl}
                              alt={it.name}
                              className="w-7 h-7 object-cover rounded border border-neutral-200 shrink-0"
                            />
                          )}
                          <span className="font-semibold text-neutral-900 truncate">
                            {it.name}
                          </span>
                          {it.modelCode && (
                            <span className="text-[10px] text-neutral-500 font-mono">
                              ({it.modelCode})
                            </span>
                          )}
                        </div>
                        <div className="shrink-0 font-mono font-bold text-neutral-800">
                          x{it.quantity} · {it.price}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 pt-2 border-t border-neutral-200 flex items-center justify-between text-xs font-bold">
                    <span className="text-neutral-600">Tổng thanh toán:</span>
                    <span className="text-sm font-black text-rose-700 font-mono">
                      {order.totalAmount}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <span className="text-[11px] text-neutral-500">
                    Thanh toán: <strong className="text-neutral-700">{order.paymentMethod || 'COD'}</strong>
                  </span>

                  <div className="flex items-center gap-3">
                    <a
                      href={generateOrderMailtoUri(order, ADMIN_NOTIFICATION_EMAIL)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-neutral-600 hover:text-rose-700 font-medium"
                    >
                      <Mail className="w-3 h-3 text-rose-600" />
                      <span>Mở gửi email chi tiết</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDeleteOrder(order.id)}
                      disabled={deletingId === order.id}
                      className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Xóa đơn hàng này"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{deletingId === order.id ? 'Đang xóa...' : 'Xóa'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
