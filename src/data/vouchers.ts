export interface VoucherItem {
  code: string;
  title: string;
  discountAmount: number; // in VND
  minOrderAmount: number; // in VND
  description: string;
  badge: string;
  expiryDateText: string;
  iconType: 'discount' | 'shipping' | 'special';
}

export const DEFAULT_VOUCHERS: VoucherItem[] = [
  {
    code: 'KDT89-50K',
    title: 'VOUCHER GIẢM 50.000₫',
    discountAmount: 50000,
    minOrderAmount: 1500000,
    description: 'Giảm 50.000₫ trực tiếp cho đơn hàng từ 1.500.000₫ tại kho KDT-89',
    badge: 'TRI ÂN THÀNH VIÊN',
    expiryDateText: 'HSD: 30/11/2026',
    iconType: 'discount',
  },
  {
    code: 'KDT89-100K',
    title: 'VOUCHER GIẢM 100.000₫',
    discountAmount: 100000,
    minOrderAmount: 3500000,
    description: 'Giảm 100.000₫ trực tiếp cho đơn hàng từ 3.500.000₫ (Tivi, Tủ lạnh, Máy giặt...)',
    badge: 'ĐƠN TỪ 3.5 TRIỆU',
    expiryDateText: 'HSD: 30/11/2026',
    iconType: 'special',
  },
  {
    code: 'KDT89-200K',
    title: 'VOUCHER GIẢM 200.000₫',
    discountAmount: 200000,
    minOrderAmount: 7000000,
    description: 'Giảm 200.000₫ trực tiếp cho đơn hàng giá trị cao từ 7.000.000₫',
    badge: 'ĐƠN TỪ 7 TRIỆU',
    expiryDateText: 'HSD: 30/11/2026',
    iconType: 'discount',
  },
];

export interface CustomerAccount {
  fullName: string;
  phoneNumber: string;
  registeredAt: string;
  password?: string;
  address?: string;
  lastLoginAt?: string;
  vouchersClaimed: string[]; // voucher codes
}

export interface VoucherRedemptionRecord {
  id: string; // `${voucherCode}_${phoneNumber}`
  phoneNumber: string;
  customerName: string;
  voucherCode: string;
  discountAmount: number;
  orderId: string;
  usedAt: string;
}
