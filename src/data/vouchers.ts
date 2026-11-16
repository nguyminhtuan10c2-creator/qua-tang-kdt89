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
    description: 'Giảm 100.000₫ trực tiếp cho đơn hàng từ 3.500.000₫ (Smart Tivi, Bếp đôi, Combo gia dụng...)',
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

export function resolveVouchers(customVouchers?: VoucherItem[]): VoucherItem[] {
  if (Array.isArray(customVouchers) && customVouchers.length > 0) {
    return customVouchers.map((v) => ({
      code: (v.code || 'KDT89').trim(),
      title:
        v.title ||
        `VOUCHER GIẢM ${Number(v.discountAmount || 0).toLocaleString('vi-VN')}₫`,
      discountAmount: Number(v.discountAmount) || 0,
      minOrderAmount: Number(v.minOrderAmount) || 0,
      description:
        v.description ||
        `Giảm ${Number(v.discountAmount || 0).toLocaleString('vi-VN')}₫ trực tiếp cho đơn hàng từ ${Number(v.minOrderAmount || 0).toLocaleString('vi-VN')}₫ tại kho KDT-89`,
      badge:
        v.badge ||
        (v.minOrderAmount > 0
          ? `ĐƠN TỪ ${(v.minOrderAmount / 1000000).toFixed(1).replace('.0', '')} TRIỆU`
          : 'ƯU ĐÃI KDT-89'),
      expiryDateText: v.expiryDateText || 'HSD: 30/11/2026',
      iconType: v.iconType || 'discount',
    }));
  }
  return DEFAULT_VOUCHERS;
}

export function formatShortVnd(amount: number): string {
  if (amount >= 1000000) {
    const tr = amount / 1000000;
    return `${Number.isInteger(tr) ? tr : tr.toFixed(1).replace(/\.0$/, '')}TR`;
  }
  return `${Math.round(amount / 1000)}K`;
}

export function getTotalVoucherAmount(vouchers: VoucherItem[]): number {
  return vouchers.reduce((sum, v) => sum + (Number(v.discountAmount) || 0), 0);
}

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
