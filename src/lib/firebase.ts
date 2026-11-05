import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firestoreDatabaseId according to Firebase Skill
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Persist login state in browser local storage across tabs and sessions
try {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
} catch {
  // Ignore in non-browser environments
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRITICAL: Validate connection to Firestore at boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'settings', 'site'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
import type { ProductItem, ComboItem, CategoryItem } from '../data/products';

export interface CategoryOverride {
  name?: string;
  subTitle?: string;
  tagline?: string;
}

export interface MegaSaleCampaignConfig {
  enabled: boolean;
  campaignId: string; // 'double_11' | 'black_friday' | 'double_12' | 'tet_holiday' | 'year_end' | 'custom'
  title: string;
  badge: string;
  subtitle: string;
  startDate: string; // ISO format e.g. '2026-11-09T00:00'
  endDate: string; // ISO format e.g. '2026-11-13T23:59'
  teaserStartDate: string; // ISO format e.g. '2026-11-08T00:00' (hoặc '2026-11-02T00:00')
  highlights?: string;
  theme?: 'red' | 'black' | 'gold' | 'rose' | 'orange';
  buttonTextUpcoming?: string;
  buttonTextLive?: string;
  earlyBirdSlots?: number;
}

export interface SiteDecorSettings {
  showCountdown?: boolean;
  activeSaleCampaignId?: string; // 'double_11' | 'black_friday' | 'double_12' | 'tet_holiday' | 'year_end' | 'daily_flash'
  allowCustomerSwitchCampaign?: boolean; // Allow visitors to click and preview countdown of other upcoming big sales
  countdownTitle?: string;
  countdownSubtitle?: string;
  countdownTargetDate?: string;
  countdownMode?: 'daily' | 'target_date' | 'campaign';
  countdownBadge?: string;
  countdownSoldPercent?: number;
  countdownButtonText?: string;
  countdownTheme?: 'red' | 'black' | 'gold' | 'rose' | 'orange';
  fallingEffect?: 'none' | 'sakura' | 'red_envelope' | 'confetti' | 'snow' | 'stars' | 'hearts';
  fallingSpeed?: 'slow' | 'normal' | 'fast';
  showLiveOrderTicker?: boolean;
  showCornerRibbon?: boolean;
  cornerRibbonText?: string;
  enablePulsingCta?: boolean;
  showBudgetFilter?: boolean; // Bật / Tắt bộ lọc bảng giá ngân sách (Price Range Slider)
  megaSaleConfig?: MegaSaleCampaignConfig;
}

export interface SiteSettingsData {
  hiddenProductIds?: string[];
  hiddenComboIds?: string[];
  customPrices?: Record<string, { programPrice?: string; referencePrice?: string }>;
  customProducts?: ProductItem[];
  deletedProductIds?: string[];
  editedProducts?: Record<string, Partial<ProductItem>>;
  customCombos?: ComboItem[];
  deletedComboIds?: string[];
  customCategories?: Record<string, CategoryOverride>;
  customTexts?: Record<string, string>;
  customSeo?: { title?: string; description?: string };
  hiddenSections?: string[];
  addedCategories?: CategoryItem[];
  deletedCategoryIds?: string[];
  decorSettings?: SiteDecorSettings;
  updatedAt: string;
}

const SETTINGS_DOC_PATH = 'settings/site';

/**
 * Listen to real-time updates of site settings (hidden products, prices)
 */
export function subscribeToSiteSettings(
  onUpdate: (data: SiteSettingsData | null) => void,
  onError?: (err: unknown) => void
) {
  const docRef = doc(db, 'settings', 'site');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as SiteSettingsData);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, SETTINGS_DOC_PATH);
      } catch (e) {
        if (onError) onError(e);
      }
    }
  );
}

/**
 * Save site settings (hidden products & prices) to Firestore without overflowing 1MB document limit
 */
export async function saveSiteSettingsToFirestore(data: Partial<SiteSettingsData>): Promise<void> {
  const docRef = doc(db, 'settings', 'site');
  const payload: SiteSettingsData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, SETTINGS_DOC_PATH);
  }
}

/**
 * Listen to real-time custom images stored across the custom_images collection
 * Each image has its own document (preventing the 1MB single-document limit)
 */
export function subscribeToCustomImages(
  onUpdate: (images: Record<string, string>) => void,
  onError?: (err: unknown) => void
) {
  const colRef = collection(db, 'custom_images');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const images: Record<string, string> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.imageUrl) {
          images[docSnap.id] = data.imageUrl;
        }
      });
      onUpdate(images);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'custom_images');
      } catch (e) {
        if (onError) onError(e);
      }
    }
  );
}

/**
 * Save an individual product/site image to its own Firestore document in custom_images/{productId}
 */
export async function saveCustomImageToFirestore(productId: string, imageUrl: string): Promise<void> {
  const docRef = doc(db, 'custom_images', productId);
  const path = `custom_images/${productId}`;
  const payload = {
    imageUrl,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Reset/Delete an image from custom_images collection in Firestore
 */
export async function deleteCustomImageFromFirestore(productId: string): Promise<void> {
  const docRef = doc(db, 'custom_images', productId);
  const path = `custom_images/${productId}`;

  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Client-side high efficiency image compressor using HTML5 Canvas.
 * Compresses any 3MB-10MB mobile camera photo to ~40KB - 80KB crisp Web/JPEG format.
 */
export function compressImageFile(file: File, maxWidth = 900, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        // Smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export interface ConsultationLeadPayload {
  fullName: string;
  phoneNumber: string;
  recipient?: 'Vợ' | 'Mẹ' | 'Người thân' | string;
  budgetTier?: string;
  interestedProducts?: string;
  deliveryArea?: string;
  giftNote?: string;
}

/**
 * Submit consultation lead to Firestore
 */
export async function submitConsultationLead(lead: ConsultationLeadPayload): Promise<string> {
  const id = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `leads/${id}`;
  const docRef = doc(db, 'leads', id);

  const payload = {
    ...lead,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(docRef, payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return id;
  }
}

/**
 * Google Sign-In for Admin
 */
export async function loginAdminWithGoogle(): Promise<{ email: string | null; isAdmin: boolean; cancelled?: boolean }> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const isOwner = user.email === 'nguyminhtuan10C2@gmail.com';
    return { email: user.email, isAdmin: isOwner };
  } catch (error: any) {
    const code = error?.code || '';
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/user-cancelled'
    ) {
      // User closed the popup window or cancelled. This is expected behavior, not an error.
      return { email: null, isAdmin: false, cancelled: true };
    }
    if (code === 'auth/popup-blocked') {
      throw new Error('Trình duyệt đã chặn cửa sổ đăng nhập popup. Anh vui lòng cho phép popup hoặc dùng mã 89.');
    }
    console.warn('Google Sign-In status:', error?.message || error);
    throw error;
  }
}

/**
 * Sign out
 */
export async function logoutFirebaseAuth(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout failed', error);
  }
}

export const ADMIN_NOTIFICATION_EMAIL = 'nguyminhtuan10C2@gmail.com';

export interface OrderItem {
  id: string;
  name: string;
  modelCode?: string;
  price: string;
  quantity: number;
  imageUrl?: string;
}

export interface OrderPayload {
  customerName: string;
  phoneNumber: string;
  address: string;
  items: OrderItem[];
  totalAmount: string;
  recipient?: string;
  giftCardRequested?: boolean;
  paymentMethod?: string;
  appliedVoucher?: string;
  voucherDiscount?: string;
  note?: string;
  status?: 'Mới' | 'Đã liên hệ' | 'Đang giao' | 'Hoàn thành' | 'Đã hủy';
}

export interface StoredOrder extends OrderPayload {
  id: string;
  createdAt: string;
}


/**
 * Submit order to Firestore
 */
export async function submitOrderToFirestore(order: OrderPayload): Promise<string> {
  const id = `kdt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const path = `orders/${id}`;
  const docRef = doc(db, 'orders', id);

  const payload: StoredOrder = {
    ...order,
    id,
    paymentMethod: order.paymentMethod || 'Thanh toán khi nhận hàng & kiểm tra (COD)',
    status: order.status || 'Mới',
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(docRef, payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return id;
  }
}

/**
 * Send order notification email to admin email (nguyminhtuan10C2@gmail.com)
 * Uses FormSubmit.co background dispatch with HTML formatting + fallback mailto link
 */
export async function sendOrderEmailNotification(order: StoredOrder, targetEmail = ADMIN_NOTIFICATION_EMAIL): Promise<{ success: boolean; message: string }> {
  try {
    const itemsListHtml = order.items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.name} ${it.modelCode ? `(${it.modelCode})` : ''} - Số lượng: ${it.quantity} - Đơn giá: ${it.price}`
      )
      .join('\n');

    const bodyPayload: Record<string, string> = {
      _subject: `🔔 [ĐƠN HÀNG MỚI KDT-89] Khách hàng ${order.customerName} - SĐT: ${order.phoneNumber}`,
      _template: 'table',
      _captcha: 'false',
      'Mã đơn hàng': order.id,
      'Tên khách hàng': order.customerName,
      'Số điện thoại': order.phoneNumber,
      'Địa chỉ giao hàng': order.address,
      'Người nhận / Mục đích': order.recipient || 'Tự dùng / Không chỉ định',
      'Yêu cầu gói quà & thiệp': order.giftCardRequested ? 'CÓ (Miễn phí 100%)' : 'Không',
      'Danh sách sản phẩm': itemsListHtml,
      'Tổng tiền tạm tính': order.totalAmount,
      'Hình thức thanh toán': order.paymentMethod || 'COD',
      'Ghi chú của khách': order.note || 'Không có',
      'Thời gian đặt': new Date(order.createdAt).toLocaleString('vi-VN'),
    };

    const res = await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok || data.success === 'true' || (data.message && data.message.includes('Activation'))) {
      return { success: true, message: 'Đã gửi thông báo đơn hàng qua email' };
    }
    return { success: true, message: 'Đã lưu đơn hàng lên hệ thống' };
  } catch (error) {
    console.warn('Lỗi khi gửi thông báo email tự động:', error);
    // Non-blocking error, Firestore has saved it
    return { success: false, message: 'Đã ghi nhận đơn hàng lên hệ thống Firestore' };
  }
}

/**
 * Generate mailto URI for manual 1-click fallback
 */
export function generateOrderMailtoUri(order: StoredOrder, targetEmail = ADMIN_NOTIFICATION_EMAIL): string {
  const subject = encodeURIComponent(`[ĐƠN HÀNG MỚI KDT-89] ${order.customerName} - ${order.phoneNumber}`);
  const itemsText = order.items
    .map((it, idx) => `  ${idx + 1}. ${it.name} ${it.modelCode ? `[${it.modelCode}]` : ''} x${it.quantity}: ${it.price}`)
    .join('\n');

  const body = encodeURIComponent(
    `THÔNG TIN ĐƠN HÀNG KHO ĐIỆN TỬ KDT-89\n` +
    `Mã đơn: ${order.id}\n` +
    `Ngày đặt: ${new Date(order.createdAt).toLocaleString('vi-VN')}\n` +
    `----------------------------------------\n` +
    `Khách hàng: ${order.customerName}\n` +
    `Số điện thoại: ${order.phoneNumber}\n` +
    `Địa chỉ giao hàng: ${order.address}\n` +
    `Người nhận quà: ${order.recipient || 'Tự dùng / Không chỉ định'}\n` +
    `Gói quà & Thiệp: ${order.giftCardRequested ? 'CÓ (Miễn phí 100%)' : 'Không'}\n` +
    `Ghi chú: ${order.note || 'Không có'}\n` +
    `----------------------------------------\n` +
    `SẢN PHẨM ĐẶT MUA:\n${itemsText}\n` +
    `----------------------------------------\n` +
    `TỔNG TIỀN TẠM TÍNH: ${order.totalAmount}\n` +
    `Hình thức: ${order.paymentMethod || 'COD'}\n`
  );

  return `mailto:${targetEmail}?subject=${subject}&body=${body}`;
}

/**
 * Real-time subscription to orders (Admin only)
 */
export function subscribeToOrders(
  onOrders: (orders: StoredOrder[]) => void,
  onError?: (error: Error) => void
): () => void {
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: StoredOrder[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as StoredOrder);
      });
      onOrders(list);
    },
    (err) => {
      console.warn('Firestore orders sync:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: 'Mới' | 'Đã liên hệ' | 'Đang giao' | 'Hoàn thành' | 'Đã hủy'
): Promise<void> {
  const docRef = doc(db, 'orders', orderId);
  const path = `orders/${orderId}`;

  try {
    await updateDoc(docRef, { status: newStatus });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete an order from Firestore
 */
export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  const docRef = doc(db, 'orders', orderId);
  const path = `orders/${orderId}`;

  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/* =========================================================================
   CUSTOMER ACCOUNT & VOUCHER REDEMPTION
   Khách hàng tạo tài khoản đăng nhập (Họ tên, SĐT, Mật khẩu, Địa chỉ)
   Mỗi số điện thoại nhận ví voucher, và mỗi voucher chỉ dùng 1 lần/SĐT
   ========================================================================= */

import type { CustomerAccount, VoucherRedemptionRecord } from '../data/vouchers';

/**
 * Register a new customer account
 */
export async function registerCustomerAccount(data: {
  fullName: string;
  phoneNumber: string;
  password?: string;
  address?: string;
}): Promise<CustomerAccount> {
  const cleanPhone = data.phoneNumber.replace(/[^0-9]/g, '');
  const docRef = doc(db, 'customers', cleanPhone);

  const existingSnap = await getDoc(docRef).catch(() => null);
  if (existingSnap && existingSnap.exists()) {
    throw new Error('Số điện thoại này đã được đăng ký tài khoản trước đó. Vui lòng bấm sang tab Đăng Nhập!');
  }

  const newAccount: CustomerAccount = {
    fullName: data.fullName.trim(),
    phoneNumber: cleanPhone,
    registeredAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    vouchersClaimed: ['KDT89-50K', 'KDT89-100K', 'KDT89-200K', 'KDT89-500K'],
  };

  if (data.password && data.password.trim()) {
    newAccount.password = data.password.trim();
  }
  if (data.address && data.address.trim()) {
    newAccount.address = data.address.trim();
  }

  try {
    await setDoc(docRef, newAccount);
  } catch (error) {
    console.warn('Firestore set customer account error:', error);
  }

  return newAccount;
}

/**
 * Customer login with Phone number & optional password
 */
export async function loginCustomerAccount(
  phoneNumber: string,
  password?: string
): Promise<CustomerAccount> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const docRef = doc(db, 'customers', cleanPhone);

  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error('Số điện thoại này chưa có tài khoản. Vui lòng bấm sang tab "Tạo tài khoản" để kích hoạt ví voucher!');
  }

  const account = snap.data() as CustomerAccount;

  // If account has password and user provided password, verify
  if (account.password && password) {
    if (account.password !== password.trim()) {
      throw new Error('Mật khẩu không chính xác. Vui lòng kiểm tra lại!');
    }
  }

  // Update last login
  try {
    await updateDoc(docRef, { lastLoginAt: new Date().toISOString() });
    account.lastLoginAt = new Date().toISOString();
  } catch (e) {
    // ignore
  }

  return account;
}

/**
 * Quick register or login customer by Name & Phone number (for backwards compatibility)
 */
export async function registerOrLoginCustomer(fullName: string, phoneNumber: string): Promise<CustomerAccount> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const docRef = doc(db, 'customers', cleanPhone);

  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as CustomerAccount;
      if (fullName && fullName.trim() !== data.fullName) {
        await updateDoc(docRef, { fullName: fullName.trim() });
        data.fullName = fullName.trim();
      }
      return data;
    } else {
      const newAccount: CustomerAccount = {
        fullName: fullName.trim(),
        phoneNumber: cleanPhone,
        registeredAt: new Date().toISOString(),
        vouchersClaimed: ['KDT89-100K', 'KDT89-200K', 'KDT89-500K'],
      };
      await setDoc(docRef, newAccount);
      return newAccount;
    }
  } catch (error) {
    console.warn('Firestore customer account sync fallback:', error);
    return {
      fullName: fullName.trim(),
      phoneNumber: cleanPhone,
      registeredAt: new Date().toISOString(),
      vouchersClaimed: ['KDT89-100K', 'KDT89-200K', 'KDT89-500K'],
    };
  }
}

/**
 * Check if a voucher code has already been redeemed by this phone number
 * Rule: "mỗi sdt mua 1 lần sẽ được dùng voucher 1 lần"
 */
export async function checkVoucherRedeemed(phoneNumber: string, voucherCode: string): Promise<boolean> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const redemptionId = `${voucherCode}_${cleanPhone}`;
  const docRef = doc(db, 'voucher_redemptions', redemptionId);

  try {
    const snap = await getDoc(docRef);
    return snap.exists();
  } catch (error) {
    console.warn('Check voucher redemption error:', error);
    return false;
  }
}

/**
 * Record a voucher redemption for a phone number
 */
export async function recordVoucherRedemption(
  phoneNumber: string,
  customerName: string,
  voucherCode: string,
  discountAmount: number,
  orderId: string
): Promise<void> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const redemptionId = `${voucherCode}_${cleanPhone}`;
  const path = `voucher_redemptions/${redemptionId}`;
  const docRef = doc(db, 'voucher_redemptions', redemptionId);

  const payload: VoucherRedemptionRecord = {
    id: redemptionId,
    phoneNumber: cleanPhone,
    customerName,
    voucherCode,
    discountAmount,
    orderId,
    usedAt: new Date().toISOString(),
  };

  try {
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Get all redeemed vouchers for a specific phone number
 */
export async function getCustomerRedeemedVouchers(phoneNumber: string): Promise<string[]> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const vouchersToCheck = ['KDT89-50K', 'KDT89-100K', 'KDT89-200K', 'KDT89-500K'];
  const redeemed: string[] = [];

  for (const vCode of vouchersToCheck) {
    const isRedeemed = await checkVoucherRedeemed(cleanPhone, vCode);
    if (isRedeemed) redeemed.push(vCode);
  }

  return redeemed;
}

/**
 * Admin: Subscribe to all voucher redemptions
 */
export function subscribeToVoucherRedemptions(
  onRedemptions: (records: VoucherRedemptionRecord[]) => void
): () => void {
  const colRef = collection(db, 'voucher_redemptions');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: VoucherRedemptionRecord[] = [];
      snapshot.forEach((snap) => {
        list.push({ ...snap.data(), id: snap.id } as VoucherRedemptionRecord);
      });
      onRedemptions(list);
    },
    (err) => {
      console.warn('Voucher redemptions sync error:', err);
    }
  );
}

/**
 * Admin: Reset a voucher redemption for a phone number
 */
export async function resetVoucherRedemption(redemptionId: string): Promise<void> {
  const docRef = doc(db, 'voucher_redemptions', redemptionId);
  const path = `voucher_redemptions/${redemptionId}`;

  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}


